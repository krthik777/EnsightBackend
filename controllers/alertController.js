const Alert = require('../models/Alert');
const PowerReading = require('../models/PowerReading');
const Settings = require('../models/Settings');

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private
exports.getAlerts = async (req, res) => {
  try {
    const { isRead, type, limit = 50 } = req.query;
    
    let query = { userId: req.user._id };
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    if (type) {
      query.type = type;
    }

    const alerts = await Alert.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('roomId', 'name icon');

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark alert as read
// @route   PUT /api/alerts/:id/read
// @access  Private
exports.markAlertRead = async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark all alerts as read
// @route   PUT /api/alerts/read-all
// @access  Private
exports.markAllAlertsRead = async (req, res) => {
  try {
    await Alert.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All alerts marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete alert
// @route   DELETE /api/alerts/:id
// @access  Private
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check and generate budget alerts
// @route   POST /api/alerts/check-budget
// @access  Private
exports.checkBudgetAlerts = async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user._id });
    const monthlyBudget = settings ? settings.budget.monthly : 400;

    // Get this month's consumption
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const readings = await PowerReading.find({
      userId: req.user._id,
      timestamp: { $gte: monthStart }
    });

    const totalEnergy = readings.reduce((sum, r) => sum + r.energy, 0);
    const usagePercent = (totalEnergy / monthlyBudget) * 100;

    // Create alert if over 80% or 100%
    if (usagePercent >= 100) {
      await Alert.create({
        userId: req.user._id,
        type: 'budget_exceeded',
        severity: 'critical',
        message: `Monthly budget exceeded! Used ${totalEnergy.toFixed(1)} kWh of ${monthlyBudget} kWh`,
        value: totalEnergy,
        threshold: monthlyBudget
      });
    } else if (usagePercent >= 80) {
      // Check if alert already exists
      const existingAlert = await Alert.findOne({
        userId: req.user._id,
        type: 'budget_warning',
        timestamp: { $gte: monthStart }
      });

      if (!existingAlert) {
        await Alert.create({
          userId: req.user._id,
          type: 'budget_warning',
          severity: 'warning',
          message: `Budget warning: ${usagePercent.toFixed(1)}% of monthly budget used`,
          value: totalEnergy,
          threshold: monthlyBudget
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Budget alerts checked'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
