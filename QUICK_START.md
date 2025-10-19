# Quick Start Guide - Energy Dashboard Backend

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)
- Postman (optional, for API testing)

## Setup Steps

### 1. Install MongoDB
**Option A: Local MongoDB**
- Download and install MongoDB from https://www.mongodb.com/try/download/community
- Start MongoDB service

**Option B: MongoDB Atlas (Cloud)**
- Create free account at https://www.mongodb.com/cloud/atlas
- Create a cluster and get connection string
- Update `.env` file with your Atlas connection string

### 2. Configure Environment Variables
Edit the `.env` file in the project root:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/energy_dashboard
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

**Important:** Change `JWT_SECRET` to a secure random string in production!

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed the Database (Optional but Recommended)
This creates a demo user and sample data:
```bash
npm run seed
```

Demo credentials:
- Email: `john.doe@example.com`
- Password: `password123`

### 5. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ⚡ Energy Dashboard Backend Server                 ║
║                                                       ║
║   Server running on port 5000                        ║
║   Environment: development                           ║
║                                                       ║
║   API Documentation: http://localhost:5000/          ║
║   Health Check: http://localhost:5000/health        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

## Testing the API

### Method 1: Using Postman
1. Import `Energy_Dashboard_API.postman_collection.json` into Postman
2. Update environment variables (base_url, token, etc.)
3. Start with "Login User" to get JWT token
4. Use the token for authenticated endpoints

### Method 2: Using PowerShell/cURL

**Register a new user:**
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/user/register" -Method POST -Headers $headers -Body $body
```

**Login:**
```powershell
$body = @{
    email = "john.doe@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/user/login" -Method POST -Headers $headers -Body $body
$token = $response.data.token
Write-Host "Token: $token"
```

**Get all rooms:**
```powershell
$authHeaders = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/room" -Method GET -Headers $authHeaders
```

### Method 3: Using Browser
1. Visit http://localhost:5000/ for API documentation
2. Visit http://localhost:5000/health for health check

## ESP32 Integration

To send data from ESP32 to the backend:

### Arduino Code Example:
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:5000/api/power";

void sendPowerData(float voltage, float current, float power) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    String jsonData = "{";
    jsonData += "\"userId\":\"YOUR_USER_ID\",";
    jsonData += "\"roomId\":\"YOUR_ROOM_ID\",";
    jsonData += "\"voltage\":" + String(voltage) + ",";
    jsonData += "\"current\":" + String(current) + ",";
    jsonData += "\"power\":" + String(power) + ",";
    jsonData += "\"energy\":" + String(power/1000.0) + "";
    jsonData += "}";
    
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode > 0) {
      Serial.println("Data sent successfully");
    } else {
      Serial.println("Error sending data");
    }
    
    http.end();
  }
}
```

## Common Issues & Solutions

### Issue: MongoDB Connection Failed
**Solution:**
- Check if MongoDB is running: `mongod --version`
- Verify connection string in `.env`
- If using Atlas, check IP whitelist and credentials

### Issue: Port 5000 already in use
**Solution:**
- Change PORT in `.env` file
- Or kill the process using port 5000:
```powershell
# Find process
netstat -ano | findstr :5000
# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Issue: JWT Token Expired
**Solution:**
- Login again to get a new token
- Tokens expire after 7 days (configurable in `.env`)

### Issue: Cannot find module errors
**Solution:**
```bash
npm install
```

## Project Structure Quick Reference

```
projectBackend/
├── config/          # Database configuration
├── controllers/     # Business logic
├── middleware/      # Authentication, etc.
├── models/          # MongoDB schemas
├── routes/          # API routes
├── utils/           # Helper functions
├── .env            # Environment variables
├── server.js       # Main entry point
├── seed.js         # Database seeder
└── package.json    # Dependencies
```

## Next Steps

1. **Customize Settings:** Update budget, currency, and rates in Settings model
2. **Add More Rooms:** Use POST /api/room endpoint
3. **Connect ESP32:** Update ESP32 code with your server IP and IDs
4. **Monitor Data:** Use GET endpoints to view consumption
5. **Set Up Alerts:** Configure thresholds for automatic alerts

## API Endpoints Quick Reference

| Category | Endpoint | Method |
|----------|----------|--------|
| Auth | `/api/user/register` | POST |
| Auth | `/api/user/login` | POST |
| Power | `/api/power` | POST |
| Consumption | `/api/consumption/overall` | GET |
| Rooms | `/api/room` | GET/POST |
| Alerts | `/api/alerts` | GET |
| Forecast | `/api/forecast/monthly` | GET |
| Settings | `/api/settings/budget` | GET/PUT |

## Support & Resources

- Full API Documentation: http://localhost:5000/
- MongoDB Docs: https://docs.mongodb.com/
- Express.js Guide: https://expressjs.com/
- JWT.io: https://jwt.io/

## Production Deployment Tips

1. Set `NODE_ENV=production` in `.env`
2. Use strong JWT_SECRET (32+ random characters)
3. Enable HTTPS
4. Add rate limiting (express-rate-limit)
5. Set up proper logging (winston, morgan)
6. Use environment-specific configs
7. Set up monitoring (PM2, New Relic)
8. Add input validation (express-validator)

---

Happy Coding! ⚡
