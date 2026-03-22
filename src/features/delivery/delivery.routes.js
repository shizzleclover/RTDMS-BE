const express = require('express');
const router = express.Router();
const {
  createDelivery,
  getDeliveries,
  getDelivery,
  assignRider,
  updateStatus,
  trackDelivery,
  getMyDeliveries,
  getRiderDeliveries,
} = require('./delivery.controller');
const {
  createDeliveryValidator,
  assignRiderValidator,
  updateStatusValidator,
} = require('./delivery.validator');
const { protect } = require('../../common/middleware/auth.middleware');
const { authorize } = require('../../common/middleware/role.middleware');

// Public route — must be BEFORE protect middleware
router.get('/track/:trackingId', trackDelivery);

// All routes below require authentication
router.use(protect);

// Customer routes
router.get('/my-deliveries', authorize('customer'), getMyDeliveries);

// Rider routes
router.get('/rider-deliveries', authorize('rider'), getRiderDeliveries);
router.put('/:id/status', authorize('rider'), updateStatusValidator, updateStatus);

// Admin routes
router.post('/', authorize('admin'), createDeliveryValidator, createDelivery);
router.get('/', authorize('admin'), getDeliveries);
router.put('/:id/assign', authorize('admin'), assignRiderValidator, assignRider);

// Shared: Admin + assigned Rider
router.get('/:id', authorize('admin', 'rider'), getDelivery);

module.exports = router;
