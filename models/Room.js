const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true
  },
  icon: {
    type: String,
    default: 'home'
  },
  threshold: {
    type: Number,
    default: 2000, // Watt threshold
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);
