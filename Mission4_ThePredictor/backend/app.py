from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import math

# --- CONFIGURATION AND DATA ---

# Tunisian Arabic day and month names for localization
TUNISIAN_MONTHS = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
WEATHER_FACTORS = [1.0, 1.1, 0.8, 1.2, 1.05, 0.9, 1.15] # Mocked weather factors for 7 days

INITIAL_PLANT_CONFIGS = [
    {
        'plantId': 'tomato-101',
        'plantName': 'طماطم - هيرلوم',
        'soilDeficit': 0.35, # 35% deficit
        'color': '#dc2626', # Red-600
        'baseETc': 4.0, # Base daily crop water requirement (mm)
    },
    {
        'plantId': 'mint-202',
        'plantName': 'نعناع - فلفلي',
        'soilDeficit': 0.10, # 10% deficit
        'color': '#16a34a', # Green-600
        'baseETc': 2.5,
    },
    {
        'plantId': 'onion-303',
        'plantName': 'بصل - أصفر',
        'soilDeficit': 0.25, # 25% deficit
        'color': '#d97706', # Yellow-600
        'baseETc': 3.0,
    },
]

# --- CORE IRRIGATION CALCULATION ---

def calculate_weekly_schedule(config):
    """
    Calculates the 7-day irrigation schedule for a single plant configuration.
    This logic mirrors the original React component's calculation.
    """
    schedule = []
    today = datetime.now()

    for i in range(7):
        date = today + timedelta(days=i)
        
        day = DAYS_OF_WEEK[date.weekday() % 7] 
        day_num = date.day
        month_name = TUNISIAN_MONTHS[date.month - 1]
        date_str = f"{day_num} {month_name}"

        # Mock Weather Simulation (aligned with weatherFactors)
        rain_mm = 0
        if i == 2: rain_mm = 6.0  # Rain on day 3
        if i == 5: rain_mm = 1.5  # Light rain on day 6

        # ETc CALCULATION (Crop Evapotranspiration)
        factor = WEATHER_FACTORS[i]
        etc_mm = round(config['baseETc'] * factor, 1)

        # Simplified Mock Water Need Calculation:
        # We calculate needed water based on ETc, deficit, minus any rain.
        deficit_buffer = config['soilDeficit'] * 10 
        needed_mm = max(0, etc_mm + deficit_buffer - rain_mm)
        
        # Round up to the nearest 0.5mm for realistic irrigation steps
        needed_mm = math.ceil(needed_mm / 0.5) * 0.5
        needed_mm = round(needed_mm, 1)

        schedule.append({
            'day': day,
            'date': date_str,
            'rain_mm': round(rain_mm, 1),
            'etc_mm': etc_mm,
            'needed_mm': needed_mm,
        })

    return { **config, 'schedule': schedule }

# --- FLASK APPLICATION SETUP ---

app = Flask(__name__)
# Enable CORS for the frontend running on a different port (e.g., in the canvas environment)
CORS(app) 

@app.route('/api/v1/weekly-forecast', methods=['GET'])
def get_weekly_forecast():
    """
    API endpoint to return the calculated weekly irrigation forecasts for all plants.
    """
    all_forecasts = [calculate_weekly_schedule(config) for config in INITIAL_PLANT_CONFIGS]
    
    return jsonify(all_forecasts)

if __name__ == '__main__':
    # Run the server on the standard Flask port
    app.run(debug=True, port=5000)
