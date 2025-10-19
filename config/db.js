const mongoose = require('mongoose');
const colors = require('colors');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully'.green.bold);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:'.red.bold, error.message.red);
    process.exit(1);
  }
};

module.exports = connectDB;
