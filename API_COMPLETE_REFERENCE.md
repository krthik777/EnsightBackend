# EnSight Backend — Complete API Reference
> **Base URL:** `http://localhost:3000`  
> **Authentication:** All routes marked 🔒 require `Authorization: Bearer <token>` header  
> **Content-Type:** `application/json` for all POST/PUT requests

---

## Table of Contents
1. [Authentication](#1-authentication)
2. [Room Management](#2-room-management)
3. [Power Readings (IoT)](#3-power-readings-iot)
4. [Appliance Management](#4-appliance-management)
5. [Consumption Analytics](#5-consumption-analytics)
6. [NILM (Appliance Detection)](#6-nilm-appliance-detection)
7. [Forecast & Cost Prediction](#7-forecast--cost-prediction)
8. [Alerts & Notifications](#8-alerts--notifications)
9. [Settings](#9-settings)

---

## 1. Authentication
> **Route prefix:** `/api/user`

---

### `POST /api/user/register`
Register a new user account.

**Request Body**
```json
{
  "name": "Karthik Kumar",
  "email": "karthik@example.com",
  "password": "mypassword123"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Karthik Kumar",
    "email": "karthik@example.com",
    "createdAt": "2026-03-09T01:07:21.000Z",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### `POST /api/user/login`
Login and receive a JWT token.

**Request Body**
```json
{
  "email": "karthik@example.com",
  "password": "mypassword123"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Karthik Kumar",
    "email": "karthik@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> 💡 **UI Usage:** Save `data.token` and `data._id` to local storage/state on login. All subsequent requests need `Authorization: Bearer <token>`.

---

### 🔒 `GET /api/user/profile`
Get current user profile.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Karthik Kumar",
    "email": "karthik@example.com",
    "createdAt": "2026-03-09T01:07:21.000Z"
  }
}
```

---

### 🔒 `PUT /api/user/profile`
Update user profile.

**Request Body** *(all optional)*
```json
{
  "name": "Karthik K",
  "phone": "+91-9876543210"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Karthik K",
    "email": "karthik@example.com"
  }
}
```

---

## 2. Room Management
> **Route prefix:** `/api/room`  
> All routes 🔒

---

### `GET /api/room`
Get all rooms with live power data and appliance counts.

**Response `200`**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
      "userId": "65f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Living Room",
      "icon": "sofa",
      "threshold": 2000,
      "isActive": true,
      "createdAt": "2026-03-01T00:00:00.000Z",
      "currentPower": 483.5,
      "currentVoltage": 231.2,
      "currentCurrent": 2.09,
      "todayEnergy": "1.24",
      "lastUpdated": "2026-03-09T01:05:00.000Z",
      "applianceCount": 3,
      "activeApplianceCount": 3
    }
  ]
}
```

> 💡 **UI Fields to display:**  
> - `currentPower` → Live watt display on room card  
> - `todayEnergy` → Today's kWh  
> - `applianceCount` / `activeApplianceCount` → Appliance badge

---

### `GET /api/room/:id`
Get single room with full appliance list.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "name": "Living Room",
    "icon": "sofa",
    "threshold": 2000,
    "isActive": true,
    "appliances": [
      {
        "_id": "65f1a2b3c4d5e6f7a8b9c0d5",
        "name": "LG TV",
        "type": "Television",
        "powerRating": 120,
        "estimatedWattage": 120,
        "usageHoursPerDay": 6,
        "isActive": true,
        "icon": "television",
        "color": "#6366f1",
        "powerSignature": { "min": 96, "max": 144, "typical": 120 },
        "estimatedDailyConsumption": 0.72,
        "estimatedMonthlyConsumption": "21.60"
      }
    ],
    "applianceCount": 3,
    "activeApplianceCount": 3
  }
}
```

---

### `POST /api/room`
Create a new room. Optionally add appliances in the same request.

**Request Body**
```json
{
  "name": "Kitchen",
  "icon": "kitchen",
  "threshold": 3000,
  "appliances": [
    {
      "name": "Refrigerator",
      "type": "Refrigerator",
      "powerRating": 150,
      "estimatedWattage": 150,
      "usageHoursPerDay": 24
    },
    {
      "name": "Microwave",
      "type": "Microwave",
      "powerRating": 1200,
      "estimatedWattage": 1200,
      "usageHoursPerDay": 0.5
    }
  ]
}
```

> `appliances` is optional — you can create a room with no appliances.

**Response `201`**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "room": {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d3",
      "name": "Kitchen",
      "icon": "kitchen",
      "threshold": 3000,
      "isActive": true,
      "userId": "65f1a2b3c4d5e6f7a8b9c0d1",
      "createdAt": "2026-03-09T01:07:21.000Z"
    },
    "appliances": [
      { "_id": "...", "name": "Refrigerator", "type": "Refrigerator", "estimatedWattage": 150 },
      { "_id": "...", "name": "Microwave", "type": "Microwave", "estimatedWattage": 1200 }
    ],
    "applianceCount": 2
  }
}
```

---

### `PUT /api/room/:id`
Update room details.

**Request Body** *(all optional)*
```json
{
  "name": "Kitchen Updated",
  "threshold": 2500,
  "icon": "kitchen",
  "isActive": true
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "name": "Kitchen Updated",
    "threshold": 2500,
    "icon": "kitchen",
    "isActive": true
  }
}
```

---

### `DELETE /api/room/:id`
Soft-delete a room (sets `isActive: false`).

**Response `200`**
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

---

## 3. Power Readings (IoT)
> **Route prefix:** `/api/power`

---

### `POST /api/power` *(Public — ESP32)*
Receive power data from the ESP32 sensor.

**Format A — ESP32 Format**
```json
{
  "current_rms_a": 2.09,
  "apparent_power_va": 483.5,
  "userId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "roomId": "65f1a2b3c4d5e6f7a8b9c0d2"
}
```
> `userId` and `roomId` can also be sent as query params (`?userId=...&roomId=...`) or headers (`x-user-id`, `x-room-id`).

**Format B — Standard Format**
```json
{
  "userId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "roomId": "65f1a2b3c4d5e6f7a8b9c0d2",
  "voltage": 231.2,
  "current": 2.09,
  "power": 483.5,
  "energy": 0.000134
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
    "userId": "65f1a2b3c4d5e6f7a8b9c0d1",
    "roomId": "65f1a2b3c4d5e6f7a8b9c0d2",
    "voltage": 231.2,
    "current": 2.09,
    "power": 483.5,
    "energy": 0.000134,
    "timestamp": "2026-03-09T01:07:21.000Z"
  }
}
```

---

### 🔒 `GET /api/power/latest`
Get the most recent power reading.

**Query Params** *(optional)*
```
?roomId=65f1a2b3c4d5e6f7a8b9c0d2
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
    "voltage": 231.2,
    "current": 2.09,
    "power": 483.5,
    "energy": 0.000134,
    "timestamp": "2026-03-09T01:07:21.000Z",
    "roomId": {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
      "name": "Living Room",
      "icon": "sofa"
    }
  }
}
```

---

### 🔒 `GET /api/power/readings`
Get paginated historical power readings.

**Query Params**
```
?roomId=65f1a2b3c4d5e6f7a8b9c0d2&limit=50&page=1&startDate=2026-03-01T00:00:00Z&endDate=2026-03-09T23:59:59Z
```

**Response `200`**
```json
{
  "success": true,
  "count": 50,
  "total": 1240,
  "page": 1,
  "pages": 25,
  "data": [
    {
      "_id": "...",
      "voltage": 231.2,
      "current": 2.09,
      "power": 483.5,
      "energy": 0.000134,
      "timestamp": "2026-03-09T01:07:21.000Z",
      "roomId": { "_id": "...", "name": "Living Room", "icon": "sofa" }
    }
  ]
}
```

---

## 4. Appliance Management
> **Route prefix:** `/api/appliances`  
> All routes 🔒

---

### `GET /api/appliances`
Get all appliances with optional filters and summary.

**Query Params** *(all optional)*
```
?roomId=65f1a2b3c4d5e6f7a8b9c0d2&type=Air+Conditioner&isActive=true
```

**Response `200`**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d5",
      "userId": "65f1a2b3c4d5e6f7a8b9c0d1",
      "roomId": { "_id": "65f1a2b3c4d5e6f7a8b9c0d2", "name": "Living Room", "icon": "sofa" },
      "name": "LG TV",
      "type": "Television",
      "powerRating": 120,
      "estimatedWattage": 120,
      "usageHoursPerDay": 6,
      "isActive": true,
      "icon": "television",
      "color": "#6366f1",
      "powerSignature": { "min": 96, "max": 144, "typical": 120 },
      "createdAt": "2026-03-01T00:00:00.000Z",
      "updatedAt": "2026-03-01T00:00:00.000Z",
      "estimatedDailyConsumption": 0.72,
      "estimatedMonthlyConsumption": "21.60"
    }
  ],
  "summary": {
    "totalAppliances": 4,
    "activeAppliances": 4,
    "estimatedDailyConsumption": "3.45",
    "estimatedMonthlyConsumption": "103.50"
  }
}
```

---

### `GET /api/appliances/types`
Get all valid appliance types for dropdowns.

**Response `200`**
```json
{
  "success": true,
  "count": 18,
  "data": [
    { "value": "Air Conditioner", "label": "Air Conditioner", "icon": "air-conditioner", "avgWattage": 1500 },
    { "value": "Refrigerator", "label": "Refrigerator", "icon": "fridge", "avgWattage": 150 },
    { "value": "Television", "label": "Television", "icon": "tv", "avgWattage": 150 },
    { "value": "Lights", "label": "Lights", "icon": "lightbulb", "avgWattage": 60 },
    { "value": "Fan", "label": "Fan", "icon": "fan", "avgWattage": 75 },
    { "value": "Washing Machine", "label": "Washing Machine", "icon": "washing-machine", "avgWattage": 750 },
    { "value": "Microwave", "label": "Microwave", "icon": "microwave", "avgWattage": 1200 },
    { "value": "Computer", "label": "Computer", "icon": "desktop", "avgWattage": 200 },
    { "value": "Water Heater", "label": "Water Heater", "icon": "water-heater", "avgWattage": 2000 },
    { "value": "Electric Kettle", "label": "Electric Kettle", "icon": "kettle", "avgWattage": 1500 },
    { "value": "Iron", "label": "Iron", "icon": "iron", "avgWattage": 1000 },
    { "value": "Dishwasher", "label": "Dishwasher", "icon": "dishwasher", "avgWattage": 1800 },
    { "value": "Oven", "label": "Oven", "icon": "oven", "avgWattage": 2400 },
    { "value": "Coffee Maker", "label": "Coffee Maker", "icon": "coffee", "avgWattage": 800 },
    { "value": "Toaster", "label": "Toaster", "icon": "toaster", "avgWattage": 1200 },
    { "value": "Vacuum Cleaner", "label": "Vacuum Cleaner", "icon": "vacuum", "avgWattage": 1400 },
    { "value": "Hair Dryer", "label": "Hair Dryer", "icon": "hair-dryer", "avgWattage": 1800 },
    { "value": "Other", "label": "Other", "icon": "appliance", "avgWattage": 100 }
  ]
}
```

---

### `GET /api/appliances/:id`
Get single appliance.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d5",
    "name": "LG TV",
    "type": "Television",
    "powerRating": 120,
    "estimatedWattage": 120,
    "usageHoursPerDay": 6,
    "isActive": true,
    "icon": "television",
    "color": "#6366f1",
    "powerSignature": { "min": 96, "max": 144, "typical": 120 },
    "estimatedDailyConsumption": 0.72,
    "estimatedMonthlyConsumption": "21.60",
    "roomId": {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
      "name": "Living Room",
      "icon": "sofa",
      "threshold": 2000
    }
  }
}
```

---

### `POST /api/appliances`
Create a new appliance.

**Request Body**
```json
{
  "roomId": "65f1a2b3c4d5e6f7a8b9c0d2",
  "name": "Samsung AC",
  "type": "Air Conditioner",
  "powerRating": 1500,
  "estimatedWattage": 1500,
  "usageHoursPerDay": 8,
  "icon": "air-conditioner"
}
```

> **Required:** `roomId`, `name`, `type`, `powerRating`, `estimatedWattage`  
> **Optional:** `usageHoursPerDay`, `icon`  
> **Auto-set:** `color` (#6366f1), `powerSignature` (±20% of wattage)

**Response `201`**
```json
{
  "success": true,
  "message": "Appliance created successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d6",
    "name": "Samsung AC",
    "type": "Air Conditioner",
    "powerRating": 1500,
    "estimatedWattage": 1500,
    "usageHoursPerDay": 8,
    "isActive": true,
    "icon": "air-conditioner",
    "color": "#6366f1",
    "powerSignature": { "min": 1200, "max": 1800, "typical": 1500 },
    "estimatedDailyConsumption": 12,
    "estimatedMonthlyConsumption": "360.00",
    "roomId": { "_id": "...", "name": "Living Room", "icon": "sofa" }
  }
}
```

---

### `POST /api/appliances/bulk`
Create multiple appliances in one request.

**Request Body**
```json
{
  "roomId": "65f1a2b3c4d5e6f7a8b9c0d2",
  "appliances": [
    { "name": "LED Light 1", "type": "Lights", "powerRating": 15, "estimatedWattage": 15, "usageHoursPerDay": 6 },
    { "name": "LED Light 2", "type": "Lights", "powerRating": 15, "estimatedWattage": 15, "usageHoursPerDay": 6 },
    { "name": "Ceiling Fan",  "type": "Fan",    "powerRating": 75, "estimatedWattage": 75, "usageHoursPerDay": 12 }
  ]
}
```

**Response `201`**
```json
{
  "success": true,
  "message": "Successfully created 3 appliances",
  "count": 3,
  "data": [ { "...": "..." }, { "...": "..." }, { "...": "..." } ]
}
```

---

### `GET /api/appliances/room/:roomId`
Get all appliances in a room with room-level power stats.

**Response `200`**
```json
{
  "success": true,
  "count": 3,
  "data": [ { "...": "appliance objects" } ],
  "room": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "name": "Living Room",
    "icon": "sofa",
    "threshold": 2000
  },
  "summary": {
    "totalAppliances": 3,
    "activeAppliances": 3,
    "totalEstimatedWattage": 1695,
    "estimatedDailyConsumption": "14.34",
    "estimatedMonthlyConsumption": "430.20",
    "thresholdUsagePercent": "84.8"
  }
}
```

> 💡 **UI Usage:**  
> - `summary.thresholdUsagePercent` → progress bar showing room load vs threshold  
> - `summary.totalEstimatedWattage` → compare with `room.threshold` for warning colour

---

### `PUT /api/appliances/:id`
Update an appliance.

**Request Body** *(all optional)*
```json
{
  "usageHoursPerDay": 10,
  "powerRating": 1600,
  "isActive": false,
  "roomId": "65f1a2b3c4d5e6f7a8b9c0d3"
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Appliance updated successfully",
  "data": { "...updated appliance object..." }
}
```

---

### `DELETE /api/appliances/:id`
Delete an appliance permanently.

**Response `200`**
```json
{
  "success": true,
  "message": "Appliance deleted successfully",
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d6",
    "name": "Samsung AC"
  }
}
```

---

## 5. Consumption Analytics
> **Route prefix:** `/api/consumption`  
> All routes 🔒

---

### `GET /api/consumption/overall`
Live power snapshot + energy totals.

**Query Params**
```
?period=today       (options: today | week | month | year)
```

**Response `200`**
```json
{
  "success": true,
  "period": "today",
  "data": {
    "currentPowerW": 483.5,
    "currentA": 2.09,
    "voltageV": 231.2,
    "capacityPercentage": 48.35,
    "maxCapacityW": 1000,
    "timestamp": "2026-03-09T01:07:21.000Z",
    "totalEnergy": 1.24,
    "avgPower": 312.4,
    "avgVoltage": 230.8,
    "avgCurrent": 1.35,
    "maxPower": 1850.0,
    "readingsCount": 720
  }
}
```

> 💡 **UI Fields:**  
> - `currentPowerW` → Hero gauge / live watt display  
> - `capacityPercentage` → Circle/arc progress bar  
> - `totalEnergy` → Today's kWh counter  
> - `currentA` / `voltageV` → Electrical stats panel

---

### `GET /api/consumption/room`
Per-room consumption breakdown.

**Query Params**
```
?period=today&roomId=65f1a2b3c4d5e6f7a8b9c0d2
```

**Response `200`**
```json
{
  "success": true,
  "period": "today",
  "data": [
    {
      "room": {
        "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
        "name": "Living Room",
        "icon": "sofa",
        "threshold": 2000
      },
      "currentPower": 483.5,
      "totalEnergy": 0.82,
      "readingsCount": 320,
      "avgPower": 156.3,
      "maxPower": 1200.0
    }
  ]
}
```

---

### `GET /api/consumption/stats`
Quick stats card data — today and this month.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "today": {
      "energy": "1.24",
      "cost": "8.06"
    },
    "month": {
      "energy": "42.80",
      "cost": "278.20",
      "budget": 400,
      "budgetUsed": "10.7",
      "remaining": "357.20"
    },
    "peakPower": "2340.50"
  }
}
```

> 💡 **UI Usage:**  
> - `today.energy` → Daily usage card  
> - `month.budgetUsed` → Budget ring/progress bar (percentage string, e.g., "10.7")  
> - `month.remaining` → Remaining budget in kWh  
> - All costs in INR

---

### `GET /api/consumption/monthly`
Full breakdown for a specific calendar month.

**Query Params**
```
?year=2026&month=3
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "month": "March",
    "year": 2026,
    "monthNumber": 3,
    "daysInMonth": 31,
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-03-31T23:59:59.999Z",
    "summary": {
      "totalEnergyKWh": 42.80,
      "totalCostINR": 278.20,
      "avgDailyEnergyKWh": 1.38,
      "avgPowerW": 312.5,
      "avgVoltageV": 230.8,
      "avgCurrentA": 1.35,
      "maxPowerW": 2340.50,
      "minPowerW": 12.30,
      "readingsCount": 26280
    },
    "budget": {
      "monthlyBudgetKWh": 400,
      "budgetUsedPercent": 10.7,
      "remainingKWh": 357.2,
      "isOverBudget": false,
      "exceedanceKWh": 0
    },
    "dailyBreakdown": [
      {
        "day": 1,
        "date": "2026-03-01",
        "energy": 1.45,
        "readingsCount": 864,
        "avgPower": 302.1,
        "maxPower": 1850.0,
        "cost": 9.43
      }
    ],
    "ratePerKwh": 6.5
  }
}
```

---

### `GET /api/consumption/trends`
Aggregated trends for charts.

**Query Params**
```
?type=daily      (options: daily | weekly | monthly)
?type=daily&roomId=65f1a2b3c4d5e6f7a8b9c0d2   (optional room filter)
```

**Response — `type=daily` `200`**
```json
{
  "success": true,
  "data": {
    "type": "daily",
    "period": "Last 7 Days",
    "dailyBreakdown": [
      { "date": "2026-03-03", "day": "Mon", "energy": 1.21, "avgPower": 252.1, "maxPower": 1800.0, "readingsCount": 720, "cost": 7.87 },
      { "date": "2026-03-04", "day": "Tue", "energy": 1.38, "avgPower": 287.5, "maxPower": 1820.0, "readingsCount": 720, "cost": 8.97 },
      { "date": "2026-03-09", "day": "Sun", "energy": 0.24, "avgPower": 300.0, "maxPower": 480.0,  "readingsCount": 120, "cost": 1.56 }
    ],
    "hourlyBreakdown": [
      { "hour": 0,  "timeLabel": "00:00", "energy": 0.01, "avgPower": 28.5, "maxPower": 45.0,  "readingsCount": 12 },
      { "hour": 6,  "timeLabel": "06:00", "energy": 0.05, "avgPower": 450.0,"maxPower": 900.0, "readingsCount": 12 },
      { "hour": 18, "timeLabel": "18:00", "energy": 0.09, "avgPower": 650.0,"maxPower": 1800.0,"readingsCount": 12 }
    ],
    "summary": {
      "currentWeekTotal": 8.65,
      "previousWeekTotal": 9.20,
      "weekChangePercent": -6.0,
      "avgDailyEnergy": 1.24,
      "peakHour": { "hour": 18, "timeLabel": "18:00", "maxPower": 1800.0 }
    },
    "ratePerKwh": 6.5
  }
}
```

**Response — `type=weekly` `200`**
```json
{
  "success": true,
  "data": {
    "type": "weekly",
    "period": "Last 8 Weeks",
    "weeklyBreakdown": [
      { "weekNumber": 1, "weekLabel": "Week 1", "startDate": "2026-01-12", "endDate": "2026-01-19", "energy": 9.10, "avgDailyEnergy": 1.30, "maxPower": 2100.0, "readingsCount": 4320, "cost": 59.15 },
      { "weekNumber": 8, "weekLabel": "Week 8", "startDate": "2026-03-02", "endDate": "2026-03-09", "energy": 8.65, "avgDailyEnergy": 1.24, "maxPower": 1820.0, "readingsCount": 4080, "cost": 56.23 }
    ],
    "summary": {
      "currentWeekEnergy": 8.65,
      "previousWeekEnergy": 9.20,
      "weekChangePercent": -6.0,
      "avgWeeklyEnergy": 9.10,
      "totalEnergy": 72.80
    },
    "ratePerKwh": 6.5
  }
}
```

**Response — `type=monthly` `200`**
```json
{
  "success": true,
  "data": {
    "type": "monthly",
    "period": "Last 12 Months",
    "monthlyBreakdown": [
      {
        "month": "March", "monthShort": "Mar", "year": 2026, "monthNumber": 3,
        "startDate": "2026-03-01", "endDate": "2026-03-31", "daysInMonth": 31,
        "energy": 42.80, "avgDailyEnergy": 1.38, "maxPower": 2340.50,
        "readingsCount": 26280, "cost": 278.20, "budgetUsedPercent": 10.7, "overBudget": false
      }
    ],
    "summary": {
      "currentMonthEnergy": 42.80,
      "previousMonthEnergy": 38.50,
      "monthChangePercent": 11.2,
      "avgMonthlyEnergy": 40.10,
      "totalYearEnergy": 481.20,
      "yearOverYearChangePercent": 4.5,
      "monthlyBudget": 400,
      "overBudgetMonths": 0
    },
    "ratePerKwh": 6.5
  }
}
```

---

## 6. NILM (Appliance Detection)
> **Route prefix:** `/api/nilm`  
> All routes 🔒  
> ML Backend must be running at `http://localhost:5050`

