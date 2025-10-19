const Settings = require('../models/Settings');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      // Create default settings if none exist
      settings = await Settings.create({ userId: req.user._id });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
exports.updateSettings = async (req, res) => {
  try {
    const allowedUpdates = ['budget', 'notifications', 'autoOptimization'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.updatedAt = Date.now();

    let settings = await Settings.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get budget settings
// @route   GET /api/settings/budget
// @access  Private
exports.getBudgetSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    res.status(200).json({
      success: true,
      data: settings.budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update budget settings
// @route   PUT /api/settings/budget
// @access  Private
exports.updateBudgetSettings = async (req, res) => {
  try {
    const { monthly, currency, ratePerKwh } = req.body;

    let settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      settings = await Settings.create({
        userId: req.user._id,
        budget: { monthly, currency, ratePerKwh }
      });
    } else {
      if (monthly !== undefined) settings.budget.monthly = monthly;
      if (currency !== undefined) settings.budget.currency = currency;
      if (ratePerKwh !== undefined) settings.budget.ratePerKwh = ratePerKwh;
      settings.updatedAt = Date.now();
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get notification settings
// @route   GET /api/settings/notifications
// @access  Private
exports.getNotificationSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    res.status(200).json({
      success: true,
      data: settings.notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update notification settings
// @route   PUT /api/settings/notifications
// @access  Private
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { pushEnabled, emailEnabled, alertsEnabled } = req.body;

    let settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      settings = await Settings.create({
        userId: req.user._id,
        notifications: { pushEnabled, emailEnabled, alertsEnabled }
      });
    } else {
      if (pushEnabled !== undefined) settings.notifications.pushEnabled = pushEnabled;
      if (emailEnabled !== undefined) settings.notifications.emailEnabled = emailEnabled;
      if (alertsEnabled !== undefined) settings.notifications.alertsEnabled = alertsEnabled;
      settings.updatedAt = Date.now();
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
