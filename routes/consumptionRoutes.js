const express = require('express');
const router = express.Router();
const {
  getRoomConsumption,
  getOverallConsumption,
  getConsumptionStats
} = require('../controllers/consumptionController');
const { protect } = require('../middleware/auth');

router.get('/room', protect, getRoomConsumption);
router.get('/overall', protect, getOverallConsumption);
router.get('/stats', protect, getConsumptionStats);

module.exports = router;
