const ApplianceDetection = require('../models/ApplianceDetection');
const PowerReading = require('../models/PowerReading');

// Simple NILM algorithm - In production, use ML models
const detectAppliances = (power) => {
  const appliances = [];
  
  // Simple power signature matching (replace with ML model in production)
  const signatures = [
    { name: 'Air Conditioner', min: 1000, max: 2000, confidence: 85 },
    { name: 'Refrigerator', min: 100, max: 200, confidence: 80 },
    { name: 'Washing Machine', min: 500, max: 1000, confidence: 75 },
    { name: 'Microwave', min: 800, max: 1500, confidence: 70 },
    { name: 'TV', min: 50, max: 200, confidence: 65 },
    { name: 'Lights', min: 10, max: 100, confidence: 90 },
    { name: 'Computer', min: 100, max: 300, confidence: 75 },
    { name: 'Water Heater', min: 1500, max: 3000, confidence: 85 },
    { name: 'Electric Kettle', min: 1200, max: 2000, confidence: 80 }
  ];

  let remainingPower = power;
  
  signatures.forEach(sig => {
    if (remainingPower >= sig.min) {
      const possibleCount = Math.floor(remainingPower / sig.min);
      if (possibleCount > 0 && remainingPower >= sig.min && remainingPower <= sig.max * possibleCount) {
        appliances.push({
          name: sig.name,
          confidence: sig.confidence,
          powerConsumption: Math.min(sig.max, remainingPower)
        });
        remainingPower -= sig.max;
      }
    }
  });

  // If there's remaining power, add as "Other Appliances"
  if (remainingPower > 10) {
    appliances.push({
      name: 'Other Appliances',
      confidence: 50,
      powerConsumption: remainingPower
    });
  }

  return appliances;
};

// @desc    Predict appliances from recent readings
// @route   POST /api/nilm/predict
// @access  Private
exports.predictAppliances = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // Get recent readings (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const readings = await PowerReading.find({
      userId: req.user._id,
      roomId,
      timestamp: { $gte: fiveMinutesAgo }
    }).sort({ timestamp: -1 });

    if (readings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No recent readings found'
      });
    }

    // Use latest reading for prediction
    const latestReading = readings[0];
    const detectedAppliances = detectAppliances(latestReading.power);

    // Save detection
    const detection = await ApplianceDetection.create({
      userId: req.user._id,
      roomId,
      appliances: detectedAppliances,
      totalPower: latestReading.power
    });

    res.status(200).json({
      success: true,
      data: detection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get historical appliance usage
// @route   GET /api/nilm/history
// @access  Private
exports.getApplianceHistory = async (req, res) => {
  try {
    const { roomId, startDate, endDate, limit = 50 } = req.query;

    let query = { userId: req.user._id };
    
    if (roomId) {
      query.roomId = roomId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const history = await ApplianceDetection.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('roomId', 'name icon');

    // Aggregate appliance usage
    const applianceStats = {};
    history.forEach(detection => {
      detection.appliances.forEach(appliance => {
        if (!applianceStats[appliance.name]) {
          applianceStats[appliance.name] = {
            name: appliance.name,
            detectionCount: 0,
            totalPower: 0,
            avgPower: 0,
            avgConfidence: 0
          };
        }
        applianceStats[appliance.name].detectionCount += 1;
        applianceStats[appliance.name].totalPower += appliance.powerConsumption;
        applianceStats[appliance.name].avgConfidence += appliance.confidence;
      });
    });

    // Calculate averages
    Object.keys(applianceStats).forEach(key => {
      const stat = applianceStats[key];
      stat.avgPower = stat.totalPower / stat.detectionCount;
      stat.avgConfidence = stat.avgConfidence / stat.detectionCount;
    });

    res.status(200).json({
      success: true,
      count: history.length,
      data: {
        history,
        statistics: Object.values(applianceStats)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get appliance breakdown for current usage
// @route   GET /api/nilm/breakdown
// @access  Private
exports.getApplianceBreakdown = async (req, res) => {
  try {
    const { roomId } = req.query;

    // Get latest detection
    let query = { userId: req.user._id };
    if (roomId) query.roomId = roomId;

    const latestDetection = await ApplianceDetection.findOne(query)
      .sort({ timestamp: -1 })
      .populate('roomId', 'name icon');

    if (!latestDetection) {
      return res.status(404).json({
        success: false,
        message: 'No appliance detection data found'
      });
    }

    res.status(200).json({
      success: true,
      data: latestDetection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