---

### `POST /api/nilm/predict`
Detect which appliances are currently ON (calls ML `/detect-appliances` + `/predict-appliance-power`).

**Request Body**
```json
{
  "roomId": "65f1a2b3c4d5e6f7a8b9c0d2"
}
```

**Response `200` — ML Backend available**
```json
{
  "success": true,
  "data": {
    "source": "ml_backend",
    "active_appliances": [
      "air_conditioner",
      "television",
      "kitchen_outlets"
    ],
    "confidence": {
      "air_conditioner": 0.98,
      "television": 0.99,
      "kitchen_outlets": 0.96
    },
    "appliance_power": {
      "air_conditioner": 1667.91,
      "television": 73.78,
      "kitchen_outlets": 161.49,
      "fridge": 0,
      "other": 34.12
    },
    "totalPower": 1937.30,
    "detectionId": "65f1a2b3c4d5e6f7a8b9c0e1"
  }
}
```

**Response `200` — ML Backend unavailable (fallback)**
```json
{
  "success": true,
  "warning": "Using fallback algorithm — ML backend unavailable.",
  "data": {
    "source": "fallback",
    "appliances": [
      { "name": "Air Conditioner", "confidence": 85, "powerConsumption": 1500 },
      { "name": "TV", "confidence": 65, "powerConsumption": 150 }
    ],
    "totalPower": 1650,
    "detectionId": "65f1a2b3c4d5e6f7a8b9c0e1"
  }
}
```

