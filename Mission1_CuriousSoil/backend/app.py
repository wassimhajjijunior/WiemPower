# app.py

from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import threading

app = Flask(__name__)
# Enable CORS for all origins, allowing your React app to connect
CORS(app) 

# --- In-Memory Plant State (Simulates Database/Hardware State) ---

# This object holds the current state for all your plants, indexed by plantId.
plant_states = {
    'tomato-101': {'waterLevel': 75.0, 'isPumpOn': False},
    'mint-202': {'waterLevel': 45.0, 'isPumpOn': True},
    'onion-303': {'waterLevel': 15.0, 'isPumpOn': False},
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
simulation_thread.daemon = True # Allows the main program to exit even if thread is running
simulation_thread.start()


# --- API Endpoints (Prefix: /api/v1) ---

@app.route('/api/v1/plants/<plant_id>/status', methods=['GET'])
def get_plant_status(plant_id):
    """
    Endpoint 1: GET Status (Read Sensor Data)
    Used by the frontend's polling mechanism.
    """
    state = plant_states.get(plant_id)

    if not state:
        return jsonify({'error': f'Plant ID {plant_id} not found.'}), 404

    # Log the request
    print(f"[GET] Status requested for {plant_id}: Water={state['waterLevel']}%, Pump={state['isPumpOn']}")

    # Return the current state
    return jsonify({
        'plantId': plant_id,
        'waterLevel': state['waterLevel'],
        'isPumpOn': state['isPumpOn'],
        'lastUpdated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    })


@app.route('/api/v1/plants/<plant_id>/pump', methods=['PUT'])
def update_pump_state(plant_id):
    """
    Endpoint 2: PUT Pump Control (Write Command)
    Used by the frontend's button clicks.
    """
    state_data = request.get_json()
    new_state = state_data.get('state')

    plant = plant_states.get(plant_id)

    if not plant:
        return jsonify({'error': f'Plant ID {plant_id} not found.'}), 404

    if not isinstance(new_state, bool):
        return jsonify({'error': 'Invalid state value. Must be true or false.'}), 400

    # --- Hardware Interface Point ---
    # In a real application, THIS is where you would send a command 
    # (e.g., via MQTT or a direct HTTP call) to your physical hardware.
    # For now, we just update the in-memory state:
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
    print('Starting background water simulation...')
    print('-------------------------------------------')
    # Use 0.0.0.0 to make it accessible from other devices/containers if needed
    # Default port is 5000
    app.run(host='0.0.0.0', port=5000, debug=False)