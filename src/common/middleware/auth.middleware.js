const jwt = require('jsonwebtoken');
const User = require('../../features/user/user.model');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn('Auth', 'Access attempt without token');
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      logger.warn('Auth', `Token valid but user not found: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        error: 'User no longer exists',
      });
    }

    next();
  } catch (err) {
    logger.warn('Auth', `Invalid token: ${err.message}`);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }
};

module.exports = { protect };
