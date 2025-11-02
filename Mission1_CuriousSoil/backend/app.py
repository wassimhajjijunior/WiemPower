from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import threading
import requests
import datetime
import math # Needed for wind speed calculation helper
import sys
import os

# --- MODEL IMPORT ---
# Ensure 'irrigation_model.py' is in the same directory!
try:
    from irrigation_model import get_daily_irrigation_recommendation, get_location_data
except ImportError:
    print("FATAL ERROR: Could not import 'irrigation_model.py'. Ensure the model file is present.")
    sys.exit(1)

app = Flask(__name__)
CORS(app) 

# --- CONFIGURATION (Agronomy & Location) ---

# Location data (Fetching Zaghouan data once on startup)
LOCATION_NAME = "Zaghouan"
LOCATION_DATA = get_location_data(LOCATION_NAME) 

if not LOCATION_DATA:
    print(f"FATAL ERROR: Could not get location data for {LOCATION_NAME}. Using default placeholders.")
    # Use fallback data if API call fails
    LOCATION_DATA = {
        "latitude": 36.41, 
        "longitude": 10.14, 
        "elevation": 420.0,
        "timezone": "Africa/Tunis",
        "name": LOCATION_NAME # Add name for logging
    }

# Crop-specific parameters for the AI model
CROP_AGRONOMY = {
    # Kc (Crop Coefficient), Root Depth (mm), Field Capacity (%), Wilting Point (%)
    'tomato-101': {'Kc': 1.0, 'root_depth_mm': 600, 'field_capacity': 35.0, 'wilting_point': 15.0},
    'mint-202': {'Kc': 0.95, 'root_depth_mm': 200, 'field_capacity': 35.0, 'wilting_point': 15.0},
    'onion-303': {'Kc': 1.1, 'root_depth_mm': 400, 'field_capacity': 35.0, 'wilting_point': 15.0},
}


# --- In-Memory Plant State (Simulates Database/Hardware State) ---
plant_states = {
    'tomato-101': {'waterLevel': 75.0, 'isPumpOn': False}, # Sufficient water (Will likely get 'OFF' recommendation)
    'mint-202': {'waterLevel': 45.0, 'isPumpOn': True},    # Watering in progress (Moisture increasing)
    'onion-303': {'waterLevel': 15.0, 'isPumpOn': False},  # Critically low water (Will likely get 'ON' recommendation)
}

# --- Polling Simulation Logic (Runs in a separate thread) ---

def run_simulation():
    """Simulates water consumption/filling over time."""
    while True:
        # Simulate data change for all plants
        for plant_id in plant_states:
            state = plant_states[plant_id]
            
            # Water level change logic (consumption vs. filling)
            if state['isPumpOn']:
                # If pump is ON, water level increases slowly (filling)
                state['waterLevel'] = min(100.0, state['waterLevel'] + 0.5)
            else:
                # If pump is OFF, water level decreases slowly (consumption)
                state['waterLevel'] = max(0.0, state['waterLevel'] - 0.25)
            
            # Round to one decimal place
            state['waterLevel'] = round(state['waterLevel'], 1)
            
        time.sleep(2) # Update simulation every 2 seconds

# Start the simulation thread in the background
simulation_thread = threading.Thread(target=run_simulation)
simulation_thread.daemon = True 
simulation_thread.start()


# --- API Endpoints (Prefix: /api/v1) ---

@app.route('/api/v1/plants/<plant_id>/status', methods=['GET'])
def get_plant_status(plant_id):
    """
    Endpoint 1: GET Status (Read Sensor Data) - NOW INCLUDES AI RECOMMENDATION
    """
    state = plant_states.get(plant_id)

    if not state:
        return jsonify({'error': f'Plant ID {plant_id} not found.'}), 404

    # 1. Get current sensor data
    current_water_level = state['waterLevel']
    
    # 2. Get agronomy parameters for the plant
    agronomy = CROP_AGRONOMY.get(plant_id)
    if not agronomy:
        # Fallback if plant is not defined in agronomy settings
        agronomy = CROP_AGRONOMY['tomato-101'] # Default to Tomato settings

    # 3. Call the sophisticated AI model
    ai_report = get_daily_irrigation_recommendation(
        lat=LOCATION_DATA['latitude'],
        lon=LOCATION_DATA['longitude'],
        z=LOCATION_DATA['elevation'],
        Kc=agronomy['Kc'],
        soil_moisture_percent=current_water_level,
        field_capacity=agronomy['field_capacity'],
        wilting_point=agronomy['wilting_point'],
        root_depth_mm=agronomy['root_depth_mm']
    )

    # 4. Determine Simple Alert based on the AI's recommendation
    # An alert is active if the AI says the pump should be ON.
    is_alert_active = ai_report.get('recommended_pump_state', False)
    
    # Log the request
    print(f"[GET] Status requested for {plant_id}. Water={current_water_level}%. AI Rec: {'ON' if is_alert_active else 'OFF'}")

    # Return the current state + AI report
    return jsonify({
        'plantId': plant_id,
        'waterLevel': current_water_level,
        'isPumpOn': state['isPumpOn'],
        'alertActive': is_alert_active, # Alert is triggered by AI recommendation
        'lastUpdated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'aiReport': ai_report # Full, detailed AI recommendation report
    })


@app.route('/api/v1/plants/<plant_id>/pump', methods=['PUT'])
def update_pump_state(plant_id):
    """
    Endpoint 2: PUT Pump Control (Write Command)
    """
    state_data = request.get_json()
    new_state = state_data.get('state')

    plant = plant_states.get(plant_id)

    if not plant:
        return jsonify({'error': f'Plant ID {plant_id} not found.'}), 404

    if not isinstance(new_state, bool):
        return jsonify({'error': 'Invalid state value. Must be true or false.'}), 400

    # Update the in-memory state:
    plant['isPumpOn'] = new_state

    # Log the command
    print(f"[PUT] Pump control received for {plant_id}. New state: {new_state}")

    # Send a success response back to the frontend
    return jsonify({
        'success': True,
        'plantId': plant_id,
        'message': f"Pump set to {'ON' if new_state else 'OFF'}."
    })


if __name__ == '__main__':
    print('--- SMART GARDEN MOCK BACKEND (Flask) ---')
    print(f"Location configured for: {LOCATION_DATA.get('name', LOCATION_NAME)} ({LOCATION_DATA['latitude']:.2f}, {LOCATION_DATA['longitude']:.2f})")
    print('Starting background water simulation and AI integration...')
    print('-------------------------------------------')
    # Use 0.0.0.0 to make it accessible from other devices/containers if needed
    app.run(host='0.0.0.0', port=5000, debug=False)
