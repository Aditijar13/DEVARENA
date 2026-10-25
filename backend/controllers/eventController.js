const Event = require('../models/Event');
const User = require('../models/User');
const Team = require('../models/Team');
const { Notification, Certificate } = require('../models/Supplementary');
const { uploadBanner, deleteFromCloudinary } = require('../config/cloudinary');
const { getRecommendedEvents } = require('../utils/recommendationEngine');
const { sendNotification } = require('../utils/notificationService');
const { checkAndAwardBadges } = require('../utils/gamification');
const { generateCertificate } = require('../utils/certificateGenerator');

// @desc    Get all events with filters
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const {
      search, category, mode, status, isPaid, city, country,
      startDate, endDate, tags, skills, sortBy, page = 1, limit = 12,
      featured, myEvents,
    } = req.query;

    const query = { isPublished: true, isRemoved: false };

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (category && category !== 'all') query.category = category;
    if (mode && mode !== 'all') query.mode = mode;
    if (status && status !== 'all') query.status = status;
    if (isPaid !== undefined && isPaid !== 'all') query.isPaid = isPaid === 'true';
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (country) query['location.country'] = new RegExp(country, 'i');
    if (featured === 'true') query.isFeatured = true;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { ...query.endDate, $lte: new Date(endDate) };
    if (tags) query.tags = { $in: tags.split(',').map((t) => t.trim().toLowerCase()) };
    if (skills) query.skills = { $in: skills.split(',').map((s) => s.trim()) };

    // Sort
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'popular') sortOptions = { views: -1, bookmarks: -1 };
    if (sortBy === 'upcoming') sortOptions = { startDate: 1 };
    if (sortBy === 'registrations') sortOptions = { registeredCount: -1 };
    if (sortBy === 'newest') sortOptions = { createdAt: -1 };
    if (search) sortOptions = { score: { $meta: 'textScore' }, ...sortOptions };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Event.countDocuments(query);

    const events = await Event.find(query)
      .populate('organizer', 'name avatar headline')
      .select('-registrations -reports -__v')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add bookmark status if user is authenticated
    let bookmarkedIds = [];
    if (req.user) {
      const user = await User.findById(req.user.id).select('bookmarkedEvents');
      bookmarkedIds = user.bookmarkedEvents.map((id) => id.toString());
    }

    const eventsWithMeta = events.map((event) => ({
      ...event,
      isBookmarked: bookmarkedIds.includes(event._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      count: events.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      events: eventsWithMeta,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single event by slug
// @route   GET /api/events/:slug
// @access  Public
const getEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug, isRemoved: false })
      .populate('organizer', 'name avatar headline bio socialLinks stats')
      .populate('coOrganizers', 'name avatar')
      .populate('registrations.user', 'name avatar headline skills')
      .populate('registrations.team', 'name');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Increment view count
    event.views += 1;
    event.analytics.totalViews += 1;
    await event.save({ validateBeforeSave: false });

    // Check registration status for current user
    let userRegistration = null;
    let isBookmarked = false;
    if (req.user) {
      userRegistration = event.registrations.find(
        (r) => r.user && r.user._id.toString() === req.user.id
      );
      const user = await User.findById(req.user.id).select('bookmarkedEvents');
      isBookmarked = user.bookmarkedEvents.some((id) => id.toString() === event._id.toString());
    }

    return res.status(200).json({
      success: true,
      event,
      userRegistration,
      isBookmarked,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private (Organizer/Admin)
const createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user.id,
    };

    if (req.file) {
      eventData.banner = req.file.path;
      eventData.bannerPublicId = req.file.filename;
    }

    const event = await Event.create(eventData);

    // Update organizer stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.eventsCreated': 1, points: 100 },
    });

    // Check badges
    await checkAndAwardBadges(req.user.id, 'create_event');

    return res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      event,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Organizer/Admin)
