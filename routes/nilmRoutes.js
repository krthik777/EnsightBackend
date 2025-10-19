const express = require('express');
const router = express.Router();
const {
  predictAppliances,
  getApplianceHistory,
  getApplianceBreakdown
} = require('../controllers/nilmController');
const { protect } = require('../middleware/auth');

router.post('/predict', protect, predictAppliances);
router.get('/history', protect, getApplianceHistory);
router.get('/breakdown', protect, getApplianceBreakdown);

module.exports = router;
