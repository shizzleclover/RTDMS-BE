const Delivery = require('./delivery.model');
const User = require('../user/user.model');
const generateTrackingId = require('../../common/utils/generateTrackingId');
const logger = require('../../common/utils/logger');

// @desc    Create new delivery
// @route   POST /api/deliveries
// @access  Admin
const createDelivery = async (req, res, next) => {
  try {
    const {
      customer,
      pickupLocation,
      dropoffLocation,
      packageDescription,
      rider,
    } = req.body;

    const customerUser = await User.findById(customer);
    if (!customerUser || customerUser.role !== 'customer') {
      return res.status(400).json({ success: false, error: 'Invalid customer ID' });
    }

    let trackingId;
    let isUnique = false;
    while (!isUnique) {
      trackingId = generateTrackingId();
      const existing = await Delivery.findOne({ trackingId });
      if (!existing) isUnique = true;
    }

    const deliveryData = {
      trackingId,
      customer,
      pickupLocation,
      dropoffLocation,
      packageDescription,
    };

    if (rider) {
      const riderUser = await User.findById(rider);
      if (!riderUser || riderUser.role !== 'rider') {
        return res.status(400).json({ success: false, error: 'Invalid rider ID' });
      }
      deliveryData.rider = rider;
      deliveryData.status = 'picked_up'; // Aligning with frontend expectations
    }

    const delivery = await Delivery.create(deliveryData);
    await delivery.populate(['customer', 'rider']);

    logger.info('Delivery', `Created: ${trackingId} | Customer: ${customerUser.email}`);

    if (req.io) {
      req.io.to('admin').emit('delivery:new', { delivery });
      if (rider) {
        req.io.to(`rider:${rider}`).emit('delivery:assigned', { delivery });
      }
    }

    res.status(201).json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all deliveries
const getDeliveries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const deliveries = await Delivery.find(query)
      .populate('customer', 'name email phone')
      .populate('rider', 'name email phone isAvailable')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Delivery.countDocuments(query);
    res.status(200).json({
      success: true, count: deliveries.length, total, page: parseInt(page),
      pages: Math.ceil(total / limit), data: deliveries,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single delivery
const getDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('rider', 'name email phone isAvailable currentLocation');

    if (!delivery) return res.status(404).json({ success: false, error: 'Delivery not found' });
    if (req.user.role === 'rider' && (!delivery.rider || delivery.rider._id.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this delivery' });
    }
    res.status(200).json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign rider to delivery
const assignRider = async (req, res, next) => {
  try {
    const { riderId } = req.body;
    const rider = await User.findById(riderId);
    if (!rider || rider.role !== 'rider') return res.status(400).json({ success: false, error: 'Invalid rider ID' });

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, error: 'Delivery not found' });
    if (delivery.status === 'delivered') return res.status(400).json({ success: false, error: 'Cannot assign rider to a delivered order' });

    delivery.rider = riderId;
    delivery.status = 'picked_up'; // UI strictly expects picked_up
    delivery.statusHistory.push({ status: 'picked_up' });
    await delivery.save();
    await delivery.populate([{ path: 'customer', select: 'name email' }, { path: 'rider', select: 'name email' }]);

    logger.info('Delivery', `Assigned: ${delivery.trackingId} -> Rider: ${rider.email}`);

    if (req.io) {
      req.io.to('admin').emit('delivery:statusChanged', { deliveryId: delivery._id, trackingId: delivery.trackingId, status: 'picked_up', timestamp: new Date() });
      req.io.to(`rider:${riderId}`).emit('delivery:assigned', { delivery });
      req.io.to(`delivery:${delivery._id}`).emit('delivery:statusChanged', { deliveryId: delivery._id, status: 'picked_up', timestamp: new Date() });
    }
    res.status(200).json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
};

// @desc    Update delivery status
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, error: 'Delivery not found' });
    if (!delivery.rider || delivery.rider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You are not assigned to this delivery' });
    }

    delivery.status = status;
    delivery.statusHistory.push({ status });
    if (status === 'delivered') {
      await User.findByIdAndUpdate(req.user.id, { isAvailable: true });
    }
    await delivery.save();

    logger.info('Delivery', `Status updated: ${delivery.trackingId} -> ${status} by ${req.user.email}`);

    if (req.io) {
      const payload = { deliveryId: delivery._id, trackingId: delivery.trackingId, status, timestamp: new Date() };
      req.io.to('admin').emit('delivery:statusChanged', payload);
      req.io.to(`delivery:${delivery._id}`).emit('delivery:statusChanged', payload);
    }
    res.status(200).json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
};

// @desc    Track delivery by tracking ID
const trackDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({ trackingId: req.params.trackingId })
      .populate('rider', 'name phone')
      .select('trackingId status statusHistory pickupLocation dropoffLocation currentLocation rider createdAt');

    if (!delivery) {
      logger.warn('Delivery', `Track not found: ${req.params.trackingId}`);
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }
    res.status(200).json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
};

const getMyDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find({ customer: req.user.id })
      .populate('rider', 'name phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
  } catch (err) {
    next(err);
  }
};

const getRiderDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find({ rider: req.user.id })
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
  } catch (err) {
    next(err);
  }
};

module.exports = { createDelivery, getDeliveries, getDelivery, assignRider, updateStatus, trackDelivery, getMyDeliveries, getRiderDeliveries };
