const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - JWT authentication
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid. User not found.',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Your account has been banned. Reason: ${user.banReason || 'Violation of terms'}`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired.' });
    }
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (err) {
    // Fail silently
  }
  next();
};

// Role authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this action.`,
      });
    }
    next();
  };
};

// Check if user is organizer or admin
const isOrganizerOrAdmin = (req, res, next) => {
  if (req.user.role === 'organizer' || req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Only organizers or admins can perform this action.',
  });
};

// Check if user owns the resource or is admin
const isOwnerOrAdmin = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const doc = await model.findById(req.params[paramName]);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Resource not found.' });
      }

      const ownerId = doc.organizer || doc.user || doc.leader || doc.author;
      const isOwner = ownerId && ownerId.toString() === req.user.id;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to modify this resource.',
        });
      }

      req.resource = doc;
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Authorization check failed.' });
    }
  };
};

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '90d' }
  );
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  isOrganizerOrAdmin,
  isOwnerOrAdmin,
  generateToken,
  generateRefreshToken,
};