> 💡 **UI Usage:**  
> - `active_appliances` → Show as "currently ON" chips/badges  
> - `confidence[name]` → Show as percentage next to each  
> - `appliance_power[name]` → Show watt value per appliance  
> - `totalPower` → Cross-check with live power reading

---

### `POST /api/nilm/anomaly`
Detect power spikes / possible faulty appliances.

**Request Body**
```json
{
  "roomId": "65f1a2b3c4d5e6f7a8b9c0d2"
}
```

**Response `200` — Anomaly detected**
```json
{
  "success": true,
  "data": {
    "source": "ml_backend",
    "possible_faulty_appliance": true,
    "room_threshold_used": 2000.0,
    "details": {
      "max_power": 3500.0,
      "mean_power": 168.0,
      "statistical_threshold": 1596.0,
      "room_power_threshold": 2000.0,
      "triggered_by": "both"
    }
  }
}
```

**Response `200` — No anomaly**
```json
{
  "success": true,
  "data": {
    "source": "ml_backend",
    "possible_faulty_appliance": false,
    "room_threshold_used": 2000.0,
    "details": null
  }
}
```

> 💡 **UI Usage:**  
> - `possible_faulty_appliance` → Show warning banner/alert  
> - `details.triggered_by` → "statistical" / "room_threshold" / "both"  
> - `details.max_power` vs `details.room_power_threshold` → Show overage amount

