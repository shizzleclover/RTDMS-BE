const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array().map((e) => e.msg).join(', '),
    });
  }
  next();
};

const createDeliveryValidator = [
  body('customer')
    .notEmpty()
    .withMessage('Customer ID is required')
    .isMongoId()
    .withMessage('Invalid customer ID format'),
  body('pickupAddress')
    .trim()
    .notEmpty()
    .withMessage('Pickup address is required'),
  body('deliveryAddress')
    .trim()
    .notEmpty()
    .withMessage('Delivery address is required'),
  body('packageDescription')
    .trim()
    .notEmpty()
    .withMessage('Package description is required'),
  body('rider')
    .optional()
    .isMongoId()
    .withMessage('Invalid rider ID format'),
  validate,
];

const assignRiderValidator = [
  body('riderId')
    .notEmpty()
    .withMessage('Rider ID is required')
    .isMongoId()
    .withMessage('Invalid rider ID format'),
  validate,
];

const updateStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['picked_up', 'in_transit', 'delivered'])
    .withMessage('Status must be picked_up, in_transit, or delivered'),
  validate,
];

module.exports = {
  createDeliveryValidator,
  assignRiderValidator,
  updateStatusValidator,
};
