# Energy Dashboard Backend API

A comprehensive Node.js backend for an IoT-based energy monitoring system with MongoDB database and ML-powered predictions.

## Features

- ⚡ **Real-time Power Monitoring** - Receive and store data from ESP32 IoT devices
- 📊 **Consumption Analytics** - Room-level and overall household energy tracking
- 🔮 **Predictive Forecasting** - Daily and monthly energy usage predictions
- 🤖 **NILM (Appliance Detection)** - ML-powered appliance identification from power signatures
- 🧠 **ML Integration** - Integration with Flask-based ML backend for advanced predictions
- 🚨 **Smart Alerts** - Budget warnings, high usage detection, and anomalies
- 👤 **User Management** - JWT-based authentication and authorization
- ⚙️ **Settings Management** - Customizable budgets, notifications, and preferences

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** bcryptjs for password hashing
- **ML Integration:** Axios for HTTP communication with Flask ML backend

## Installation

1. **Clone the repository** (if applicable)
   ```bash
   cd e:\mainProject\projectBackend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `.env` file with your MongoDB connection string

4. **Configure environment variables**
   - Edit `.env` file:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/energy_dashboard
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   ML_BACKEND_URL=http://localhost:5000
   ```
   
   **Important:** Node.js backend runs on port **3000**, Flask ML backend on port **5000**.
   
   See [ML_BACKEND_INTEGRATION.md](./ML_BACKEND_INTEGRATION.md) for ML backend setup.

5. **Start the server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication & User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/user/register` | Register new user | No |
| POST | `/api/user/login` | User login | No |
| GET | `/api/user/profile` | Get user profile | Yes |
| PUT | `/api/user/profile` | Update user profile | Yes |

### Power Data (IoT Integration)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/power` | Receive sensor data from ESP32 | No* |
| GET | `/api/power/latest` | Get latest power reading | Yes |
| GET | `/api/power/readings` | Get power readings with filters | Yes |

*In production, implement device authentication

### Consumption & Analytics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/consumption/room` | Get room-level consumption | Yes |
| GET | `/api/consumption/overall` | Get total household consumption | Yes |
| GET | `/api/consumption/stats` | Get detailed statistics | Yes |
| GET | `/api/consumption/monthly` | Get specific calendar month consumption | Yes |
| GET | `/api/consumption/trends` | Get daily/weekly/monthly trends | Yes |

### Room Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/room` | Get all rooms | Yes |
| POST | `/api/room` | Create new room | Yes |
| GET | `/api/room/:id` | Get specific room | Yes |
| PUT | `/api/room/:id` | Update room | Yes |
| DELETE | `/api/room/:id` | Delete room | Yes |

### Alerts & Notifications

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/alerts` | Get all alerts | Yes |
| PUT | `/api/alerts/:id/read` | Mark alert as read | Yes |
| PUT | `/api/alerts/read-all` | Mark all alerts as read | Yes |
| POST | `/api/alerts/check-budget` | Check budget alerts | Yes |
| DELETE | `/api/alerts/:id` | Delete alert | Yes |

### NILM (Appliance Detection)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/nilm/predict` | Predict running appliances | Yes |
| GET | `/api/nilm/history` | Get appliance history | Yes |
| GET | `/api/nilm/breakdown` | Get current appliance breakdown | Yes |

### Forecasting & Predictions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/forecast/monthly` | Monthly usage forecast | Yes |
| GET | `/api/forecast/daily` | Daily usage forecast | Yes |
| GET | `/api/forecast/weekly` | Weekly usage trends | Yes |

### Settings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/settings` | Get all settings | Yes |
| PUT | `/api/settings` | Update settings | Yes |
| GET | `/api/settings/budget` | Get budget settings | Yes |
| PUT | `/api/settings/budget` | Update budget settings | Yes |
| GET | `/api/settings/notifications` | Get notification settings | Yes |
| PUT | `/api/settings/notifications` | Update notification settings | Yes |

## Request/Response Examples

### Register User
```bash
POST /api/user/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

### Login
```bash
POST /api/user/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

