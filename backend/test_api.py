import pytest
import uuid
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from server import app, get_db
from typing import Dict, List, Any
from unittest import mock

# Test configuration
TEST_BASE_URL = "http://test"

# Mock database session for testing
class MockAsyncSession:
    """Mock session that mimics the behavior of AsyncSession without connecting to a database"""
    
    def __init__(self):
        self.devices = {}
        for device_type in DEVICE_TYPES:
            self.devices[device_type] = []
    
    def execute(self, query):
        """Mock query execution"""
        return MockResult(self.devices)
    
    def commit(self):
        """Mock commit"""
        pass
    
    def refresh(self, obj):
        """Mock refresh"""
        # Add timestamp if not present
        if not hasattr(obj, 'timestamp') or not obj.timestamp:
            obj.timestamp = datetime.now(timezone.utc).isoformat()
        
        # Add id if not present
        if not hasattr(obj, 'id') or not obj.id:
            obj.id = len(self.devices.get(obj.__tablename__, [])) + 1
    
    def add(self, obj):
        """Mock add"""
        # Initialize the device list if not exists
        if obj.__tablename__ not in self.devices:
            self.devices[obj.__tablename__] = []
        
        # Add a UUID as id if not present
        if not hasattr(obj, 'id') or not obj.id:
            obj.id = len(self.devices[obj.__tablename__]) + 1
        
        # Add timestamp if not present
        if not hasattr(obj, 'timestamp') or not obj.timestamp:
            obj.timestamp = datetime.now(timezone.utc).isoformat()
        
        # Add to mock database
        self.devices[obj.__tablename__].append(obj)
    
    def close(self):
        """Mock close"""
        pass

class MockResult:
    """Mock query result"""
    
    def __init__(self, devices):
        self.devices = devices
        self.current_tablename = None
    
    def where(self, condition):
        """Mock where clause"""
        self.condition = condition
        return self
    
    def scalar(self):
        """Mock scalar result"""
        if not self.devices.get(self.current_tablename):
            return None
        
        # Find by ID (simple implementation)
        for device in self.devices.get(self.current_tablename, []):
            if hasattr(device, 'id') and self.condition.right.value == device.id:
                return device
        
        return None
    
    def scalars(self):
        """Mock scalars result"""
        return self
    
    def all(self):
        """Return all mock devices for the current tablename"""
        return self.devices.get(self.current_tablename, [])

# All device types with test data
DEVICE_TYPES = {
    "traffic_sensors": {
        "create_data": {"location": "Test Junction", "vehicle_count": 42, "avg_speed": 35.5},
        "update_data": {"location": "Updated Junction", "vehicle_count": 55, "avg_speed": 40.0}
    },
    "air_quality_sensors": {
        "create_data": {"location": "Test Park", "pm25": 25.5, "pm10": 45.0, "no2": 30.0, "co": 5.5},
        "update_data": {"location": "Updated Park", "pm25": 30.0, "pm10": 50.0, "no2": 35.0, "co": 6.0}
    },
    "noise_sensors": {
        "create_data": {"location": "Test Street", "decibel_level": 65.5},
        "update_data": {"location": "Updated Street", "decibel_level": 70.0}
    },
    "weather_stations": {
        "create_data": {"location": "Test Station", "temperature": 22.5, "humidity": 60.0, "rainfall": 5.0, "wind_speed": 15.0},
        "update_data": {"location": "Updated Station", "temperature": 25.0, "humidity": 65.0, "rainfall": 3.0, "wind_speed": 12.0}
    },
    "smart_meters": {
        "create_data": {"location": "Test Building", "electricity_usage": 250.75, "water_usage": 1500.50},
        "update_data": {"location": "Updated Building", "electricity_usage": 300.00, "water_usage": 1800.00}
    },
    "waste_bins": {
        "create_data": {"location": "Test Corner", "fill_level": 45.5, "temperature": 25.0},
        "update_data": {"location": "Updated Corner", "fill_level": 60.0, "temperature": 28.0}
    },
    "parking_sensors": {
        "create_data": {"location": "Test Parking", "is_occupied": True},
        "update_data": {"location": "Updated Parking", "is_occupied": False}
    },
    "street_lights": {
        "create_data": {"location": "Test Avenue", "status": True, "energy_consumption": 25.5},
        "update_data": {"location": "Updated Avenue", "status": False, "energy_consumption": 30.0}
    },
    "public_transport_trackers": {
        "create_data": {"bus_id": "TEST_001", "location": "Test Route", "occupancy": 25},
        "update_data": {"bus_id": "TEST_002", "location": "Updated Route", "occupancy": 30}
    },
    "surveillance_cameras": {
        "create_data": {"location": "Test Plaza", "motion_detected": True, "object_count": 5},
        "update_data": {"location": "Updated Plaza", "motion_detected": False, "object_count": 8}
    },
    "water_quality_sensors": {
        "create_data": {"location": "Test River", "ph": 7.2, "turbidity": 2.5, "dissolved_oxygen": 8.5},
        "update_data": {"location": "Updated River", "ph": 7.5, "turbidity": 2.0, "dissolved_oxygen": 9.0}
    },
    "energy_grid_sensors": {
        "create_data": {"location": "Test Grid", "voltage": 230.5, "current": 25.0, "frequency": 50.0},
        "update_data": {"location": "Updated Grid", "voltage": 235.0, "current": 30.0, "frequency": 50.1}
    }
}

