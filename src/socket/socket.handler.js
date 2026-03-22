const Delivery = require('../features/delivery/delivery.model');
const User = require('../features/user/user.model');
const logger = require('../common/utils/logger');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    const { user } = socket;
    logger.socket(`Connected: ${user.email} (${user.role}) | Socket: ${socket.id}`);

    // ─── Auto-join role-based rooms ───
    if (user.role === 'admin') {
      socket.join('admin');
      logger.socket(`${user.email} joined room: admin`);
    }

    if (user.role === 'rider') {
      socket.join(`rider:${user._id}`);
      logger.socket(`${user.email} joined room: rider:${user._id}`);
    }

    // ─── Customer joins a delivery tracking room ───
    socket.on('tracking:join', async ({ trackingId }) => {
      try {
        const delivery = await Delivery.findOne({ trackingId });
        if (!delivery) {
          socket.emit('error', { message: 'Delivery not found' });
          return;
        }

        const room = `delivery:${delivery._id}`;
        socket.join(room);
        logger.socket(`${user.email} joined tracking room: ${room}`);

        // Send current delivery state
        socket.emit('tracking:update', {
          deliveryId: delivery._id,
          trackingId: delivery.trackingId,
          status: delivery.status,
          currentLocation: delivery.currentLocation,
        });
      } catch (err) {
        logger.error('Socket', `tracking:join error: ${err.message}`);
        socket.emit('error', { message: 'Failed to join tracking' });
      }
    });

    socket.on('tracking:leave', ({ deliveryId }) => {
      const room = `delivery:${deliveryId}`;
      socket.leave(room);
      logger.socket(`${user.email} left room: ${room}`);
    });

    // ─── Rider joins their assigned delivery room ───
    socket.on('rider:joinDelivery', async ({ deliveryId }) => {
      try {
        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
          socket.emit('error', { message: 'Delivery not found' });
          return;
        }

        if (delivery.rider.toString() !== user._id.toString()) {
          socket.emit('error', { message: 'Not assigned to this delivery' });
          return;
        }

        const room = `delivery:${deliveryId}`;
        socket.join(room);
        logger.socket(`Rider ${user.email} joined delivery room: ${room}`);
      } catch (err) {
        logger.error('Socket', `rider:joinDelivery error: ${err.message}`);
      }
    });

    // ─── Rider broadcasts GPS location ───
    socket.on('rider:updateLocation', async ({ deliveryId, lat, lng }) => {
      try {
        // Update delivery's current location
        await Delivery.findByIdAndUpdate(deliveryId, {
          currentLocation: { lat, lng },
        });

        // Update rider's current location
        await User.findByIdAndUpdate(user._id, {
          currentLocation: { lat, lng },
        });

        const payload = {
          deliveryId,
          lat,
          lng,
          riderId: user._id,
          timestamp: new Date(),
        };

        // Push to admin dashboard
        io.to('admin').emit('delivery:locationUpdate', payload);

        // Push to customer tracking the delivery
        io.to(`delivery:${deliveryId}`).emit('tracking:update', {
          deliveryId,
          lat,
          lng,
          status: 'in-transit',
        });

        logger.socket(
          `Location update: Rider ${user.email} → [${lat}, ${lng}]`
        );
      } catch (err) {
        logger.error('Socket', `rider:updateLocation error: ${err.message}`);
      }
    });

    // ─── Rider updates delivery status via socket ───
    socket.on('rider:statusUpdate', async ({ deliveryId, status }) => {
      try {
        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
          socket.emit('error', { message: 'Delivery not found' });
          return;
        }

        if (delivery.rider.toString() !== user._id.toString()) {
          socket.emit('error', { message: 'Not assigned to this delivery' });
          return;
        }

        // Validate transition
        const validTransitions = {
          assigned: ['in-transit'],
          'in-transit': ['delivered'],
        };

        const allowed = validTransitions[delivery.status];
        if (!allowed || !allowed.includes(status)) {
          socket.emit('error', {
            message: `Cannot change from '${delivery.status}' to '${status}'`,
          });
          return;
        }

        delivery.status = status;
        delivery.statusHistory.push({ status });
        await delivery.save();

        if (status === 'delivered') {
          await User.findByIdAndUpdate(user._id, { isAvailable: true });
        }

        const payload = {
          deliveryId,
          trackingId: delivery.trackingId,
          status,
          timestamp: new Date(),
        };

        io.to('admin').emit('delivery:statusChanged', payload);
        io.to(`delivery:${deliveryId}`).emit('delivery:statusChanged', payload);

        logger.socket(
          `Status update: ${delivery.trackingId} → ${status} by ${user.email}`
        );
      } catch (err) {
        logger.error('Socket', `rider:statusUpdate error: ${err.message}`);
      }
    });

    // ─── Disconnect ───
    socket.on('disconnect', () => {
      logger.socket(`Disconnected: ${user.email} (${user.role})`);
    });
  });
};

module.exports = setupSocket;
