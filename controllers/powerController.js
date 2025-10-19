const PowerReading = require('../models/PowerReading');
const Room = require('../models/Room');
const Alert = require('../models/Alert');

// @desc    Receive power data from ESP32
// @route   POST /api/power
// @access  Public (ESP32) - In production, add device authentication
exports.receivePowerData = async (req, res) => {
  try {
    // Support both formats: old format and new ESP32 format
    let userId, roomId, voltage, current, power, energy;
    
    // Backend-generated timestamp - ignore any timestamp from IoT device
    const timestamp = new Date();
    
    // Check if it's the new ESP32 format
    if (req.body.current_rms_a !== undefined && req.body.apparent_power_va !== undefined) {
      // New ESP32 format
      const { current_rms_a, apparent_power_va } = req.body;
      
      // Extract or use default values
      // You can set default userId and roomId, or get from query params/headers
      userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      roomId = req.body.roomId || req.query.roomId || req.headers['x-room-id'];
      
      // Calculate values from ESP32 data
      current = current_rms_a;
      power = apparent_power_va;
      voltage = power / current; // Calculate voltage from power and current
      energy = (power / 1000) * (1 / 3600); // Convert to kWh (assuming reading every second)
      
    } else {
      // Old format
      ({ userId, roomId, voltage, current, power, energy } = req.body);
    }

    // Validate required fields
    if (!userId || !roomId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId and roomId are required. You can provide them in body, query params, or headers (x-user-id, x-room-id)'
      });
    }

    if (current === undefined || power === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: current and power data are required'
      });
    }

    // Create power reading
    const reading = await PowerReading.create({
      userId,
      roomId,
      voltage: voltage || 230, // Default voltage if not provided
      current: parseFloat(current.toFixed(3)),
      power: parseFloat(power.toFixed(2)),
      energy: energy || 0,
      timestamp: timestamp // Always use backend-generated timestamp
    });

    // Check for high usage alerts
    const room = await Room.findById(roomId);
    if (room && power > room.threshold) {
      await Alert.create({
        userId,
        roomId,
        type: 'high_usage',
        severity: 'warning',
        message: `High usage detected in ${room.name}`,
        value: power,
        threshold: room.threshold
      });
    }

    res.status(201).json({
      success: true,
      data: reading
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get latest power reading
// @route   GET /api/power/latest
// @access  Private
exports.getLatestReading = async (req, res) => {
  try {
    const { roomId } = req.query;
    
    let query = { userId: req.user._id };
    if (roomId) {
      query.roomId = roomId;
    }

    const reading = await PowerReading.findOne(query)
      .sort({ timestamp: -1 })
      .populate('roomId', 'name icon');

    res.status(200).json({
      success: true,
      data: reading
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get power readings with pagination
// @route   GET /api/power/readings
// @access  Private
exports.getPowerReadings = async (req, res) => {
  try {
    const { roomId, startDate, endDate, limit = 100, page = 1 } = req.query;
    
    let query = { userId: req.user._id };
    
    if (roomId) {
      query.roomId = roomId;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const readings = await PowerReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('roomId', 'name icon');

    const total = await PowerReading.countDocuments(query);

    res.status(200).json({
      success: true,
      count: readings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: readings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
