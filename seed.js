require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Room = require('./models/Room');
const Settings = require('./models/Settings');
const PowerReading = require('./models/PowerReading');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

const seedDatabase = async () => {
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Room.deleteMany({});
    await Settings.deleteMany({});
    await PowerReading.deleteMany({});

    // Create demo user
    console.log('👤 Creating demo user...');
    const user = await User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123'
    });

    console.log('✅ User created:', user.email);

    // Create default settings for user
    console.log('⚙️  Creating default settings...');
    await Settings.create({
      userId: user._id,
      budget: {
        monthly: 400,
        currency: 'INR',
        ratePerKwh: 6.5
      },
      notifications: {
        pushEnabled: true,
        emailEnabled: false,
        alertsEnabled: true
      },
      autoOptimization: {
        enabled: true
      }
    });

    // Create rooms
    console.log('🏠 Creating rooms...');
    const rooms = await Room.insertMany([
      {
        userId: user._id,
        name: 'Living Room',
        icon: 'sofa',
        threshold: 2000
      },
      {
        userId: user._id,
        name: 'Kitchen',
        icon: 'utensils',
        threshold: 2500
      },
      {
        userId: user._id,
        name: 'Bedroom',
        icon: 'bed',
        threshold: 1500
      },
      {
        userId: user._id,
        name: 'Office',
        icon: 'desktop',
        threshold: 1000
      }
    ]);

    console.log(`✅ Created ${rooms.length} rooms`);

    // Create sample power readings for the last 7 days
    console.log('⚡ Creating sample power readings...');
    const now = new Date();
    const readings = [];

    for (let day = 6; day >= 0; day--) {
      for (let hour = 0; hour < 24; hour++) {
        rooms.forEach(room => {
          const timestamp = new Date(now);
          timestamp.setDate(timestamp.getDate() - day);
          timestamp.setHours(hour, 0, 0, 0);

          // Generate realistic power data based on room and time
          let basePower = 0;
          switch (room.name) {
            case 'Living Room':
              basePower = hour >= 6 && hour <= 23 ? 300 + Math.random() * 200 : 50;
              break;
            case 'Kitchen':
              basePower = (hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21) 
                ? 800 + Math.random() * 500 : 100 + Math.random() * 100;
              break;
            case 'Bedroom':
              basePower = (hour >= 20 || hour <= 7) ? 200 + Math.random() * 300 : 50;
              break;
            case 'Office':
              basePower = hour >= 9 && hour <= 18 ? 250 + Math.random() * 150 : 30;
              break;
          }

          const voltage = 230 + Math.random() * 20;
          const current = basePower / voltage;
          const energy = (basePower / 1000) * (1/24); // kWh per hour

          readings.push({
            userId: user._id,
            roomId: room._id,
            voltage: parseFloat(voltage.toFixed(2)),
            current: parseFloat(current.toFixed(2)),
            power: parseFloat(basePower.toFixed(2)),
            energy: parseFloat(energy.toFixed(4)),
            timestamp
          });
        });
      }
    }

    await PowerReading.insertMany(readings);
    console.log(`✅ Created ${readings.length} power readings`);

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║   🎉 Database seeded successfully!                   ║');
    console.log('║                                                       ║');
    console.log('║   Demo User Credentials:                             ║');
    console.log('║   Email: john.doe@example.com                        ║');
    console.log('║   Password: password123                              ║');
    console.log('║                                                       ║');
    console.log('║   Use these credentials to login via API             ║');
    console.log('║   POST /api/user/login                               ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
