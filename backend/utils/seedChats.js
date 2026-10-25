const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Chat = require('../models/Chat');

const seedChats = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devarena';
    await mongoose.connect(mongoUri);
    console.log('[seeder] Connected to MongoDB');

    const admin = await User.findOne({ email: 'admin@devarena.dev' });
    const arjun = await User.findOne({ email: 'arjun@devarena.dev' });
    const priya = await User.findOne({ email: 'priya@devarena.dev' });
    const rahul = await User.findOne({ email: 'rahul@devarena.dev' });

    if (!admin || !arjun || !priya) {
      console.log('[seeder] Seeded users not found. Run main seeder first.');
      process.exit(1);
    }

    // Clear existing chats to start fresh
    await Chat.deleteMany({});
    console.log('[seeder] Cleared existing chats');

    // 1. Direct chat: Admin <-> Arjun
    const chat1 = await Chat.create({
      type: 'direct',
      participants: [admin._id, arjun._id],
      messages: [
        {
          sender: arjun._id,
          content: 'Hi Admin! Excited to participate in the upcoming DeFi BuildFest.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          readBy: [arjun._id, admin._id],
        },
        {
          sender: admin._id,
          content: 'Welcome Arjun! Make sure your team repository is set up with smart contract test suites.',
          createdAt: new Date(Date.now() - 1000 * 60 * 50), // 50 mins ago
          readBy: [arjun._id, admin._id],
        },
        {
          sender: arjun._id,
          content: 'Will do! We are using Hardhat and Foundry. Thanks for the quick response!',
          createdAt: new Date(Date.now() - 1000 * 60 * 20), // 20 mins ago
          readBy: [arjun._id],
        },
      ],
      lastMessage: {
        content: 'Will do! We are using Hardhat and Foundry. Thanks for the quick response!',
        sender: arjun._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 20),
      },
    });

    // 2. Direct chat: Admin <-> Priya (Organizer)
    const chat2 = await Chat.create({
      type: 'direct',
      participants: [admin._id, priya._id],
      messages: [
        {
          sender: priya._id,
          content: 'Hello! We have finalized the keynote speakers for the MLOps Summit.',
          createdAt: new Date(Date.now() - 1000 * 60 * 120),
          readBy: [priya._id, admin._id],
        },
        {
          sender: admin._id,
          content: 'Awesome Priya! The event banner and registration forms are live on the Explore page.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60),
          readBy: [priya._id, admin._id],
        },
      ],
      lastMessage: {
        content: 'Awesome Priya! The event banner and registration forms are live on the Explore page.',
        sender: admin._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
      },
    });

    // 3. Direct chat: Arjun <-> Priya
    const chat3 = await Chat.create({
      type: 'direct',
      participants: [arjun._id, priya._id],
      messages: [
        {
          sender: arjun._id,
          content: 'Hi Priya, will mentor office hours be hosted on Discord or Google Meet?',
          createdAt: new Date(Date.now() - 1000 * 60 * 40),
          readBy: [arjun._id, priya._id],
        },
        {
          sender: priya._id,
          content: 'Hey Arjun! We will share Google Meet links in the event schedule tab 30 mins before.',
          createdAt: new Date(Date.now() - 1000 * 60 * 15),
          readBy: [arjun._id, priya._id],
        },
      ],
      lastMessage: {
        content: 'Hey Arjun! We will share Google Meet links in the event schedule tab 30 mins before.',
        sender: priya._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
      },
    });

    if (rahul) {
      // 4. Direct chat: Admin <-> Rahul
      await Chat.create({
        type: 'direct',
        participants: [admin._id, rahul._id],
        messages: [
          {
            sender: rahul._id,
            content: 'Hello! How do I claim my certificate for the previous algorithm championship?',
            createdAt: new Date(Date.now() - 1000 * 60 * 180),
            readBy: [rahul._id, admin._id],
          },
          {
            sender: admin._id,
            content: 'You can go to your Profile -> Certificates tab and click Download PDF.',
            createdAt: new Date(Date.now() - 1000 * 60 * 90),
            readBy: [rahul._id, admin._id],
          },
        ],
        lastMessage: {
          content: 'You can go to your Profile -> Certificates tab and click Download PDF.',
          sender: admin._id,
          createdAt: new Date(Date.now() - 1000 * 60 * 90),
        },
      });
    }

    console.log('[seeder] Successfully seeded initial conversations and messages!');
    process.exit(0);
  } catch (error) {
    console.error('[seeder] Error seeding chats:', error);
    process.exit(1);
  }
};

seedChats();
