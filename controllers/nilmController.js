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

// @desc    Predict appliances from recent readings (using ML Backend)
// @route   POST /api/nilm/predict
// @access  Private
exports.predictAppliances = async (req, res) => {
  try {
    const { roomId, mainsSequence } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    console.log('🔮 NILM Prediction Request:'.cyan);
    console.log(`   User: ${req.user._id}`.gray);
    console.log(`   Room: ${roomId}`.gray);
    console.log(`   Mains Sequence Provided: ${mainsSequence ? 'Yes' : 'No'}`.gray);

    let sequence = mainsSequence;

    // If no sequence provided, fetch from database
    if (!sequence) {
      const mlService = require('../services/mlBackendService');
      sequence = await mlService.getMainsSequence(req.user._id, roomId, 50);
      console.log(`   Fetched ${sequence.length} readings from database`.gray);
    }

    // Try to use ML Backend first
    try {
      const mlService = require('../services/mlBackendService');
      const mlResponse = await mlService.predictAppliances({
        mainsSequence: sequence,
        roomId,
        userId: req.user._id.toString()
      });

      // Transform ML response to our format
      const transformedData = mlService.transformMLPrediction(
        mlResponse,
        req.user._id,
        roomId
      );

      // Save detection to database
      const detection = await ApplianceDetection.create({
        userId: req.user._id,
        roomId,
        appliances: transformedData.appliances,
        totalPower: transformedData.totalPower,
        metadata: {
          source: 'ml_backend',
          confidence: transformedData.confidence,
          activeAppliances: transformedData.activeAppliances,
          ...transformedData.metadata
        }
      });

      res.status(200).json({
        success: true,
        data: {
          prediction: {
            appliances: mlResponse.data.prediction.appliances,
            totalPower: mlResponse.data.prediction.totalPower,
            confidence: mlResponse.data.prediction.confidence,
            activeAppliances: mlResponse.data.prediction.activeAppliances,
            timestamp: mlResponse.data.prediction.timestamp
          },
          summary: mlResponse.data.summary,
          detectionId: detection._id,
          source: 'ml_backend'
        }
      });
    } catch (mlError) {
      console.warn('⚠️  ML Backend unavailable, using fallback algorithm'.yellow);
      console.warn(`   Error: ${mlError.message}`.gray);

      // Fallback to simple local algorithm
      const latestReading = await PowerReading.findOne({
        userId: req.user._id,
        roomId
      }).sort({ timestamp: -1 });

      if (!latestReading) {
        return res.status(404).json({
          success: false,
          message: 'No readings found for this room'
        });
      }

      const detectedAppliances = detectAppliances(latestReading.power);

      // Save detection
      const detection = await ApplianceDetection.create({
        userId: req.user._id,
        roomId,
        appliances: detectedAppliances,
        totalPower: latestReading.power,
        metadata: {
          source: 'fallback_algorithm',
          mlBackendError: mlError.message
        }
      });

      res.status(200).json({
        success: true,
        data: detection,
        warning: 'Using fallback algorithm. ML backend unavailable.',
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('❌ Error in predictAppliances:'.red, error.message);
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
