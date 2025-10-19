const mongoose = require('mongoose');

const powerReadingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  voltage: {
    type: Number,
    required: true
  },
  current: {
    type: Number,
    required: true
  },
  power: {
    type: Number,
    required: true
  },
  energy: {
    type: Number,
    default: 0 // kWh
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for faster queries
powerReadingSchema.index({ userId: 1, roomId: 1, timestamp: -1 });
powerReadingSchema.index({ timestamp: -1 });

module.exports = mongoose.model('PowerReading', powerReadingSchema);
