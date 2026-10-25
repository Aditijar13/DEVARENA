const express  = require('express');
const http     = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');
const passport  = require('passport');
const path      = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { initializeSocket } = require('./socket/socketHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes    = require('./routes/auth');
const userRoutes    = require('./routes/users');
const eventRoutes   = require('./routes/events');
const teamRoutes    = require('./routes/teams');
const chatRoutes    = require('./routes/chat');
const notifRoutes   = require('./routes/notifications');
const adminRoutes   = require('./routes/admin');
const certRoutes    = require('./routes/certificates');
const paymentRoutes = require('./routes/payments');
const commentRoutes = require('./routes/comments');
const leaderRoutes  = require('./routes/leaderboard');

const app    = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const isProd     = process.env.NODE_ENV === 'production';

// ── Socket.io ────────────────────────────────────────────────
const io = socketIO(server, {
  cors: {
    origin: isProd ? CLIENT_URL : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Database ─────────────────────────────────────────────────
connectDB();

// ── Passport ─────────────────────────────────────────────────
require('./config/passport')(passport);

// ── Rate limiters ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

// ── Core middleware ───────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: isProd ? CLIENT_URL : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(passport.initialize());

// Inject io into every request
app.use((req, _res, next) => { req.io = io; next(); });

// ── Rate limits on API ────────────────────────────────────────
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/teams',         teamRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/certificates',  certRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/comments',      commentRoutes);
app.use('/api/leaderboard',   leaderRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() })
);

// ── Serve React build in PRODUCTION ──────────────────────────
// The frontend build lives at ../frontend/build relative to this file
const FRONTEND_BUILD = path.join(__dirname, '..', 'frontend', 'build');

if (isProd) {
  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(FRONTEND_BUILD));

  // Any route that is NOT /api/* → send React's index.html
  // This lets React Router handle all frontend routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ success: false, message: 'API route not found' });
    res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
  });
} else {
  // Development: just return 404 for unknown routes
  // (React dev server runs separately on port 3000)
  app.use('*', (_req, res) =>
    res.status(404).json({ success: false, message: 'Route not found' })
  );
}

// ── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error(`${err.message}\n${err.stack}`);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Socket.io ─────────────────────────────────────────────────
initializeSocket(io);

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info('[server] Running on port ' + PORT + ' in ' + (process.env.NODE_ENV || 'development') + ' mode');
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = { app, io };
