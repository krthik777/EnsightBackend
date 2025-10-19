const express = require('express');
const router = express.Router();
const {
  receivePowerData,
  getLatestReading,
  getPowerReadings
} = require('../controllers/powerController');
const { protect } = require('../middleware/auth');

router.post('/', receivePowerData);
router.get('/latest', protect, getLatestReading);
router.get('/readings', protect, getPowerReadings);

module.exports = router;
