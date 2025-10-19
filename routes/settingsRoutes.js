const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getBudgetSettings,
  updateBudgetSettings,
  getNotificationSettings,
  updateNotificationSettings
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getSettings)
  .put(protect, updateSettings);

router.route('/budget')
  .get(protect, getBudgetSettings)
  .put(protect, updateBudgetSettings);

router.route('/notifications')
  .get(protect, getNotificationSettings)
  .put(protect, updateNotificationSettings);

module.exports = router;