### Send Power Data (ESP32)
```bash
POST /api/power
Content-Type: application/json

{
  "userId": "671234567890abcdef123456",
  "roomId": "671234567890abcdef123457",
  "voltage": 239,
  "current": 8.8,
  "power": 483,
  "energy": 0.12
}
```

### Create Room
```bash
POST /api/room
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "name": "Living Room",
  "icon": "sofa",
  "threshold": 2000
}
```

### Get Overall Consumption
```bash
GET /api/consumption/overall?period=today
Authorization: Bearer <your_jwt_token>
```

### Get Monthly Consumption (Specific Month)
```bash
GET /api/consumption/monthly?year=2025&month=10
Authorization: Bearer <your_jwt_token>
```

### Get Consumption Trends
```bash
# Daily trends (last 7 days + hourly breakdown)
GET /api/consumption/trends?type=daily
Authorization: Bearer <your_jwt_token>

# Weekly trends (last 8 weeks)
GET /api/consumption/trends?type=weekly
Authorization: Bearer <your_jwt_token>

# Monthly trends (last 12 months)
GET /api/consumption/trends?type=monthly
Authorization: Bearer <your_jwt_token>

# Room-specific trends
GET /api/consumption/trends?type=weekly&roomId=671234567890abcdef123457
Authorization: Bearer <your_jwt_token>
```

### Update Budget Settings
```bash
PUT /api/settings/budget
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "monthly": 400,
  "currency": "INR",
  "ratePerKwh": 6.5
}
```

## Database Models

### User
- name, email, password (hashed)
- Authentication & profile management

### Room
- name, icon, threshold, isActive
- Linked to user

### PowerReading
- userId, roomId, voltage, current, power, energy, timestamp
- Stores all sensor readings

### ApplianceDetection
- userId, roomId, appliances[], totalPower, timestamp
- NILM predictions

### Alert
- userId, roomId, type, severity, message, isRead, timestamp
- Notifications and warnings

### Settings
- userId, budget, notifications, autoOptimization
- User preferences

## Development

### Project Structure
```
projectBackend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── powerController.js    # Power data handling
│   ├── consumptionController.js
│   ├── roomController.js
│   ├── alertController.js
│   ├── nilmController.js
│   ├── forecastController.js
│   └── settingsController.js
├── middleware/
│   └── auth.js               # JWT authentication
├── models/
│   ├── User.js
│   ├── Room.js
│   ├── PowerReading.js
│   ├── ApplianceDetection.js
│   ├── Alert.js
│   └── Settings.js
├── routes/
│   ├── authRoutes.js
│   ├── powerRoutes.js
│   ├── consumptionRoutes.js
│   ├── roomRoutes.js
│   ├── alertRoutes.js
│   ├── nilmRoutes.js
│   ├── forecastRoutes.js
│   └── settingsRoutes.js
├── utils/
│   └── generateToken.js      # JWT token generation
├── .env                      # Environment variables
├── server.js                 # Main server file
└── package.json
```

## Security Considerations

1. **Change JWT Secret:** Update `JWT_SECRET` in `.env` before production
2. **HTTPS:** Use HTTPS in production
3. **Rate Limiting:** Consider adding rate limiting middleware
4. **Input Validation:** Add validation middleware for requests
5. **Device Authentication:** Implement authentication for ESP32 devices
6. **Environment Variables:** Never commit `.env` to version control

## Future Enhancements

- [ ] Machine Learning models for better NILM accuracy
- [ ] Real-time WebSocket connections for live updates
- [ ] Advanced analytics and reporting
- [ ] Email notifications
- [ ] Data export functionality
- [ ] Multi-tenancy support
- [ ] Rate limiting and API throttling
- [ ] Caching layer (Redis)

## API Testing

Use tools like:
- **Postman** - Import endpoints and test
- **Thunder Client** (VS Code extension)
- **cURL** - Command line testing

## Support

For issues or questions, please refer to the API documentation at `http://localhost:5000/` when the server is running.

## License

ISC

---

Built with ⚡ for Energy Monitoring & Management
