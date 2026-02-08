/**
 * ML Backend Integration - Quick Reference
 * 
 * This file provides a quick reference for using the ML backend integration
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Environment Variables Required:
 * 
 * ML_BACKEND_URL=http://localhost:5000  (Flask ML Backend URL)
 * PORT=3000                              (Node.js Backend Port)
 */

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: NILM Prediction with ML Backend
 * 
 * Endpoint: POST /api/nilm/predict
 * Auth: Required (JWT Bearer token)
 * 
 * Request:
 * {
 *   "roomId": "507f1f77bcf86cd799439011",
 *   "mainsSequence": [1200, 1205, 1198, ...] // Optional: 50 readings
 * }
 * 
 * If mainsSequence not provided, automatically fetches from MongoDB
 * 
 * Response (ML Backend active):
 * {
 *   "success": true,
 *   "data": {
 *     "prediction": {
 *       "appliances": {
 *         "air_conditioner": { "power": 1250.0, "state": "ON" },
 *         "fridge": { "power": 120.0, "state": "ON" }
 *       },
 *       "totalPower": 1370.0,
 *       "confidence": 0.85,
 *       "activeAppliances": ["air_conditioner", "fridge"]
 *     },
 *     "source": "ml_backend"
 *   }
 * }
 * 
 * Response (Fallback):
 * {
 *   "success": true,
 *   "data": { ... },
 *   "warning": "Using fallback algorithm. ML backend unavailable.",
 *   "source": "fallback"
 * }
 */

/**
 * Example 2: Monthly Consumption Forecast
 * 
 * Endpoint: GET /api/forecast/monthly?roomId=507f1f77bcf86cd799439011
 * Auth: Required (JWT Bearer token)
 * 
 * Query Parameters:
 * - roomId (recommended): Room identifier
 * - mainsSequence (optional): Array of power readings
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "source": "ml_backend",
 *     "currentMonth": {
 *       "daysElapsed": 15,
 *       "daysRemaining": 15,
 *       "currentUsage": 450.0
 *     },
 *     "forecast": {
 *       "predictedTotal": 245.5,
 *       "predictedCost": 1540.25,
 *       "confidence": 0.65,
 *       "applianceBreakdown": {
 *         "fridge": {
 *           "estimatedMonthlyConsumption": 120.0,
 *           "estimatedMonthlyCost": 600.0,
 *           "contributionPercentage": 48.9
 *         }
 *       }
 *     }
 *   }
 * }
 */

// ============================================================================
// SERVICE USAGE IN CODE
// ============================================================================

/**
 * Using the ML Backend Service in your controllers:
 */

// Import the service
const mlService = require('../services/mlBackendService');

// Example: Get mains sequence from database
async function getSequenceExample(userId, roomId) {
  const sequence = await mlService.getMainsSequence(userId, roomId, 50);
  console.log(`Fetched ${sequence.length} readings`);
  return sequence;
}

// Example: Predict appliances
async function predictExample(userId, roomId) {
  try {
    // Option 1: Let service fetch sequence
    const sequence = await mlService.getMainsSequence(userId, roomId, 50);
    
    // Option 2: Call ML backend
    const prediction = await mlService.predictAppliances({
      mainsSequence: sequence,
      roomId: roomId,
      userId: userId
    });
    
    console.log('Prediction:', prediction);
    return prediction;
  } catch (error) {
    console.error('ML Backend Error:', error.message);
    // Handle fallback
  }
}

// Example: Monthly consumption prediction
async function forecastExample(userId, roomId) {
  try {
    const sequence = await mlService.getMainsSequence(userId, roomId, 50);
    const now = new Date();
    const daysElapsed = now.getDate();
    
    const forecast = await mlService.predictMonthlyConsumption({
      mainsSequence: sequence,
      daysElapsed: daysElapsed,
      roomId: roomId,
      userId: userId
    });
    
    console.log('Forecast:', forecast);
    return forecast;
  } catch (error) {
    console.error('ML Backend Error:', error.message);
    // Handle fallback
  }
}

// ============================================================================
// TESTING
// ============================================================================

/**
 * Test Script:
 * Run: .\test-ml-integration.ps1
 * 
 * Manual Testing with cURL:
 * 
 * 1. Login:
 * curl -X POST http://localhost:3000/api/user/login \
 *   -H "Content-Type: application/json" \
 *   -d '{"email":"john.doe@example.com","password":"password123"}'
 * 
 * 2. Test NILM:
 * curl -X POST http://localhost:3000/api/nilm/predict \
 *   -H "Authorization: Bearer YOUR_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"roomId":"YOUR_ROOM_ID"}'
 * 
 * 3. Test Forecast:
 * curl -X GET "http://localhost:3000/api/forecast/monthly?roomId=YOUR_ROOM_ID" \
 *   -H "Authorization: Bearer YOUR_TOKEN"
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * Common Issues:
 * 
 * 1. "ML Backend is not reachable"
 *    - Ensure Flask server running: python app.py
 *    - Check ML_BACKEND_URL in .env
 *    - Verify firewall not blocking port 5000
 * 
 * 2. Always getting "source": "fallback"
 *    - Flask endpoints not matching expected URLs
 *    - Flask not handling POST requests properly
 *    - Check Flask logs for errors
 * 
 * 3. Port already in use
 *    - Node.js on 3000, Flask on 5000
 *    - Kill processes: taskkill /F /IM node.exe
 * 
 * 4. Invalid response format
 *    - Flask must return exact format from documentation
 *    - Check transformMLPrediction function
 */

// ============================================================================
// ARCHITECTURE OVERVIEW
// ============================================================================

/**
 * Component Flow:
 * 
 * Client Request
 *     ↓
 * Node.js Express Route
 *     ↓
 * Controller (nilmController/forecastController)
 *     ↓
 * ML Backend Service (mlBackendService.js)
 *     ↓
 * HTTP Request → Flask ML Backend (port 5000)
 *     ↓
 * ML Model Processing
 *     ↓
 * Response → Node.js
 *     ↓
 * Save to MongoDB
 *     ↓
 * Format & Return to Client
 * 
 * If Flask fails at any point:
 *     ↓
 * Fallback to Local Algorithm
 *     ↓
 * Continue normal flow
 */

// ============================================================================
// PORT CONFIGURATION
// ============================================================================

/**
 * IMPORTANT: Port Assignment
 * 
 * Node.js Backend:  PORT 3000
 * Flask ML Backend: PORT 5000
 * MongoDB:          PORT 27017 (default)
 * 
 * Changed Node.js from 5000 → 3000 to avoid conflict with Flask
 */

module.exports = {
  // This file is for documentation only
  // See /services/mlBackendService.js for actual implementation
};
