const express = require('express');
const router = express.Router();
const {
  getAlerts,
  markAlertRead,
  markAllAlertsRead,
  deleteAlert,
  checkBudgetAlerts
} = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAlerts);
router.put('/read-all', protect, markAllAlertsRead);
router.post('/check-budget', protect, checkBudgetAlerts);
router.put('/:id/read', protect, markAlertRead);
router.delete('/:id', protect, deleteAlert);

module.exports = router;