---

### `GET /api/nilm/history`
Historical appliance detections.

**Query Params** *(all optional)*
```
?roomId=65f1a2b3c4d5e6f7a8b9c0d2&limit=50&startDate=2026-03-01T00:00:00Z&endDate=2026-03-09T23:59:59Z
```

**Response `200`**
```json
{
  "success": true,
  "count": 24,
  "data": {
    "history": [
      {
        "_id": "65f1a2b3c4d5e6f7a8b9c0e1",
        "appliances": [
          { "name": "Air Conditioner", "confidence": 98, "powerConsumption": 1667 },
          { "name": "Television",       "confidence": 99, "powerConsumption": 73 }
        ],
        "totalPower": 1937.30,
        "timestamp": "2026-03-09T01:07:21.000Z",
        "roomId": { "_id": "...", "name": "Living Room", "icon": "sofa" }
      }
    ],
    "statistics": [
      { "name": "Air Conditioner", "detectionCount": 18, "avgPower": "1623.40", "avgConfidence": "97.2" },
      { "name": "Television",       "detectionCount": 22, "avgPower": "75.30",   "avgConfidence": "98.5" }
    ]
  }
}
```

---

### `GET /api/nilm/breakdown`
Latest detection snapshot for breakdown chart.

**Query Params** *(optional)*
```
?roomId=65f1a2b3c4d5e6f7a8b9c0d2
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0e1",
    "appliances": [
      { "name": "Air Conditioner", "confidence": 98, "powerConsumption": 1667 },
      { "name": "Television",       "confidence": 99, "powerConsumption": 73 }
    ],
    "totalPower": 1937.30,
    "timestamp": "2026-03-09T01:07:21.000Z",
    "roomId": { "_id": "...", "name": "Living Room", "icon": "sofa" }
  }
}
```

