const PowerReading = require('../models/PowerReading');
const Settings    = require('../models/Settings');
const mlService   = require('../services/mlBackendService');

// ─────────────────────────────────────────────────────────────────────────────
// Simple linear regression — used only by the local fallback
// ─────────────────────────────────────────────────────────────────────────────
const simpleLinearRegression = (values) => {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  values.forEach((y, x) => { sumX += x; sumY += y; sumXY += x * y; sumXX += x * x; });
  const slope     = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Forecast monthly energy + cost
// @route GET /api/forecast/monthly
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.forecastMonthly = async (req, res) => {
  try {
    const { roomId, lookback_days } = req.query;
    const userId = req.user._id.toString();

    const now         = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay  = now.getDate();

    console.log('📈 Monthly Forecast:'.cyan);
    console.log(`   User: ${userId}`.gray);
    console.log(`   Room: ${roomId || '(all)'}`.gray);
    console.log(`   Day: ${currentDay}/${daysInMonth}`.gray);

    // ── Try ML backend ────────────────────────────────────────────────────
    if (roomId) {
      try {
        // ML uses EWMA from last 2-7 days (more accurate than simple linear)
        const mlRes = await mlService.predictMonthEnd({
          userId,
          roomId,
          lookback_days: lookback_days ? parseInt(lookback_days) : 7
        });

        if (!mlRes.success) {
          throw new Error(mlRes.error || 'predict-month-end returned success=false');
        }

        // ML returns predicted_cost as a full KSEB bill object
        const predictedCost = mlRes.predicted_cost || {};

        return res.status(200).json({
          success: true,
          data: {
            source: 'ml_backend',
            currentMonth: {
              daysElapsed:         mlRes.days_elapsed,
              daysRemaining:       mlRes.days_remaining,
              actualKwhSoFar:      mlRes.actual_kwh_so_far,
              projectedDailyKwh:   mlRes.projected_daily_kwh,
              projectedRemainingKwh: mlRes.projected_remaining_kwh,
              trend:               mlRes.trend,
              dataPoints:          mlRes.data_points
            },
            forecast: {
              predictedMonthUnits:   mlRes.predicted_month_units,
              // Full KSEB bill breakdown
              ksebBill: {
                monthlyUnits:      predictedCost.monthly_units,
                energyCharge:      predictedCost.energy_charge,
                fixedCharge:       predictedCost.fixed_charge,
                electricityDuty:   predictedCost.electricity_duty,
                totalBillInr:      predictedCost.total_bill_inr,
                flatRateEstimate:  predictedCost.flat_rate_estimate
              },
              // Simple fields for frontend convenience
              expectedCost:        predictedCost.total_bill_inr,
              flatRateCost:        predictedCost.flat_rate_estimate,
              monthlyBudgetKwh:    mlRes.monthly_budget_kwh,
              budgetHeadroomKwh:   mlRes.budget_headroom_kwh,
              overBudget:          mlRes.over_budget,
              currency:            mlRes.currency,
              ratePerKwhUsed:      mlRes.rate_per_kwh_used
            },
            dailyBreakdown: mlRes.daily_breakdown || [],
            recommendation: mlRes.over_budget
              ? `You are projected to exceed your budget by ${Math.abs(mlRes.budget_headroom_kwh).toFixed(1)} kWh. Consider reducing usage.`
              : `You are on track — ${(mlRes.budget_headroom_kwh || 0).toFixed(1)} kWh headroom remaining.`
          }
        });
      } catch (mlError) {
        console.warn('⚠️  ML unavailable for monthly forecast, using fallback'.yellow);
        console.warn(`   ${mlError.message}`.gray);
      }
    }

    // ── Local fallback ────────────────────────────────────────────────────
    console.log('📐 Using local forecasting algorithm...'.gray);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const readings = await PowerReading.find({
      userId:    req.user._id,
      timestamp: { $gte: monthStart, $lte: now },
      ...(roomId && { roomId })
    }).sort({ timestamp: 1 });

    const dailyConsumption = {};
    readings.forEach(r => {
      const day = r.timestamp.getDate();
      dailyConsumption[day] = (dailyConsumption[day] || 0) + r.energy;
    });

    const dailyValues      = Object.values(dailyConsumption);
    const avgDailyKwh      = dailyValues.length ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;
    const { slope, intercept } = simpleLinearRegression(dailyValues);

    let forecastedTotal = dailyValues.reduce((a, b) => a + b, 0);
    for (let day = currentDay + 1; day <= daysInMonth; day++) {
      forecastedTotal += Math.max(0, slope * (day - 1) + intercept);
    }

    const settings        = await Settings.findOne({ userId: req.user._id });
    const monthlyBudget   = settings?.budget?.monthly    ?? 400;
    const ratePerKwh      = settings?.budget?.ratePerKwh ?? 6.5;
    const currency        = settings?.budget?.currency   ?? 'INR';
    const currentUsageKwh = dailyValues.reduce((a, b) => a + b, 0);
    const willExceedBudget = forecastedTotal > monthlyBudget;
    const exceedAmount     = willExceedBudget ? forecastedTotal - monthlyBudget : 0;

    res.status(200).json({
      success: true,
      data: {
        source: 'fallback_algorithm',
        currentMonth: {
          daysElapsed:   currentDay,
          daysRemaining: daysInMonth - currentDay,
          currentUsage:  currentUsageKwh.toFixed(2),
          avgDailyKwh:   avgDailyKwh.toFixed(2)
        },
        forecast: {
          predictedMonthUnits: forecastedTotal.toFixed(2),
          expectedCost:        (forecastedTotal * ratePerKwh).toFixed(2),
          monthlyBudgetKwh:    monthlyBudget,
          budgetHeadroomKwh:   (monthlyBudget - forecastedTotal).toFixed(2),
          overBudget:          willExceedBudget,
          currency,
          ratePerKwhUsed:      ratePerKwh
        },
        recommendation: willExceedBudget
          ? `Reduce daily consumption by ${(exceedAmount / (daysInMonth - currentDay)).toFixed(2)} kWh to stay within budget`
          : 'You are on track to stay within your monthly budget'
      }
    });
  } catch (error) {
    console.error('❌ forecastMonthly error:'.red, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Monthly cost prediction with 3-tier fallback
// @route GET /api/forecast/cost
// @access Private
//
// Tier 1: ML /predict-cost   — uses today's actual readings (most accurate)
// Tier 2: ML /predict-month-end — EWMA over last 7 days (resilient, no today required)
// Tier 3: Local DB           — last-resort calculation from stored readings
// ─────────────────────────────────────────────────────────────────────────────
exports.forecastCost = async (req, res) => {
  try {
    const { roomId } = req.query;
    const userId = req.user._id.toString();

    if (!roomId) {
      return res.status(400).json({ success: false, message: 'roomId is required for cost prediction' });
    }

    console.log('💰 Cost Forecast:'.cyan);
    console.log(`   User: ${userId}  Room: ${roomId}`.gray);

    // ── Tier 1: /predict-cost (needs today's readings) ────────────────────
    try {
      const mlRes = await mlService.predictCost({ userId, roomId });

      if (!mlRes.success) {
        throw new Error(mlRes.error || 'predict-cost returned success=false');
      }

      console.log('✅ Cost from /predict-cost (today readings)'.green);
      return res.status(200).json({
        success: true,
        data: {
          source:                'ml_predict_cost',
          todayKwh:              mlRes.today_kwh,
          todayAvgPowerW:        mlRes.today_avg_power_w,
          todayPeakPowerW:       mlRes.today_peak_power_w,
          readingCount:          mlRes.reading_count,
          estimatedMonthlyUnits: mlRes.estimated_monthly_units,
          estimatedCost:         mlRes.estimated_cost,
          currency:              mlRes.currency,
          ratePerKwhUsed:        mlRes.rate_per_kwh_used,
          monthlyBudgetKwh:      mlRes.monthly_budget_kwh,
          budgetHeadroomKwh:     mlRes.budget_headroom_kwh,
          overBudget:            mlRes.over_budget
        }
      });

    } catch (costErr) {
      // /predict-cost returns 404 when no readings exist for today yet.
      // Fall back to /predict-month-end which works with any recent data.
      console.warn(`⚠️  /predict-cost failed (${costErr.message}) — trying /predict-month-end...`.yellow);
    }

    // ── Tier 2: /predict-month-end (EWMA, works without today's data) ─────
    try {
      const monthRes = await mlService.predictMonthEnd({ userId, roomId, lookback_days: 7 });

      if (!monthRes.success) {
        throw new Error(monthRes.error || 'predict-month-end returned success=false');
      }

      console.log('✅ Cost from /predict-month-end (EWMA fallback)'.green);
      const pc = monthRes.predicted_cost || {};

      return res.status(200).json({
        success: true,
        data: {
          source:                'ml_month_end_fallback',
          note:                  'No readings for today — cost estimated from EWMA of recent days',
          todayKwh:              null,
          todayAvgPowerW:        null,
          todayPeakPowerW:       null,
          readingCount:          monthRes.data_points ?? null,
          estimatedMonthlyUnits: monthRes.predicted_month_units,
          estimatedCost:         pc.total_bill_inr,
          flatRateCost:          pc.flat_rate_estimate,
          ksebBill: {
            monthlyUnits:     pc.monthly_units,
            energyCharge:     pc.energy_charge,
            fixedCharge:      pc.fixed_charge,
            electricityDuty:  pc.electricity_duty,
            totalBillInr:     pc.total_bill_inr,
            flatRateEstimate: pc.flat_rate_estimate
          },
          currency:              monthRes.currency,
          ratePerKwhUsed:        monthRes.rate_per_kwh_used,
          monthlyBudgetKwh:      monthRes.monthly_budget_kwh,
          budgetHeadroomKwh:     monthRes.budget_headroom_kwh,
          overBudget:            monthRes.over_budget,
          trend:                 monthRes.trend,
          daysElapsed:           monthRes.days_elapsed,
          daysRemaining:         monthRes.days_remaining,
          actualKwhSoFar:        monthRes.actual_kwh_so_far,
          projectedDailyKwh:     monthRes.projected_daily_kwh
        }
      });

    } catch (monthErr) {
      console.warn(`⚠️  /predict-month-end also failed (${monthErr.message}) — using local DB`.yellow);
    }

    // ── Tier 3: Local DB (last resort) ───────────────────────────────────
    const Settings     = require('../models/Settings');
    const PowerReading = require('../models/PowerReading');

    const settings  = await Settings.findOne({ userId: req.user._id });
    const rate      = settings?.budget?.ratePerKwh ?? 6.5;
    const budget    = settings?.budget?.monthly    ?? 400;
    const currency  = settings?.budget?.currency   ?? 'INR';

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const readings = await PowerReading.find({
      userId: req.user._id, roomId,
      timestamp: { $gte: monthStart }
    });

    const currentKwh     = readings.reduce((s, r) => s + (r.energy || 0), 0);
    const daysElapsed    = new Date().getDate();
    const avgDailyKwh    = daysElapsed > 0 ? currentKwh / daysElapsed : 0;
    const projectedTotal = avgDailyKwh * 30;
    const estimatedCost  = projectedTotal * rate;

    console.log('✅ Cost from local DB fallback'.green);
    return res.status(200).json({
      success: true,
      data: {
        source:                'local_db_fallback',
        note:                  'ML backend unavailable — calculated from local DB readings',
        todayKwh:              null,
        todayAvgPowerW:        null,
        readingCount:          readings.length,
        estimatedMonthlyUnits: parseFloat(projectedTotal.toFixed(2)),
        estimatedCost:         parseFloat(estimatedCost.toFixed(2)),
        currency,
        ratePerKwhUsed:        rate,
        monthlyBudgetKwh:      budget,
        budgetHeadroomKwh:     parseFloat((budget - projectedTotal).toFixed(2)),
        overBudget:            projectedTotal > budget,
        actualKwhSoFar:        parseFloat(currentKwh.toFixed(4)),
        projectedDailyKwh:     parseFloat(avgDailyKwh.toFixed(4)),
        daysElapsed
      }
    });

  } catch (error) {
    console.error('❌ forecastCost error:'.red, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Forecast daily energy usage (local — ML has no standalone daily forecast)
// @route GET /api/forecast/daily
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.forecastDaily = async (req, res) => {
  try {
    const { roomId } = req.query;
    const userId = req.user._id.toString();

    // ── Try ML /energy/today for accurate today's reading ────────────────
    let mlTodayData = null;
    if (roomId) {
      try {
        const todayRes = await mlService.getEnergyToday({ userId, roomId });
        if (todayRes.success) {
          mlTodayData = todayRes;
        }
      } catch (e) {
        console.warn('⚠️  ML /energy/today unavailable, using DB fallback'.yellow);
      }
    }

    // ── Local fallback for 7-day trend ───────────────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const query = {
      userId:    req.user._id,
      timestamp: { $gte: sevenDaysAgo },
      ...(roomId && { roomId })
    };

    const readings     = await PowerReading.find(query).sort({ timestamp: 1 });
    const settings     = await Settings.findOne({ userId: req.user._id });
    const ratePerKwh   = settings?.budget?.ratePerKwh ?? 6.5;
    const currency     = settings?.budget?.currency   ?? 'INR';

    const dailyConsumption = {};
    readings.forEach(r => {
      const dateKey = r.timestamp.toISOString().split('T')[0];
      dailyConsumption[dateKey] = (dailyConsumption[dateKey] || 0) + r.energy;
    });

    const dailyValues = Object.values(dailyConsumption);
    const { slope, intercept } = simpleLinearRegression(dailyValues);
    const forecastedUsage = Math.max(0, slope * dailyValues.length + intercept);
    const avgUsage = dailyValues.length ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;
    const trend    = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';

    // Today's usage — prefer ML value if available
    let todayUsage, todayAvgPower, todayPeakPower;
    if (mlTodayData) {
      todayUsage    = mlTodayData.kwh;
      todayAvgPower = mlTodayData.avg_power_w;
      todayPeakPower = mlTodayData.peak_power_w;
    } else {
      const todayStart    = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayReadings = await PowerReading.find({
        userId:    req.user._id,
        timestamp: { $gte: todayStart },
        ...(roomId && { roomId })
      });
      todayUsage    = todayReadings.reduce((s, r) => s + r.energy, 0);
      todayAvgPower = todayReadings.length > 0
        ? todayReadings.reduce((s, r) => s + r.power, 0) / todayReadings.length
        : 0;
      todayPeakPower = todayReadings.length > 0
        ? Math.max(...todayReadings.map(r => r.power))
        : 0;
    }

    res.status(200).json({
      success: true,
      data: {
        today: {
          usage:       parseFloat(todayUsage.toFixed(4)),
          cost:        (todayUsage * ratePerKwh).toFixed(2),
          avgPowerW:   parseFloat((todayAvgPower || 0).toFixed(2)),
          peakPowerW:  parseFloat((todayPeakPower || 0).toFixed(2)),
          source:      mlTodayData ? 'ml_backend' : 'db_local',
          currency
        },
        tomorrow: {
          predictedUsage: forecastedUsage.toFixed(4),
          predictedCost:  (forecastedUsage * ratePerKwh).toFixed(2),
          currency,
          confidence:     dailyValues.length >= 5 ? 'high' : 'medium'
        },
        last7Days: {
          avgUsage:    avgUsage.toFixed(4),
          trend,
          dailyData: Object.keys(dailyConsumption).map(date => ({
            date,
            usage: dailyConsumption[date].toFixed(4)
          }))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Weekly usage trend
// @route GET /api/forecast/weekly
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getWeeklyTrend = async (req, res) => {
  try {
    const { weeks = 7, roomId } = req.query;
    const weeksAgo = new Date(Date.now() - parseInt(weeks) * 7 * 24 * 60 * 60 * 1000);

    const readings = await PowerReading.find({
      userId:    req.user._id,
      timestamp: { $gte: weeksAgo },
      ...(roomId && { roomId })
    }).sort({ timestamp: 1 });

    const weeklyConsumption = {};
    readings.forEach(r => {
      const ws = new Date(r.timestamp);
      ws.setDate(ws.getDate() - ws.getDay());
      const key = ws.toISOString().split('T')[0];
      weeklyConsumption[key] = (weeklyConsumption[key] || 0) + r.energy;
    });

    const weeklyData = Object.keys(weeklyConsumption).sort().map((weekStart, i) => ({
      week: `W${i + 1}`, weekStart, usage: weeklyConsumption[weekStart].toFixed(4)
    }));

    const vals = Object.values(weeklyConsumption);
    const lastWeekUsage     = vals[vals.length - 1] || 0;
    const previousWeekUsage = vals[vals.length - 2] || 0;
    const changePercent     = previousWeekUsage > 0
      ? ((lastWeekUsage - previousWeekUsage) / previousWeekUsage * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        weeklyData,
        comparison: {
          lastWeek:      lastWeekUsage.toFixed(4),
          previousWeek:  previousWeekUsage.toFixed(4),
          changePercent,
          trend: changePercent > 0 ? 'increase' : changePercent < 0 ? 'decrease' : 'stable'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
