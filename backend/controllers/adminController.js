const User = require('../models/User');
const Event = require('../models/Event');
const { Notification, Report } = require('../models/Supplementary');

// ==================== NOTIFICATION CONTROLLER ====================

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const query = { recipient: req.user.id };
    if (unread === 'true') query.isRead = false;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });

    return res.status(200).json({ success: true, notifications, total, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { notificationIds, all } = req.body;

    if (all) {
      await Notification.updateMany(
        { recipient: req.user.id, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } else if (notificationIds?.length) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, recipient: req.user.id },
        { isRead: true, readAt: new Date() }
      );
    }

    return res.status(200).json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    return res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ADMIN CONTROLLER ====================

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getPlatformStats = async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalOrganizers, activeEvents, completedEvents] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Event.countDocuments({ isPublished: true }),
      User.countDocuments({ role: 'organizer' }),
      Event.countDocuments({ status: { $in: ['upcoming', 'ongoing'] } }),
      Event.countDocuments({ status: 'completed' }),
    ]);

    // User growth (last 7 days)
    const userGrowth = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      const count = await User.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } });
      userGrowth.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        users: count,
      });
    }

    // Category distribution
    const categoryDistribution = await Event.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Revenue stats
    const revenueStats = await Event.aggregate([
      { $match: { isPaid: true, isPublished: true } },
      {
        $project: {
          revenue: { $multiply: ['$price', '$registeredCount'] },
          currency: 1,
        },
      },
      { $group: { _id: null, total: { $sum: '$revenue' } } },
    ]);

    // Pending reports
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        totalOrganizers,
        activeEvents,
        completedEvents,
        userGrowth,
        categoryDistribution,
        totalRevenue: revenueStats[0]?.total || 0,
        pendingReports,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { search, role, isBanned, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    if (role) query.role = role;
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -verificationToken -resetPasswordToken')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, total, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Ban/unban user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin)
const toggleBanUser = async (req, res) => {
  try {
    const { ban, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot ban admin users.' });
    }

    user.isBanned = ban;
    user.banReason = ban ? reason : undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: ban ? 'User banned successfully.' : 'User unbanned successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['participant', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove event (admin moderation)
// @route   PUT /api/admin/events/:id/remove
// @access  Private (Admin)
const removeEvent = async (req, res) => {
  try {
    const { reason } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isRemoved: true, removeReason: reason },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    return res.status(200).json({ success: true, message: 'Event removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Feature/unfeature event
// @route   PUT /api/admin/events/:id/feature
// @access  Private (Admin)
const toggleFeatureEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    event.isFeatured = !event.isFeatured;
    await event.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      isFeatured: event.isFeatured,
      message: event.isFeatured ? 'Event featured!' : 'Event unfeatured.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getReports = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const reports = await Report.find({ status })
      .populate('reporter', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== LEADERBOARD CONTROLLER ====================

// @desc    Get leaderboard
// @route   GET /api/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', category, page = 1, limit = 50 } = req.query;

    let dateFilter = {};
    if (period === 'weekly') {
      dateFilter = { updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (period === 'monthly') {
      dateFilter = { updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }

    const users = await User.find({ isActive: true, isBanned: false, ...dateFilter })
      .select('name avatar headline skills points level badges stats location')
      .sort({ points: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const leaderboard = users.map((user, index) => ({
      rank: (parseInt(page) - 1) * parseInt(limit) + index + 1,
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        headline: user.headline,
        skills: user.skills.slice(0, 3),
        level: user.level,
        badges: user.badges.slice(0, 3),
        stats: user.stats,
        location: user.location,
      },
      points: user.points,
    }));

    // Get current user rank if authenticated
    let userRank = null;
    if (req.user) {
      const allUsers = await User.find({ isActive: true }).sort({ points: -1 }).select('_id');
      const rankIndex = allUsers.findIndex((u) => u._id.toString() === req.user.id);
      userRank = rankIndex !== -1 ? rankIndex + 1 : null;
    }

    return res.status(200).json({ success: true, leaderboard, userRank });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  // Notifications
  getNotifications,
  markAsRead,
  deleteNotification,
  // Admin
  getPlatformStats,
  getAllUsers,
  toggleBanUser,
  changeUserRole,
  removeEvent,
  toggleFeatureEvent,
  getReports,
  // Leaderboard
  getLeaderboard,
};
