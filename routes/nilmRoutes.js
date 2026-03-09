const express = require('express');
const router = express.Router();
const {
  predictAppliances,
  detectAnomaly,
  getApplianceHistory,
  getApplianceBreakdown
} = require('../controllers/nilmController');
const { protect } = require('../middleware/auth');

router.post('/predict',  protect, predictAppliances);
router.post('/anomaly',  protect, detectAnomaly);
router.get('/history',   protect, getApplianceHistory);
router.get('/breakdown', protect, getApplianceBreakdown);

module.exports = router;
