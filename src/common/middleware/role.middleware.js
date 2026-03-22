const logger = require('../utils/logger');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        'Auth',
        `Role '${req.user.role}' denied access. Required: [${roles.join(', ')}]`
      );
      return res.status(403).json({
        success: false,
        error: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

module.exports = { authorize };
