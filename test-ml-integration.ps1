# ML Backend Integration Test Script
# This script tests the connection between Node.js and Flask ML backends

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ML Backend Integration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$NODE_BACKEND = "http://localhost:3000"
$FLASK_BACKEND = "http://localhost:5000"

# Test 1: Check Flask Backend Health
Write-Host "Test 1: Checking Flask ML Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$FLASK_BACKEND/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Flask Backend is running on port 5000" -ForegroundColor Green
} catch {
    Write-Host "❌ Flask Backend is NOT reachable" -ForegroundColor Red
    Write-Host "   Please start Flask backend: python app.py" -ForegroundColor Gray
    Write-Host "   Expected URL: $FLASK_BACKEND" -ForegroundColor Gray
}
Write-Host ""

# Test 2: Check Node.js Backend Health
Write-Host "Test 2: Checking Node.js Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$NODE_BACKEND/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Node.js Backend is running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js Backend is NOT reachable" -ForegroundColor Red
    Write-Host "   Please start Node.js backend: npm run dev" -ForegroundColor Gray
    Write-Host "   Expected URL: $NODE_BACKEND" -ForegroundColor Gray
}
Write-Host ""

# Test 3: Login to get JWT token
Write-Host "Test 3: Authenticating..." -ForegroundColor Yellow
$loginBody = @{
    email = "john.doe@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$NODE_BACKEND/api/user/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $token = $loginResponse.token
    Write-Host "✅ Authentication successful" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Authentication failed" -ForegroundColor Red
    Write-Host "   Have you seeded the database? Run: npm run seed" -ForegroundColor Gray
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}
Write-Host ""

# Test 4: Get user's rooms
Write-Host "Test 4: Fetching user rooms..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $roomsResponse = Invoke-RestMethod -Uri "$NODE_BACKEND/api/room" -Method GET -Headers $headers -ErrorAction Stop
    
    if ($roomsResponse.data -and $roomsResponse.data.Count -gt 0) {
        $roomId = $roomsResponse.data[0]._id
        Write-Host "✅ Found $($roomsResponse.data.Count) room(s)" -ForegroundColor Green
        Write-Host "   Using Room: $($roomsResponse.data[0].name) (ID: $roomId)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  No rooms found. Please seed database." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Failed to fetch rooms" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}
Write-Host ""

# Test 5: Test NILM Prediction (with ML Backend)
Write-Host "Test 5: Testing NILM Prediction..." -ForegroundColor Yellow
$nilmBody = @{
    roomId = $roomId
} | ConvertTo-Json

try {
    $nilmResponse = Invoke-RestMethod -Uri "$NODE_BACKEND/api/nilm/predict" -Method POST -Body $nilmBody -Headers $headers -ContentType "application/json" -ErrorAction Stop
    
    if ($nilmResponse.success) {
        Write-Host "✅ NILM Prediction successful" -ForegroundColor Green
        Write-Host "   Source: $($nilmResponse.data.source)" -ForegroundColor Gray
        
        if ($nilmResponse.data.source -eq "ml_backend") {
            Write-Host "   🧠 Using ML Backend predictions" -ForegroundColor Cyan
            Write-Host "   Total Power: $($nilmResponse.data.prediction.totalPower) W" -ForegroundColor Gray
            Write-Host "   Active Appliances: $($nilmResponse.data.prediction.activeAppliances -join ', ')" -ForegroundColor Gray
            Write-Host "   Confidence: $($nilmResponse.data.prediction.confidence)" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️  Using Fallback Algorithm (ML Backend unavailable)" -ForegroundColor Yellow
            Write-Host "   Total Power: $($nilmResponse.data.totalPower) W" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ NILM Prediction failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

# Test 6: Test Monthly Consumption Forecast
Write-Host "Test 6: Testing Monthly Consumption Forecast..." -ForegroundColor Yellow
try {
    $forecastResponse = Invoke-RestMethod -Uri "$NODE_BACKEND/api/forecast/monthly?roomId=$roomId" -Method GET -Headers $headers -ErrorAction Stop
    
    if ($forecastResponse.success) {
        Write-Host "✅ Monthly Forecast successful" -ForegroundColor Green
        Write-Host "   Source: $($forecastResponse.data.source)" -ForegroundColor Gray
        
        if ($forecastResponse.data.source -eq "ml_backend") {
            Write-Host "   🧠 Using ML Backend predictions" -ForegroundColor Cyan
            Write-Host "   Predicted Total: $($forecastResponse.data.forecast.predictedTotal) kWh" -ForegroundColor Gray
            Write-Host "   Predicted Cost: ₹$($forecastResponse.data.forecast.predictedCost)" -ForegroundColor Gray
            Write-Host "   Confidence: $($forecastResponse.data.forecast.confidence)" -ForegroundColor Gray
            Write-Host "   Will Exceed Budget: $($forecastResponse.data.forecast.willExceedBudget)" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️  Using Fallback Algorithm (ML Backend unavailable)" -ForegroundColor Yellow
            Write-Host "   Predicted Total: $($forecastResponse.data.forecast.predictedTotal) kWh" -ForegroundColor Gray
            Write-Host "   Predicted Cost: ₹$($forecastResponse.data.forecast.predictedCost)" -ForegroundColor Gray
        }
        
        Write-Host "   Recommendation: $($forecastResponse.data.recommendation)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Monthly Forecast failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Integration Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "- If you see 'ml_backend' as the source, integration is working! 🎉" -ForegroundColor Green
Write-Host "- If you see 'fallback', make sure Flask backend is running on port 5000" -ForegroundColor Yellow
Write-Host "- Check ML_BACKEND_INTEGRATION.md for detailed documentation" -ForegroundColor Gray
Write-Host ""
