const PowerReading = require('../models/PowerReading');
const Room = require('../models/Room');

// @desc    Get room-level consumption
// @route   GET /api/consumption/room
// @access  Private
exports.getRoomConsumption = async (req, res) => {
  try {
    const { roomId, period = 'today' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch(period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    let query = {
      userId: req.user._id,
      timestamp: { $gte: startDate }
    };

    if (roomId) {
      query.roomId = roomId;
    }

    // Get readings and calculate consumption
    const readings = await PowerReading.find(query)
      .populate('roomId', 'name icon threshold');

    // Group by room
    const roomConsumption = {};
    readings.forEach(reading => {
      const roomKey = reading.roomId._id.toString();
      if (!roomConsumption[roomKey]) {
        roomConsumption[roomKey] = {
          room: reading.roomId,
          currentPower: 0,
          totalEnergy: 0,
          readingsCount: 0,
          avgPower: 0,
          maxPower: 0
        };
      }
      
      roomConsumption[roomKey].currentPower = reading.power;
      roomConsumption[roomKey].totalEnergy += reading.energy;
      roomConsumption[roomKey].readingsCount += 1;
      roomConsumption[roomKey].maxPower = Math.max(roomConsumption[roomKey].maxPower, reading.power);
    });

    // Calculate averages
    Object.keys(roomConsumption).forEach(key => {
      const room = roomConsumption[key];
      room.avgPower = room.readingsCount > 0 
        ? room.totalEnergy / room.readingsCount 
        : 0;
    });

    const result = Object.values(roomConsumption);

    res.status(200).json({
      success: true,
      period,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get overall household consumption
// @route   GET /api/consumption/overall
// @access  Private
exports.getOverallConsumption = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch(period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const readings = await PowerReading.find({
      userId: req.user._id,
      timestamp: { $gte: startDate }
    });

    // Calculate totals
    let totalPower = 0;
    let totalEnergy = 0;
    let avgVoltage = 0;
    let avgCurrent = 0;
    let maxPower = 0;

    readings.forEach(reading => {
      totalPower += reading.power;
      totalEnergy += reading.energy;
      avgVoltage += reading.voltage;
      avgCurrent += reading.current;
      maxPower = Math.max(maxPower, reading.power);
    });

    const count = readings.length;

    // Get current power (latest reading)
    const latestReading = await PowerReading.findOne({ 
      userId: req.user._id 
    }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      period,
      data: {
        currentPower: latestReading ? latestReading.power : 0,
        currentVoltage: latestReading ? latestReading.voltage : 0,
        currentCurrent: latestReading ? latestReading.current : 0,
        totalEnergy: totalEnergy.toFixed(2),
        avgPower: count > 0 ? (totalPower / count).toFixed(2) : 0,
        avgVoltage: count > 0 ? (avgVoltage / count).toFixed(2) : 0,
        avgCurrent: count > 0 ? (avgCurrent / count).toFixed(2) : 0,
        maxPower: maxPower.toFixed(2),
        readingsCount: count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get consumption statistics
// @route   GET /api/consumption/stats
// @access  Private
exports.getConsumptionStats = async (req, res) => {
  try {
    const now = new Date();
    
    // Today's consumption
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayReadings = await PowerReading.find({
      userId: req.user._id,
      timestamp: { $gte: todayStart }
    });
    
    // This month's consumption
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthReadings = await PowerReading.find({
      userId: req.user._id,
      timestamp: { $gte: monthStart }
    });

    // Calculate stats
    const todayEnergy = todayReadings.reduce((sum, r) => sum + r.energy, 0);
    const monthEnergy = monthReadings.reduce((sum, r) => sum + r.energy, 0);
    
    // Peak power this month
    const peakPower = monthReadings.length > 0 
      ? Math.max(...monthReadings.map(r => r.power)) 
      : 0;

    // Get settings for budget comparison
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne({ userId: req.user._id });
    const monthlyBudget = settings ? settings.budget.monthly : 400;
    const ratePerKwh = settings ? settings.budget.ratePerKwh : 6.5;

    const estimatedCost = monthEnergy * ratePerKwh;
    const budgetUsedPercent = (monthEnergy / monthlyBudget) * 100;

    res.status(200).json({
      success: true,
      data: {
        today: {
          energy: todayEnergy.toFixed(2),
          cost: (todayEnergy * ratePerKwh).toFixed(2)
        },
        month: {
          energy: monthEnergy.toFixed(2),
          cost: estimatedCost.toFixed(2),
          budget: monthlyBudget,
          budgetUsed: budgetUsedPercent.toFixed(1),
          remaining: (monthlyBudget - monthEnergy).toFixed(2)
        },
        peakPower: peakPower.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
