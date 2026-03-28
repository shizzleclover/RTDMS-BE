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

    // Create Dispatcher (Admin role)
    const admin = await User.create({
      name: 'Head Dispatcher',
      email: 'admin@rtdms.com',
      password: 'password123',
      role: 'admin'
    });

    // Create Delivery Agent (Rider role)
    const rider = await User.create({
      name: 'Field Agent Ade',
      email: 'rider@rtdms.com',
      password: 'password123',
      role: 'rider',
      currentLocation: {
        type: 'Point',
        coordinates: [3.3792, 6.5244] // default lng/lat (Lagos)
      }
    });

    // Create Farmer (Customer role)
    const customer = await User.create({
      name: 'Farmer Bola',
      email: 'customer@rtdms.com',
      password: 'password123',
      role: 'customer'
    });

    console.log(` Created 3 Users. Credentials:
      Dispatcher: admin@rtdms.com / password123
      Delivery Agent: rider@rtdms.com / password123
      Farmer: customer@rtdms.com / password123
    `);

    // Create Deliveries with agricultural produce context
    await Delivery.create([
      {
        trackingId: generateTrackingId(),
        pickupLocation: { address: 'Oke-Odo Farm Settlement, Ikeja (Lagos)', coordinates: [3.3333, 6.6018] },
        dropoffLocation: { address: 'Mile 12 Market, Lagos', coordinates: [3.4219, 6.4281] },
        packageDescription: 'Fresh tomatoes (20 baskets) — High perishability',
        customer: customer._id,
        status: 'pending'
      },
      {
        trackingId: generateTrackingId(),
        pickupLocation: { address: 'Epe Fish Farm, Lekki', coordinates: [3.4667, 6.4381] },
        dropoffLocation: { address: 'Oyingbo Market, Yaba', coordinates: [3.3764, 6.5095] },
        packageDescription: 'Fresh catfish (15 crates) — Medium perishability',
        customer: customer._id,
        rider: rider._id,
        status: 'in_transit'
      },
      {
        trackingId: generateTrackingId(),
        pickupLocation: { address: 'Agege Vegetable Farm, Ikeja', coordinates: [3.3582, 6.6139] },
        dropoffLocation: { address: 'Balogun Market, Surulere', coordinates: [3.3486, 6.5000] },
        packageDescription: 'Leafy greens and yams (mixed produce) — Low perishability',
        customer: customer._id,
        rider: rider._id,
        status: 'delivered'
      }
    ]);

    console.log(' Created Agricultural Produce Deliveries.');
    console.log(' Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error(' Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
