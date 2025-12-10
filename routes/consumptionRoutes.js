const express = require('express');
const router = express.Router();

const {
  getRoomConsumption,
  getOverallConsumption,
  getConsumptionStats,
  getMonthlyConsumption,
  getConsumptionTrends
} = require('../controllers/consumptionController');
const { protect } = require('../middleware/auth');

router.get('/room', protect, getRoomConsumption);
router.get('/overall', protect, getOverallConsumption);
router.get('/stats', protect, getConsumptionStats);
router.get('/monthly', protect, getMonthlyConsumption);
router.get('/trends', protect, getConsumptionTrends);

module.exports = router;
