const Appliance = require('../models/Appliance');
const Room = require('../models/Room');

// @desc    Get all appliances for a user or room
// @route   GET /api/appliances
// @access  Private
exports.getAppliances = async (req, res) => {
  try {
    const { roomId, type, isActive } = req.query;

    console.log('📦 Fetching Appliances:'.cyan);
    console.log(`   User: ${req.user._id}`.gray);
    console.log(`   Room Filter: ${roomId || 'All rooms'}`.gray);
    console.log(`   Type Filter: ${type || 'All types'}`.gray);

    // Build query
    let query = { userId: req.user._id };
    
    if (roomId) {
      query.roomId = roomId;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const appliances = await Appliance.find(query)
      .populate('roomId', 'name icon')
      .sort({ createdAt: -1 });

    console.log(`   Found ${appliances.length} appliance(s)`.green);

    // Calculate total estimated consumption
    const totalEstimatedDaily = appliances
      .filter(a => a.isActive)
      .reduce((sum, a) => sum + (a.estimatedWattage * a.usageHoursPerDay / 1000), 0);

    res.status(200).json({
      success: true,
      count: appliances.length,
      data: appliances,
      summary: {
        totalAppliances: appliances.length,
        activeAppliances: appliances.filter(a => a.isActive).length,
        estimatedDailyConsumption: totalEstimatedDaily.toFixed(2),
        estimatedMonthlyConsumption: (totalEstimatedDaily * 30).toFixed(2)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching appliances:'.red, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single appliance by ID
// @route   GET /api/appliances/:id
// @access  Private
exports.getApplianceById = async (req, res) => {
  try {
    const appliance = await Appliance.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('roomId', 'name icon threshold');

    if (!appliance) {
      return res.status(404).json({
        success: false,
        message: 'Appliance not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appliance
    });
  } catch (error) {
    console.error('❌ Error fetching appliance:'.red, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new appliance
// @route   POST /api/appliances
// @access  Private
exports.createAppliance = async (req, res) => {
  try {
    const {
      roomId,
      name,
      type,
      powerRating,
      estimatedWattage,
      usageHoursPerDay,
      icon
    } = req.body;

    console.log('➕ Creating Appliance:'.cyan);
    console.log(`   Name: ${name}`.gray);
    console.log(`   Type: ${type}`.gray);
    console.log(`   Room: ${roomId}`.gray);
    console.log(`   Power Rating: ${powerRating}W`.gray);
    console.log(`   Wattage: ${estimatedWattage}W`.gray);

    // Validate required fields
    if (!roomId || !name || !type || !powerRating || !estimatedWattage) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roomId, name, type, powerRating, and estimatedWattage'
      });
    }

    // Verify room exists and belongs to user
    const room = await Room.findOne({
      _id: roomId,
      userId: req.user._id
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or does not belong to you'
      });
    }

    // Set power signature based on estimated wattage
    const powerSignature = {
      min: estimatedWattage * 0.8,
      max: estimatedWattage * 1.2,
      typical: estimatedWattage
    };

    // Create appliance
    const appliance = await Appliance.create({
      userId: req.user._id,
      roomId,
      name,
      type,
      powerRating,
      estimatedWattage,
      usageHoursPerDay: usageHoursPerDay || 0,
      icon: icon || type.toLowerCase().replace(/\s+/g, '_'),
      color: '#6366f1',
      powerSignature
    });

    console.log(`✅ Appliance created: ${appliance._id}`.green);

    // Populate room details before sending response
    await appliance.populate('roomId', 'name icon');

    res.status(201).json({
      success: true,
      message: 'Appliance created successfully',
      data: appliance
    });
  } catch (error) {
    console.error('❌ Error creating appliance:'.red, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update appliance
// @route   PUT /api/appliances/:id
// @access  Private
exports.updateAppliance = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`✏️  Updating Appliance: ${id}`.cyan);

    // Find appliance
    let appliance = await Appliance.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!appliance) {
      return res.status(404).json({
        success: false,
        message: 'Appliance not found'
      });
    }

    // If roomId is being changed, verify new room exists
    if (req.body.roomId && req.body.roomId !== appliance.roomId.toString()) {
      const room = await Room.findOne({
        _id: req.body.roomId,
        userId: req.user._id
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Target room not found'
        });
      }
    }

    // Update power signature if wattage changed
    if (req.body.estimatedWattage && req.body.estimatedWattage !== appliance.estimatedWattage) {
      req.body.powerSignature = {
        min: req.body.estimatedWattage * 0.8,
        max: req.body.estimatedWattage * 1.2,
        typical: req.body.estimatedWattage
      };
    }

    // Fields that can be updated
    const allowedUpdates = [
      'name',
      'type',
      'powerRating',
      'estimatedWattage',
      'usageHoursPerDay',
      'isActive',
      'icon',
      'color',
      'powerSignature',
      'roomId'
    ];

    // Update only allowed fields
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        appliance[field] = req.body[field];
      }
    });

    await appliance.save();
    await appliance.populate('roomId', 'name icon');

    console.log(`✅ Appliance updated: ${appliance.name}`.green);

    res.status(200).json({
      success: true,
      message: 'Appliance updated successfully',
      data: appliance
    });
  } catch (error) {
    console.error('❌ Error updating appliance:'.red, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete appliance
// @route   DELETE /api/appliances/:id
// @access  Private
exports.deleteAppliance = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️  Deleting Appliance: ${id}`.cyan);

    const appliance = await Appliance.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!appliance) {
      return res.status(404).json({
        success: false,
        message: 'Appliance not found'
      });
    }

    await Appliance.deleteOne({ _id: id });

    console.log(`✅ Appliance deleted: ${appliance.name}`.green);

    res.status(200).json({
      success: true,
      message: 'Appliance deleted successfully',
      data: {
        id: appliance._id,
        name: appliance.name
      }
    });
  } catch (error) {
    console.error('❌ Error deleting appliance:'.red, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get appliances by room
// @route   GET /api/appliances/room/:roomId
// @access  Private
exports.getAppliancesByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    console.log(`📦 Fetching appliances for room: ${roomId}`.cyan);

    // Verify room exists and belongs to user
    const room = await Room.findOne({
      _id: roomId,
      userId: req.user._id
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const appliances = await Appliance.find({
      roomId,
      userId: req.user._id
    }).sort({ createdAt: -1 });

    // Calculate room-level statistics
    const activeAppliances = appliances.filter(a => a.isActive);
    const totalEstimatedWattage = activeAppliances.reduce((sum, a) => sum + a.estimatedWattage, 0);
    const totalDailyConsumption = activeAppliances.reduce(
      (sum, a) => sum + (a.estimatedWattage * a.usageHoursPerDay / 1000),
      0
    );

    console.log(`✅ Found ${appliances.length} appliances`.green);

    res.status(200).json({
      success: true,
      count: appliances.length,
      data: appliances,
      room: {
        id: room._id,
        name: room.name,
        icon: room.icon,
        threshold: room.threshold
      },
      summary: {
        totalAppliances: appliances.length,
        activeAppliances: activeAppliances.length,
        totalEstimatedWattage,
        estimatedDailyConsumption: totalDailyConsumption.toFixed(2),
        estimatedMonthlyConsumption: (totalDailyConsumption * 30).toFixed(2),
        thresholdUsagePercent: room.threshold > 0 
          ? ((totalEstimatedWattage / room.threshold) * 100).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    console.error('❌ Error fetching room appliances:'.red, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get appliance types/categories
// @route   GET /api/appliances/types
// @access  Private
exports.getApplianceTypes = async (req, res) => {
  try {
    const types = [
      { value: 'Air Conditioner', label: 'Air Conditioner', icon: 'air-conditioner', avgWattage: 1500 },
      { value: 'Refrigerator', label: 'Refrigerator', icon: 'fridge', avgWattage: 150 },
      { value: 'Washing Machine', label: 'Washing Machine', icon: 'washing-machine', avgWattage: 750 },
      { value: 'Microwave', label: 'Microwave', icon: 'microwave', avgWattage: 1200 },
      { value: 'Television', label: 'Television', icon: 'tv', avgWattage: 150 },
      { value: 'Lights', label: 'Lights', icon: 'lightbulb', avgWattage: 60 },
      { value: 'Computer', label: 'Computer', icon: 'desktop', avgWattage: 200 },
      { value: 'Water Heater', label: 'Water Heater', icon: 'water-heater', avgWattage: 2000 },
      { value: 'Electric Kettle', label: 'Electric Kettle', icon: 'kettle', avgWattage: 1500 },
      { value: 'Fan', label: 'Fan', icon: 'fan', avgWattage: 75 },
      { value: 'Iron', label: 'Iron', icon: 'iron', avgWattage: 1000 },
      { value: 'Dishwasher', label: 'Dishwasher', icon: 'dishwasher', avgWattage: 1800 },
      { value: 'Oven', label: 'Oven', icon: 'oven', avgWattage: 2400 },
      { value: 'Coffee Maker', label: 'Coffee Maker', icon: 'coffee', avgWattage: 800 },
      { value: 'Toaster', label: 'Toaster', icon: 'toaster', avgWattage: 1200 },
      { value: 'Vacuum Cleaner', label: 'Vacuum Cleaner', icon: 'vacuum', avgWattage: 1400 },
      { value: 'Hair Dryer', label: 'Hair Dryer', icon: 'hair-dryer', avgWattage: 1800 },
      { value: 'Other', label: 'Other', icon: 'appliance', avgWattage: 100 }
    ];

    res.status(200).json({
      success: true,
      count: types.length,
      data: types
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bulk create appliances for a room
// @route   POST /api/appliances/bulk
// @access  Private
exports.bulkCreateAppliances = async (req, res) => {
  try {
    const { roomId, appliances } = req.body;

    if (!roomId || !appliances || !Array.isArray(appliances) || appliances.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roomId and appliances array'
      });
    }

    console.log(`➕ Bulk creating ${appliances.length} appliances for room: ${roomId}`.cyan);

    // Verify room exists
    const room = await Room.findOne({
      _id: roomId,
      userId: req.user._id
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Prepare appliances for creation
    const appliancesToCreate = appliances.map(appliance => ({
      userId: req.user._id,
      roomId,
      name: appliance.name,
      type: appliance.type || 'Other',
      powerRating: appliance.powerRating || appliance.estimatedWattage || 100,
      estimatedWattage: appliance.estimatedWattage || 100,
      usageHoursPerDay: appliance.usageHoursPerDay || 0,
      icon: appliance.icon || appliance.type?.toLowerCase().replace(/\s+/g, '_') || 'appliance',
      color: '#6366f1',
      powerSignature: {
        min: (appliance.estimatedWattage || 100) * 0.8,
        max: (appliance.estimatedWattage || 100) * 1.2,
        typical: appliance.estimatedWattage || 100
      }
    }));

    // Create all appliances
    const createdAppliances = await Appliance.insertMany(appliancesToCreate);

    console.log(`✅ Created ${createdAppliances.length} appliances`.green);

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdAppliances.length} appliances`,
      count: createdAppliances.length,
      data: createdAppliances
    });
  } catch (error) {
    console.error('❌ Error bulk creating appliances:'.red, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
