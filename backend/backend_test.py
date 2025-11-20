import requests
import sys
import json
import argparse
from datetime import datetime

class CityDigitalTwinAPITester:
    def __init__(self, base_url="http://localhost:5000/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.device_ids = {}  # Store created device IDs for testing
        
        # All 12 device types with their required fields
        self.device_types = {
            "traffic_sensors": {
                "create_data": {"location": "Test Location", "vehicle_count": 50, "avg_speed": 35.5},
                "update_data": {"location": "Updated Location", "vehicle_count": 75, "avg_speed": 40.0}
            },
            "air_quality_sensors": {
                "create_data": {"location": "Test Location", "pm25": 25.5, "pm10": 45.0, "no2": 30.0, "co": 5.5},
                "update_data": {"location": "Updated Location", "pm25": 30.0, "pm10": 50.0, "no2": 35.0, "co": 6.0}
            },
            "noise_sensors": {
                "create_data": {"location": "Test Location", "decibel_level": 65.5},
                "update_data": {"location": "Updated Location", "decibel_level": 70.0}
            },
            "weather_stations": {
                "create_data": {"location": "Test Location", "temperature": 22.5, "humidity": 60.0, "rainfall": 5.0, "wind_speed": 15.0},
                "update_data": {"location": "Updated Location", "temperature": 25.0, "humidity": 65.0, "rainfall": 3.0, "wind_speed": 12.0}
            },
            "smart_meters": {
                "create_data": {"location": "Test Location", "electricity_usage": 250.75, "water_usage": 1500.50},
                "update_data": {"location": "Updated Location", "electricity_usage": 300.00, "water_usage": 1800.00}
            },
            "waste_bins": {
                "create_data": {"location": "Test Location", "fill_level": 45.5, "temperature": 25.0},
                "update_data": {"location": "Updated Location", "fill_level": 60.0, "temperature": 28.0}
            },
            "parking_sensors": {
                "create_data": {"location": "Test Location", "is_occupied": True},
                "update_data": {"location": "Updated Location", "is_occupied": False}
            },
            "street_lights": {
                "create_data": {"location": "Test Location", "status": True, "energy_consumption": 25.5},
                "update_data": {"location": "Updated Location", "status": False, "energy_consumption": 30.0}
            },
            "public_transport_trackers": {
                "create_data": {"bus_id": "TEST_BUS_001", "location": "Test Location", "occupancy": 25},
                "update_data": {"bus_id": "TEST_BUS_002", "location": "Updated Location", "occupancy": 30}
            },
            "surveillance_cameras": {
                "create_data": {"location": "Test Location", "motion_detected": True, "object_count": 5},
                "update_data": {"location": "Updated Location", "motion_detected": False, "object_count": 8}
            },
            "water_quality_sensors": {
                "create_data": {"location": "Test Location", "ph": 7.2, "turbidity": 2.5, "dissolved_oxygen": 8.5},
                "update_data": {"location": "Updated Location", "ph": 7.5, "turbidity": 2.0, "dissolved_oxygen": 9.0}
            },
            "energy_grid_sensors": {
                "create_data": {"location": "Test Location", "voltage": 230.5, "current": 25.0, "frequency": 50.0},
                "update_data": {"location": "Updated Location", "voltage": 235.0, "current": 30.0, "frequency": 50.1}
            }
        }

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        self.run_test("Root endpoint", "GET", "", 200)
        self.run_test("Health check", "GET", "health", 200)

    def test_device_crud_operations(self, device_type):
        """Test CRUD operations for a specific device type"""
        print(f"\n" + "="*50)
        print(f"TESTING {device_type.upper()} CRUD OPERATIONS")
        print("="*50)
        
        device_config = self.device_types[device_type]
        device_id = None
        
        # Test CREATE (add)
        success, response = self.run_test(
            f"Create {device_type}",
            "POST",
            f"{device_type}/add",
            200,  # Changed from 201 to 200 based on FastAPI default
            device_config["create_data"]
        )
        if success and isinstance(response, dict) and 'id' in response:
            device_id = response['id']
            self.device_ids[device_type] = device_id
            print(f"   Created device with ID: {device_id}")
        
        # Test READ ALL
        self.run_test(f"Get all {device_type}", "GET", f"{device_type}/all", 200)
        
        # Test READ BY ID (if we have an ID)
        if device_id:
            self.run_test(f"Get {device_type} by ID", "GET", f"{device_type}/{device_id}", 200)
        
        # Test UPDATE (if we have an ID)
        if device_id:
            self.run_test(
                f"Update {device_type}",
                "PUT",
                f"{device_type}/{device_id}",
                200,
                device_config["update_data"]
            )
        
        # Test LATEST
        self.run_test(f"Get latest {device_type}", "GET", f"{device_type}/latest", 200)
        
        # Test SIMULATE
        success, response = self.run_test(f"Simulate {device_type}", "POST", f"{device_type}/simulate", 200)
        if success and isinstance(response, dict) and 'id' in response:
            simulated_id = response['id']
            print(f"   Simulated device with ID: {simulated_id}")
        
        # Test DELETE (if we have an ID) - Do this last
        if device_id:
            self.run_test(f"Delete {device_type}", "DELETE", f"{device_type}/{device_id}", 200)

    def test_simulate_all(self):
        """Test the simulate_all endpoint"""
        print("\n" + "="*50)
        print("TESTING SIMULATE ALL DEVICES")
        print("="*50)
        
        success, response = self.run_test("Simulate all devices", "POST", "simulate_all", 200)
        if success and isinstance(response, dict):
            results = response.get('results', {})
            print(f"   Simulated {len(results)} device types")
            for device_type, result in results.items():
                if 'error' in result:
                    print(f"   ❌ {device_type}: {result['error']}")
                else:
                    print(f"   ✅ {device_type}: Success")

    def test_error_handling(self):
        """Test error handling with invalid requests"""
        print("\n" + "="*50)
        print("TESTING ERROR HANDLING")
        print("="*50)
        
        # Test 404 for non-existent device
        self.run_test("Get non-existent traffic sensor", "GET", "traffic_sensors/non-existent-id", 404)
        
        # Test 404 for non-existent endpoint
        self.run_test("Non-existent endpoint", "GET", "non_existent_endpoint", 404)

def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Test City-Scale Digital Twin API')
    parser.add_argument('--base-url', type=str, default="http://localhost:5000/api",
                        help='Base URL for the API (default: http://localhost:5000/api)')
    parser.add_argument('--device-types', type=str,
                        help='Comma-separated list of device types to test (default: all)')
    args = parser.parse_args()
    
    print("🚀 Starting City-Scale Digital Twin API Tests")
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = CityDigitalTwinAPITester(base_url=args.base_url)
    
    # Test health endpoints first
    tester.test_health_endpoints()
    
    # Test CRUD operations for each device type
    if args.device_types:
        device_types = args.device_types.split(',')
        for device_type in device_types:
            if device_type in tester.device_types:
                tester.test_device_crud_operations(device_type)
            else:
                print(f"⚠️ Unknown device type: {device_type}")
    else:
        # Test all device types
        for device_type in tester.device_types.keys():
            tester.test_device_crud_operations(device_type)
    
    # Test simulate all endpoint
    tester.test_simulate_all()
    
    # Test error handling
    tester.test_error_handling()
    
    # Print final results
    print("\n" + "="*60)
    print("FINAL TEST RESULTS")
    print("="*60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📈 Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    print(f"⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())