class TestCityDigitalTwinAPI:
    """Comprehensive test suite for City Digital Twin API"""
    
    @pytest.fixture
    def client(self):
        """Create test client with mocked database session"""
        # Create a mock database session
        mock_db = MockAsyncSession()
        
        # Create a dependency override that returns a mock session
        def override_get_db():
            try:
                yield mock_db
            finally:
                mock_db.close()
        
        # Override the get_db dependency
        app.dependency_overrides[get_db] = override_get_db
        
        # Create a test client
        test_client = TestClient(app)
        yield test_client
        
        # Clean up overrides after the test
        app.dependency_overrides = {}
    
    def test_health_endpoints(self, client):
        """Test basic health endpoints"""
        # Test root endpoint
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "City-Scale Digital Twin API"
        
        # Test health endpoint
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_device_crud_operations(self, client):
        """Test CRUD operations for all device types"""
        created_devices = {}
        
        for device_type, config in DEVICE_TYPES.items():
            print(f"\n🔍 Testing CRUD for {device_type}")
            
            # Test CREATE
            response = client.post(f"/api/{device_type}/add", json=config["create_data"])
            assert response.status_code == 200, f"Failed to create {device_type}: {response.text}"
            
            created_device = response.json()
            assert "id" in created_device
            assert created_device["location"] == config["create_data"]["location"]
            created_devices[device_type] = created_device["id"]
            
            # Test READ ALL
            response = client.get(f"/api/{device_type}/all")
            assert response.status_code == 200
            devices = response.json()
            assert isinstance(devices, list)
            assert len(devices) >= 1
            
            # Test READ BY ID
            device_id = created_devices[device_type]
            response = client.get(f"/api/{device_type}/{device_id}")
            assert response.status_code == 200
            device = response.json()
            assert device["id"] == device_id
            
            # Test UPDATE
            response = client.put(f"/api/{device_type}/{device_id}", json=config["update_data"])
            assert response.status_code == 200
            updated_device = response.json()
            assert updated_device["location"] == config["update_data"]["location"]
            

            
            print(f"✅ {device_type} CRUD operations successful")
        
        # Clean up created devices
        for device_type, device_id in created_devices.items():
            response = client.delete(f"/api/{device_type}/{device_id}")
            assert response.status_code == 200
    

    
    def test_error_handling(self, client):
        """Test API error handling"""
        # Test 404 for non-existent device
        fake_id = str(uuid.uuid4())
        response = client.get(f"/api/traffic_sensors/{fake_id}")
        assert response.status_code == 404
        
        # Test 404 for non-existent endpoint
        response = client.get("/api/non_existent_endpoint")
        assert response.status_code == 404
        
        # Test invalid data for create endpoint
        invalid_data = {"invalid_field": "invalid_value"}
        response = client.post("/api/traffic_sensors/add", json=invalid_data)
        assert response.status_code == 422  # Validation error
    
    def test_data_validation(self, client):
        """Test data validation for device creation"""
        # Test with missing required fields
        incomplete_data = {"location": "Test"}  # Missing vehicle_count and avg_speed
        response = client.post("/api/traffic_sensors/add", json=incomplete_data)
        assert response.status_code == 422
        
        # Test with invalid data types
        invalid_data = {
            "location": "Test",
            "vehicle_count": "not_a_number",  # Should be int
            "avg_speed": 35.5
        }
        response = client.post("/api/traffic_sensors/add", json=invalid_data)
        assert response.status_code == 422
    
    def test_timestamp_generation(self, client):
        """Test that timestamps are properly generated"""
        # Create a device to test timestamp
        response = client.post("/api/traffic_sensors/add", json=DEVICE_TYPES["traffic_sensors"]["create_data"])
        assert response.status_code == 200
        
        device = response.json()
        assert "timestamp" in device
        
        # Verify timestamp is recent (within last minute)
        timestamp = datetime.fromisoformat(device["timestamp"].replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        time_diff = abs((now - timestamp).total_seconds())
        assert time_diff < 60  # Within 60 seconds
        
        # Clean up
        client.delete(f"/api/traffic_sensors/{device['id']}")
    
    def test_device_specific_fields(self, client):
        """Test device-specific field validation"""
        # Test air quality sensor with valid ranges
        air_data = {
            "location": "Test Location",
            "pm25": 25.5,
            "pm10": 45.0,
            "no2": 30.0,
            "co": 5.5
        }
        response = client.post("/api/air_quality_sensors/add", json=air_data)
        assert response.status_code == 200
        
        created = response.json()
        assert created["pm25"] == 25.5
        assert created["pm10"] == 45.0
        assert created["no2"] == 30.0
        assert created["co"] == 5.5
        
        # Clean up
        client.delete(f"/api/air_quality_sensors/{created['id']}")
    
    def test_boolean_fields(self, client):
        """Test boolean field handling"""
        # Test parking sensor with boolean field
        parking_data = {
            "location": "Test Parking",
            "is_occupied": True
        }
        response = client.post("/api/parking_sensors/add", json=parking_data)
        assert response.status_code == 200
        
        created = response.json()
        assert created["is_occupied"] is True
        
        # Test update with different boolean value
        update_data = {
            "location": "Test Parking",
            "is_occupied": False
        }
        response = client.put(f"/api/parking_sensors/{created['id']}", json=update_data)
        assert response.status_code == 200
        
        updated = response.json()
        assert updated["is_occupied"] is False
        
        # Clean up
        client.delete(f"/api/parking_sensors/{created['id']}")

if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])