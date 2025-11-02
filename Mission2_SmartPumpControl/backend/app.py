from flask import Flask, request, jsonify
from datetime import datetime, timedelta
import logging
import json
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
MOISTURE_THRESHOLD = 30  # Water when below this percentage
MAX_WATER_AMOUNT = 500  # Maximum ml per watering
MIN_WATER_AMOUNT = 50   # Minimum ml per watering
WATERING_COOLDOWN = timedelta(hours=6)  # Minimum time between waterings

# Store the last watering time and amount
class WateringHistory:
    def __init__(self):
        self.last_watering = None
        self.history = []
        self.load_history()
    
    def load_history(self):
        try:
            if os.path.exists('watering_history.json'):
                with open('watering_history.json', 'r') as f:
                    data = json.load(f)
                    self.last_watering = datetime.fromisoformat(data['last_watering']) if data.get('last_watering') else None
                    self.history = data.get('history', [])
        except Exception as e:
            logger.error(f"Error loading history: {e}")
    
    def save_history(self):
        try:
            with open('watering_history.json', 'w') as f:
                json.dump({
                    'last_watering': self.last_watering.isoformat() if self.last_watering else None,
                    'history': self.history
                }, f)
        except Exception as e:
            logger.error(f"Error saving history: {e}")
    
    def add_watering(self, amount, moisture_before):
        now = datetime.now()
        self.last_watering = now
        self.history.append({
            'timestamp': now.isoformat(),
            'amount_ml': amount,
            'moisture_before': moisture_before
        })
        # Keep only last 100 entries
        self.history = self.history[-100:]
        self.save_history()

history = WateringHistory()

def calculate_water_amount(moisture_level):
    """Calculate how much water to give based on moisture level."""
    if moisture_level >= MOISTURE_THRESHOLD:
        return 0
    
    # More water needed when soil is drier
    deficit = MOISTURE_THRESHOLD - moisture_level
    amount = MIN_WATER_AMOUNT + (deficit / 100.0) * (MAX_WATER_AMOUNT - MIN_WATER_AMOUNT)
    
    return min(max(amount, MIN_WATER_AMOUNT), MAX_WATER_AMOUNT)

@app.route('/api/v1/irrigate', methods=['GET'])
def check_irrigation():
    try:
        moisture = float(request.args.get('moisture', 0))
        logger.info(f"Received moisture level: {moisture}%")
        
        # Check if enough time has passed since last watering
        if history.last_watering and datetime.now() - history.last_watering < WATERING_COOLDOWN:
            logger.info("Still in cooldown period")
            return jsonify({
                'water': False,
                'amount_ml': 0,
                'reason': 'cooldown'
            })
        
        # Calculate if watering is needed
        amount = calculate_water_amount(moisture)
        should_water = amount > 0
        
        if should_water:
            logger.info(f"Recommending watering of {amount}ml")
        
        return jsonify({
            'water': should_water,
            'amount_ml': amount
        })
        
    except Exception as e:
        logger.error(f"Error in check_irrigation: {e}")
        return jsonify({
            'water': False,
            'amount_ml': 0,
            'error': str(e)
        }), 500

@app.route('/api/v1/irrigate/feedback', methods=['POST'])
def irrigation_feedback():
    try:
        data = request.get_json()
        requested = data.get('requested_ml', 0)
        delivered = data.get('delivered_ml', 0)
        moisture = data.get('moisture', 0)
        
        logger.info(f"Watering feedback - Requested: {requested}ml, "
                   f"Delivered: {delivered}ml, New moisture: {moisture}%")
        
        # Record the watering
        history.add_watering(delivered, moisture)
        
        return jsonify({'status': 'success'})
        
    except Exception as e:
        logger.error(f"Error in irrigation_feedback: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/history', methods=['GET'])
def get_history():
    try:
        return jsonify({
            'last_watering': history.last_watering.isoformat() if history.last_watering else None,
            'history': history.history
        })
    except Exception as e:
        logger.error(f"Error getting history: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)