const jwt = require('jsonwebtoken');
const User = require('../features/user/user.model');
const logger = require('../common/utils/logger');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      logger.warn('Socket', `Connection rejected: No token provided`);
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logger.warn('Socket', `Connection rejected: User not found (${decoded.id})`);
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.user = user;
    logger.socket(`Authenticated: ${user.email} (${user.role})`);
    next();
  } catch (err) {
    logger.error('Socket', `Auth failed: ${err.message}`);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;
