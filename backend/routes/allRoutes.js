const express = require('express');
const { protect, authorize, isOrganizerOrAdmin, optionalAuth } = require('../middleware/auth');

// ──────────────────────────────────────────────
// USER ROUTER
// ──────────────────────────────────────────────
const userRouter = express.Router();
const userCtrl = require('../controllers/userController');
const { uploadAvatar } = require('../config/cloudinary');

userRouter.get('/search',           protect, userCtrl.searchUsers);
userRouter.get('/dashboard',        protect, userCtrl.getDashboardStats);
userRouter.get('/my-events',        protect, userCtrl.getMyEvents);
userRouter.get('/organized-events', protect, isOrganizerOrAdmin, userCtrl.getOrganizedEvents);
userRouter.get('/my-teams',         protect, userCtrl.getMyTeams);
userRouter.get('/bookmarks',        protect, userCtrl.getBookmarks);
userRouter.put('/profile',          protect, userCtrl.updateProfile);
userRouter.put('/avatar',           protect, uploadAvatar.single('avatar'), userCtrl.uploadUserAvatar);
userRouter.get('/:id',              userCtrl.getUserProfile);

// ──────────────────────────────────────────────
// TEAM ROUTER
// ──────────────────────────────────────────────
const teamRouter = express.Router();
const teamCtrl = require('../controllers/teamController');

teamRouter.get('/event/:eventId',           teamCtrl.getTeamsByEvent);
teamRouter.post('/',                        protect, teamCtrl.createTeam);
teamRouter.get('/:id',                      teamCtrl.getTeam);
teamRouter.put('/:id',                      protect, teamCtrl.updateTeam);
teamRouter.post('/:id/invite',              protect, teamCtrl.inviteMember);
teamRouter.put('/:id/invite/respond',       protect, teamCtrl.respondToInvite);
teamRouter.post('/:id/request',             protect, teamCtrl.requestToJoin);
teamRouter.put('/:id/request/:requestId',   protect, teamCtrl.respondToRequest);
teamRouter.delete('/:id/leave',             protect, teamCtrl.leaveTeam);

// ──────────────────────────────────────────────
// CHAT ROUTER
// ──────────────────────────────────────────────
const chatRouter = express.Router();
const chatCtrl = require('../controllers/chatController');

chatRouter.get('/',                               protect, chatCtrl.getChats);
chatRouter.get('/unread',                         protect, chatCtrl.getUnreadCount);
chatRouter.post('/direct/:userId',                protect, chatCtrl.getOrCreateDirectChat);
chatRouter.get('/:chatId/messages',               protect, chatCtrl.getMessages);
chatRouter.post('/:chatId/messages',              protect, chatCtrl.sendMessage);
chatRouter.delete('/:chatId/messages/:messageId', protect, chatCtrl.deleteMessage);

// ──────────────────────────────────────────────
// NOTIFICATION ROUTER
// ──────────────────────────────────────────────
const notifRouter = express.Router();
const { getNotifications, markAsRead, deleteNotification } = require('../controllers/adminController');

notifRouter.get('/',      protect, getNotifications);
notifRouter.put('/read',  protect, markAsRead);
notifRouter.delete('/:id', protect, deleteNotification);

// ──────────────────────────────────────────────
// ADMIN ROUTER
// ──────────────────────────────────────────────
const adminRouter = express.Router();
const {
  getPlatformStats, getAllUsers, toggleBanUser,
  changeUserRole, removeEvent, toggleFeatureEvent, getReports,
} = require('../controllers/adminController');

adminRouter.use(protect, authorize('admin'));
adminRouter.get('/stats',              getPlatformStats);
adminRouter.get('/users',              getAllUsers);
adminRouter.put('/users/:id/ban',      toggleBanUser);
adminRouter.put('/users/:id/role',     changeUserRole);
adminRouter.put('/events/:id/remove',  removeEvent);
adminRouter.put('/events/:id/feature', toggleFeatureEvent);
adminRouter.get('/reports',            getReports);

// ──────────────────────────────────────────────
// LEADERBOARD ROUTER
// ──────────────────────────────────────────────
const leaderRouter = express.Router();
const { getLeaderboard } = require('../controllers/adminController');
leaderRouter.get('/', optionalAuth, getLeaderboard);

