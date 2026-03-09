const express = require('express');
const router = express.Router();
const {
  forecastMonthly,
  forecastCost,
  forecastDaily,
  getWeeklyTrend
} = require('../controllers/forecastController');
const { protect } = require('../middleware/auth');

router.get('/monthly', protect, forecastMonthly);
router.get('/cost',    protect, forecastCost);
router.get('/daily',   protect, forecastDaily);
router.get('/weekly',  protect, getWeeklyTrend);

module.exports = router;
