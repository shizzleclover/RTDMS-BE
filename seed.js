const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./src/features/user/user.model');
const Delivery = require('./src/features/delivery/delivery.model');

// Generate a random tracking ID helper
const generateTrackingId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'TRK-';
  for (let i = 0; i < 8; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' MongoDB Connected for Seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Delivery.deleteMany({});
    console.log(' Cleared existing data.');

    // Create Admin
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@rtdms.com',
      password: 'password123',
      role: 'admin'
    });

    // Create Rider
    const rider = await User.create({
      name: 'Fast Rider',
      email: 'rider@rtdms.com',
      password: 'password123',
      role: 'rider',
      currentLocation: {
        type: 'Point',
        coordinates: [3.3792, 6.5244] // default lng/lat (Lagos)
      }
    });

    // Create Customer
    const customer = await User.create({
      name: 'John Customer',
      email: 'customer@rtdms.com',
      password: 'password123',
      role: 'customer'
    });

    console.log(` Created 3 Users. Credentials:
      Admin: admin@rtdms.com / password123
      Rider: rider@rtdms.com / password123
      Customer: customer@rtdms.com / password123
    `);

    // Create Deliveries
    await Delivery.create([
      {
        trackingId: generateTrackingId(),
        pickupLocation: { address: 'Warehouse A, Ikeja (Lagos)', coordinates: [3.3333, 6.6018] },
        dropoffLocation: { address: 'Victoria Island, Lagos', coordinates: [3.4219, 6.4281] },
        customer: customer._id,
        status: 'pending'
      },
      {
        trackingId: generateTrackingId(),
        pickupLocation: { address: 'Lekki Phase 1', coordinates: [3.4667, 6.4381] },
        dropoffLocation: { address: 'Yaba, Lagos', coordinates: [3.3764, 6.5095] },
        customer: customer._id,
        rider: rider._id,
        status: 'in_transit'
      },
      {
        trackingId: generateTrackingId(),
        pickupLocation: { address: 'Ikeja City Mall', coordinates: [3.3582, 6.6139] },
        dropoffLocation: { address: 'Surulere, Lagos', coordinates: [3.3486, 6.5000] },
        customer: customer._id,
        rider: rider._id,
        status: 'delivered'
      }
    ]);

    console.log(' Created Dummy Deliveries.');
    console.log(' Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error(' Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