// ──────────────────────────────────────────────
// CERTIFICATE ROUTER
// ──────────────────────────────────────────────
const certRouter = express.Router();
const Certificate = require('../models/Supplementary').Certificate;

certRouter.get('/', protect, async (req, res) => {
  try {
    const certs = await Certificate.find({ user: req.user.id, isValid: true })
      .populate('event', 'title slug category startDate endDate banner organizer')
      .sort({ issuedAt: -1 });
    return res.status(200).json({ success: true, certificates: certs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

certRouter.get('/verify/:certificateId', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId })
      .populate('user', 'name avatar')
      .populate('event', 'title slug organizer startDate');
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
    return res.status(200).json({ success: true, certificate: cert, isValid: cert.isValid });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────
// COMMENT ROUTER
// ──────────────────────────────────────────────
const commentRouter = express.Router();
const commentCtrl = require('../controllers/commentController');

commentRouter.get('/event/:eventId',                      optionalAuth, commentCtrl.getComments);
commentRouter.post('/event/:eventId',                     protect,      commentCtrl.createComment);
commentRouter.put('/event/:eventId/:commentId',           protect,      commentCtrl.updateComment);
commentRouter.delete('/event/:eventId/:commentId',        protect,      commentCtrl.deleteComment);
commentRouter.post('/event/:eventId/:commentId/like',     protect,      commentCtrl.toggleLike);

// ──────────────────────────────────────────────
// PAYMENT ROUTER  (Razorpay)
// ──────────────────────────────────────────────
const paymentRouter = express.Router();
const crypto = require('crypto');

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for a paid event registration.
 */
paymentRouter.post('/create-order', protect, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ success: false, message: 'eventId is required.' });

    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    if (!event)          return res.status(404).json({ success: false, message: 'Event not found.' });
    if (!event.isPaid)   return res.status(400).json({ success: false, message: 'Event is free — no payment needed.' });

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Sandbox / Test Mode fallback if keys not configured
    if (!keyId || !keySecret) {
      const mockOrderId = `order_sandbox_${Date.now()}`;
      return res.status(200).json({
        success:    true,
        orderId:    mockOrderId,
        amount:     Math.round(event.price * 100),
        currency:   (event.currency || 'INR').toUpperCase(),
        keyId:      'rzp_test_sandbox',
        isSandbox:  true,
        eventTitle: event.title,
      });
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount:   Math.round(event.price * 100),           // paise
      currency: (event.currency || 'INR').toUpperCase(),
      receipt:  `evt_${eventId}_usr_${req.user.id}`.slice(0, 40),
      notes:    { eventId: eventId.toString(), userId: req.user.id.toString() },
    });

    return res.status(200).json({
      success:    true,
      orderId:    order.id,
      amount:     order.amount,
      currency:   order.currency,
      keyId,
      isSandbox:  false,
      eventTitle: event.title,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature and approves registration.
 */
paymentRouter.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId, isSandbox } = req.body;
    if (!razorpay_order_id || !eventId) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields.' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // In live mode with keys configured, verify signature
    if (keySecret && !isSandbox && !razorpay_order_id.startsWith('order_sandbox_')) {
      const hmac   = crypto.createHmac('sha256', keySecret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = hmac.digest('hex');

      if (digest !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature.' });
      }
    }

    // Approve registration
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const existing = event.registrations.find(r => r.user.toString() === req.user.id.toString());
    const payId = razorpay_payment_id || `pay_sandbox_${Date.now()}`;
    if (existing) {
      existing.status        = 'approved';
      existing.paymentId     = payId;
      existing.paymentStatus = 'completed';
    } else {
      event.registrations.push({
        user:          req.user.id,
        status:        'approved',
        paymentId:     payId,
        paymentStatus: 'completed',
      });
      event.registeredCount = (event.registeredCount || 0) + 1;
    }
    await event.save();

    return res.status(200).json({ success: true, message: 'Payment verified and registration approved.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = {
  userRouter, teamRouter, chatRouter, notifRouter,
  adminRouter, leaderRouter, certRouter, commentRouter, paymentRouter,
};
