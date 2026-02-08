const mongoose = require('mongoose');

const applianceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Appliance name is required'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Air Conditioner',
      'Refrigerator',
      'Washing Machine',
      'Microwave',
      'Television',
      'Lights',
      'Computer',
      'Water Heater',
      'Electric Kettle',
      'Fan',
      'Iron',
      'Dishwasher',
      'Oven',
      'Coffee Maker',
      'Toaster',
      'Vacuum Cleaner',
      'Hair Dryer',
      'Other'
    ],
    default: 'Other'
  },
  powerRating: {
    type: Number,
    required: [true, 'Power rating is required'],
    min: 0,
    max: 10000 // Max 10kW for household appliances
  },
  estimatedWattage: {
    type: Number,
    required: [true, 'Estimated wattage is required'],
    min: 0,
    max: 10000 // Max 10kW for household appliances
  },
  usageHoursPerDay: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },
  isActive: {
    type: Boolean,
    default: true
  },
  icon: {
    type: String,
    default: 'appliance'
  },
  color: {
    type: String,
    default: '#6366f1' // Default color for UI
  },
  powerSignature: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    typical: { type: Number, default: 0 }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
applianceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
applianceSchema.index({ userId: 1, roomId: 1 });
applianceSchema.index({ userId: 1, isActive: 1 });

// Virtual for estimated daily consumption
applianceSchema.virtual('estimatedDailyConsumption').get(function() {
  return (this.estimatedWattage * this.usageHoursPerDay) / 1000; // kWh
});

// Virtual for estimated monthly consumption
applianceSchema.virtual('estimatedMonthlyConsumption').get(function() {
  return ((this.estimatedWattage * this.usageHoursPerDay * 30) / 1000).toFixed(2); // kWh
});

// Ensure virtuals are included when converting to JSON
applianceSchema.set('toJSON', { virtuals: true });
applianceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Appliance', applianceSchema);
