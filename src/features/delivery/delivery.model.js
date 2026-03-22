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
    pickupAddress: {
      type: String,
      required: [true, 'Please add a pickup address'],
    },
    pickupCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Please add a delivery address'],
    },
    deliveryCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    packageDescription: {
      type: String,
      required: [true, 'Please add a package description'],
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-transit', 'delivered'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
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
