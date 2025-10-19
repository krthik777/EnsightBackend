require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const colors = require('colors');
const connectDB = require('./config/db');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  // Color code based on method
  let methodColor;
  switch(method) {
    case 'GET': methodColor = method.cyan; break;
    case 'POST': methodColor = method.green; break;
    case 'PUT': methodColor = method.yellow; break;
    case 'DELETE': methodColor = method.red; break;
    default: methodColor = method.white;
  }
  
  console.log('\n' + '─'.repeat(70).gray);
  console.log(`📥 [${timestamp.white}] ${methodColor} ${url.brightWhite}`);
  console.log(`🌐 IP: ${ip.dim}`);
  
  if (req.headers.authorization) {
    console.log(`🔐 Auth: ${'Token provided'.green}`);
  }
  
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`.cyan, JSON.stringify(req.body, null, 2).gray);
  }
  
  if (req.query && typeof req.query === 'object' && Object.keys(req.query).length > 0) {
    console.log(`🔍 Query:`.magenta, JSON.stringify(req.query).gray);
  }
  
  // Track start time
  const startTime = Date.now();
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? 'red' : res.statusCode >= 300 ? 'yellow' : 'green';
    console.log(`📤 Response: ${res.statusCode} ${res.statusMessage || ''}`[statusColor] + ` (${duration}ms)`.dim);
    console.log('─'.repeat(70).gray);
    originalSend.call(this, data);
  };
  
  next();
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const powerRoutes = require('./routes/powerRoutes');
const consumptionRoutes = require('./routes/consumptionRoutes');
const roomRoutes = require('./routes/roomRoutes');
const alertRoutes = require('./routes/alertRoutes');
const nilmRoutes = require('./routes/nilmRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Mount routes
app.use('/api/user', authRoutes);
app.use('/api/power', powerRoutes);
app.use('/api/consumption', consumptionRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/nilm', nilmRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/settings', settingsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '⚡ Energy Dashboard API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: {
        register: 'POST /api/user/register',
        login: 'POST /api/user/login',
        profile: 'GET /api/user/profile',
        updateProfile: 'PUT /api/user/profile'
      },
      power: {
        receive: 'POST /api/power',
        latest: 'GET /api/power/latest',
        readings: 'GET /api/power/readings'
      },
      consumption: {
        room: 'GET /api/consumption/room',
        overall: 'GET /api/consumption/overall',
        stats: 'GET /api/consumption/stats'
      },
      rooms: {
        getAll: 'GET /api/room',
        getOne: 'GET /api/room/:id',
        create: 'POST /api/room',
        update: 'PUT /api/room/:id',
        delete: 'DELETE /api/room/:id'
      },
      alerts: {
        getAll: 'GET /api/alerts',
        markRead: 'PUT /api/alerts/:id/read',
        markAllRead: 'PUT /api/alerts/read-all',
        checkBudget: 'POST /api/alerts/check-budget',
        delete: 'DELETE /api/alerts/:id'
      },
      nilm: {
        predict: 'POST /api/nilm/predict',
        history: 'GET /api/nilm/history',
        breakdown: 'GET /api/nilm/breakdown'
      },
      forecast: {
        monthly: 'GET /api/forecast/monthly',
        daily: 'GET /api/forecast/daily',
        weekly: 'GET /api/forecast/weekly'
      },
      settings: {
        get: 'GET /api/settings',
        update: 'PUT /api/settings',
        budget: 'GET/PUT /api/settings/budget',
        notifications: 'GET/PUT /api/settings/notifications'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ ERROR:'.red.bold, err.stack.red);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
${'╔═══════════════════════════════════════════════════════╗'.cyan}
${'║                                                       ║'.cyan}
${'║   ⚡ Energy Dashboard Backend Server                 ║'.cyan.bold}
${'║                                                       ║'.cyan}
${'║   Server running on port'.cyan} ${PORT.toString().green.bold}                        ${'║'.cyan}
${'║   Environment:'.cyan} ${(process.env.NODE_ENV || 'development').yellow}                        ${'║'.cyan}
${'║   Request Logging:'.cyan} ${'ENABLED'.green.bold}                           ${'║'.cyan}
${'║                                                       ║'.cyan}
${'║   API Documentation:'.cyan} ${'http://localhost:'.white}${PORT.toString().white}${'/ '.white}         ${'║'.cyan}
${'║   Health Check:'.cyan} ${'http://localhost:'.white}${PORT.toString().white}${'/health'.white}        ${'║'.cyan}
${'║                                                       ║'.cyan}
${'╚═══════════════════════════════════════════════════════╝'.cyan}
  `);
  console.log(`${'🚀 Server is ready to receive requests!'.green.bold}\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ Unhandled Rejection:'.red.bold, err.message.red);
  process.exit(1);
});

module.exports = app;