---

## 7. Forecast & Cost Prediction
> **Route prefix:** `/api/forecast`  
> All routes 🔒  
> ML Backend must be running at `http://localhost:5050`

---

### `GET /api/forecast/monthly`
End-of-month forecast via ML linear extrapolation.

**Query Params**
```
?roomId=65f1a2b3c4d5e6f7a8b9c0d2
```
> `roomId` required to use ML backend; without it falls back to local algorithm.

**Response `200` — ML Backend available**
```json
{
  "success": true,
  "data": {
    "source": "ml_backend",
    "currentMonth": {
      "daysElapsed": 9,
      "daysRemaining": 22,
      "avgDailyKwh": 1.38
    },
    "forecast": {
      "predictedMonthUnits": 42.78,
      "expectedCost": 247.80,
      "flatRateCost": 278.07,
      "monthlyBudgetKwh": 400,
      "budgetHeadroomKwh": 357.22,
      "overBudget": false,
      "currency": "INR",
      "ratePerKwhUsed": 6.5
    },
    "recommendation": "You are on track — 357.22 kWh headroom remaining."
  }
}
```

**Response `200` — Fallback algorithm**
```json
{
  "success": true,
  "data": {
    "source": "fallback_algorithm",
    "currentMonth": {
      "daysElapsed": 9,
      "daysRemaining": 22,
      "currentUsage": "12.42",
      "avgDailyKwh": "1.38"
    },
    "forecast": {
      "predictedMonthUnits": "42.20",
      "expectedCost": "274.30",
      "monthlyBudgetKwh": 400,
      "budgetHeadroomKwh": "357.80",
      "overBudget": false,
      "currency": "INR",
      "ratePerKwhUsed": 6.5
    },
    "recommendation": "You are on track to stay within your monthly budget"
  }
}
```

