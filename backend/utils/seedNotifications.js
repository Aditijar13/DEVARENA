const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const { Notification } = require('../models/Supplementary');

const seedNotifications = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devarena';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
    console.log('[seeder] Connected for notifications');

    const users = await User.find({ email: { $in: ['admin@devarena.dev', 'arjun@devarena.dev', 'priya@devarena.dev'] } });

    await Notification.deleteMany({});
    console.log('[seeder] Cleared previous notifications');

    for (const u of users) {
      await Notification.create([
        {
          recipient: u._id,
          type: 'badge_awarded',
          title: 'New Badge Unlocked!',
          message: 'Congratulations! You earned the "Code Starter" achievement badge.',
          isRead: false,
          priority: 'high',
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
        },
        {
          recipient: u._id,
          type: 'event_reminder',
          title: 'Event Starting Soon: DeFi BuildFest',
          message: 'Your registered hackathon starts in 48 hours. Team formation is now open!',
          link: '/explore',
          isRead: false,
          priority: 'medium',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
        {
          recipient: u._id,
          type: 'registration_approved',
          title: 'Registration Approved',
          message: 'Your application for MLOps India Summit has been accepted.',
          link: '/explore',
          isRead: true,
          priority: 'low',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      ]);
    }

    console.log('[seeder] Notifications seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[seeder] Error seeding notifications:', err);
    process.exit(1);
  }
};

seedNotifications();
