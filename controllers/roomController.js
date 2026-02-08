const Room = require('../models/Room');
const PowerReading = require('../models/PowerReading');

// @desc    Get all rooms
// @route   GET /api/room
// @access  Private
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ userId: req.user._id, isActive: true });
    const Appliance = require('../models/Appliance');

    // Get latest power reading for each room
    const roomsWithPower = await Promise.all(
      rooms.map(async (room) => {
        const latestReading = await PowerReading.findOne({ 
          roomId: room._id 
        }).sort({ timestamp: -1 });

        // Get today's consumption
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayReadings = await PowerReading.find({
          roomId: room._id,
          timestamp: { $gte: todayStart }
        });

        const todayEnergy = todayReadings.reduce((sum, r) => sum + r.energy, 0);

        // Get appliances for this room
        const appliances = await Appliance.find({
          roomId: room._id,
          userId: req.user._id
        });

        return {
          ...room.toObject(),
          currentPower: latestReading ? latestReading.power : 0,
          currentVoltage: latestReading ? latestReading.voltage : 0,
          currentCurrent: latestReading ? latestReading.current : 0,
          todayEnergy: todayEnergy.toFixed(2),
          lastUpdated: latestReading ? latestReading.timestamp : null,
          applianceCount: appliances.length,
          activeApplianceCount: appliances.filter(a => a.isActive).length
        };
      })
    );

    res.status(200).json({
      success: true,
      count: roomsWithPower.length,
      data: roomsWithPower
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single room
// @route   GET /api/room/:id
// @access  Private
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Get appliances for this room
    const Appliance = require('../models/Appliance');
    const appliances = await Appliance.find({
      roomId: room._id,
      userId: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...room.toObject(),
        appliances,
        applianceCount: appliances.length,
        activeApplianceCount: appliances.filter(a => a.isActive).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new room
// @route   POST /api/room
// @access  Private
exports.createRoom = async (req, res) => {
  try {
    const { name, icon, threshold, appliances } = req.body;

    console.log('🏠 Creating Room:'.cyan);
    console.log(`   Name: ${name}`.gray);
    console.log(`   Appliances to add: ${appliances ? appliances.length : 0}`.gray);

    // Create room
    const room = await Room.create({
      userId: req.user._id,
      name,
      icon: icon || 'home',
      threshold: threshold || 2000
    });

    console.log(`✅ Room created: ${room._id}`.green);

    // If appliances are provided, create them
    let createdAppliances = [];
    if (appliances && Array.isArray(appliances) && appliances.length > 0) {
      const Appliance = require('../models/Appliance');
      
      const appliancesToCreate = appliances.map(appliance => ({
        userId: req.user._id,
        roomId: room._id,
        name: appliance.name,
        type: appliance.type || 'Other',
        brand: appliance.brand,
        model: appliance.model,
        estimatedWattage: appliance.estimatedWattage || 100,
        usageHoursPerDay: appliance.usageHoursPerDay || 0,
        icon: appliance.icon || appliance.type?.toLowerCase().replace(/\s+/g, '_') || 'appliance',
        color: appliance.color || '#6366f1',
        powerSignature: {
          min: (appliance.estimatedWattage || 100) * 0.8,
          max: (appliance.estimatedWattage || 100) * 1.2,
          typical: appliance.estimatedWattage || 100
        },
        notes: appliance.notes
      }));

      createdAppliances = await Appliance.insertMany(appliancesToCreate);
      console.log(`✅ Created ${createdAppliances.length} appliances for room`.green);
    }

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        room,
        appliances: createdAppliances,
        applianceCount: createdAppliances.length
      }
    });
  } catch (error) {
    console.error('❌ Error creating room:'.red, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update room
// @route   PUT /api/room/:id
// @access  Private
exports.updateRoom = async (req, res) => {
  try {
    const { name, icon, threshold, isActive } = req.body;

    let room = await Room.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    room = await Room.findByIdAndUpdate(
      req.params.id,
      { name, icon, threshold, isActive },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete room
// @route   DELETE /api/room/:id
// @access  Private
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Soft delete
    room.isActive = false;
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
