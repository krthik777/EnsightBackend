# API Testing Guide - PowerShell Examples

This guide provides PowerShell commands to test all API endpoints.

## Setup

First, set the base URL:
```powershell
$baseUrl = "http://localhost:5000"
```

## 1. Authentication & User Management

### Register a New User
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    name = "Jane Smith"
    email = "jane@example.com"
    password = "securePass123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/api/user/register" -Method POST -Headers $headers -Body $body
$response | ConvertTo-Json -Depth 10
```

### Login and Get Token
```powershell
$body = @{
    email = "john.doe@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/api/user/login" -Method POST -Headers $headers -Body $body
$token = $response.data.token
$userId = $response.data._id

Write-Host "✅ Token received: $token" -ForegroundColor Green
Write-Host "✅ User ID: $userId" -ForegroundColor Green

# Save for later use
$authHeaders = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}
```

### Get User Profile
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/user/profile" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Update Profile
```powershell
$body = @{
    name = "John Updated"
    email = "john.updated@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/user/profile" -Method PUT -Headers $authHeaders -Body $body | ConvertTo-Json -Depth 10
```

## 2. Room Management

### Get All Rooms
```powershell
$rooms = Invoke-RestMethod -Uri "$baseUrl/api/room" -Method GET -Headers $authHeaders
$rooms | ConvertTo-Json -Depth 10

# Save first room ID for later
$roomId = $rooms.data[0]._id
Write-Host "✅ First Room ID: $roomId" -ForegroundColor Green
```

### Create a New Room
```powershell
$body = @{
    name = "Garage"
    icon = "car"
    threshold = 1500
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/room" -Method POST -Headers $authHeaders -Body $body | ConvertTo-Json -Depth 10
```

### Get Single Room
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/room/$roomId" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Update Room
```powershell
$body = @{
    name = "Living Room Updated"
    threshold = 2500
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/room/$roomId" -Method PUT -Headers $authHeaders -Body $body | ConvertTo-Json -Depth 10
```

## 3. Power Data (IoT)

### Send Power Data (Simulating ESP32)
```powershell
$body = @{
    userId = $userId
    roomId = $roomId
    voltage = 239.5
    current = 8.8
    power = 483
    energy = 0.12
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/power" -Method POST -Headers $headers -Body $body | ConvertTo-Json -Depth 10
```

### Get Latest Power Reading
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/power/latest" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Get Latest Reading for Specific Room
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/power/latest?roomId=$roomId" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Get Power Readings with Filters
```powershell
# Today's readings
$today = (Get-Date).ToString("yyyy-MM-dd")
Invoke-RestMethod -Uri "$baseUrl/api/power/readings?startDate=$today&limit=10" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

## 4. Consumption & Analytics

### Get Room Consumption (Today)
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/consumption/room?period=today" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Get Overall Consumption
```powershell
# Today
Invoke-RestMethod -Uri "$baseUrl/api/consumption/overall?period=today" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10

# This Week
Invoke-RestMethod -Uri "$baseUrl/api/consumption/overall?period=week" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10

# This Month
Invoke-RestMethod -Uri "$baseUrl/api/consumption/overall?period=month" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Get Consumption Statistics
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/consumption/stats" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

## 5. Forecasting & Predictions

### Get Monthly Forecast
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/forecast/monthly" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Get Daily Forecast
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/forecast/daily" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Get Weekly Trend
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/forecast/weekly" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

## 6. NILM (Appliance Detection)

### Predict Appliances
```powershell
$body = @{
    roomId = $roomId
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/nilm/predict" -Method POST -Headers $authHeaders -Body $body | ConvertTo-Json -Depth 10
```

### Get Appliance History
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/nilm/history?roomId=$roomId&limit=10" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Get Current Appliance Breakdown
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/nilm/breakdown?roomId=$roomId" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

## 7. Alerts & Notifications

### Get All Alerts
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/alerts" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Get Unread Alerts Only
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/alerts?isRead=false&limit=20" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Check Budget Alerts
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/alerts/check-budget" -Method POST -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Mark Alert as Read
```powershell
# Get first alert ID
$alerts = Invoke-RestMethod -Uri "$baseUrl/api/alerts" -Method GET -Headers $authHeaders
$alertId = $alerts.data[0]._id

# Mark as read
Invoke-RestMethod -Uri "$baseUrl/api/alerts/$alertId/read" -Method PUT -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Mark All Alerts as Read
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/alerts/read-all" -Method PUT -Headers $authHeaders | ConvertTo-Json -Depth 10
```

## 8. Settings Management

### Get All Settings
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/settings" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Get Budget Settings
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/settings/budget" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Update Budget Settings
```powershell
$body = @{
    monthly = 500
    currency = "INR"
    ratePerKwh = 7.0
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/settings/budget" -Method PUT -Headers $authHeaders -Body $body | ConvertTo-Json -Depth 10
```

### Get Notification Settings
```powershell
Invoke-RestMethod -Uri "$baseUrl/api/settings/notifications" -Method GET -Headers $authHeaders | ConvertTo-Json -Depth 10
```

### Update Notification Settings
```powershell
$body = @{
    pushEnabled = $true
    emailEnabled = $true
    alertsEnabled = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/settings/notifications" -Method PUT -Headers $authHeaders -Body $body | ConvertTo-Json -Depth 10
```

### Update All Settings
```powershell
$body = @{
    budget = @{
        monthly = 450
        currency = "INR"
        ratePerKwh = 6.8
    }
    notifications = @{
        pushEnabled = $true
        emailEnabled = $false
        alertsEnabled = $true
    }
    autoOptimization = @{
        enabled = $true
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "$baseUrl/api/settings" -Method PUT -Headers $authHeaders -Body $body | ConvertTo-Json -Depth 10
```

## 9. Health & Status

### Health Check
```powershell
Invoke-RestMethod -Uri "$baseUrl/health" -Method GET | ConvertTo-Json -Depth 10
```

### API Documentation
```powershell
Invoke-RestMethod -Uri "$baseUrl/" -Method GET | ConvertTo-Json -Depth 10
```

## Complete Test Script

Save this as `test-api.ps1`:

```powershell
# Energy Dashboard API Test Script
$baseUrl = "http://localhost:5000"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Energy Dashboard API Test Suite          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan

# 1. Login
Write-Host "`n📝 Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "john.doe@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/user/login" -Method POST -Headers $headers -Body $loginBody
    $token = $loginResponse.data.token
    $userId = $loginResponse.data._id
    Write-Host "✅ Login successful!" -ForegroundColor Green
    
    $authHeaders = @{ 
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    
    # 2. Get Rooms
    Write-Host "`n🏠 Getting rooms..." -ForegroundColor Yellow
    $rooms = Invoke-RestMethod -Uri "$baseUrl/api/room" -Method GET -Headers $authHeaders
    Write-Host "✅ Found $($rooms.count) rooms" -ForegroundColor Green
    $roomId = $rooms.data[0]._id
    
    # 3. Send Power Data
    Write-Host "`n⚡ Sending power data..." -ForegroundColor Yellow
    $powerBody = @{
        userId = $userId
        roomId = $roomId
        voltage = 239.5
        current = 8.8
        power = 483
        energy = 0.12
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/power" -Method POST -Headers $headers -Body $powerBody | Out-Null
    Write-Host "✅ Power data sent!" -ForegroundColor Green
    
    # 4. Get Consumption Stats
    Write-Host "`n📊 Getting consumption stats..." -ForegroundColor Yellow
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/consumption/stats" -Method GET -Headers $authHeaders
    Write-Host "✅ Today's energy: $($stats.data.today.energy) kWh" -ForegroundColor Green
    
    # 5. Get Forecast
    Write-Host "`n🔮 Getting monthly forecast..." -ForegroundColor Yellow
    $forecast = Invoke-RestMethod -Uri "$baseUrl/api/forecast/monthly" -Method GET -Headers $authHeaders
    Write-Host "✅ Predicted: $($forecast.data.forecast.predictedTotal) kWh" -ForegroundColor Green
    
    Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  All tests passed! ✅                      ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
```

Run it:
```powershell
.\test-api.ps1
```

## Tips

### Save Token for Session
```powershell
$token | Out-File -FilePath "token.txt"

# Load token later
$token = Get-Content "token.txt"
$authHeaders = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}
```

### Pretty Print JSON
```powershell
$response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Cyan
```

### Handle Errors
```powershell
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/room" -Method GET -Headers $authHeaders
    Write-Host "✅ Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
}
```

---

Happy Testing! 🚀
