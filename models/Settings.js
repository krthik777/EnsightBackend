const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  budget: {
    monthly: {
      type: Number,
      default: 400 // kWh
    },
    currency: {
      type: String,
      default: 'INR'
    },
    ratePerKwh: {
      type: Number,
      default: 6.5 // INR per kWh
    }
  },
  notifications: {
    pushEnabled: {
      type: Boolean,
      default: true
    },
    emailEnabled: {
      type: Boolean,
      default: false
    },
    alertsEnabled: {
      type: Boolean,
      default: true
    }
  },
  autoOptimization: {
    enabled: {
      type: Boolean,
      default: true
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
