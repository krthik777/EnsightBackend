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

    console.log(`📊 Querying PowerReadings:`.cyan);
    console.log(`   User ID: ${req.user._id}`.gray);
    console.log(`   Period: ${period}`.gray);
    console.log(`   Start Date: ${startDate}`.gray);

    const readings = await PowerReading.find({
      userId: req.user._id,
      timestamp: { $gte: startDate }
    });

    console.log(`   Found ${readings.length} readings`.gray);

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

    // Calculate current values from latest reading or averages
    const currentPowerW = latestReading ? latestReading.power : (count > 0 ? totalPower / count : 0);
    const currentA = latestReading ? latestReading.current : (count > 0 ? avgCurrent / count : 0);
    const voltageV = latestReading ? latestReading.voltage : (count > 0 ? avgVoltage / count : 230);
    
    // Max capacity (you can make this configurable via settings)
    const maxCapacityW = 1000;
    const capacityPercentage = maxCapacityW > 0 ? ((currentPowerW / maxCapacityW) * 100) : 0;

    res.status(200).json({
      success: true,
      period,
      data: {
        // Current values (matching frontend expected format)
        currentPowerW: parseFloat(currentPowerW.toFixed(2)),
        currentA: parseFloat(currentA.toFixed(3)),
        voltageV: parseFloat(voltageV.toFixed(2)),
        capacityPercentage: parseFloat(capacityPercentage.toFixed(2)),
        maxCapacityW: maxCapacityW,
        timestamp: latestReading ? latestReading.timestamp : new Date(),
        
        // Additional statistics
        totalEnergy: parseFloat(totalEnergy.toFixed(2)),
        avgPower: count > 0 ? parseFloat((totalPower / count).toFixed(2)) : 0,
        avgVoltage: count > 0 ? parseFloat((avgVoltage / count).toFixed(2)) : 0,
        avgCurrent: count > 0 ? parseFloat((avgCurrent / count).toFixed(3)) : 0,
        maxPower: parseFloat(maxPower.toFixed(2)),
        readingsCount: count
      }
    });
  } catch (error) {
    console.error(`❌ Error in getOverallConsumption:`.red, error.message);
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

// @desc    Get consumption for a specific calendar month
// @route   GET /api/consumption/monthly
// @access  Private
exports.getMonthlyConsumption = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Validate input
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Please provide year and month. Example: ?year=2025&month=10'
      });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Validate year and month ranges
    if (yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Year must be between 2000 and 2100'
      });
    }

    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 (January) and 12 (December)'
      });
    }

    // Calculate start and end dates for the calendar month
    // Month is 0-indexed in JavaScript Date (0 = January, 11 = December)
    const startDate = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999); // Last day of the month
    
    const daysInMonth = endDate.getDate();
    const monthName = startDate.toLocaleString('default', { month: 'long' });

    console.log(`📅 Querying Monthly Consumption:`.cyan);
    console.log(`   User ID: ${req.user._id}`.gray);
    console.log(`   Month: ${monthName} ${yearNum}`.gray);
    console.log(`   Start Date: ${startDate}`.gray);
    console.log(`   End Date: ${endDate}`.gray);
    console.log(`   Days in Month: ${daysInMonth}`.gray);

    // Query all readings for this calendar month
    const readings = await PowerReading.find({
      userId: req.user._id,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ timestamp: 1 });

    console.log(`   Found ${readings.length} readings`.gray);

    // Calculate statistics
    let totalPower = 0;
    let totalEnergy = 0;
    let avgVoltage = 0;
    let avgCurrent = 0;
    let maxPower = 0;
    let minPower = readings.length > 0 ? readings[0].power : 0;

    readings.forEach(reading => {
      totalPower += reading.power;
      totalEnergy += reading.energy;
      avgVoltage += reading.voltage;
      avgCurrent += reading.current;
      maxPower = Math.max(maxPower, reading.power);
      minPower = Math.min(minPower, reading.power);
    });

    const count = readings.length;

    // Get user settings for cost calculation
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne({ userId: req.user._id });
    const monthlyBudget = settings ? settings.budget.monthly : 400;
    const ratePerKwh = settings ? settings.budget.ratePerKwh : 6.5;

    // Calculate costs and budget
    const totalCost = totalEnergy * ratePerKwh;
    const budgetUsedPercent = (totalEnergy / monthlyBudget) * 100;
    const remaining = monthlyBudget - totalEnergy;
    const avgDailyEnergy = count > 0 ? totalEnergy / daysInMonth : 0;

    // Calculate daily breakdown
    const dailyBreakdown = {};
    readings.forEach(reading => {
      const day = reading.timestamp.getDate();
      if (!dailyBreakdown[day]) {
        dailyBreakdown[day] = {
          day: day,
          date: new Date(yearNum, monthNum - 1, day).toISOString().split('T')[0],
          energy: 0,
          readingsCount: 0,
          avgPower: 0,
          maxPower: 0
        };
      }
      dailyBreakdown[day].energy += reading.energy;
      dailyBreakdown[day].readingsCount += 1;
      dailyBreakdown[day].maxPower = Math.max(dailyBreakdown[day].maxPower, reading.power);
    });

    // Calculate average power for each day
    Object.values(dailyBreakdown).forEach(day => {
      day.avgPower = day.readingsCount > 0 ? parseFloat((day.energy / day.readingsCount * 1000).toFixed(2)) : 0;
      day.energy = parseFloat(day.energy.toFixed(3));
      day.cost = parseFloat((day.energy * ratePerKwh).toFixed(2));
      day.maxPower = parseFloat(day.maxPower.toFixed(2));
    });

    const dailyData = Object.values(dailyBreakdown).sort((a, b) => a.day - b.day);

    res.status(200).json({
      success: true,
      data: {
        month: monthName,
        year: yearNum,
        monthNumber: monthNum,
        daysInMonth: daysInMonth,
        startDate: startDate,
        endDate: endDate,
        summary: {
          totalEnergyKWh: parseFloat(totalEnergy.toFixed(2)),
          totalCostINR: parseFloat(totalCost.toFixed(2)),
          avgDailyEnergyKWh: parseFloat(avgDailyEnergy.toFixed(2)),
          avgPowerW: count > 0 ? parseFloat((totalPower / count).toFixed(2)) : 0,
          avgVoltageV: count > 0 ? parseFloat((avgVoltage / count).toFixed(2)) : 0,
          avgCurrentA: count > 0 ? parseFloat((avgCurrent / count).toFixed(3)) : 0,
          maxPowerW: parseFloat(maxPower.toFixed(2)),
          minPowerW: parseFloat(minPower.toFixed(2)),
          readingsCount: count
        },
        budget: {
          monthlyBudgetKWh: monthlyBudget,
          budgetUsedPercent: parseFloat(budgetUsedPercent.toFixed(1)),
          remainingKWh: parseFloat(remaining.toFixed(2)),
          isOverBudget: totalEnergy > monthlyBudget,
          exceedanceKWh: totalEnergy > monthlyBudget ? parseFloat((totalEnergy - monthlyBudget).toFixed(2)) : 0
        },
        dailyBreakdown: dailyData,
        ratePerKwh: ratePerKwh
      }
    });
  } catch (error) {
    console.error(`❌ Error in getMonthlyConsumption:`.red, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get consumption trends (daily, weekly, monthly)
// @route   GET /api/consumption/trends
// @access  Private
exports.getConsumptionTrends = async (req, res) => {
  try {
    const { type, roomId } = req.query;

    console.log(`📊 Consumption Trends Endpoint Hit:`.cyan);
    console.log(`   Full Query:`, req.query);
    console.log(`   Type value: "${type}"`.gray);
    console.log(`   Type type: ${typeof type}`.gray);

    if (!type || !['daily', 'weekly', 'monthly'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Please provide valid type: daily, weekly, or monthly. Received: "${type}"`
      });
    }

    console.log(`📊 Querying Consumption Trends:`.cyan);
    console.log(`   User ID: ${req.user._id}`.gray);
    console.log(`   Type: ${type}`.gray);
    console.log(`   Room Filter: ${roomId || 'All rooms'}`.gray);

    const now = new Date();
    let trendData = {};

    if (type === 'daily') {
      // Daily trends: Last 7 days + hourly breakdown for today
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const query = {
        userId: req.user._id,
        timestamp: { $gte: previousWeekStart }
      };
      if (roomId) query.roomId = roomId;

      const readings = await PowerReading.find(query).sort({ timestamp: 1 });

      // Last 7 days breakdown
      const dailyBreakdown = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        dailyBreakdown[dateKey] = {
          date: dateKey,
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          energy: 0,
          avgPower: 0,
          maxPower: 0,
          readingsCount: 0,
          cost: 0
        };
      }

      // Previous week breakdown (for comparison)
      const previousWeekBreakdown = {};
      for (let i = 7; i < 14; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        previousWeekBreakdown[dateKey] = { energy: 0 };
      }

      // Hourly breakdown for today
      const hourlyBreakdown = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        timeLabel: `${i.toString().padStart(2, '0')}:00`,
        energy: 0,
        avgPower: 0,
        maxPower: 0,
        readingsCount: 0
      }));

      readings.forEach(reading => {
        const readingDate = new Date(reading.timestamp);
        const dateKey = readingDate.toISOString().split('T')[0];
        
        // Daily breakdown (last 7 days)
        if (dailyBreakdown[dateKey]) {
          dailyBreakdown[dateKey].energy += reading.energy;
          dailyBreakdown[dateKey].maxPower = Math.max(dailyBreakdown[dateKey].maxPower, reading.power);
          dailyBreakdown[dateKey].readingsCount += 1;
        }

        // Previous week breakdown
        if (previousWeekBreakdown[dateKey]) {
          previousWeekBreakdown[dateKey].energy += reading.energy;
        }

        // Hourly breakdown for today
        if (readingDate >= todayStart) {
          const hour = readingDate.getHours();
          hourlyBreakdown[hour].energy += reading.energy;
          hourlyBreakdown[hour].maxPower = Math.max(hourlyBreakdown[hour].maxPower, reading.power);
          hourlyBreakdown[hour].readingsCount += 1;
        }
      });

      // Get settings for cost calculation
      const Settings = require('../models/Settings');
      const settings = await Settings.findOne({ userId: req.user._id });
      const ratePerKwh = settings ? settings.budget.ratePerKwh : 6.5;

      // Calculate averages and costs
      Object.values(dailyBreakdown).forEach(day => {
        day.avgPower = day.readingsCount > 0 ? parseFloat((day.energy / day.readingsCount * 1000).toFixed(2)) : 0;
        day.energy = parseFloat(day.energy.toFixed(3));
        day.cost = parseFloat((day.energy * ratePerKwh).toFixed(2));
        day.maxPower = parseFloat(day.maxPower.toFixed(2));
      });

      hourlyBreakdown.forEach(hour => {
        hour.avgPower = hour.readingsCount > 0 ? parseFloat((hour.energy / hour.readingsCount * 1000).toFixed(2)) : 0;
        hour.energy = parseFloat(hour.energy.toFixed(3));
        hour.maxPower = parseFloat(hour.maxPower.toFixed(2));
      });

      const dailyData = Object.values(dailyBreakdown).sort((a, b) => new Date(a.date) - new Date(b.date));
      const currentWeekTotal = dailyData.reduce((sum, day) => sum + parseFloat(day.energy), 0);
      const previousWeekTotal = Object.values(previousWeekBreakdown).reduce((sum, day) => sum + day.energy, 0);
      const weekChange = previousWeekTotal > 0 ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal * 100) : 0;

      // Find peak hour
      const peakHour = hourlyBreakdown.reduce((max, hour) => hour.maxPower > max.maxPower ? hour : max, hourlyBreakdown[0]);

      trendData = {
        type: 'daily',
        period: 'Last 7 Days',
        dailyBreakdown: dailyData,
        hourlyBreakdown: hourlyBreakdown,
        summary: {
          currentWeekTotal: parseFloat(currentWeekTotal.toFixed(2)),
          previousWeekTotal: parseFloat(previousWeekTotal.toFixed(2)),
          weekChangePercent: parseFloat(weekChange.toFixed(1)),
          avgDailyEnergy: parseFloat((currentWeekTotal / 7).toFixed(2)),
          peakHour: {
            hour: peakHour.hour,
            timeLabel: peakHour.timeLabel,
            maxPower: peakHour.maxPower
          }
        },
        ratePerKwh
      };

    } else if (type === 'weekly') {
      // Weekly trends: Last 8 weeks
      const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
      
      const query = {
        userId: req.user._id,
        timestamp: { $gte: eightWeeksAgo }
      };
      if (roomId) query.roomId = roomId;

      const readings = await PowerReading.find(query).sort({ timestamp: 1 });

      // Calculate week boundaries
      const weeklyBreakdown = [];
      for (let i = 0; i < 8; i++) {
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        weeklyBreakdown.unshift({
          weekNumber: 8 - i,
          weekLabel: `Week ${8 - i}`,
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0],
          energy: 0,
          avgDailyEnergy: 0,
          maxPower: 0,
          readingsCount: 0,
          cost: 0
        });
      }

      readings.forEach(reading => {
        const readingTime = reading.timestamp.getTime();
        weeklyBreakdown.forEach(week => {
          const weekStartTime = new Date(week.startDate).getTime();
          const weekEndTime = new Date(week.endDate).getTime();
          
          if (readingTime >= weekStartTime && readingTime < weekEndTime) {
            week.energy += reading.energy;
            week.maxPower = Math.max(week.maxPower, reading.power);
            week.readingsCount += 1;
          }
        });
      });

      const Settings = require('../models/Settings');
      const settings = await Settings.findOne({ userId: req.user._id });
      const ratePerKwh = settings ? settings.budget.ratePerKwh : 6.5;

      weeklyBreakdown.forEach(week => {
        week.avgDailyEnergy = parseFloat((week.energy / 7).toFixed(2));
        week.energy = parseFloat(week.energy.toFixed(2));
        week.cost = parseFloat((week.energy * ratePerKwh).toFixed(2));
        week.maxPower = parseFloat(week.maxPower.toFixed(2));
      });

      const currentWeek = weeklyBreakdown[weeklyBreakdown.length - 1];
      const previousWeek = weeklyBreakdown[weeklyBreakdown.length - 2];
      const weekChange = previousWeek.energy > 0 ? ((currentWeek.energy - previousWeek.energy) / previousWeek.energy * 100) : 0;
      const avgWeeklyEnergy = weeklyBreakdown.reduce((sum, week) => sum + week.energy, 0) / 8;

      trendData = {
        type: 'weekly',
        period: 'Last 8 Weeks',
        weeklyBreakdown,
        summary: {
          currentWeekEnergy: currentWeek.energy,
          previousWeekEnergy: previousWeek.energy,
          weekChangePercent: parseFloat(weekChange.toFixed(1)),
          avgWeeklyEnergy: parseFloat(avgWeeklyEnergy.toFixed(2)),
          totalEnergy: parseFloat(weeklyBreakdown.reduce((sum, week) => sum + week.energy, 0).toFixed(2))
        },
        ratePerKwh
      };

    } else if (type === 'monthly') {
      // Monthly trends: Last 12 months
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
      
      const query = {
        userId: req.user._id,
        timestamp: { $gte: twelveMonthsAgo }
      };
      if (roomId) query.roomId = roomId;

      const readings = await PowerReading.find(query).sort({ timestamp: 1 });

      // Calculate month boundaries
      const monthlyBreakdown = [];
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
        const daysInMonth = monthEnd.getDate();
        
        monthlyBreakdown.unshift({
          month: monthDate.toLocaleString('default', { month: 'long' }),
          monthShort: monthDate.toLocaleString('default', { month: 'short' }),
          year: monthDate.getFullYear(),
          monthNumber: monthDate.getMonth() + 1,
          startDate: monthStart.toISOString().split('T')[0],
          endDate: monthEnd.toISOString().split('T')[0],
          daysInMonth,
          energy: 0,
          avgDailyEnergy: 0,
          maxPower: 0,
          readingsCount: 0,
          cost: 0
        });
      }

      readings.forEach(reading => {
        const readingDate = reading.timestamp;
        monthlyBreakdown.forEach(month => {
          const monthStart = new Date(month.startDate);
          const monthEnd = new Date(month.endDate);
          
          if (readingDate >= monthStart && readingDate <= monthEnd) {
            month.energy += reading.energy;
            month.maxPower = Math.max(month.maxPower, reading.power);
            month.readingsCount += 1;
          }
        });
      });

      const Settings = require('../models/Settings');
      const settings = await Settings.findOne({ userId: req.user._id });
      const ratePerKwh = settings ? settings.budget.ratePerKwh : 6.5;
      const monthlyBudget = settings ? settings.budget.monthly : 400;

      monthlyBreakdown.forEach(month => {
        month.avgDailyEnergy = parseFloat((month.energy / month.daysInMonth).toFixed(2));
        month.energy = parseFloat(month.energy.toFixed(2));
        month.cost = parseFloat((month.energy * ratePerKwh).toFixed(2));
        month.maxPower = parseFloat(month.maxPower.toFixed(2));
        month.budgetUsedPercent = parseFloat((month.energy / monthlyBudget * 100).toFixed(1));
        month.overBudget = month.energy > monthlyBudget;
      });

      const currentMonth = monthlyBreakdown[monthlyBreakdown.length - 1];
      const previousMonth = monthlyBreakdown[monthlyBreakdown.length - 2];
      const monthChange = previousMonth.energy > 0 ? ((currentMonth.energy - previousMonth.energy) / previousMonth.energy * 100) : 0;
      const avgMonthlyEnergy = monthlyBreakdown.reduce((sum, month) => sum + month.energy, 0) / 12;
      const totalYearEnergy = monthlyBreakdown.reduce((sum, month) => sum + month.energy, 0);

      // Year-over-year comparison (if we have data from 12 months ago)
      const currentMonthData = monthlyBreakdown.find(m => m.monthNumber === (now.getMonth() + 1) && m.year === now.getFullYear());
      const lastYearSameMonth = monthlyBreakdown.find(m => m.monthNumber === (now.getMonth() + 1) && m.year === (now.getFullYear() - 1));
      const yearOverYearChange = lastYearSameMonth && lastYearSameMonth.energy > 0 
        ? ((currentMonthData.energy - lastYearSameMonth.energy) / lastYearSameMonth.energy * 100) 
        : null;

      trendData = {
        type: 'monthly',
        period: 'Last 12 Months',
        monthlyBreakdown,
        summary: {
          currentMonthEnergy: currentMonth.energy,
          previousMonthEnergy: previousMonth.energy,
          monthChangePercent: parseFloat(monthChange.toFixed(1)),
          avgMonthlyEnergy: parseFloat(avgMonthlyEnergy.toFixed(2)),
          totalYearEnergy: parseFloat(totalYearEnergy.toFixed(2)),
          yearOverYearChangePercent: yearOverYearChange !== null ? parseFloat(yearOverYearChange.toFixed(1)) : null,
          monthlyBudget,
          overBudgetMonths: monthlyBreakdown.filter(m => m.overBudget).length
        },
        ratePerKwh
      };
    }

    res.status(200).json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error(`❌ Error in getConsumptionTrends:`.red, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
