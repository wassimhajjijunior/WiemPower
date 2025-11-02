#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// === CONFIG ===
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* backend_url = "http://YOUR_BACKEND_IP:5000/api/v1/irrigate";

// Pins & Constants
const int RELAY_PIN = 2;        // GPIO pin for relay control
const int FLOW_PIN = 4;         // GPIO pin for flow sensor
const int MOISTURE_PIN = 34;    // Analog pin for moisture sensor
const float FLOW_RATE = 300.0;  // ml/min (calibrate for your pump)
const float PULSE_PER_ML = 4.5; // For YF-S201 flow sensor; calibrate

// Globals
volatile float water_delivered = 0.0;
unsigned long last_poll = 0;
const unsigned long POLL_INTERVAL = 300000;  // 5 min
float moisture_level = 0.0;

void IRAM_ATTR flow_pulse() {
  water_delivered += (1.0 / PULSE_PER_ML);
}

void setup() {
  Serial.begin(115200);
  
  // Pin Setup
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(FLOW_PIN, INPUT_PULLUP);
  pinMode(MOISTURE_PIN, INPUT);
  
  digitalWrite(RELAY_PIN, LOW);  // Ensure pump starts off
  
  // Setup flow sensor interrupt
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flow_pulse, FALLING);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.println("IP address: " + WiFi.localIP().toString());
}

void loop() {
  if (millis() - last_poll > POLL_INTERVAL) {
    moisture_level = readMoisture();
    fetch_and_water();
    last_poll = millis();
  }
  delay(1000);
}

float readMoisture() {
  int raw = analogRead(MOISTURE_PIN);
  // Convert to percentage (calibrate these values for your sensor)
  return map(raw, 4095, 0, 0, 100);
}

void fetch_and_water() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["moisture"] = moisture_level;
    doc["last_watered"] = millis();
    
    String json;
    serializeJson(doc, json);
    
    // Send GET request with current status
    http.begin(String(backend_url) + "?moisture=" + String(moisture_level));
    int httpCode = http.GET();

    if (httpCode == 200) {
      String payload = http.getString();
      DynamicJsonDocument response(1024);
      DeserializationError error = deserializeJson(response, payload);
      
      if (!error) {
        bool should_water = response["water"];
        float amount_ml = response["amount_ml"];

        Serial.printf("Backend response: water=%s, amount=%.1f ml\n", 
                     should_water ? "true" : "false", amount_ml);

        if (should_water) {
          water_pump(amount_ml);
        }
      }
    } else {
      Serial.printf("HTTP Error: %d\n", httpCode);
    }
    http.end();
  }
}

void water_pump(float target_ml) {
  water_delivered = 0.0;  // Reset counter
  digitalWrite(RELAY_PIN, HIGH);  // Turn on pump
  
  unsigned long start_time = millis();
  float runtime_sec = (target_ml / FLOW_RATE) * 60.0;
  
  Serial.printf("Starting to pump %.1f ml (estimated time: %.1f sec)\n", 
                target_ml, runtime_sec);

  // Monitor until target reached or timeout
  while (water_delivered < target_ml && 
         (millis() - start_time) < (runtime_sec * 1000 + 5000)) {
    if (water_delivered >= target_ml) break;
    
    // Safety check - stop if moisture is very high
    if (readMoisture() > 90) {
      Serial.println("Emergency stop: Moisture too high!");
      break;
    }
    
    delay(100);
    
    if (millis() % 1000 == 0) {  // Progress update every second
      Serial.printf("Progress: %.1f/%.1f ml\n", water_delivered, target_ml);
    }
  }

  stop_pump();
  send_feedback(target_ml, water_delivered);
}

void stop_pump() {
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("Pump stopped");
}

void send_feedback(float requested, float actual) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Create feedback JSON
    StaticJsonDocument<200> doc;
    doc["requested_ml"] = requested;
    doc["delivered_ml"] = actual;
    doc["moisture"] = readMoisture();
    
    String json;
    serializeJson(doc, json);
    
    // Send POST request
    http.begin(String(backend_url) + "/feedback");
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST(json);
    
    if (httpCode == 200) {
      Serial.println("Feedback sent successfully");
    } else {
      Serial.printf("Failed to send feedback: %d\n", httpCode);
    }
    http.end();
  }
}