> 💡 **UI Fields:**  
> - `forecast.predictedMonthUnits` → Projected usage gauge  
> - `forecast.expectedCost` → Projected bill (KSEB slabs)  
> - `forecast.budgetHeadroomKwh` → Headroom display  
> - `forecast.overBudget` → Show red warning vs green status  
> - `recommendation` → Display as informational toast/card

---

### `GET /api/forecast/cost`
Precise monthly bill estimate using KSEB 2025-2027 slab tariff.

**Query Params**
```
?roomId=65f1a2b3c4d5e6f7a8b9c0d2
```
> `roomId` is **required**

**Response `200`**
```json
{
  "success": true,
  "data": {
    "source": "ml_backend",
    "estimatedMonthlyUnits": 246.0,
    "estimatedCost": 1137.58,
    "flatRateCost": 1599.0,
    "currency": "INR",
    "ratePerKwhUsed": 6.5,
    "monthlyBudgetKwh": 400,
    "budgetHeadroomKwh": 154.0,
    "overBudget": false
  }
}
```

> 💡 **UI Fields:**  
> - `estimatedCost` → Primary bill estimate (uses KSEB slab rates — more accurate)  
> - `flatRateCost` → Secondary estimate (flat rate from settings)  
> - `budgetHeadroomKwh` → How much kWh left before hitting budget

