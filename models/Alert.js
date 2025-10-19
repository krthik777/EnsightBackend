const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  type: {
    type: String,
    enum: ['high_usage', 'budget_warning', 'budget_exceeded', 'anomaly', 'spike'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'warning'
  },
  message: {
    type: String,
    required: true
  },
  value: {
    type: Number
  },
  threshold: {
    type: Number
  },
  isRead: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

alertSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Alert', alertSchema);
