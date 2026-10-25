const express = require('express');
const router = express.Router();
const {
  getEvents, getEvent, createEvent, updateEvent, deleteEvent,
  registerForEvent, updateRegistrationStatus, toggleBookmark,
  getRecommended, getEventAnalytics, sendAnnouncement, issueCertificates, getTrending,
} = require('../controllers/eventController');
const { protect, optionalAuth, isOrganizerOrAdmin } = require('../middleware/auth');
const { uploadBanner } = require('../config/cloudinary');
const commentCtrl = require('../controllers/commentController');

// Public
router.get('/trending',     getTrending);
router.get('/recommended',  protect, getRecommended);
router.get('/',             optionalAuth, getEvents);

// CRUD
router.post('/',    protect, isOrganizerOrAdmin, uploadBanner.single('banner'), createEvent);
router.get('/:slug', optionalAuth, getEvent);
router.put('/:id',  protect, isOrganizerOrAdmin, uploadBanner.single('banner'), updateEvent);
router.delete('/:id', protect, isOrganizerOrAdmin, deleteEvent);

// Registration
router.post('/:id/register',                  protect, registerForEvent);
router.put('/:id/registrations/:userId',      protect, isOrganizerOrAdmin, updateRegistrationStatus);

// Bookmark
router.post('/:id/bookmark', protect, toggleBookmark);

// Organizer actions
router.get('/:id/analytics',         protect, isOrganizerOrAdmin, getEventAnalytics);
router.post('/:id/announce',         protect, isOrganizerOrAdmin, sendAnnouncement);
router.post('/:id/certificates/issue', protect, isOrganizerOrAdmin, issueCertificates);

// Comments via event route
router.get('/:eventId/comments',                      optionalAuth, commentCtrl.getComments);
router.post('/:eventId/comments',                     protect,      commentCtrl.createComment);
router.put('/:eventId/comments/:commentId',           protect,      commentCtrl.updateComment);
router.delete('/:eventId/comments/:commentId',        protect,      commentCtrl.deleteComment);
router.post('/:eventId/comments/:commentId/like',     protect,      commentCtrl.toggleLike);

module.exports = router;
