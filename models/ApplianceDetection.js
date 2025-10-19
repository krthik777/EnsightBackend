const mongoose = require('mongoose');

const applianceDetectionSchema = new mongoose.Schema({
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
  appliances: [{
    name: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    powerConsumption: {
      type: Number
    }
  }],
  totalPower: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

applianceDetectionSchema.index({ userId: 1, roomId: 1, timestamp: -1 });

module.exports = mongoose.model('ApplianceDetection', applianceDetectionSchema);
