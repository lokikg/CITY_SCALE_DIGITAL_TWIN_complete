from locust import HttpUser, TaskSet, task, between
import random
import string
import os
import json

API_BASE = os.getenv("LOCUST_API_BASE", "http://localhost:5000/api")
DEVICE_TYPES = [
    "traffic_sensors", "air_quality_sensors", "noise_sensors", "weather_stations",
    "smart_meters", "waste_bins", "parking_sensors", "street_lights",
    "public_transport_trackers", "surveillance_cameras", "water_quality_sensors",
    "energy_grid_sensors"
]

# Example payloads for each device type (customize as needed)
EXAMPLE_PAYLOADS = {
    "traffic_sensors": {
        "location": "Main St", "vehicle_count": 42, "avg_speed": 35.5
    },
    "air_quality_sensors": {
        "location": "Park", "pm25": 12.5, "pm10": 20.1, "no2": 0.03, "co": 0.7
    },
    "noise_sensors": {
        "location": "Downtown", "decibel_level": 65.2
    },
    "weather_stations": {
        "location": "Rooftop", "temperature": 28.5, "humidity": 60.0, "rainfall": 0.0, "wind_speed": 5.2
    },
    "smart_meters": {
        "location": "Building A", "electricity_usage": 120.5, "water_usage": 30.2
    },
    "waste_bins": {
        "location": "Corner", "fill_level": 80.0, "temperature": 22.0
    },
    "parking_sensors": {
        "location": "Lot 1", "is_occupied": False
    },
    "street_lights": {
        "location": "Avenue", "status": True, "energy_consumption": 15.2
    },
    "public_transport_trackers": {
        "location": "Route 5", "bus_id": "BUS123", "occupancy": 30
    },
    "surveillance_cameras": {
        "location": "Mall", "motion_detected": True, "object_count": 5
    },
    "water_quality_sensors": {
        "location": "Lake", "ph": 7.2, "turbidity": 1.5, "dissolved_oxygen": 8.1
    },
    "energy_grid_sensors": {
        "location": "Substation", "voltage": 230.0, "current": 10.5, "frequency": 50.0
    }
}

def random_id():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=8))

class DeviceTaskSet(TaskSet):
    @task(2)
    def add_device(self):
        device_type = random.choice(DEVICE_TYPES)
        payload = EXAMPLE_PAYLOADS[device_type].copy()
        payload["id"] = random_id()
        url = f"{API_BASE}/{device_type}/add"
        self.client.post(url, json=payload)

    @task(2)
    def get_all_devices(self):
        device_type = random.choice(DEVICE_TYPES)
        url = f"{API_BASE}/{device_type}/all"
        self.client.get(url)

    @task(1)
    def get_latest_device(self):
        device_type = random.choice(DEVICE_TYPES)
        url = f"{API_BASE}/{device_type}/latest"
        self.client.get(url)

    @task(1)
    def update_device(self):
        device_type = random.choice(DEVICE_TYPES)
        payload = EXAMPLE_PAYLOADS[device_type].copy()
        payload["id"] = random_id()
        # Add first
        add_url = f"{API_BASE}/{device_type}/add"
        resp = self.client.post(add_url, json=payload)
        if resp.status_code == 200:
            device_id = resp.json().get("id", payload["id"])
            update_url = f"{API_BASE}/{device_type}/{device_id}"
            self.client.put(update_url, json=payload)

    @task(1)
    def delete_device(self):
        device_type = random.choice(DEVICE_TYPES)
        payload = EXAMPLE_PAYLOADS[device_type].copy()
        payload["id"] = random_id()
        # Add first
        add_url = f"{API_BASE}/{device_type}/add"
        resp = self.client.post(add_url, json=payload)
        if resp.status_code == 200:
            device_id = resp.json().get("id", payload["id"])
            delete_url = f"{API_BASE}/{device_type}/{device_id}"
            self.client.delete(delete_url)

class WebsiteUser(HttpUser):
    tasks = [DeviceTaskSet]
    wait_time = between(1, 3)
