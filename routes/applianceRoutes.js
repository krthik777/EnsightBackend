const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAppliances,
  getApplianceById,
  createAppliance,
  updateAppliance,
  deleteAppliance,
  getAppliancesByRoom,
  getApplianceTypes,
  bulkCreateAppliances
} = require('../controllers/applianceController');

// Protect all routes
router.use(protect);

// General appliance routes
router.route('/')
  .get(getAppliances)      // GET all appliances (with filters)
  .post(createAppliance);   // CREATE new appliance

// Bulk operations
router.post('/bulk', bulkCreateAppliances);  // BULK create appliances

// Get appliance types/categories
router.get('/types', getApplianceTypes);

// Room-specific appliances
router.get('/room/:roomId', getAppliancesByRoom);

// Single appliance operations
router.route('/:id')
  .get(getApplianceById)    // GET single appliance
  .put(updateAppliance)     // UPDATE appliance
  .delete(deleteAppliance); // DELETE appliance

module.exports = router;
