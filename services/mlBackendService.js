const axios = require('axios');

// ML Backend Base URL — new port is 5050
const ML_BACKEND_URL = process.env.ML_BACKEND_URL || 'http://localhost:5050';

const mlClient = axios.create({
  baseURL: ML_BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
const checkHealth = async () => {
  const response = await mlClient.get('/health');
  return response.data;
};

// ─────────────────────────────────────────────
// POST /detect-appliances
// Detects which appliances are ON. ML fetches power readings itself.
// ─────────────────────────────────────────────
const detectAppliances = async ({ userId, roomId }) => {
  console.log('🤖 ML: calling /detect-appliances'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}`.gray);

  const response = await mlClient.post('/detect-appliances', { userId, roomId });
  return response.data; // { success, active_appliances, confidence }
};

// ─────────────────────────────────────────────
// POST /predict-appliance-power
// Returns per-appliance power in Watts. ML fetches readings itself.
// ─────────────────────────────────────────────
const predictAppliancePower = async ({ userId, roomId }) => {
  console.log('🤖 ML: calling /predict-appliance-power'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}`.gray);

  const response = await mlClient.post('/predict-appliance-power', { userId, roomId });
  return response.data; // { success, appliances: { name: watts, ... } }
};

// ─────────────────────────────────────────────
// POST /predict-cost
// Estimates monthly bill using KSEB slabs. Reads energy & settings from DB.
// ─────────────────────────────────────────────
const predictCost = async ({ userId, roomId }) => {
  console.log('🤖 ML: calling /predict-cost'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}`.gray);

  const response = await mlClient.post('/predict-cost', { userId, roomId });
  return response.data;
  /*
    {
      success, estimated_monthly_units, estimated_cost,
      flat_rate_cost, currency, rate_per_kwh_used,
      monthly_budget_kwh, budget_headroom_kwh, over_budget
    }
  */
};

// ─────────────────────────────────────────────
// POST /predict-month-end
// Linear extrapolation of end-of-month usage. Reads DB automatically.
// ─────────────────────────────────────────────
const predictMonthEnd = async ({ userId, roomId }) => {
  console.log('🤖 ML: calling /predict-month-end'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}`.gray);

  const response = await mlClient.post('/predict-month-end', { userId, roomId });
  return response.data;
  /*
    {
      success, predicted_month_units, avg_daily_kwh,
      expected_cost, flat_rate_cost, currency, rate_per_kwh_used,
      monthly_budget_kwh, budget_headroom_kwh, over_budget,
      days_elapsed, days_remaining
    }
  */
};

// ─────────────────────────────────────────────
// POST /detect-anomaly
// Detects power spikes via 3-sigma + room threshold. Reads DB automatically.
// ─────────────────────────────────────────────
const detectAnomaly = async ({ userId, roomId }) => {
  console.log('🤖 ML: calling /detect-anomaly'.cyan);
  console.log(`   userId=${userId}  roomId=${roomId}`.gray);

  const response = await mlClient.post('/detect-anomaly', { userId, roomId });
  return response.data;
  /*
    {
      success, possible_faulty_appliance, room_threshold_used,
      details?: { max_power, mean_power, statistical_threshold, room_power_threshold, triggered_by }
    }
  */
};

// ─────────────────────────────────────────────
// Generic error formatter
// ─────────────────────────────────────────────
const formatMlError = (error, endpoint) => {
  if (error.response) {
    const msg = error.response.data?.error || error.response.statusText || 'Unknown ML error';
    throw new Error(`ML Backend /${endpoint} → ${error.response.status}: ${msg}`);
  } else if (error.request) {
    throw new Error(`ML Backend unreachable at ${ML_BACKEND_URL}. Is the Flask server running?`);
  }
  throw error;
};

module.exports = {
  ML_BACKEND_URL,
  checkHealth,
  detectAppliances,
  predictAppliancePower,
  predictCost,
  predictMonthEnd,
  detectAnomaly,
  formatMlError
};
