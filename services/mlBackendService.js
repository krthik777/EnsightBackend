const axios = require('axios');
const PowerReading = require('../models/PowerReading');

// Flask ML Backend Base URL - can be configured via environment variable
const ML_BACKEND_URL = process.env.ML_BACKEND_URL || 'http://localhost:5000';

/**
 * Fetch recent power readings and format them as a mains sequence
 * @param {String} userId - User ID
 * @param {String} roomId - Room ID
 * @param {Number} sequenceLength - Number of readings to fetch (default 50)
 * @returns {Array} Array of power readings
 */
const getMainsSequence = async (userId, roomId, sequenceLength = 50) => {
  try {
    const readings = await PowerReading.find({
      userId,
      roomId
    })
      .sort({ timestamp: -1 })
      .limit(sequenceLength)
      .lean();

    // Extract power values and reverse to chronological order
    const mainsSequence = readings.reverse().map(r => r.power);

    // Pad or truncate to exactly sequenceLength
    if (mainsSequence.length < sequenceLength) {
      const padding = new Array(sequenceLength - mainsSequence.length).fill(0);
      return [...padding, ...mainsSequence];
    }
    
    return mainsSequence.slice(-sequenceLength);
  } catch (error) {
    console.error('❌ Error fetching mains sequence:', error.message);
    throw error;
  }
};

/**
 * Call Flask ML Backend - Real-time Appliance Prediction
 * @param {Object} options - Prediction options
 * @param {Array} options.mainsSequence - Power readings array (optional)
 * @param {String} options.roomId - Room identifier (required if mainsSequence not provided)
 * @param {String} options.userId - User identifier (optional)
 * @returns {Object} Prediction result from ML model
 */
const predictAppliances = async ({ mainsSequence, roomId, userId }) => {
  try {
    console.log('🤖 Calling ML Backend - Appliance Prediction'.cyan);
    console.log(`   Endpoint: ${ML_BACKEND_URL}/nilm/predict`.gray);
    console.log(`   Room ID: ${roomId}`.gray);
    console.log(`   User ID: ${userId || 'N/A'}`.gray);
    console.log(`   Mains Sequence Length: ${mainsSequence ? mainsSequence.length : 'Not provided'}`.gray);

    const requestBody = {
      roomId,
      ...(userId && { userId }),
      ...(mainsSequence && { mainsSequence })
    };

    const response = await axios.post(
      `${ML_BACKEND_URL}/nilm/predict`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('✅ ML Prediction successful'.green);
    return response.data;
  } catch (error) {
    console.error('❌ ML Backend Error (Predict):'.red, error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`.red);
      console.error(`   Data:`.red, error.response.data);
      throw new Error(`ML Backend returned error: ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('ML Backend is not reachable. Please ensure Flask server is running on ' + ML_BACKEND_URL);
    } else {
      throw error;
    }
  }
};

/**
 * Call Flask ML Backend - Monthly Consumption & Billing Prediction
 * @param {Object} options - Prediction options
 * @param {Array} options.mainsSequence - Current power readings (optional)
 * @param {Number} options.daysElapsed - Days elapsed in billing cycle (optional)
 * @param {String} options.roomId - Room identifier (required)
 * @param {String} options.userId - User identifier (optional)
 * @returns {Object} Monthly consumption prediction from ML model
 */
const predictMonthlyConsumption = async ({ mainsSequence, daysElapsed, roomId, userId }) => {
  try {
    console.log('🤖 Calling ML Backend - Monthly Consumption Prediction'.cyan);
    console.log(`   Endpoint: ${ML_BACKEND_URL}/nilm/consumption-prediction`.gray);
    console.log(`   Room ID: ${roomId}`.gray);
    console.log(`   User ID: ${userId || 'N/A'}`.gray);
    console.log(`   Days Elapsed: ${daysElapsed || 0}`.gray);
    console.log(`   Mains Sequence Length: ${mainsSequence ? mainsSequence.length : 'Not provided'}`.gray);

    const requestBody = {
      roomId,
      ...(userId && { userId }),
      ...(mainsSequence && { mainsSequence }),
      ...(daysElapsed !== undefined && { daysElapsed })
    };

    const response = await axios.post(
      `${ML_BACKEND_URL}/nilm/consumption-prediction`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('✅ ML Monthly Prediction successful'.green);
    return response.data;
  } catch (error) {
    console.error('❌ ML Backend Error (Monthly Prediction):'.red, error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`.red);
      console.error(`   Data:`.red, error.response.data);
      throw new Error(`ML Backend returned error: ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('ML Backend is not reachable. Please ensure Flask server is running on ' + ML_BACKEND_URL);
    } else {
      throw error;
    }
  }
};

/**
 * Helper function to transform ML prediction to ApplianceDetection format
 * @param {Object} mlResponse - Response from ML backend
 * @param {String} userId - User ID
 * @param {String} roomId - Room ID
 * @returns {Object} Formatted appliance detection data
 */
const transformMLPrediction = (mlResponse, userId, roomId) => {
  if (!mlResponse.success || !mlResponse.data) {
    throw new Error('Invalid ML response format');
  }

  const { prediction, summary } = mlResponse.data;

  // Transform appliances object to array format expected by ApplianceDetection model
  const appliances = Object.entries(prediction.appliances || {}).map(([name, details]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format name
    powerConsumption: details.power || 0,
    confidence: prediction.confidence ? prediction.confidence * 100 : 75, // Convert 0-1 to 0-100
    state: details.state
  })).filter(app => app.state === 'ON'); // Only include active appliances

  return {
    userId,
    roomId,
    appliances,
    totalPower: prediction.totalPower || 0,
    confidence: prediction.confidence || 0,
    activeAppliances: prediction.activeAppliances || [],
    timestamp: prediction.timestamp ? new Date(prediction.timestamp) : new Date(),
    metadata: {
      backendStatus: mlResponse.data.backendStatus,
      summary: summary || {}
    }
  };
};

module.exports = {
  getMainsSequence,
  predictAppliances,
  predictMonthlyConsumption,
  transformMLPrediction,
  ML_BACKEND_URL
};
