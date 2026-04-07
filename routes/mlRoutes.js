const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  mlHealth,
  mlDbStatus,
  mlDebugRoom,
  mlEnergyToday,
  mlEnergyDaily,
} = require('../controllers/mlController');

// ── Diagnostics (authenticated so only logged-in users can query) ─────────────
router.get('/health',    protect, mlHealth);
router.get('/db-status', protect, mlDbStatus);
router.get('/debug-room', protect, mlDebugRoom);

// ── ML energy analytics ───────────────────────────────────────────────────────
router.get('/energy/today', protect, mlEnergyToday);
router.get('/energy/daily', protect, mlEnergyDaily);

module.exports = router;
