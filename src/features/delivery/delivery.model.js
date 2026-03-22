const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify a customer'],
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    pickupLocation: {
      address: { type: String, required: true },
      coordinates: { type: [Number] }
    },
    dropoffLocation: {
      address: { type: String, required: true },
      coordinates: { type: [Number] }
    },
    packageDescription: {
      type: String,
      required: false, // Not strictly needed for UI presentation
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] }
    },
  },
  {
    timestamps: true,
  }
);

// Push initial status to history on creation
DeliverySchema.pre('save', function (next) {
  if (this.isNew) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

module.exports = mongoose.model('Delivery', DeliverySchema);
