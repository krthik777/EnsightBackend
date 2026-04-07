const axios = require('axios');

// ML Backend Base URL — Flask server on port 5050
const ML_BACKEND_URL = process.env.ML_BACKEND_URL || 'http://localhost:5050';

const mlClient = axios.create({
  baseURL: ML_BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000   // 20s — LSTM inference can be slow on first call
});

// ─────────────────────────────────────────────────────────────────────────────
// Diagnostics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /health
 * Returns: { status, service, mongodb_connected }
 */
const checkHealth = async () => {
  const response = await mlClient.get('/health');
  return response.data;
};

/**
 * GET /db-status
 * Returns: { mongodb_connected, status }
 */
const checkDbStatus = async () => {
  const response = await mlClient.get('/db-status');
  return response.data;
};

/**
 * GET /debug-room?userId=<id>&roomId=<id>
 * Diagnostic: counts readings, verifies IDs, shows latest timestamps.
 * Returns: { userId, roomId, total_readings, room_only_count, latest_reading, oldest_reading }
 */
const debugRoom = async ({ userId, roomId }) => {
  console.log('🔍 ML: calling /debug-room'.cyan);
  const response = await mlClient.get('/debug-room', { params: { userId, roomId } });
  return response.data;
};


// ─────────────────────────────────────────────────────────────────────────────
// NILM — Appliance Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /detect-appliances
 * Smart 3-tier NILM (DB matching → LSTM → heuristic).
 * ML fetches last 50 power readings from MongoDB itself.
 *
 * Body: { userId, roomId }
 *
 * Returns:
 *   {
 *     success, active_appliances, confidence,
 *     power_breakdown_w,          // per-appliance watts  ← key field
 *     total_power_w, mean_power_w, unmatched_w,
 *     detection_tier,             // "db_matching" | "lstm_model" | "heuristic"
 *     db_appliances_count, readings_used
 *   }
 */
const detectAppliances = async ({ userId, roomId }) => {
  console.log('🤖 ML: calling /detect-appliances'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}`.gray);
  const response = await mlClient.post('/detect-appliances', { userId, roomId });
  return response.data;
};

/**
 * POST /predict-appliance-power
 * Same NILM inference, but returns power_breakdown as the primary field.
 *
 * Body: { userId, roomId }
 *
 * Returns:
 *   { success, appliances: { <name>: <watts>, ... }, total_power_w, tier }
 */
const predictAppliancePower = async ({ userId, roomId }) => {
  console.log('🤖 ML: calling /predict-appliance-power'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}`.gray);
  const response = await mlClient.post('/predict-appliance-power', { userId, roomId });
  return response.data;
};

/**
 * POST /detect-anomaly
 * 3-sigma statistical test + room threshold check.
 * ML reads the room's threshold from the rooms collection automatically.
 *
 * Body: { userId, roomId }
 *
 * Returns:
 *   {
 *     success, possible_faulty_appliance, room_threshold_used, readings_used,
 *     details?: { max_power, mean_power, statistical_threshold,
 *                 room_power_threshold, triggered_by }
 *   }
 */
const detectAnomaly = async ({ userId, roomId }) => {
  console.log('🤖 ML: calling /detect-anomaly'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}`.gray);
  const response = await mlClient.post('/detect-anomaly', { userId, roomId });
  return response.data;
};


// ─────────────────────────────────────────────────────────────────────────────
// Energy — Daily Analytics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /energy/today
 * Today's kWh from midnight (00:00 UTC) to now via trapezoidal integration.
 *
 * Body: { userId, roomId }
 *
 * Returns:
 *   {
 *     success, date, kwh, avg_power_w, peak_power_w,
 *     duration_hours, reading_count, method,
 *     projected_monthly_units, projected_monthly_cost (KSEB breakdown)
 *   }
 */
const getEnergyToday = async ({ userId, roomId }) => {
  console.log('🤖 ML: calling /energy/today'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}`.gray);
  const response = await mlClient.post('/energy/today', { userId, roomId });
  return response.data;
};

