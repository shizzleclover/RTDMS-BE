const User = require('../user/user.model');
const logger = require('../../common/utils/logger');

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    logger.info('User', `Admin fetched all users (${users.length} found)`);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all riders
// @route   GET /api/users/riders
// @access  Admin
const getRiders = async (req, res, next) => {
  try {
    const riders = await User.find({ role: 'rider' }).select('-password');
    logger.info('User', `Admin fetched riders (${riders.length} found)`);

    res.status(200).json({
      success: true,
      count: riders.length,
      data: riders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      logger.warn('User', `User not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    logger.info('User', `Admin fetched user: ${user.email}`);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getRiders,
  getUser,
};
