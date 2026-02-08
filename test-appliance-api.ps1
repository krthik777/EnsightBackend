# Appliance Management Test Script
# This script tests all appliance management endpoints

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Appliance Management API Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:3000"

# Test 1: Login
Write-Host "Test 1: Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "john.doe@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/user/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful" -ForegroundColor Green
    $headers = @{
        "Authorization" = "Bearer $token"
    }
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Get Appliance Types
Write-Host "Test 2: Getting appliance types..." -ForegroundColor Yellow
try {
    $typesResponse = Invoke-RestMethod -Uri "$BASE_URL/api/appliances/types" -Method GET -Headers $headers
    Write-Host "✅ Found $($typesResponse.count) appliance types" -ForegroundColor Green
    Write-Host "   Sample types: $($typesResponse.data[0..2].value -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Rooms
Write-Host "Test 3: Getting rooms..." -ForegroundColor Yellow
try {
    $roomsResponse = Invoke-RestMethod -Uri "$BASE_URL/api/room" -Method GET -Headers $headers
    if ($roomsResponse.data.Count -gt 0) {
        $testRoom = $roomsResponse.data[0]
        $roomId = $testRoom._id
        Write-Host "✅ Found $($roomsResponse.count) room(s)" -ForegroundColor Green
        Write-Host "   Using room: $($testRoom.name) (ID: $roomId)" -ForegroundColor Gray
        Write-Host "   Appliances in room: $($testRoom.applianceCount)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  No rooms found. Please seed database first." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Create New Appliance
Write-Host "Test 4: Creating new appliance..." -ForegroundColor Yellow
$newAppliance = @{
    roomId = $roomId
    name = "Test Coffee Maker"
    type = "Coffee Maker"
    brand = "TestBrand"
    estimatedWattage = 800
    usageHoursPerDay = 1
    notes = "Created via test script"
    color = "#10b981"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$BASE_URL/api/appliances" -Method POST -Body $newAppliance -Headers $headers -ContentType "application/json"
    $applianceId = $createResponse.data._id
    Write-Host "✅ Appliance created successfully" -ForegroundColor Green
    Write-Host "   ID: $applianceId" -ForegroundColor Gray
    Write-Host "   Name: $($createResponse.data.name)" -ForegroundColor Gray
    Write-Host "   Estimated Daily: $($createResponse.data.estimatedDailyConsumption) kWh" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get All Appliances
Write-Host "Test 5: Getting all appliances..." -ForegroundColor Yellow
try {
    $appliancesResponse = Invoke-RestMethod -Uri "$BASE_URL/api/appliances" -Method GET -Headers $headers
    Write-Host "✅ Found $($appliancesResponse.count) appliance(s)" -ForegroundColor Green
    Write-Host "   Total daily consumption: $($appliancesResponse.summary.estimatedDailyConsumption) kWh" -ForegroundColor Gray
    Write-Host "   Active appliances: $($appliancesResponse.summary.activeAppliances)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get Appliances by Room
Write-Host "Test 6: Getting appliances for room..." -ForegroundColor Yellow
try {
    $roomAppliancesResponse = Invoke-RestMethod -Uri "$BASE_URL/api/appliances/room/$roomId" -Method GET -Headers $headers
    Write-Host "✅ Found $($roomAppliancesResponse.count) appliance(s) in room" -ForegroundColor Green
    Write-Host "   Room: $($roomAppliancesResponse.room.name)" -ForegroundColor Gray
    Write-Host "   Total wattage: $($roomAppliancesResponse.summary.totalEstimatedWattage) W" -ForegroundColor Gray
    Write-Host "   Threshold usage: $($roomAppliancesResponse.summary.thresholdUsagePercent)%" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Get Single Appliance
if ($applianceId) {
    Write-Host "Test 7: Getting single appliance..." -ForegroundColor Yellow
    try {
        $singleResponse = Invoke-RestMethod -Uri "$BASE_URL/api/appliances/$applianceId" -Method GET -Headers $headers
        Write-Host "✅ Retrieved appliance details" -ForegroundColor Green
        Write-Host "   Name: $($singleResponse.data.name)" -ForegroundColor Gray
        Write-Host "   Type: $($singleResponse.data.type)" -ForegroundColor Gray
        Write-Host "   Power: $($singleResponse.data.estimatedWattage) W" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 8: Update Appliance
if ($applianceId) {
    Write-Host "Test 8: Updating appliance..." -ForegroundColor Yellow
    $updateData = @{
        usageHoursPerDay = 2
        notes = "Updated via test script"
    } | ConvertTo-Json

    try {
        $updateResponse = Invoke-RestMethod -Uri "$BASE_URL/api/appliances/$applianceId" -Method PUT -Body $updateData -Headers $headers -ContentType "application/json"
        Write-Host "✅ Appliance updated successfully" -ForegroundColor Green
        Write-Host "   New usage hours: $($updateResponse.data.usageHoursPerDay) hrs/day" -ForegroundColor Gray
        Write-Host "   New daily consumption: $($updateResponse.data.estimatedDailyConsumption) kWh" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 9: Bulk Create Appliances
Write-Host "Test 9: Bulk creating appliances..." -ForegroundColor Yellow
$bulkData = @{
    roomId = $roomId
    appliances = @(
        @{
            name = "Test LED 1"
            type = "Lights"
            estimatedWattage = 15
            usageHoursPerDay = 6
        },
        @{
            name = "Test LED 2"
            type = "Lights"
            estimatedWattage = 15
            usageHoursPerDay = 6
        },
        @{
            name = "Test Fan"
            type = "Fan"
            estimatedWattage = 75
            usageHoursPerDay = 8
        }
    )
} | ConvertTo-Json -Depth 3

try {
    $bulkResponse = Invoke-RestMethod -Uri "$BASE_URL/api/appliances/bulk" -Method POST -Body $bulkData -Headers $headers -ContentType "application/json"
    Write-Host "✅ Created $($bulkResponse.count) appliances in bulk" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 10: Create Room with Appliances
Write-Host "Test 10: Creating room with appliances..." -ForegroundColor Yellow
$newRoomData = @{
    name = "Test Room $(Get-Random -Maximum 999)"
    icon = "home"
    threshold = 2000
    appliances = @(
        @{
            name = "Room Fan"
            type = "Fan"
            estimatedWattage = 75
            usageHoursPerDay = 10
        },
        @{
            name = "Room Light"
            type = "Lights"
            estimatedWattage = 60
            usageHoursPerDay = 8
        }
    )
} | ConvertTo-Json -Depth 3

try {
    $newRoomResponse = Invoke-RestMethod -Uri "$BASE_URL/api/room" -Method POST -Body $newRoomData -Headers $headers -ContentType "application/json"
    Write-Host "✅ Room created with appliances" -ForegroundColor Green
    Write-Host "   Room: $($newRoomResponse.data.room.name)" -ForegroundColor Gray
    Write-Host "   Appliances added: $($newRoomResponse.data.applianceCount)" -ForegroundColor Gray
    $newRoomId = $newRoomResponse.data.room._id
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 11: Delete Appliance
if ($applianceId) {
    Write-Host "Test 11: Deleting appliance..." -ForegroundColor Yellow
    try {
        $deleteResponse = Invoke-RestMethod -Uri "$BASE_URL/api/appliances/$applianceId" -Method DELETE -Headers $headers
        Write-Host "✅ Appliance deleted successfully" -ForegroundColor Green
        Write-Host "   Deleted: $($deleteResponse.data.name)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Cleanup: Delete test room
if ($newRoomId) {
    Write-Host "Cleanup: Deleting test room..." -ForegroundColor Gray
    try {
        Invoke-RestMethod -Uri "$BASE_URL/api/room/$newRoomId" -Method DELETE -Headers $headers | Out-Null
        Write-Host "✅ Test room deleted" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not delete test room" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All appliance management endpoints tested!" -ForegroundColor Green
Write-Host ""
Write-Host "Features Tested:" -ForegroundColor White
Write-Host "  ✅ Get appliance types" -ForegroundColor Green
Write-Host "  ✅ Create appliance" -ForegroundColor Green
Write-Host "  ✅ Get all appliances" -ForegroundColor Green
Write-Host "  ✅ Get appliances by room" -ForegroundColor Green
Write-Host "  ✅ Get single appliance" -ForegroundColor Green
Write-Host "  ✅ Update appliance" -ForegroundColor Green
Write-Host "  ✅ Bulk create appliances" -ForegroundColor Green
Write-Host "  ✅ Create room with appliances" -ForegroundColor Green
Write-Host "  ✅ Delete appliance" -ForegroundColor Green
Write-Host ""
Write-Host "Check APPLIANCE_MANAGEMENT_API.md for full documentation" -ForegroundColor Gray
Write-Host ""
