# Smart Pump Control System

This system consists of two main components:
1. ESP32 firmware for controlling the water pump
2. Flask backend for intelligent irrigation decisions

## Hardware Requirements

- ESP32 development board
- Relay module for pump control
- YF-S201 water flow sensor (or similar)
- Capacitive soil moisture sensor
- Water pump (12V DC recommended)
- Power supply for pump
- Jumper wires and breadboard

## Firmware Setup (ESP32)

1. Install Required Libraries in Arduino IDE:
   - WiFi
   - HTTPClient
   - ArduinoJson

2. Configure `smart_pump.ino`:
   - Set your WiFi credentials
   - Update the backend URL
   - Calibrate FLOW_RATE and PULSE_PER_ML for your pump/sensor
   - Adjust pin numbers if needed

3. Upload to ESP32

## Backend Setup

1. Install Python requirements:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Run the Flask server:
   ```bash
   python app.py
   ```

## System Operation

1. The ESP32 will:
   - Read soil moisture every 5 minutes
   - Send data to backend
   - Control pump based on backend response
   - Monitor water flow
   - Send feedback after watering

2. The backend will:
   - Process moisture readings
   - Calculate required water amount
   - Maintain watering history
   - Enforce safety limits and cooldown periods
   - Provide API endpoints for monitoring

## API Endpoints

- GET `/api/v1/irrigate?moisture=XX`
  - Check if watering is needed
  - Returns water amount if needed

- POST `/api/v1/irrigate/feedback`
  - Receives watering results
  - Updates history

- GET `/api/v1/history`
  - View watering history

## Safety Features

1. Moisture threshold limits
2. Maximum water amount per session
3. Minimum time between waterings
4. Emergency stop if soil too wet
5. Pump runtime limits
6. Flow monitoring feedback

## Troubleshooting

1. If pump doesn't start:
   - Check relay connections
   - Verify power supply
   - Check serial output for errors

2. If flow sensor not working:
   - Verify wiring
   - Check interrupt pin
   - Calibrate pulse rate

3. If moisture readings are incorrect:
   - Calibrate sensor
   - Check sensor placement
   - Verify wiring