---

### `GET /api/forecast/daily`
Today's usage + tomorrow's prediction (local algorithm).

**Response `200`**
```json
{
  "success": true,
  "data": {
    "today": {
      "usage": "1.24",
      "cost": "8.06",
      "currency": "INR"
    },
    "tomorrow": {
      "predictedUsage": "1.38",
      "predictedCost": "8.97",
      "currency": "INR",
      "confidence": "high"
    },
    "last7Days": {
      "avgUsage": "1.24",
      "trend": "decreasing",
      "dailyData": [
        { "date": "2026-03-03", "usage": "1.21" },
        { "date": "2026-03-04", "usage": "1.38" }
      ]
    }
  }
}
```

---

### `GET /api/forecast/weekly`
Weekly usage trend comparison.

**Query Params** *(optional)*
```
?weeks=7
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "weeklyData": [
      { "week": "W1", "weekStart": "2026-01-27", "usage": "9.10" },
      { "week": "W7", "weekStart": "2026-03-09", "usage": "8.65" }
    ],
    "comparison": {
      "lastWeek": "8.65",
      "previousWeek": "9.20",
      "changePercent": "-6.0",
      "trend": "decrease"
    }
  }
}
```

---

## 8. Alerts & Notifications
> **Route prefix:** `/api/alerts`  
> All routes 🔒

---

### `GET /api/alerts`
Get all alerts with optional filters.

**Query Params** *(all optional)*
```
?isRead=false&type=high_usage&limit=20
```
Valid `type` values: `high_usage` | `budget_warning` | `budget_exceeded` | `anomaly` | `spike`

**Response `200`**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0f1",
      "type": "high_usage",
      "severity": "warning",
      "message": "High usage detected in Living Room",
      "value": 2340.5,
      "threshold": 2000,
      "isRead": false,
      "timestamp": "2026-03-09T01:07:21.000Z",
      "roomId": { "_id": "...", "name": "Living Room", "icon": "sofa" }
    },
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0f2",
      "type": "budget_warning",
      "severity": "warning",
      "message": "Budget warning: 82.4% of monthly budget used",
      "value": 329.6,
      "threshold": 400,
      "isRead": false,
      "timestamp": "2026-03-08T18:00:00.000Z",
      "roomId": null
    }
  ]
}
```

> 💡 **UI Usage:**  
> - Filter `isRead=false` for notification badge count  
> - `severity` → colour code: `info`=blue, `warning`=yellow, `critical`=red

---

### `PUT /api/alerts/:id/read`
Mark a single alert as read.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0f1",
    "isRead": true,
    "type": "high_usage",
    "message": "High usage detected in Living Room"
  }
}
```

---

### `PUT /api/alerts/read-all`
Mark all alerts as read.

**Response `200`**
```json
{
  "success": true,
  "message": "All alerts marked as read"
}
```

---

### `DELETE /api/alerts/:id`
Delete an alert.

**Response `200`**
```json
{
  "success": true,
  "message": "Alert deleted successfully"
}
```

---

### `POST /api/alerts/check-budget`
Trigger budget check — creates alert if usage ≥ 80% or ≥ 100% of budget.

**Request Body** *(empty body)*
```json
{}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Budget alerts checked"
}
```

---

## 9. Settings
> **Route prefix:** `/api/settings`  
> All routes 🔒

---

### `GET /api/settings`
Get full user settings (creates defaults if none exist).

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d8",
    "userId": "65f1a2b3c4d5e6f7a8b9c0d1",
    "budget": {
      "monthly": 400,
      "currency": "INR",
      "ratePerKwh": 6.5
    },
    "notifications": {
      "pushEnabled": true,
      "emailEnabled": false,
      "alertsEnabled": true
    },
    "autoOptimization": {
      "enabled": true
    },
    "updatedAt": "2026-03-01T00:00:00.000Z"
  }
}
```

---

### `PUT /api/settings`
Update all settings at once.

**Request Body** *(any/all fields optional)*
```json
{
  "budget": {
    "monthly": 300,
    "currency": "INR",
    "ratePerKwh": 7.0
  },
  "notifications": {
    "pushEnabled": true,
    "emailEnabled": true,
    "alertsEnabled": true
  },
  "autoOptimization": {
    "enabled": false
  }
}
```

**Response `200`**
```json
{
  "success": true,
  "data": { "...full settings object..." }
}
```

---

### `GET /api/settings/budget`
Get only budget settings.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "monthly": 400,
    "currency": "INR",
    "ratePerKwh": 6.5
  }
}
```

