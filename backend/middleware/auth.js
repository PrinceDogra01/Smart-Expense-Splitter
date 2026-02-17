const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production');
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Optional auth - attach user if token present, do not fail if missing
const optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      req.user = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      req.user = null;
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, optionalProtect };

