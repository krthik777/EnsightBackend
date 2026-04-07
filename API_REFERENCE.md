# ⚡ Energy Dashboard Backend — Complete API Reference

> **Base URL:** `http://localhost:5000`  
> **Authentication:** JWT Bearer Token (header: `Authorization: Bearer <token>`)  
> **Content-Type:** `application/json`

---

## Table of Contents

| # | Section | Endpoints |
|---|---------|-----------|
| 1 | [Server Utility](#1-server-utility) | 2 |
| 2 | [Authentication](#2-authentication-apiuser) | 4 |
| 3 | [Rooms](#3-rooms-apiroom) | 5 |
| 4 | [Power Readings](#4-power-readings-apipower) | 3 |
| 5 | [Consumption](#5-consumption-apiconsumption) | 5 |
| 6 | [Appliances](#6-appliances-apiappliances) | 8 |
| 7 | [Alerts](#7-alerts-apialerts) | 5 |
| 8 | [Settings](#8-settings-apisettings) | 6 |
| 9 | [Forecast](#9-forecast-apiforecast) | 4 |
| 10 | [NILM](#10-nilm-apinilm) | 4 |
| | **Total** | **46** |

---

## 1. Server Utility

### 1.1 `GET /` — API Info

**Access:** Public

```
GET http://localhost:5000/
```

**Sample Response:**

```json
{
  "message": "⚡ Energy Dashboard API",
  "version": "1.0.0",
  "status": "active",
  "endpoints": { "auth": {}, "power": {}, "consumption": {}, "rooms": {}, "appliances": {}, "alerts": {}, "nilm": {}, "forecast": {}, "settings": {} }
}
```

### 1.2 `GET /health` — Health Check

**Access:** Public

```
GET http://localhost:5000/health
```

**Sample Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-04-04T00:00:00.000Z",
  "uptime": 3600.123
}
```

---

## 2. Authentication (`/api/user`)

### 2.1 `POST /api/user/register` — Register

**Access:** Public

```
POST http://localhost:5000/api/user/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Sample Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

**Error (400):** `{ "success": false, "message": "User already exists" }`

### 2.2 `POST /api/user/login` — Login

**Access:** Public

```
POST http://localhost:5000/api/user/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

**Error (401):** `{ "success": false, "message": "Invalid credentials" }`

### 2.3 `GET /api/user/profile` — Get Profile

**Access:** 🔒 Private

```
GET http://localhost:5000/api/user/profile
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### 2.4 `PUT /api/user/profile` — Update Profile

**Access:** 🔒 Private

```
PUT http://localhost:5000/api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.new@example.com"
}
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Updated",
    "email": "john.new@example.com",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## 3. Rooms (`/api/room`)

### 3.1 `GET /api/room` — Get All Rooms

**Access:** 🔒 Private

```
GET http://localhost:5000/api/room
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "665b1c2d3e4f5a6b7c8d9e0f",
      "userId": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "Living Room",
      "icon": "sofa",
      "threshold": 2000,
      "isActive": true,
      "currentPower": 450.5,
      "currentVoltage": 230.12,
      "currentCurrent": 1.957,
      "todayEnergy": "3.25",
      "lastUpdated": "2026-04-04T00:00:00.000Z",
      "applianceCount": 5,
      "activeApplianceCount": 3
    }
  ]
}
```

### 3.2 `GET /api/room/:id` — Get Single Room

**Access:** 🔒 Private

```
GET http://localhost:5000/api/room/665b1c2d3e4f5a6b7c8d9e0f
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "665b1c2d3e4f5a6b7c8d9e0f",
    "name": "Living Room",
    "icon": "sofa",
    "threshold": 2000,
    "isActive": true,
    "appliances": [
      { "_id": "666c...", "name": "AC Unit", "type": "Air Conditioner", "estimatedWattage": 1500, "isActive": true }
    ],
    "applianceCount": 1,
    "activeApplianceCount": 1
  }
}
```

### 3.3 `POST /api/room` — Create Room (with optional appliances)

**Access:** 🔒 Private

```
POST http://localhost:5000/api/room
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Bedroom",
  "icon": "bed",
  "threshold": 1500,
  "appliances": [
    { "name": "Ceiling Fan", "type": "Fan", "estimatedWattage": 75, "usageHoursPerDay": 8, "brand": "Havells" }
  ]
}
```

**Sample Response (201):**

```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "room": { "_id": "667d...", "name": "Bedroom", "icon": "bed", "threshold": 1500, "isActive": true },
    "appliances": [ { "_id": "668e...", "name": "Ceiling Fan", "type": "Fan", "estimatedWattage": 75 } ],
    "applianceCount": 1
  }
}
```

### 3.4 `PUT /api/room/:id` — Update Room

**Access:** 🔒 Private

```
PUT http://localhost:5000/api/room/665b1c2d3e4f5a6b7c8d9e0f
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Master Bedroom", "icon": "bed", "threshold": 1800, "isActive": true }
```

**Sample Response (200):**

```json
{ "success": true, "data": { "_id": "665b...", "name": "Master Bedroom", "icon": "bed", "threshold": 1800, "isActive": true } }
```

### 3.5 `DELETE /api/room/:id` — Delete Room (soft delete)

**Access:** 🔒 Private

```
DELETE http://localhost:5000/api/room/665b1c2d3e4f5a6b7c8d9e0f
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{ "success": true, "message": "Room deleted successfully" }
```

---

## 4. Power Readings (`/api/power`)

### 4.1 `POST /api/power` — Receive Power Data (ESP32 / IoT)

**Access:** Public (designed for ESP32 devices)

**Old format:**

```
POST http://localhost:5000/api/power
Content-Type: application/json

{
  "userId": "664a1b2c3d4e5f6a7b8c9d0e",
  "roomId": "665b1c2d3e4f5a6b7c8d9e0f",
  "voltage": 230.5,
  "current": 2.15,
  "power": 495.58,
  "energy": 0.138
}
```

**New ESP32 format** (userId/roomId can go in body, query params, or headers `x-user-id`/`x-room-id`):

```
POST http://localhost:5000/api/power?userId=664a...&roomId=665b...
Content-Type: application/json

{ "current_rms_a": 2.15, "apparent_power_va": 495.58 }
```

**Sample Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "669f...", "userId": "664a...", "roomId": "665b...",
    "voltage": 230.5, "current": 2.15, "power": 495.58, "energy": 0.138,
    "timestamp": "2026-04-04T00:00:00.000Z"
  }
}
```

### 4.2 `GET /api/power/latest` — Get Latest Power Reading

**Access:** 🔒 Private  
**Query:** `roomId` (optional, ObjectId)

```
GET http://localhost:5000/api/power/latest?roomId=665b...
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "669f...", "voltage": 230.5, "current": 2.15, "power": 495.58, "energy": 0.138,
    "timestamp": "2026-04-04T00:00:00.000Z",
    "roomId": { "_id": "665b...", "name": "Living Room", "icon": "sofa" }
  }
}
```

### 4.3 `GET /api/power/readings` — Get Power Readings (paginated)

**Access:** 🔒 Private

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `roomId` | ObjectId | — | Filter by room |
| `startDate` | ISO Date | — | Range start |
| `endDate` | ISO Date | — | Range end |
| `limit` | Number | 100 | Results per page |
| `page` | Number | 1 | Page number |

```
GET http://localhost:5000/api/power/readings?roomId=665b...&limit=10&page=1
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true, "count": 10, "total": 250, "page": 1, "pages": 25,
  "data": [
    { "_id": "669f...", "voltage": 230.5, "current": 2.15, "power": 495.58, "energy": 0.138, "timestamp": "2026-04-04T00:00:00.000Z", "roomId": { "_id": "665b...", "name": "Living Room", "icon": "sofa" } }
  ]
}
```

---

## 5. Consumption (`/api/consumption`)

### 5.1 `GET /api/consumption/room` — Room-level Consumption

**Access:** 🔒 Private  
**Query:** `roomId` (optional), `period` (optional, default: `today` — values: `today`, `week`, `month`)

```
GET http://localhost:5000/api/consumption/room?period=week
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true, "period": "week",
  "data": [
    {
      "room": { "_id": "665b...", "name": "Living Room", "icon": "sofa", "threshold": 2000 },
      "currentPower": 450.5, "totalEnergy": 25.8, "readingsCount": 500, "avgPower": 0.0516, "maxPower": 1200.3
    }
  ]
}
```

### 5.2 `GET /api/consumption/overall` — Overall Household Consumption

**Access:** 🔒 Private  
**Query:** `period` (optional, default: `today` — values: `today`, `week`, `month`, `year`)

```
GET http://localhost:5000/api/consumption/overall?period=today
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true, "period": "today",
  "data": {
    "currentPowerW": 450.50, "currentA": 1.957, "voltageV": 230.12,
    "capacityPercentage": 45.05, "maxCapacityW": 1000,
    "timestamp": "2026-04-04T00:00:00.000Z",
    "totalEnergy": 3.25, "avgPower": 380.20, "avgVoltage": 229.80,
    "avgCurrent": 1.65, "maxPower": 1200.30, "readingsCount": 150
  }
}
```

### 5.3 `GET /api/consumption/stats` — Consumption Statistics

**Access:** 🔒 Private

```
GET http://localhost:5000/api/consumption/stats
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "today": { "energy": "3.25", "cost": "21.13" },
    "month": { "energy": "85.40", "cost": "555.10", "budget": 400, "budgetUsed": "21.4", "remaining": "314.60" },
    "peakPower": "2150.00"
  }
}
```

### 5.4 `GET /api/consumption/monthly` — Specific Calendar Month Consumption

**Access:** 🔒 Private  
**Required Query:** `year` (Number), `month` (Number, 1-12)

```
GET http://localhost:5000/api/consumption/monthly?year=2026&month=3
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "month": "March", "year": 2026, "monthNumber": 3, "daysInMonth": 31,
    "summary": {
      "totalEnergyKWh": 120.50, "totalCostINR": 783.25, "avgDailyEnergyKWh": 3.89,
      "avgPowerW": 380.20, "avgVoltageV": 229.80, "avgCurrentA": 1.653,
      "maxPowerW": 2150.00, "minPowerW": 10.50, "readingsCount": 4500
    },
    "budget": {
      "monthlyBudgetKWh": 400, "budgetUsedPercent": 30.1, "remainingKWh": 279.50,
      "isOverBudget": false, "exceedanceKWh": 0
    },
    "dailyBreakdown": [
      { "day": 1, "date": "2026-03-01", "energy": 3.85, "readingsCount": 144, "avgPower": 160.42, "maxPower": 1200.30, "cost": 25.03 }
    ],
    "ratePerKwh": 6.5
  }
}
```

### 5.5 `GET /api/consumption/trends` — Consumption Trends

**Access:** 🔒 Private  
**Required Query:** `type` (`daily`, `weekly`, or `monthly`)  
**Optional Query:** `roomId`

```
GET http://localhost:5000/api/consumption/trends?type=daily
Authorization: Bearer <token>
```

**Sample Response — `type=daily` (200):**

```json
{
  "success": true,
  "data": {
    "type": "daily", "period": "Last 7 Days",
    "dailyBreakdown": [ { "date": "2026-03-29", "day": "Sat", "energy": 4.12, "avgPower": 171.67, "maxPower": 1200.30, "readingsCount": 144, "cost": 26.78 } ],
    "hourlyBreakdown": [ { "hour": 0, "timeLabel": "00:00", "energy": 0.15, "avgPower": 62.50, "maxPower": 120.00, "readingsCount": 6 } ],
    "summary": {
      "currentWeekTotal": 25.80, "previousWeekTotal": 28.50, "weekChangePercent": -9.5,
      "avgDailyEnergy": 3.69, "peakHour": { "hour": 19, "timeLabel": "19:00", "maxPower": 2150.00 }
    },
    "ratePerKwh": 6.5
  }
}
```

> `type=weekly` returns `weeklyBreakdown` (last 8 weeks). `type=monthly` returns `monthlyBreakdown` (last 12 months with budget tracking).

---

## 6. Appliances (`/api/appliances`)

> All appliance routes require authentication (router-level `protect`).

### 6.1 `GET /api/appliances` — Get All Appliances

**Access:** 🔒 Private  
**Optional Query:** `roomId`, `type`, `isActive`

```
GET http://localhost:5000/api/appliances?roomId=665b...&type=Fan
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true, "count": 3,
  "data": [
    {
      "_id": "668e...", "name": "Ceiling Fan", "type": "Fan", "powerRating": 75,
      "estimatedWattage": 75, "usageHoursPerDay": 8, "isActive": true,
      "icon": "fan", "color": "#6366f1",
      "powerSignature": { "min": 60, "max": 90, "typical": 75 },
      "roomId": { "_id": "665b...", "name": "Living Room", "icon": "sofa" },
      "estimatedDailyConsumption": 0.6, "estimatedMonthlyConsumption": "18.00"
    }
  ],
  "summary": {
    "totalAppliances": 3, "activeAppliances": 2,
    "estimatedDailyConsumption": "1.20", "estimatedMonthlyConsumption": "36.00"
  }
}
```

### 6.2 `GET /api/appliances/:id` — Get Single Appliance

**Access:** 🔒 Private

```
GET http://localhost:5000/api/appliances/668e4f5a6b7c8d9e0f1a2b3c
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "668e...", "name": "Ceiling Fan", "type": "Fan", "powerRating": 75,
    "estimatedWattage": 75, "usageHoursPerDay": 8, "isActive": true,
    "roomId": { "_id": "665b...", "name": "Living Room", "icon": "sofa", "threshold": 2000 }
  }
}
```

### 6.3 `POST /api/appliances` — Create Appliance

**Access:** 🔒 Private  
**Required body:** `roomId`, `name`, `type`, `powerRating`, `estimatedWattage`

```
POST http://localhost:5000/api/appliances
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "665b1c2d3e4f5a6b7c8d9e0f",
  "name": "Samsung AC",
  "type": "Air Conditioner",
  "powerRating": 1500,
  "estimatedWattage": 1500,
  "usageHoursPerDay": 6,
  "icon": "air-conditioner"
}
```

**Sample Response (201):**

```json
{
  "success": true, "message": "Appliance created successfully",
  "data": {
    "_id": "670a...", "name": "Samsung AC", "type": "Air Conditioner",
    "powerRating": 1500, "estimatedWattage": 1500,
    "powerSignature": { "min": 1200, "max": 1800, "typical": 1500 },
    "roomId": { "_id": "665b...", "name": "Living Room", "icon": "sofa" }
  }
}
```

### 6.4 `PUT /api/appliances/:id` — Update Appliance

**Access:** 🔒 Private  
**Updatable fields:** `name`, `type`, `powerRating`, `estimatedWattage`, `usageHoursPerDay`, `isActive`, `icon`, `color`, `powerSignature`, `roomId`

```
PUT http://localhost:5000/api/appliances/670a1b2c3d4e5f6a7b8c9d0e
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Samsung AC - 1.5 Ton", "estimatedWattage": 1600, "usageHoursPerDay": 5, "isActive": false }
```

**Sample Response (200):**

```json
{ "success": true, "message": "Appliance updated successfully", "data": { "_id": "670a...", "name": "Samsung AC - 1.5 Ton", "estimatedWattage": 1600, "isActive": false } }
```

### 6.5 `DELETE /api/appliances/:id` — Delete Appliance

**Access:** 🔒 Private

```
DELETE http://localhost:5000/api/appliances/670a1b2c3d4e5f6a7b8c9d0e
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{ "success": true, "message": "Appliance deleted successfully", "data": { "id": "670a...", "name": "Samsung AC - 1.5 Ton" } }
```

### 6.6 `GET /api/appliances/room/:roomId` — Get Appliances by Room

**Access:** 🔒 Private

```
GET http://localhost:5000/api/appliances/room/665b1c2d3e4f5a6b7c8d9e0f
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true, "count": 3,
  "data": [ { "_id": "668e...", "name": "Ceiling Fan" } ],
  "room": { "id": "665b...", "name": "Living Room", "icon": "sofa", "threshold": 2000 },
  "summary": {
    "totalAppliances": 3, "activeAppliances": 2, "totalEstimatedWattage": 1650,
    "estimatedDailyConsumption": "9.60", "estimatedMonthlyConsumption": "288.00",
    "thresholdUsagePercent": "82.5"
  }
}
```

### 6.7 `GET /api/appliances/types` — Get Appliance Types

**Access:** 🔒 Private

```
GET http://localhost:5000/api/appliances/types
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true, "count": 18,
  "data": [
    { "value": "Air Conditioner", "label": "Air Conditioner", "icon": "air-conditioner", "avgWattage": 1500 },
    { "value": "Refrigerator", "label": "Refrigerator", "icon": "fridge", "avgWattage": 150 },
    { "value": "Fan", "label": "Fan", "icon": "fan", "avgWattage": 75 },
    { "value": "Other", "label": "Other", "icon": "appliance", "avgWattage": 100 }
  ]
}
```

### 6.8 `POST /api/appliances/bulk` — Bulk Create Appliances

**Access:** 🔒 Private  
**Required body:** `roomId`, `appliances` (array)

```
POST http://localhost:5000/api/appliances/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "665b1c2d3e4f5a6b7c8d9e0f",
  "appliances": [
    { "name": "Table Lamp", "type": "Lights", "estimatedWattage": 60, "usageHoursPerDay": 4 },
    { "name": "Desktop PC", "type": "Computer", "estimatedWattage": 200, "usageHoursPerDay": 8 }
  ]
}
```

**Sample Response (201):**

```json
{
  "success": true, "message": "Successfully created 2 appliances", "count": 2,
  "data": [
    { "_id": "671b...", "name": "Table Lamp", "type": "Lights", "estimatedWattage": 60 },
    { "_id": "672c...", "name": "Desktop PC", "type": "Computer", "estimatedWattage": 200 }
  ]
}
```

---

## 7. Alerts (`/api/alerts`)

### 7.1 `GET /api/alerts` — Get All Alerts

**Access:** 🔒 Private  
**Optional Query:** `isRead` (boolean), `type` (`high_usage|budget_warning|budget_exceeded|anomaly|spike`), `limit` (default: 50)

```
GET http://localhost:5000/api/alerts?isRead=false&limit=10
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true, "count": 2,
  "data": [
    {
      "_id": "673d...", "type": "high_usage", "severity": "warning",
      "message": "High usage detected in Living Room",
      "value": 2500, "threshold": 2000, "isRead": false,
      "timestamp": "2026-04-03T18:30:00.000Z",
      "roomId": { "_id": "665b...", "name": "Living Room", "icon": "sofa" }
    }
  ]
}
```

### 7.2 `PUT /api/alerts/:id/read` — Mark Alert as Read

**Access:** 🔒 Private

```
PUT http://localhost:5000/api/alerts/673d.../read
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{ "success": true, "data": { "_id": "673d...", "isRead": true, "type": "high_usage" } }
```

### 7.3 `PUT /api/alerts/read-all` — Mark All Alerts as Read

**Access:** 🔒 Private

```
PUT http://localhost:5000/api/alerts/read-all
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{ "success": true, "message": "All alerts marked as read" }
```

### 7.4 `POST /api/alerts/check-budget` — Check & Generate Budget Alerts

**Access:** 🔒 Private (no body required)

```
POST http://localhost:5000/api/alerts/check-budget
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{ "success": true, "message": "Budget alerts checked" }
```

> Auto-creates `budget_warning` (≥80%) or `budget_exceeded` (≥100%) alerts.

### 7.5 `DELETE /api/alerts/:id` — Delete Alert

**Access:** 🔒 Private

```
DELETE http://localhost:5000/api/alerts/673d...
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{ "success": true, "message": "Alert deleted successfully" }
```

---

## 8. Settings (`/api/settings`)

### 8.1 `GET /api/settings` — Get All Settings

**Access:** 🔒 Private

```
GET http://localhost:5000/api/settings
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "674e...", "userId": "664a...",
    "budget": { "monthly": 400, "currency": "INR", "ratePerKwh": 6.5 },
    "notifications": { "pushEnabled": true, "emailEnabled": false, "alertsEnabled": true },
    "autoOptimization": { "enabled": true },
    "updatedAt": "2026-04-01T00:00:00.000Z"
  }
}
```

### 8.2 `PUT /api/settings` — Update Settings

**Access:** 🔒 Private  
**Allowed keys:** `budget`, `notifications`, `autoOptimization`

```
PUT http://localhost:5000/api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "budget": { "monthly": 500, "currency": "INR", "ratePerKwh": 7.0 },
  "notifications": { "pushEnabled": true, "emailEnabled": true, "alertsEnabled": true },
  "autoOptimization": { "enabled": false }
}
```

**Sample Response (200):**

```json
{ "success": true, "data": { "budget": { "monthly": 500, "currency": "INR", "ratePerKwh": 7.0 }, "notifications": { "pushEnabled": true, "emailEnabled": true, "alertsEnabled": true }, "autoOptimization": { "enabled": false } } }
```

### 8.3 `GET /api/settings/budget` — Get Budget Settings

**Access:** 🔒 Private

```
GET http://localhost:5000/api/settings/budget
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{ "success": true, "data": { "monthly": 400, "currency": "INR", "ratePerKwh": 6.5 } }
```

### 8.4 `PUT /api/settings/budget` — Update Budget Settings

**Access:** 🔒 Private

```
PUT http://localhost:5000/api/settings/budget
Authorization: Bearer <token>
Content-Type: application/json

{ "monthly": 500, "currency": "INR", "ratePerKwh": 7.5 }
```

**Sample Response (200):**

```json
{ "success": true, "data": { "monthly": 500, "currency": "INR", "ratePerKwh": 7.5 } }
```

### 8.5 `GET /api/settings/notifications` — Get Notification Settings

**Access:** 🔒 Private

```
GET http://localhost:5000/api/settings/notifications
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{ "success": true, "data": { "pushEnabled": true, "emailEnabled": false, "alertsEnabled": true } }
```

### 8.6 `PUT /api/settings/notifications` — Update Notification Settings

**Access:** 🔒 Private

```
PUT http://localhost:5000/api/settings/notifications
Authorization: Bearer <token>
Content-Type: application/json

{ "pushEnabled": true, "emailEnabled": true, "alertsEnabled": true }
```

**Sample Response (200):**

```json
{ "success": true, "data": { "pushEnabled": true, "emailEnabled": true, "alertsEnabled": true } }
```

---

## 9. Forecast (`/api/forecast`)

### 9.1 `GET /api/forecast/monthly` — Monthly Energy + Cost Forecast

**Access:** 🔒 Private  
**Optional Query:** `roomId` — if provided, tries ML backend first; otherwise uses local fallback

```
GET http://localhost:5000/api/forecast/monthly?roomId=665b...
Authorization: Bearer <token>
```

**Sample Response — ML Backend (200):**

```json
{
  "success": true,
  "data": {
    "source": "ml_backend",
    "currentMonth": { "daysElapsed": 4, "daysRemaining": 26, "avgDailyKwh": 12.5 },
    "forecast": {
      "predictedMonthUnits": 375.0, "expectedCost": 2437.50, "flatRateCost": 2250.00,
      "monthlyBudgetKwh": 400, "budgetHeadroomKwh": 25.0, "overBudget": false,
      "currency": "INR", "ratePerKwhUsed": 6.5
    },
    "recommendation": "You are on track — 25.0 kWh headroom remaining."
  }
}
```

**Sample Response — Fallback (200):**

```json
{
  "success": true,
  "data": {
    "source": "fallback_algorithm",
    "currentMonth": { "daysElapsed": 4, "daysRemaining": 26, "currentUsage": "50.00", "avgDailyKwh": "12.50" },
    "forecast": {
      "predictedMonthUnits": "375.00", "expectedCost": "2437.50",
      "monthlyBudgetKwh": 400, "budgetHeadroomKwh": "25.00", "overBudget": false,
      "currency": "INR", "ratePerKwhUsed": 6.5
    },
    "recommendation": "You are on track to stay within your monthly budget"
  }
}
```

### 9.2 `GET /api/forecast/cost` — Cost Prediction (ML only)

**Access:** 🔒 Private  
**Required Query:** `roomId`

```
GET http://localhost:5000/api/forecast/cost?roomId=665b...
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "source": "ml_backend", "estimatedMonthlyUnits": 375.0, "estimatedCost": 2437.50,
    "flatRateCost": 2250.00, "currency": "INR", "ratePerKwhUsed": 6.5,
    "monthlyBudgetKwh": 400, "budgetHeadroomKwh": 25.0, "overBudget": false
  }
}
```

**Error (503):** `{ "success": false, "message": "ML Backend unavailable for cost prediction." }`

### 9.3 `GET /api/forecast/daily` — Daily Energy Forecast (local algorithm)

**Access:** 🔒 Private

```
GET http://localhost:5000/api/forecast/daily
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "today": { "usage": "3.25", "cost": "21.13", "currency": "INR" },
    "tomorrow": { "predictedUsage": "3.80", "predictedCost": "24.70", "currency": "INR", "confidence": "high" },
    "last7Days": {
      "avgUsage": "3.65", "trend": "increasing",
      "dailyData": [ { "date": "2026-03-29", "usage": "3.10" }, { "date": "2026-03-30", "usage": "3.45" } ]
    }
  }
}
```

### 9.4 `GET /api/forecast/weekly` — Weekly Usage Trend

**Access:** 🔒 Private  
**Optional Query:** `weeks` (default: 7)

```
GET http://localhost:5000/api/forecast/weekly?weeks=4
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "weeklyData": [
      { "week": "W1", "weekStart": "2026-03-09", "usage": "25.80" },
      { "week": "W2", "weekStart": "2026-03-16", "usage": "28.50" }
    ],
    "comparison": { "lastWeek": "25.80", "previousWeek": "28.50", "changePercent": "-9.5", "trend": "decrease" }
  }
}
```

---

## 10. NILM (`/api/nilm`)

### 10.1 `POST /api/nilm/predict` — Predict Active Appliances

**Access:** 🔒 Private  
**Required body:** `roomId`

```
POST http://localhost:5000/api/nilm/predict
Authorization: Bearer <token>
Content-Type: application/json

{ "roomId": "665b1c2d3e4f5a6b7c8d9e0f" }
```

**Sample Response — ML Backend (200):**

```json
{
  "success": true,
  "data": {
    "source": "ml_backend",
    "active_appliances": ["air_conditioner", "television", "lights"],
    "confidence": { "air_conditioner": 0.98, "television": 0.85, "lights": 0.92 },
    "appliance_power": { "air_conditioner": 1500.0, "television": 120.0, "lights": 60.0 },
    "totalPower": 1680.0, "detectionId": "675f..."
  }
}
```

**Sample Response — Fallback (200):**

```json
{
  "success": true,
  "warning": "Using fallback algorithm — ML backend unavailable.",
  "data": {
    "source": "fallback",
    "appliances": [
      { "name": "Air Conditioner", "confidence": 85, "powerConsumption": 1500 },
      { "name": "Lights", "confidence": 90, "powerConsumption": 60 }
    ],
    "totalPower": 1560, "detectionId": "675f..."
  }
}
```

### 10.2 `POST /api/nilm/anomaly` — Detect Power Anomalies (ML only)

**Access:** 🔒 Private  
**Required body:** `roomId`

```
POST http://localhost:5000/api/nilm/anomaly
Authorization: Bearer <token>
Content-Type: application/json

{ "roomId": "665b1c2d3e4f5a6b7c8d9e0f" }
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "source": "ml_backend",
    "possible_faulty_appliance": "Washing Machine",
    "room_threshold_used": 2000,
    "details": { "max_power": 3200, "mean_power": 450, "statistical_threshold": 1800, "room_power_threshold": 2000, "triggered_by": "statistical" }
  }
}
```

**Error (503):** `{ "success": false, "message": "ML Backend unavailable for anomaly detection." }`

### 10.3 `GET /api/nilm/history` — Appliance Detection History

**Access:** 🔒 Private  
**Optional Query:** `roomId`, `startDate`, `endDate`, `limit` (default: 50)

```
GET http://localhost:5000/api/nilm/history?roomId=665b...&limit=5
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true, "count": 5,
  "data": {
    "history": [
      {
        "_id": "676a...",
        "roomId": { "_id": "665b...", "name": "Living Room", "icon": "sofa" },
        "appliances": [ { "name": "Air Conditioner", "confidence": 98, "powerConsumption": 1500 } ],
        "totalPower": 1680, "timestamp": "2026-04-04T00:00:00.000Z"
      }
    ],
    "statistics": [ { "name": "Air Conditioner", "detectionCount": 5, "avgPower": "1480.00", "avgConfidence": "96.2" } ]
  }
}
```

### 10.4 `GET /api/nilm/breakdown` — Latest Appliance Breakdown

**Access:** 🔒 Private  
**Optional Query:** `roomId`

```
GET http://localhost:5000/api/nilm/breakdown?roomId=665b...
Authorization: Bearer <token>
```

**Sample Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "676a...",
    "roomId": { "_id": "665b...", "name": "Living Room", "icon": "sofa" },
    "appliances": [
      { "name": "Air Conditioner", "confidence": 98, "powerConsumption": 1500 },
      { "name": "Television", "confidence": 85, "powerConsumption": 120 }
    ],
    "totalPower": 1620, "timestamp": "2026-04-04T00:00:00.000Z"
  }
}
```

---

## Error Response Format

All endpoints return errors consistently:

```json
{ "success": false, "message": "Error description here" }
```

| Status Code | Meaning |
|-------------|---------|
| `400` | Bad Request — Missing/invalid parameters |
| `401` | Unauthorized — Missing or invalid JWT token |
| `404` | Not Found — Resource does not exist |
| `500` | Internal Server Error |
| `503` | Service Unavailable — ML Backend is down |

---

## Authentication Header

For all 🔒 Private endpoints, include:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get the token from `/api/user/register` or `/api/user/login` response.

---

> **Total endpoints: 46** | Covers all 9 route files + 2 server-level routes  
> **Generated:** 2026-04-04