const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (req.file) {
      if (event.bannerPublicId) {
        await deleteFromCloudinary(event.bannerPublicId);
      }
      req.body.banner = req.file.path;
      req.body.bannerPublicId = req.file.filename;
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('organizer', 'name avatar');

    // Notify registered participants of update
    if (req.body.notifyParticipants) {
      const approvedRegistrations = event.registrations
        .filter((r) => r.status === 'approved')
        .map((r) => r.user);

      approvedRegistrations.forEach(async (userId) => {
        await sendNotification(req.io, userId, {
          type: 'event_update',
          title: 'Event Updated',
          message: `${event.title} has been updated. Check the latest details.`,
          link: `/events/${event.slug}`,
        });
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully!',
      event,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Organizer/Admin)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (event.bannerPublicId) {
      await deleteFromCloudinary(event.bannerPublicId);
    }

    // Notify registered participants
    const participants = event.registrations
      .filter((r) => r.status === 'approved')
      .map((r) => r.user);

    participants.forEach(async (userId) => {
      await sendNotification(req.io, userId, {
        type: 'event_cancelled',
        title: 'Event Cancelled',
        message: `${event.title} has been cancelled.`,
      });
    });

    await event.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (!event.isRegistrationOpen) {
      return res.status(400).json({ success: false, message: 'Registration is not open.' });
    }

    // Check existing registration
    const existingReg = event.registrations.find(
      (r) => r.user.toString() === req.user.id
    );
    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: `You have already registered (Status: ${existingReg.status}).`,
      });
    }

    // Check capacity
    if (event.maxParticipants > 0 && event.registeredCount >= event.maxParticipants) {
      if (event.waitlistEnabled) {
        event.registrations.push({
          user: req.user.id,
          status: 'waitlisted',
          customAnswers: req.body.customAnswers,
        });
      } else {
        return res.status(400).json({ success: false, message: 'Event is fully booked.' });
      }
    } else {
      const status = event.requiresApproval ? 'pending' : 'approved';
      event.registrations.push({
        user: req.user.id,
        team: req.body.teamId,
        status,
        customAnswers: req.body.customAnswers,
      });

      if (status === 'approved') {
        event.registeredCount += 1;
      }
    }

    await event.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.eventsJoined': 1, points: 20 },
      $addToSet: { participationHistory: event._id },
    });

    // Notify organizer
    await sendNotification(req.io, event.organizer, {
      type: 'registration_pending',
      title: 'New Registration',
      message: `${req.user.name} has registered for ${event.title}.`,
      link: `/organizer/events/${event._id}/registrations`,
    });

    // Notify user
    const userStatus = event.registrations[event.registrations.length - 1].status;
    let userMessage = '';
    if (userStatus === 'approved') {
      userMessage = `Your registration for ${event.title} is confirmed!`;
    } else if (userStatus === 'pending') {
      userMessage = `Your registration for ${event.title} is pending approval.`;
    } else {
      userMessage = `You've been added to the waitlist for ${event.title}.`;
    }

    await sendNotification(req.io, req.user.id, {
      type: `registration_${userStatus}`,
      title: 'Registration Update',
      message: userMessage,
      link: `/events/${event.slug}`,
    });

    // Check badges
    await checkAndAwardBadges(req.user.id, 'register_event');

    return res.status(200).json({
      success: true,
      message: userMessage,
      status: userStatus,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update registration status (approve/reject)
// @route   PUT /api/events/:id/registrations/:userId
// @access  Private (Organizer)
const updateRegistrationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const registration = event.registrations.find(
      (r) => r.user.toString() === req.params.userId
    );

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    const previousStatus = registration.status;
    registration.status = status;

    if (status === 'approved') {
      registration.approvedAt = new Date();
      if (previousStatus !== 'approved') {
        event.registeredCount += 1;
      }
    } else if (status === 'rejected') {
      registration.rejectedAt = new Date();
      if (previousStatus === 'approved') {
        event.registeredCount = Math.max(0, event.registeredCount - 1);
      }
    }

    await event.save();

    // Notify user
    await sendNotification(req.io, req.params.userId, {
      type: `registration_${status}`,
      title: status === 'approved' ? ' Registration Approved!' : 'Registration Update',
      message:
        status === 'approved'
          ? `Your registration for ${event.title} has been approved!`
          : `Your registration for ${event.title} has been ${status}.`,
      link: `/events/${event.slug}`,
    });

    return res.status(200).json({
      success: true,
      message: `Registration ${status} successfully.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bookmark/unbookmark event
// @route   POST /api/events/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const user = await User.findById(req.user.id);
    const isBookmarked = user.bookmarkedEvents.some(
      (id) => id.toString() === req.params.id
    );

    if (isBookmarked) {
      user.bookmarkedEvents = user.bookmarkedEvents.filter(
        (id) => id.toString() !== req.params.id
      );
      event.bookmarks = Math.max(0, event.bookmarks - 1);
    } else {
      user.bookmarkedEvents.push(req.params.id);
      event.bookmarks += 1;
      await checkAndAwardBadges(req.user.id, 'bookmark_event');
    }

    await user.save({ validateBeforeSave: false });
    await event.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      isBookmarked: !isBookmarked,
      message: isBookmarked ? 'Event removed from bookmarks.' : 'Event bookmarked!',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recommended events for user
// @route   GET /api/events/recommended
// @access  Private
const getRecommended = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('participationHistory', 'category tags skills');
    const recommendations = await getRecommendedEvents(user);

    return res.status(200).json({
      success: true,
      events: recommendations,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get event analytics for organizer
// @route   GET /api/events/:id/analytics
// @access  Private (Organizer)
const getEventAnalytics = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registrations.user', 'skills location createdAt');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const registrations = event.registrations;
    const approved = registrations.filter((r) => r.status === 'approved');
    const pending = registrations.filter((r) => r.status === 'pending');
    const rejected = registrations.filter((r) => r.status === 'rejected');

    // Registration trend (last 7 days)
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      const count = registrations.filter(
        (r) => r.registeredAt >= dayStart && r.registeredAt <= dayEnd
      ).length;
      trend.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        registrations: count,
      });
    }

    // Skills distribution
    const skillsMap = {};
    approved.forEach((r) => {
      if (r.user && r.user.skills) {
        r.user.skills.forEach((skill) => {
          skillsMap[skill] = (skillsMap[skill] || 0) + 1;
        });
      }
    });

    const analytics = {
      totalRegistrations: registrations.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      waitlisted: registrations.filter((r) => r.status === 'waitlisted').length,
      views: event.views,
      bookmarks: event.bookmarks,
      conversionRate: event.views > 0
        ? ((approved.length / event.views) * 100).toFixed(2)
        : 0,
      registrationTrend: trend,
      skillsDistribution: Object.entries(skillsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count })),
      revenue: event.isPaid ? approved.length * event.price : 0,
      capacityUsage: event.maxParticipants > 0
        ? ((approved.length / event.maxParticipants) * 100).toFixed(1)
        : null,
    };

    return res.status(200).json({ success: true, analytics });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send announcement to participants
// @route   POST /api/events/:id/announce
// @access  Private (Organizer)
const sendAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const participants = event.registrations
      .filter((r) => r.status === 'approved')
      .map((r) => r.user.toString());

    for (const userId of participants) {
      await sendNotification(req.io, userId, {
        type: 'announcement',
        title: ` ${event.title}: ${title}`,
        message,
        link: `/events/${event.slug}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Announcement sent to ${participants.length} participants.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Issue certificates for event
// @route   POST /api/events/:id/certificates/issue
// @access  Private (Organizer)
const issueCertificates = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('registrations.user', 'name email');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const approved = event.registrations.filter((r) => r.status === 'approved' && !r.certificateIssued);
    const issued = [];

    for (const reg of approved) {
      try {
        const cert = await generateCertificate(reg.user, event);
        reg.certificateIssued = true;
        issued.push(cert);

        await sendNotification(req.io, reg.user._id, {
          type: 'certificate_issued',
          title: ' Certificate Issued!',
          message: `Your participation certificate for ${event.title} is ready!`,
          link: `/certificates`,
        });
      } catch (err) {
        console.error(`Certificate error for ${reg.user.name}:`, err.message);
      }
    }

    await event.save();

    return res.status(200).json({
      success: true,
      message: `Certificates issued to ${issued.length} participants.`,
      count: issued.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trending events
// @route   GET /api/events/trending
// @access  Public
const getTrending = async (req, res) => {
  try {
    let events = await Event.find({
      isPublished: true,
      isRemoved: false,
      status: { $in: ['upcoming', 'ongoing'] },
    })
      .populate('organizer', 'name avatar')
      .sort({ views: -1, registeredCount: -1, bookmarks: -1 })
      .limit(8)
      .select('-registrations')
      .lean();

    // Fallback: if not enough upcoming events, grab any published events
    if (events.length < 4) {
      events = await Event.find({
        isPublished: true,
        isRemoved: false,
      })
        .populate('organizer', 'name avatar')
        .sort({ views: -1, registeredCount: -1, bookmarks: -1 })
        .limit(8)
        .select('-registrations')
        .lean();
    }

    return res.status(200).json({ success: true, events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  updateRegistrationStatus,
  toggleBookmark,
  getRecommended,
  getEventAnalytics,
  sendAnnouncement,
  issueCertificates,
  getTrending,
};
