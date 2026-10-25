// ============================================================
// utils/notificationService.js
// ============================================================
const { Notification } = require('../models/Supplementary');

const sendNotification = async (io, userId, { type, title, message, link, data, sender }) => {
  try {
    const notification = await Notification.create({
      recipient: userId,
      sender,
      type,
      title,
      message,
      link,
      data,
    });

    // Emit real-time notification
    if (io) {
      io.to(`user:${userId}`).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Notification error:', error.message);
  }
};

module.exports = { sendNotification };
