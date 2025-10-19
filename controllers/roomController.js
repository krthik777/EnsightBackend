const Room = require('../models/Room');
const PowerReading = require('../models/PowerReading');

// @desc    Get all rooms
// @route   GET /api/room
// @access  Private
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ userId: req.user._id, isActive: true });

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

        return {
          ...room.toObject(),
          currentPower: latestReading ? latestReading.power : 0,
          currentVoltage: latestReading ? latestReading.voltage : 0,
          currentCurrent: latestReading ? latestReading.current : 0,
          todayEnergy: todayEnergy.toFixed(2),
          lastUpdated: latestReading ? latestReading.timestamp : null
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

// @desc    Create new room
// @route   POST /api/room
// @access  Private
exports.createRoom = async (req, res) => {
  try {
    const { name, icon, threshold } = req.body;

    const room = await Room.create({
      userId: req.user._id,
      name,
      icon: icon || 'home',
      threshold: threshold || 2000
    });

    res.status(201).json({
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
