const ApplianceDetection = require('../models/ApplianceDetection');
const PowerReading = require('../models/PowerReading');
const mlService = require('../services/mlBackendService');

// ─────────────────────────────────────────────────────────────────────────────
// Simple local fallback NILM (used only when ML backend is down)
// ─────────────────────────────────────────────────────────────────────────────
const detectAppliances_local = (power) => {
  const signatures = [
    { name: 'Air Conditioner', min: 1000, max: 2000, confidence: 85 },
    { name: 'Refrigerator',    min: 100,  max: 200,  confidence: 80 },
    { name: 'Washing Machine', min: 500,  max: 1000, confidence: 75 },
    { name: 'Microwave',       min: 800,  max: 1500, confidence: 70 },
    { name: 'TV',              min: 50,   max: 200,  confidence: 65 },
    { name: 'Lights',          min: 10,   max: 100,  confidence: 90 },
    { name: 'Computer',        min: 100,  max: 300,  confidence: 75 },
    { name: 'Water Heater',    min: 1500, max: 3000, confidence: 85 },
    { name: 'Electric Kettle', min: 1200, max: 2000, confidence: 80 }
  ];

  const appliances = [];
  let remaining = power;

  signatures.forEach(sig => {
    if (remaining >= sig.min) {
      const count = Math.floor(remaining / sig.min);
      if (count > 0 && remaining <= sig.max * count) {
        appliances.push({
          name: sig.name,
          confidence: sig.confidence,
          powerConsumption: Math.min(sig.max, remaining)
        });
        remaining -= sig.max;
      }
    }
  });

  if (remaining > 10) {
    appliances.push({ name: 'Other Appliances', confidence: 50, powerConsumption: remaining });
  }
  return appliances;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Detect which appliances are currently ON
// @route POST /api/nilm/predict
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.predictAppliances = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ success: false, message: 'roomId is required' });
    }

    const userId = req.user._id.toString();

    console.log('🔮 NILM Predict:'.cyan);
    console.log(`   User: ${userId}`.gray);
    console.log(`   Room: ${roomId}`.gray);

    // ── Try ML backend ──────────────────────────────────────────────────────
    try {
      // 1. Detect active appliances (smart 3-tier: DB matching → LSTM → heuristic)
      const detectRes = await mlService.detectAppliances({ userId, roomId });

      if (!detectRes.success) {
        throw new Error(detectRes.error || 'ML detect-appliances returned success=false');
      }

      // 2. Get per-appliance power breakdown
      //    /detect-appliances returns power_breakdown_w directly — no second call needed.
      //    We still fetch predictAppliancePower separately for backwards-compat shape.
      const powerRes = await mlService.predictAppliancePower({ userId, roomId });

      // active_appliances = ['air_conditioner', 'television', ...]
      // confidence        = { air_conditioner: 0.98, ... }
      // power_breakdown_w = { air_conditioner: 1500, ... }   (from /detect-appliances)
      // appliances        = { air_conditioner: 1500, ... }   (from /predict-appliance-power)
      const powerBreakdown = detectRes.power_breakdown_w || (powerRes.success ? powerRes.appliances : {});

      const appliances = (detectRes.active_appliances || []).map(key => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        confidence: Math.round((detectRes.confidence?.[key] ?? 0.75) * 100),
        powerConsumption: powerBreakdown[key] ?? 0
      }));

      const totalPower = detectRes.total_power_w ?? detectRes.mean_power_w ?? 0;

      // Save to appliancedetections
      const detection = await ApplianceDetection.create({
        userId: req.user._id,
        roomId,
        appliances,
        totalPower
      });

      return res.status(200).json({
        success: true,
        data: {
          source:           'ml_backend',
          detection_tier:   detectRes.detection_tier,
          active_appliances: detectRes.active_appliances,
          confidence:       detectRes.confidence,
          appliance_power:  powerBreakdown,
          mean_power_w:     detectRes.mean_power_w,
          unmatched_w:      detectRes.unmatched_w,
          totalPower,
          detectionId:      detection._id
        }
      });

    } catch (mlError) {
      console.warn('⚠️  ML Backend unavailable, using fallback NILM'.yellow);
      console.warn(`   ${mlError.message}`.gray);

      // ── Fallback ────────────────────────────────────────────────────────
      const latest = await PowerReading.findOne({ userId: req.user._id, roomId })
        .sort({ timestamp: -1 });

      if (!latest) {
        return res.status(404).json({ success: false, message: 'No power readings found for this room' });
      }

      const detectedAppliances = detectAppliances_local(latest.power);

      const detection = await ApplianceDetection.create({
        userId: req.user._id,
        roomId,
        appliances: detectedAppliances,
        totalPower: latest.power
      });

      return res.status(200).json({
        success: true,
        warning: 'Using fallback algorithm — ML backend unavailable.',
        data: {
          source:    'fallback',
          appliances: detectedAppliances,
          totalPower: latest.power,
          detectionId: detection._id
        }
      });
    }
  } catch (error) {
    console.error('❌ predictAppliances error:'.red, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Detect power anomalies / faulty appliances
// @route POST /api/nilm/anomaly
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.detectAnomaly = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ success: false, message: 'roomId is required' });
    }

    const userId = req.user._id.toString();

    console.log('⚠️  Anomaly Detection:'.cyan);
    console.log(`   User: ${userId}  Room: ${roomId}`.gray);

    try {
      const result = await mlService.detectAnomaly({ userId, roomId });

      if (!result.success) {
        throw new Error(result.error || 'detect-anomaly returned success=false');
      }

      return res.status(200).json({
        success: true,
        data: {
          source:                    'ml_backend',
          possible_faulty_appliance: result.possible_faulty_appliance,
          room_threshold_used:       result.room_threshold_used,
          readings_used:             result.readings_used,
          details:                   result.details || null
        }
      });

    } catch (mlError) {
      console.warn('⚠️  ML unavailable for anomaly detection'.yellow);
      return res.status(503).json({
        success: false,
        message: 'ML Backend unavailable for anomaly detection.',
        error:   mlError.message
      });
    }
  } catch (error) {
    console.error('❌ detectAnomaly error:'.red, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Historical appliance detections
// @route GET /api/nilm/history
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getApplianceHistory = async (req, res) => {
  try {
    const { roomId, startDate, endDate, limit = 50 } = req.query;

    let query = { userId: req.user._id };
    if (roomId) query.roomId = roomId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate)   query.timestamp.$lte = new Date(endDate);
    }

    const history = await ApplianceDetection.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('roomId', 'name icon');

    // Aggregate stats per appliance
    const statsMap = {};
    history.forEach(det => {
      det.appliances.forEach(app => {
        if (!statsMap[app.name]) {
          statsMap[app.name] = { name: app.name, detectionCount: 0, totalPower: 0, totalConfidence: 0 };
        }
        statsMap[app.name].detectionCount++;
        statsMap[app.name].totalPower      += app.powerConsumption;
        statsMap[app.name].totalConfidence += app.confidence;
      });
    });

    const statistics = Object.values(statsMap).map(s => ({
      name:           s.name,
      detectionCount: s.detectionCount,
      avgPower:       (s.totalPower      / s.detectionCount).toFixed(2),
      avgConfidence:  (s.totalConfidence / s.detectionCount).toFixed(1)
    }));

    res.status(200).json({ success: true, count: history.length, data: { history, statistics } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Latest appliance breakdown
// @route GET /api/nilm/breakdown
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getApplianceBreakdown = async (req, res) => {
  try {
    const { roomId } = req.query;
    let query = { userId: req.user._id };
    if (roomId) query.roomId = roomId;

    const latest = await ApplianceDetection.findOne(query)
      .sort({ timestamp: -1 })
      .populate('roomId', 'name icon');

    if (!latest) {
      return res.status(404).json({ success: false, message: 'No appliance detection data found' });
    }

    res.status(200).json({ success: true, data: latest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