/**
 * POST /energy/daily
 * Energy for any specific calendar day (defaults to today).
 *
 * Body: { userId, roomId, date?: "YYYY-MM-DD" }
 *
 * Returns:
 *   { success, date, kwh, avg_power_w, peak_power_w, duration_hours, reading_count, method }
 */
const getEnergyDaily = async ({ userId, roomId, date }) => {
  console.log('🤖 ML: calling /energy/daily'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}  date=${date || 'today'}`.gray);
  const response = await mlClient.post('/energy/daily', { userId, roomId, date });
  return response.data;
};


// ─────────────────────────────────────────────────────────────────────────────
// Forecast & Cost
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /predict-cost
 * Monthly electricity cost from today's actual readings (KSEB slab + flat rate).
 * ML reads today's powerreadings and user settings from MongoDB.
 *
 * Body: { userId, roomId }
 *
 * Returns:
 *   {
 *     success,
 *     today_kwh, today_avg_power_w, today_peak_power_w, reading_count,
 *     estimated_monthly_units, estimated_cost (KSEB slab INR),
 *     currency, rate_per_kwh_used,
 *     monthly_budget_kwh, budget_headroom_kwh, over_budget
 *   }
 *
 * NOTE: "estimated_cost" is the KSEB slab-calculated bill (primary).
 *       There is no "flat_rate_cost" field in this endpoint — use
 *       estimated_monthly_units × ratePerKwh if a flat estimate is needed.
 */
const predictCost = async ({ userId, roomId }) => {
  console.log('🤖 ML: calling /predict-cost'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}`.gray);
  const response = await mlClient.post('/predict-cost', { userId, roomId });
  return response.data;
};

/**
 * POST /predict-month-end
 * EWMA-based month-end forecast from last 2–7 days of actual data.
 * More accurate than simple linear extrapolation.
 *
 * Body: { userId, roomId, lookback_days?: 7 }
 *
 * Returns:
 *   {
 *     success, currency,
 *     daily_breakdown: [{ date, kwh }],
 *     days_elapsed, days_remaining,
 *     actual_kwh_so_far, projected_daily_kwh, projected_remaining_kwh,
 *     predicted_month_units,
 *     predicted_cost: {           // Full KSEB bill breakdown
 *       monthly_units, energy_charge, fixed_charge,
 *       electricity_duty, total_bill_inr, flat_rate_estimate, currency
 *     },
 *     budget_status: { monthly_budget_kwh, headroom_kwh, over_budget },
 *     trend,        // "increasing" | "stable" | "decreasing"
 *     data_points,
 *     monthly_budget_kwh, budget_headroom_kwh, over_budget,
 *     rate_per_kwh_used
 *   }
 */
const predictMonthEnd = async ({ userId, roomId, lookback_days }) => {
  console.log('🤖 ML: calling /predict-month-end'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}`.gray);
  const body = { userId, roomId };
  if (lookback_days !== undefined) body.lookback_days = lookback_days;
  const response = await mlClient.post('/predict-month-end', body);
  return response.data;
};


// ─────────────────────────────────────────────────────────────────────────────
// Error formatter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise axios errors into a clear Error with endpoint context.
 */
const formatMlError = (error, endpoint) => {
  if (error.response) {
    const msg =
      error.response.data?.error ||
      error.response.data?.message ||
      error.response.statusText ||
      'Unknown ML error';
    throw new Error(`ML Backend /${endpoint} → HTTP ${error.response.status}: ${msg}`);
  }
  if (error.request) {
    throw new Error(
      `ML Backend unreachable at ${ML_BACKEND_URL}. Is the Flask server running? (GET ${ML_BACKEND_URL}/health)`
    );
  }
  throw error;
};


module.exports = {
  ML_BACKEND_URL,
  // Diagnostics
  checkHealth,
  checkDbStatus,
  debugRoom,
  // NILM
  detectAppliances,
  predictAppliancePower,
  detectAnomaly,
  // Energy daily
  getEnergyToday,
  getEnergyDaily,
  // Forecast & cost
  predictCost,
  predictMonthEnd,
  // Utils
  formatMlError,
};