---

### `PUT /api/settings/budget`
Update only budget settings.

**Request Body** *(all optional)*
```json
{
  "monthly": 350,
  "ratePerKwh": 7.0,
  "currency": "INR"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "monthly": 350,
    "currency": "INR",
    "ratePerKwh": 7.0
  }
}
```

---

### `GET /api/settings/notifications`
Get notification toggle states.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "pushEnabled": true,
    "emailEnabled": false,
    "alertsEnabled": true
  }
}
```

---

### `PUT /api/settings/notifications`
Update notification toggles.

**Request Body** *(all optional)*
```json
{
  "pushEnabled": true,
  "emailEnabled": false,
  "alertsEnabled": true
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "pushEnabled": true,
    "emailEnabled": false,
    "alertsEnabled": true
  }
}
```

---

## Quick Reference — All Endpoints

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| POST | `/api/user/register` | — | Register |
| POST | `/api/user/login` | — | Login |
| GET  | `/api/user/profile` | 🔒 | Get profile |
| PUT  | `/api/user/profile` | 🔒 | Update profile |
| GET  | `/api/room` | 🔒 | All rooms + live power |
| GET  | `/api/room/:id` | 🔒 | Room + appliances |
| POST | `/api/room` | 🔒 | Create room |
| PUT  | `/api/room/:id` | 🔒 | Update room |
| DELETE | `/api/room/:id` | 🔒 | Delete room |
| POST | `/api/power` | — | ESP32 data ingestion |
| GET  | `/api/power/latest` | 🔒 | Latest reading |
| GET  | `/api/power/readings` | 🔒 | Paginated readings |
| GET  | `/api/appliances` | 🔒 | All appliances |
| GET  | `/api/appliances/types` | 🔒 | Appliance type list |
| GET  | `/api/appliances/:id` | 🔒 | Single appliance |
| POST | `/api/appliances` | 🔒 | Create appliance |
| POST | `/api/appliances/bulk` | 🔒 | Bulk create |
| GET  | `/api/appliances/room/:roomId` | 🔒 | Room appliances + stats |
| PUT  | `/api/appliances/:id` | 🔒 | Update appliance |
| DELETE | `/api/appliances/:id` | 🔒 | Delete appliance |
| GET  | `/api/consumption/overall` | 🔒 | Live stats |
| GET  | `/api/consumption/room` | 🔒 | Per-room breakdown |
| GET  | `/api/consumption/stats` | 🔒 | Quick stats card |
| GET  | `/api/consumption/monthly` | 🔒 | Calendar month data |
| GET  | `/api/consumption/trends` | 🔒 | Chart data (daily/weekly/monthly) |
| POST | `/api/nilm/predict` | 🔒 | Detect active appliances |
| POST | `/api/nilm/anomaly` | 🔒 | Detect power anomalies |
| GET  | `/api/nilm/history` | 🔒 | Detection history |
| GET  | `/api/nilm/breakdown` | 🔒 | Latest detection |
| GET  | `/api/forecast/monthly` | 🔒 | Month-end forecast |
| GET  | `/api/forecast/cost` | 🔒 | KSEB bill estimate |
| GET  | `/api/forecast/daily` | 🔒 | Daily + tomorrow |
| GET  | `/api/forecast/weekly` | 🔒 | Weekly trend |
| GET  | `/api/alerts` | 🔒 | All alerts |
| PUT  | `/api/alerts/read-all` | 🔒 | Mark all read |
| PUT  | `/api/alerts/:id/read` | 🔒 | Mark one read |
| DELETE | `/api/alerts/:id` | 🔒 | Delete alert |
| POST | `/api/alerts/check-budget` | 🔒 | Trigger budget check |
| GET  | `/api/settings` | 🔒 | All settings |
| PUT  | `/api/settings` | 🔒 | Update all settings |
| GET  | `/api/settings/budget` | 🔒 | Budget settings |
| PUT  | `/api/settings/budget` | 🔒 | Update budget |
| GET  | `/api/settings/notifications` | 🔒 | Notification settings |
| PUT  | `/api/settings/notifications` | 🔒 | Update notifications |

---

## Common Error Responses

**`400` Bad Request**
```json
{ "success": false, "message": "Please provide roomId, name, type, powerRating, and estimatedWattage" }
```

**`401` Unauthorized**
```json
{ "success": false, "message": "Not authorized, token failed" }
```

**`404` Not Found**
```json
{ "success": false, "message": "Room not found" }
```

**`503` ML Backend Unavailable**
```json
{ "success": false, "message": "ML Backend unavailable for cost prediction.", "error": "ML Backend unreachable at http://localhost:5050. Is the Flask server running?" }
```

**`500` Server Error**
```json
{ "success": false, "message": "Internal server error description" }
```
