# Test Consumption Endpoints
# This script helps debug why consumption endpoints might not be working

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🧪 Testing Consumption Endpoints & Data Verification    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"

# Step 1: Login
Write-Host "`n[STEP 1] 🔐 Login to get JWT token..." -ForegroundColor Yellow

$loginBody = @{
    email = "john.doe@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/user/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $userId = $loginResponse.data._id
    $token = $loginResponse.data.token
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor Gray
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure you've run: npm run seed" -ForegroundColor Yellow
    exit
}

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get Rooms
Write-Host "`n[STEP 2] 🏠 Getting rooms..." -ForegroundColor Yellow

try {
    $roomsResponse = Invoke-RestMethod -Uri "$baseUrl/api/room" `
        -Method GET `
        -Headers $headers

    $roomCount = $roomsResponse.count
    
    if ($roomCount -eq 0) {
        Write-Host "⚠️  No rooms found! Creating a test room..." -ForegroundColor Yellow
        
        $newRoom = @{
            name = "Test Room"
            icon = "🧪"
            threshold = 2000
        } | ConvertTo-Json
        
        $roomResponse = Invoke-RestMethod -Uri "$baseUrl/api/room" `
            -Method POST `
            -Headers $headers `
            -Body $newRoom
        
        $roomId = $roomResponse.data._id
        Write-Host "✅ Created test room: $roomId" -ForegroundColor Green
    } else {
        $roomId = $roomsResponse.data[0]._id
        $roomName = $roomsResponse.data[0].name
        Write-Host "✅ Found $roomCount rooms" -ForegroundColor Green
        Write-Host "   Using: $roomName (ID: $roomId)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to get rooms: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 3: Check if PowerReadings exist
Write-Host "`n[STEP 3] 📊 Checking for existing power readings..." -ForegroundColor Yellow

try {
    $latestResponse = Invoke-RestMethod -Uri "$baseUrl/api/power/latest" `
        -Method GET `
        -Headers $headers

    if ($latestResponse.data) {
        Write-Host "✅ Found existing power readings!" -ForegroundColor Green
        Write-Host "   Latest reading:" -ForegroundColor Gray
        Write-Host "   - Power: $($latestResponse.data.power)W" -ForegroundColor Gray
        Write-Host "   - Current: $($latestResponse.data.current)A" -ForegroundColor Gray
        Write-Host "   - Voltage: $($latestResponse.data.voltage)V" -ForegroundColor Gray
        Write-Host "   - Timestamp: $($latestResponse.data.timestamp)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  No power readings found!" -ForegroundColor Yellow
        Write-Host "   This is why consumption endpoints return empty!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No power readings found" -ForegroundColor Yellow
}

# Step 4: Send test power data
Write-Host "`n[STEP 4] ⚡ Sending test power data..." -ForegroundColor Yellow

Write-Host "   Sending 5 test readings..." -ForegroundColor Gray

for ($i = 1; $i -le 5; $i++) {
    $current = 1.0 + ($i * 0.5)
    $power = 230 * $current
    
    $powerData = @{
        timestamp = [int](Get-Date -UFormat %s)
        current_rms_a = $current
        apparent_power_va = $power
        userId = $userId
        roomId = $roomId
    } | ConvertTo-Json

    try {
        $powerResponse = Invoke-RestMethod -Uri "$baseUrl/api/power" `
            -Method POST `
            -ContentType "application/json" `
            -Body $powerData

        Write-Host "   [$i] ✅ Sent: ${current}A, ${power}W" -ForegroundColor Green
        Start-Sleep -Milliseconds 500
    } catch {
        Write-Host "   [$i] ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 5: Test consumption endpoints
Write-Host "`n[STEP 5] 📈 Testing consumption endpoints..." -ForegroundColor Yellow

# Test /api/consumption/overall
Write-Host "`n   A) GET /api/consumption/overall" -ForegroundColor Cyan
try {
    $overallResponse = Invoke-RestMethod -Uri "$baseUrl/api/consumption/overall?period=today" `
        -Method GET `
        -Headers $headers

    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   - Current Power: $($overallResponse.data.currentPower)W" -ForegroundColor Gray
    Write-Host "   - Total Energy: $($overallResponse.data.totalEnergy) kWh" -ForegroundColor Gray
    Write-Host "   - Readings Count: $($overallResponse.data.readingsCount)" -ForegroundColor Gray
    Write-Host "   - Avg Power: $($overallResponse.data.avgPower)W" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test /api/consumption/room
Write-Host "`n   B) GET /api/consumption/room" -ForegroundColor Cyan
try {
    $roomResponse = Invoke-RestMethod -Uri "$baseUrl/api/consumption/room?roomId=$roomId&period=today" `
        -Method GET `
        -Headers $headers

    Write-Host "   ✅ Success!" -ForegroundColor Green
    if ($roomResponse.data.length -gt 0) {
        Write-Host "   - Room: $($roomResponse.data[0].room.name)" -ForegroundColor Gray
        Write-Host "   - Total Energy: $($roomResponse.data[0].totalEnergy) kWh" -ForegroundColor Gray
        Write-Host "   - Current Power: $($roomResponse.data[0].currentPower)W" -ForegroundColor Gray
        Write-Host "   - Readings: $($roomResponse.data[0].readingsCount)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  No data returned (empty array)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test /api/consumption/stats
Write-Host "`n   C) GET /api/consumption/stats" -ForegroundColor Cyan
try {
    $statsResponse = Invoke-RestMethod -Uri "$baseUrl/api/consumption/stats" `
        -Method GET `
        -Headers $headers

    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   Today:" -ForegroundColor Gray
    Write-Host "   - Energy: $($statsResponse.data.today.energy) kWh" -ForegroundColor Gray
    Write-Host "   - Cost: ₹$($statsResponse.data.today.cost)" -ForegroundColor Gray
    Write-Host "   Month:" -ForegroundColor Gray
    Write-Host "   - Energy: $($statsResponse.data.month.energy) kWh" -ForegroundColor Gray
    Write-Host "   - Cost: ₹$($statsResponse.data.month.cost)" -ForegroundColor Gray
    Write-Host "   - Budget Used: $($statsResponse.data.month.budgetUsed)%" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Summary and recommendations
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   📋 Test Summary                                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n🎯 Key Information:" -ForegroundColor Yellow
Write-Host "   User ID:  $userId" -ForegroundColor White
Write-Host "   Room ID:  $roomId" -ForegroundColor White
Write-Host "   Token:    $($token.Substring(0, 30))..." -ForegroundColor White

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update your ESP32 sketch.ino with the IDs above" -ForegroundColor Gray
Write-Host "   2. Upload code to ESP32 and let it send data" -ForegroundColor Gray
Write-Host "   3. Wait 30-60 seconds for data accumulation" -ForegroundColor Gray
Write-Host "   4. Call consumption endpoints from your mobile app" -ForegroundColor Gray

Write-Host "`n📱 Mobile App API Calls:" -ForegroundColor Yellow
Write-Host "   Base URL: http://YOUR_SERVER_IP:5000" -ForegroundColor Gray
Write-Host "   Auth Header: Authorization: Bearer YOUR_TOKEN" -ForegroundColor Gray
Write-Host "   Endpoints:" -ForegroundColor Gray
Write-Host "   - GET /api/consumption/overall?period=today" -ForegroundColor Gray
Write-Host "   - GET /api/consumption/room?roomId=$roomId&period=today" -ForegroundColor Gray
Write-Host "   - GET /api/consumption/stats" -ForegroundColor Gray

Write-Host "`n🐛 Debugging Tips:" -ForegroundColor Yellow
Write-Host "   If endpoints return empty data:" -ForegroundColor Gray
Write-Host "   1. Check MongoDB has 'powerreadings' collection" -ForegroundColor Gray
Write-Host "   2. Verify documents have correct userId and roomId" -ForegroundColor Gray
Write-Host "   3. Ensure timestamp is recent (not old data)" -ForegroundColor Gray
Write-Host "   4. Check JWT token hasn't expired (valid for 7 days)" -ForegroundColor Gray

Write-Host "`n✅ Test completed!" -ForegroundColor Green
