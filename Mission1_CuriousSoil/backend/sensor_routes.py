# sensor_routes.py
from flask import Blueprint, jsonify, request

sensor_bp = Blueprint("sensor_bp", __name__)

# Example simulated data
sensor_data = {
    "temperature": 23.5,
    "humidity": 61,
    "soil_moisture": 47
}

@sensor_bp.route("/data", methods=["GET"])
def get_sensor_data():
    return jsonify(sensor_data)

@sensor_bp.route("/update", methods=["POST"])
def update_sensor_data():
    new_data = request.json
    sensor_data.update(new_data)
    return jsonify({"message": "Data updated", "new_data": sensor_data})
