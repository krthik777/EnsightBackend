#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- WiFi credentials ---
const char* ssid = "Wokwi-GUEST";  // Built-in Wokwi WiFi
const char* password = "";

// --- Backend API endpoint ---
const char* serverURL = "<backend_server_url>/api/power";  // Replace with your backend server URL

// --- User and Room IDs (replace with real MongoDB IDs) ---
const char* userId = "6713cbd2a1bcd36abc123456";  
const char* roomId = "6713cbfea1bcd36abc654321";  

// --- Constants ---
const float mainsVoltage = 230.0;
const unsigned long sendInterval = 10000;  // 10 seconds
unsigned long lastSendTime = 0;

// --- Setup ---
void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected to WiFi!");
}

// --- Loop ---
void loop() {
  unsigned long currentMillis = millis();

  // Send every 10 seconds
  if (currentMillis - lastSendTime >= sendInterval) {
    lastSendTime = currentMillis;

    // Simulated current values (you can replace this with sensor data)
    float currentRMS = 3.0 + 2.0 * sin(millis() / 1500.0); // 3A ±2A
    float apparentPower = mainsVoltage * currentRMS;

    // Create JSON payload
    StaticJsonDocument<256> doc;
    doc["timestamp"] = millis();
    doc["current_rms_a"] = currentRMS;
    doc["apparent_power_va"] = apparentPower;
    doc["userId"] = userId;
    doc["roomId"] = roomId;

    String jsonStr;
    serializeJson(doc, jsonStr);

    // Print payload locally
    Serial.println(jsonStr);

    // Send to backend
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverURL);
      http.addHeader("Content-Type", "application/json");

      int httpResponseCode = http.POST(jsonStr);

      if (httpResponseCode > 0) {
        Serial.printf("✅ Data sent successfully! Response: %d\n", httpResponseCode);
        Serial.println(http.getString());
      } else {
        Serial.printf("❌ Send failed: %s\n", http.errorToString(httpResponseCode).c_str());
      }

      http.end();
    } else {
      Serial.println("⚠️ WiFi disconnected! Attempting reconnect...");
      WiFi.reconnect();
    }
  }
}
