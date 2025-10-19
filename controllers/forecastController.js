const PowerReading = require('../models/PowerReading');
const Settings = require('../models/Settings');

// Simple linear regression for forecasting
const simpleLinearRegression = (values) => {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  values.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

// @desc    Forecast monthly energy usage
// @route   GET /api/forecast/monthly
// @access  Private
exports.forecastMonthly = async (req, res) => {
  try {
    // Get current month's data
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const readings = await PowerReading.find({
      userId: req.user._id,
      timestamp: { $gte: monthStart, $lte: now }
    }).sort({ timestamp: 1 });

    // Group by day
    const dailyConsumption = {};
    readings.forEach(reading => {
      const day = reading.timestamp.getDate();
      if (!dailyConsumption[day]) {
        dailyConsumption[day] = 0;
      }
      dailyConsumption[day] += reading.energy;
    });

    const dailyValues = Object.values(dailyConsumption);
    const currentDay = now.getDate();
    const daysInMonth = monthEnd.getDate();
    
    // Calculate average daily consumption
    const avgDailyConsumption = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
    
    // Forecast remaining days
    const { slope, intercept } = simpleLinearRegression(dailyValues);
    let forecastedTotal = dailyValues.reduce((a, b) => a + b, 0);
    
    for (let day = currentDay + 1; day <= daysInMonth; day++) {
      const forecastedDay = slope * (day - 1) + intercept;
      forecastedTotal += Math.max(0, forecastedDay);
    }

    // Get budget settings
    const settings = await Settings.findOne({ userId: req.user._id });
    const monthlyBudget = settings ? settings.budget.monthly : 400;
    const ratePerKwh = settings ? settings.budget.ratePerKwh : 6.5;

    const currentUsage = dailyValues.reduce((a, b) => a + b, 0);
    const willExceedBudget = forecastedTotal > monthlyBudget;
    const exceedAmount = willExceedBudget ? forecastedTotal - monthlyBudget : 0;

    res.status(200).json({
      success: true,
      data: {
        currentMonth: {
          daysElapsed: currentDay,
          daysRemaining: daysInMonth - currentDay,
          currentUsage: currentUsage.toFixed(2),
          avgDailyUsage: avgDailyConsumption.toFixed(2)
        },
        forecast: {
          predictedTotal: forecastedTotal.toFixed(2),
          predictedCost: (forecastedTotal * ratePerKwh).toFixed(2),
          budget: monthlyBudget,
          willExceedBudget,
          exceedAmount: exceedAmount.toFixed(2),
          usagePercent: ((forecastedTotal / monthlyBudget) * 100).toFixed(1)
        },
        recommendation: willExceedBudget 
          ? `Reduce daily consumption by ${((exceedAmount / (daysInMonth - currentDay))).toFixed(2)} kWh to stay within budget`
          : 'You are on track to stay within your monthly budget'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Forecast daily energy usage
// @route   GET /api/forecast/daily
// @access  Private
exports.forecastDaily = async (req, res) => {
  try {
    // Get last 7 days of data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const readings = await PowerReading.find({
      userId: req.user._id,
      timestamp: { $gte: sevenDaysAgo }
    }).sort({ timestamp: 1 });

    // Group by day
    const dailyConsumption = {};
    readings.forEach(reading => {
      const dateKey = reading.timestamp.toISOString().split('T')[0];
      if (!dailyConsumption[dateKey]) {
        dailyConsumption[dateKey] = 0;
      }
      dailyConsumption[dateKey] += reading.energy;
    });

    const dailyValues = Object.values(dailyConsumption);
    
    // Calculate forecast for tomorrow
    const { slope, intercept } = simpleLinearRegression(dailyValues);
    const nextDayIndex = dailyValues.length;
    const forecastedUsage = Math.max(0, slope * nextDayIndex + intercept);
    
    // Calculate average and trend
    const avgUsage = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
    const trend = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';

    // Get settings for cost calculation
    const settings = await Settings.findOne({ userId: req.user._id });
    const ratePerKwh = settings ? settings.budget.ratePerKwh : 6.5;

    // Get today's usage so far
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayReadings = await PowerReading.find({
      userId: req.user._id,
      timestamp: { $gte: todayStart }
    });
    const todayUsage = todayReadings.reduce((sum, r) => sum + r.energy, 0);

    res.status(200).json({
      success: true,
      data: {
        today: {
          usage: todayUsage.toFixed(2),
          cost: (todayUsage * ratePerKwh).toFixed(2)
        },
        tomorrow: {
          predictedUsage: forecastedUsage.toFixed(2),
          predictedCost: (forecastedUsage * ratePerKwh).toFixed(2),
          confidence: dailyValues.length >= 5 ? 'high' : 'medium'
        },
        last7Days: {
          avgUsage: avgUsage.toFixed(2),
          trend,
          dailyData: Object.keys(dailyConsumption).map(date => ({
            date,
            usage: dailyConsumption[date].toFixed(2)
          }))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get weekly usage trend
// @route   GET /api/forecast/weekly
// @access  Private
exports.getWeeklyTrend = async (req, res) => {
  try {
    const { weeks = 7 } = req.query;
    
    const weeksAgo = new Date(Date.now() - parseInt(weeks) * 7 * 24 * 60 * 60 * 1000);
    const readings = await PowerReading.find({
      userId: req.user._id,
      timestamp: { $gte: weeksAgo }
    }).sort({ timestamp: 1 });

    // Group by week
    const weeklyConsumption = {};
    readings.forEach(reading => {
      const weekStart = new Date(reading.timestamp);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyConsumption[weekKey]) {
        weeklyConsumption[weekKey] = 0;
      }
      weeklyConsumption[weekKey] += reading.energy;
    });

    const weeklyData = Object.keys(weeklyConsumption)
      .sort()
      .map((weekStart, index) => ({
        week: `W${index + 1}`,
        weekStart,
        usage: weeklyConsumption[weekStart].toFixed(2)
      }));

    // Calculate comparison with last week/month
    const values = Object.values(weeklyConsumption);
    const lastWeekUsage = values[values.length - 1] || 0;
    const previousWeekUsage = values[values.length - 2] || 0;
    const changePercent = previousWeekUsage > 0 
      ? ((lastWeekUsage - previousWeekUsage) / previousWeekUsage * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        weeklyData,
        comparison: {
          lastWeek: lastWeekUsage.toFixed(2),
          previousWeek: previousWeekUsage.toFixed(2),
          changePercent,
          trend: changePercent > 0 ? 'increase' : changePercent < 0 ? 'decrease' : 'stable'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
