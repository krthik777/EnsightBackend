/*
 * ESP32 Energy Monitor - Sample Code
 * 
 * This code demonstrates how to send power readings to the Energy Dashboard Backend
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - PZEM-004T or similar power monitoring module
 * - WiFi Connection
 * 
 * Libraries Required:
 * - WiFi.h (built-in)
 * - HTTPClient.h (built-in)
 * - ArduinoJson.h (install from Library Manager)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ========== Configuration ==========
// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend Server Configuration
const char* SERVER_URL = "http://192.168.1.100:5000/api/power";  // Change to your server IP
const char* USER_ID = "671234567890abcdef123456";  // Get from database after seeding
const char* ROOM_ID = "671234567890abcdef123457";  // Get from database after seeding

// Sensor Configuration
const int SAMPLE_INTERVAL = 5000;  // Send data every 5 seconds
const float VOLTAGE_CALIBRATION = 1.0;  // Adjust based on your sensor
const float CURRENT_CALIBRATION = 1.0;  // Adjust based on your sensor

// ========== Global Variables ==========
unsigned long lastSampleTime = 0;
float totalEnergy = 0.0;  // kWh

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════╗");
  Serial.println("║   ESP32 Energy Monitor             ║");
  Serial.println("║   Dashboard Backend Client         ║");
  Serial.println("╚════════════════════════════════════╝");
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize sensors (add your sensor initialization here)
  initSensors();
  
  Serial.println("\n✅ Setup complete!");
  Serial.println("Starting to monitor power...\n");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
  
  // Check if it's time to sample
  if (millis() - lastSampleTime >= SAMPLE_INTERVAL) {
    lastSampleTime = millis();
    
    // Read sensor data
    float voltage = readVoltage();
    float current = readCurrent();
    float power = voltage * current;  // Watts
    
    // Calculate energy consumed in this interval (kWh)
    float intervalHours = SAMPLE_INTERVAL / 3600000.0;  // Convert ms to hours
    float energyInterval = (power / 1000.0) * intervalHours;
    totalEnergy += energyInterval;
    
    // Display readings
    Serial.println("─────────────────────────────────────");
    Serial.printf("⚡ Voltage: %.2f V\n", voltage);
    Serial.printf("⚡ Current: %.2f A\n", current);
    Serial.printf("⚡ Power: %.2f W\n", power);
    Serial.printf("⚡ Energy: %.4f kWh\n", totalEnergy);
    Serial.println("─────────────────────────────────────");
    
    // Send data to backend
    sendToBackend(voltage, current, power, totalEnergy);
  }
  
  delay(100);  // Small delay to prevent watchdog reset
}

// ========== WiFi Functions ==========
void connectToWiFi() {
  Serial.print("📶 Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" ✅");
    Serial.print("📍 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("📶 Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println(" ❌ Failed!");
    Serial.println("⚠️  Check your WiFi credentials");
  }
}

// ========== Sensor Functions ==========
void initSensors() {
  Serial.println("🔧 Initializing sensors...");
  // Add your sensor initialization code here
  // Example: PZEM004T, INA219, etc.
  Serial.println("✅ Sensors initialized");
}

float readVoltage() {
  // Replace with actual sensor reading
  // Example for PZEM-004T:
  // return pzem.voltage();
  
  // Simulated data for testing:
  return 230.0 + random(-10, 10) * VOLTAGE_CALIBRATION;
}

float readCurrent() {
  // Replace with actual sensor reading
  // Example for PZEM-004T:
  // return pzem.current();
  
  // Simulated data for testing:
  return 2.0 + random(0, 5) * CURRENT_CALIBRATION;
}

// ========== Backend Communication ==========
void sendToBackend(float voltage, float current, float power, float energy) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Cannot send - WiFi not connected");
    return;
  }
  
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["userId"] = USER_ID;
  doc["roomId"] = ROOM_ID;
  doc["voltage"] = round(voltage * 100) / 100.0;
  doc["current"] = round(current * 100) / 100.0;
  doc["power"] = round(power * 100) / 100.0;
  doc["energy"] = round(energy * 10000) / 10000.0;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  // Send POST request
  Serial.print("📤 Sending to backend... ");
  int httpResponseCode = http.POST(jsonData);
  
  if (httpResponseCode > 0) {
    Serial.printf("✅ Success! (Code: %d)\n", httpResponseCode);
    
    // Print response
    String response = http.getString();
    Serial.print("📥 Response: ");
    Serial.println(response);
  } else {
    Serial.printf("❌ Error! (Code: %d)\n", httpResponseCode);
    Serial.println("⚠️  Check server URL and network connection");
  }
  
  http.end();
}

// ========== Utility Functions ==========
void printSeparator() {
  Serial.println("=========================================");
}

// Reset energy counter (call this daily or as needed)
void resetEnergyCounter() {
  totalEnergy = 0.0;
  Serial.println("🔄 Energy counter reset");
}
