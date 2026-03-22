const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./src/features/user/user.model');
const Delivery = require('./src/features/delivery/delivery.model');

const generateTrackingId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'TRK-';
  for (let i = 0; i < 8; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
};

const lagosLocations = [
  { address: 'Ikeja City Mall', coords: [3.3582, 6.6139] },
  { address: 'Victoria Island Central', coords: [3.4219, 6.4281] },
  { address: 'Lekki Phase 1', coords: [3.4667, 6.4381] },
  { address: 'Yaba Tech Hub', coords: [3.3764, 6.5095] },
  { address: 'Surulere Stadium', coords: [3.3486, 6.5000] },
  { address: 'Ajah Bus Terminal', coords: [3.5667, 6.4667] },
  { address: 'Oshodi Transport Interchange', coords: [3.3483, 6.5492] },
  { address: 'Gbagada Expressway', coords: [3.3958, 6.5562] },
  { address: 'Maryland Mall', coords: [3.3644, 6.5760] },
  { address: 'Banana Island', coords: [3.4500, 6.4600] },
  { address: 'Chevron Toll Gate', coords: [3.5333, 6.4333] },
  { address: 'Magodo Phase 2', coords: [3.3833, 6.6167] }
];

const seedMassive = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' Connected to DB for Massive Seeding...');

    const admin = await User.findOne({ email: 'admin@rtdms.com' });
    const rider = await User.findOne({ email: 'rider@rtdms.com' });
    const customer = await User.findOne({ email: 'customer@rtdms.com' });

    if (!admin || !rider || !customer) {
      console.error(' Core users not found. Run seed.js first.');
      process.exit(1);
    }

    // Generate 25 extra realistic deliveries
    const jobs = [];
    
    // We want a good distribution of statuses
    // 10 pending, 5 picked_up, 5 in_transit, 5 delivered
    const distribution = [
      ...Array(10).fill('pending'),
      ...Array(5).fill('picked_up'),
      ...Array(5).fill('in_transit'),
      ...Array(5).fill('delivered')
    ];
    
    for(let status of distribution) {
      const pLoc = lagosLocations[Math.floor(Math.random() * lagosLocations.length)];
      let dLoc = lagosLocations[Math.floor(Math.random() * lagosLocations.length)];
      while(dLoc.address === pLoc.address) { 
        dLoc = lagosLocations[Math.floor(Math.random() * lagosLocations.length)]; 
      }

      jobs.push({
        trackingId: generateTrackingId(),
        pickupLocation: { address: pLoc.address, coordinates: pLoc.coords },
        dropoffLocation: { address: dLoc.address, coordinates: dLoc.coords },
        customer: customer._id,
        rider: (status !== 'pending') ? rider._id : null,
        status: status
      });
    }

    await Delivery.insertMany(jobs);
    console.log(` Massive seeding successful! Inserted ${jobs.length} new jobs across metric statuses.`);
    process.exit(0);
  } catch (error) {
    console.error(' Seeding failed:', error);
    process.exit(1);
  }
};

seedMassive();
