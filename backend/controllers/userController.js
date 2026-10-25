const User = require('../models/User');
const Event = require('../models/Event');
const Team = require('../models/Team');
const { Certificate } = require('../models/Supplementary');
const { uploadAvatar, deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationToken -resetPasswordToken -googleId -isBanned -banReason -notificationPreferences')
      .lean();

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Get participation stats
    const eventsParticipated = await Event.countDocuments({
      'registrations': { $elemMatch: { user: user._id, status: 'approved' } }
    });

    const teamsCreated = await Team.countDocuments({ leader: user._id });

    const certificates = await Certificate.find({ user: user._id, isValid: true })
      .populate('event', 'title slug category')
      .sort({ issuedAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        stats: {
          ...user.stats,
          eventsParticipated,
          teamsCreated,
        },
        recentCertificates: certificates,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const {
      name, bio, headline, location, skills, interests,
      socialLinks, experience, education, notificationPreferences,
      mobile, gender, dateOfBirth,
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (headline !== undefined) updateData.headline = headline;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (gender !== undefined) updateData.gender = gender;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth || null;
    if (location) updateData.location = location;
    if (skills) updateData.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    if (interests) updateData.interests = Array.isArray(interests) ? interests : interests.split(',').map(s => s.trim());
    if (socialLinks) updateData.socialLinks = socialLinks;
    if (experience) updateData.experience = experience;
    if (education) updateData.education = education;
    if (notificationPreferences) updateData.notificationPreferences = notificationPreferences;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload avatar
// @route   PUT /api/users/avatar
// @access  Private
const uploadUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image.' });
    }

    const user = await User.findById(req.user.id);

    // Delete old avatar
    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    }

    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Avatar updated!',
      avatar: user.avatar,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's registered events
// @route   GET /api/users/my-events
// @access  Private
const getMyEvents = async (req, res) => {
  try {
    const { type = 'upcoming', page = 1, limit = 10 } = req.query;
    const now = new Date();

    const events = await Event.find({
      'registrations': { $elemMatch: { user: req.user.id, status: 'approved' } },
      ...(type === 'upcoming' ? { endDate: { $gte: now } } : { endDate: { $lt: now } }),
    })
      .populate('organizer', 'name avatar')
      .select('-registrations')
      .sort(type === 'upcoming' ? { startDate: 1 } : { endDate: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const withStatus = events.map((event) => {
      const reg = event.registrations?.find(r => r.user?.toString() === req.user.id);
      return { ...event.toObject(), registrationStatus: reg?.status };
    });

    return res.status(200).json({ success: true, events: withStatus });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's organized events
// @route   GET /api/users/organized-events
// @access  Private (Organizer)
const getOrganizedEvents = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { organizer: req.user.id };
    if (status) query.status = status;

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, total, events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's teams
// @route   GET /api/users/my-teams
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user.id })
      .populate('event', 'title slug banner startDate endDate status')
      .populate('members.user', 'name avatar skills')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, teams });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q, skills, page = 1, limit = 10 } = req.query;
    const query = { isActive: true, _id: { $ne: req.user.id } };

    if (q) {
      query.$or = [
        { name: new RegExp(q, 'i') },
        { headline: new RegExp(q, 'i') },
        { skills: { $in: [new RegExp(q, 'i')] } },
      ];
    }

    if (skills) {
      query.skills = { $in: skills.split(',').map((s) => new RegExp(s.trim(), 'i')) };
    }

    const users = await User.find(query)
      .select('name avatar headline skills points level badges location')
      .sort({ points: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's bookmarked events
// @route   GET /api/users/bookmarks
// @access  Private
const getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'bookmarkedEvents',
      populate: { path: 'organizer', select: 'name avatar' },
      select: '-registrations',
    });

    return res.status(200).json({
      success: true,
      events: user.bookmarkedEvents,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard stats for user
// @route   GET /api/users/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date();

    const [
      upcomingEvents,
      pendingRegistrations,
      myTeams,
      recentCertificates,
      totalEventsJoined,
      totalTeamsCount,
      totalCertsCount,
    ] = await Promise.all([
      Event.find({
        'registrations': { $elemMatch: { user: req.user.id, status: 'approved' } },
        startDate: { $gte: now },
      }).sort({ startDate: 1 }).limit(3).select('title slug banner startDate endDate mode'),

      Event.find({
        'registrations': { $elemMatch: { user: req.user.id, status: 'pending' } },
      }).select('title slug').limit(5),

      Team.find({ 'members.user': req.user.id })
        .populate('event', 'title status')
        .select('name members')
        .limit(3),

      Certificate.find({ user: req.user.id, isValid: true })
        .populate('event', 'title slug')
        .sort({ issuedAt: -1 })
        .limit(3),

      Event.countDocuments({
        'registrations': { $elemMatch: { user: req.user.id, status: 'approved' } },
      }),

      Team.countDocuments({ 'members.user': req.user.id }),

      Certificate.countDocuments({ user: req.user.id, isValid: true }),
    ]);

    const eventsJoined = Math.max(user.stats?.eventsJoined || 0, totalEventsJoined);
    const teamsCount = Math.max((user.stats?.teamsJoined || 0) + (user.stats?.teamsCreated || 0), totalTeamsCount);
    const certificatesEarned = Math.max(user.stats?.certificatesEarned || 0, totalCertsCount);

    return res.status(200).json({
      success: true,
      dashboard: {
        user: {
          points: user.points,
          level: user.level,
          badges: user.badges,
          streak: user.streak,
          stats: {
            ...user.stats,
            eventsJoined,
            teamsJoined: teamsCount,
            certificatesEarned,
          },
          profileCompletion: Math.max(user.profileCompletion || 0, 75),
        },
        upcomingEvents,
        pendingRegistrations,
        myTeams,
        recentCertificates,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  uploadUserAvatar,
  getMyEvents,
  getOrganizedEvents,
  getMyTeams,
  searchUsers,
  getBookmarks,
  getDashboardStats,
};
