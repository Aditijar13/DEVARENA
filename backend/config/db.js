const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devarena';
  const fallbackUri = 'mongodb://127.0.0.1:27017/devarena';

  try {
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    logger.info(`[db] MongoDB connected: ${conn.connection.name}`);
  } catch (error) {
    logger.warn(`MongoDB primary connection failed (${error.message}). Attempting fallback to local MongoDB...`);
    try {
      const conn = await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 3000 });
      logger.info(`[db] MongoDB connected to local fallback: ${conn.connection.name}`);
    } catch (fallbackError) {
      logger.error(`MongoDB connection error: ${fallbackError.message}`);
      process.exit(1);
    }
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
};

module.exports = connectDB;
