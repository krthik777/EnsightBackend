const mlService = require('../services/mlBackendService');

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Proxy GET /health from ML backend
// @route GET /api/ml/health
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.mlHealth = async (req, res) => {
  try {
    const data = await mlService.checkHealth();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML Backend unreachable',
      error: error.message,
      mlUrl: mlService.ML_BACKEND_URL
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Proxy GET /db-status from ML backend
// @route GET /api/ml/db-status
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.mlDbStatus = async (req, res) => {
  try {
    const data = await mlService.checkDbStatus();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML Backend unreachable',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Diagnostic: verify readings exist for a room
// @route GET /api/ml/debug-room?roomId=<id>
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.mlDebugRoom = async (req, res) => {
  try {
    const { roomId } = req.query;
    const userId = req.user._id.toString();

    if (!roomId) {
      return res.status(400).json({ success: false, message: 'roomId query param is required' });
    }

    const data = await mlService.debugRoom({ userId, roomId });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML Backend unreachable or error in debug-room',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Today's energy via ML trapezoidal integration
// @route GET /api/ml/energy/today?roomId=<id>
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.mlEnergyToday = async (req, res) => {
  try {
    const { roomId } = req.query;
    const userId = req.user._id.toString();

    if (!roomId) {
      return res.status(400).json({ success: false, message: 'roomId query param is required' });
    }

    console.log('⚡ ML Energy Today:'.cyan);
    console.log(`   User: ${userId}  Room: ${roomId}`.gray);

    const data = await mlService.getEnergyToday({ userId, roomId });

    if (!data.success) {
      return res.status(404).json({ success: false, message: data.error || 'No readings found for today' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML Backend unavailable for energy/today',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Any specific day's energy via ML
// @route GET /api/ml/energy/daily?roomId=<id>&date=YYYY-MM-DD
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.mlEnergyDaily = async (req, res) => {
  try {
    const { roomId, date } = req.query;
    const userId = req.user._id.toString();

    if (!roomId) {
      return res.status(400).json({ success: false, message: 'roomId query param is required' });
    }

    console.log('📅 ML Energy Daily:'.cyan);
    console.log(`   User: ${userId}  Room: ${roomId}  Date: ${date || 'today'}`.gray);

    const data = await mlService.getEnergyDaily({ userId, roomId, date });

    if (!data.success) {
      return res.status(404).json({ success: false, message: data.error || 'No readings found for this date' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML Backend unavailable for energy/daily',
      error: error.message
    });
  }
};
