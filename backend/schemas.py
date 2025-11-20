from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Base schemas
class DeviceBase(BaseModel):
    location: str
    latitude: Optional[float] = None  # Added for map positioning
    longitude: Optional[float] = None  # Added for map positioning
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DeviceCreate(DeviceBase):
    pass

class DeviceSchema(DeviceBase):
    id: str
    
    class Config:
        from_attributes = True

# Traffic Sensor
class TrafficSensorCreate(DeviceCreate):
    vehicle_count: int
    avg_speed: float

class TrafficSensorSchema(DeviceSchema):
    vehicle_count: int
    avg_speed: float

# Air Quality Sensor
class AirQualitySensorCreate(DeviceCreate):
    pm25: float
    pm10: float
    no2: float
    co: float

class AirQualitySensorSchema(DeviceSchema):
    pm25: float
    pm10: float
    no2: float
    co: float

# Noise Sensor
class NoiseSensorCreate(DeviceCreate):
    decibel_level: float

class NoiseSensorSchema(DeviceSchema):
    decibel_level: float

# Weather Station
class WeatherStationCreate(DeviceCreate):
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float

class WeatherStationSchema(DeviceSchema):
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float

# Smart Meter
class SmartMeterCreate(DeviceCreate):
    electricity_usage: float
    water_usage: float

class SmartMeterSchema(DeviceSchema):
    electricity_usage: float
    water_usage: float

# Waste Bin
class WasteBinCreate(DeviceCreate):
    fill_level: float
    temperature: float

class WasteBinSchema(DeviceSchema):
    fill_level: float
    temperature: float

# Parking Sensor
class ParkingSensorCreate(DeviceCreate):
    is_occupied: bool

class ParkingSensorSchema(DeviceSchema):
    is_occupied: bool

# Street Light
class StreetLightCreate(DeviceCreate):
    status: bool
    energy_consumption: float

class StreetLightSchema(DeviceSchema):
    status: bool
    energy_consumption: float

# Public Transport Tracker
class PublicTransportTrackerCreate(DeviceCreate):
    bus_id: str
    occupancy: int

class PublicTransportTrackerSchema(DeviceSchema):
    bus_id: str
    occupancy: int

# Surveillance Camera
class SurveillanceCameraCreate(DeviceCreate):
    motion_detected: bool
    object_count: int

class SurveillanceCameraSchema(DeviceSchema):
    motion_detected: bool
    object_count: int

# Water Quality Sensor
class WaterQualitySensorCreate(DeviceCreate):
    ph: float
    turbidity: float
    dissolved_oxygen: float

class WaterQualitySensorSchema(DeviceSchema):
    ph: float
    turbidity: float
    dissolved_oxygen: float

# Energy Grid Sensor
class EnergyGridSensorCreate(DeviceCreate):
    voltage: float
    current: float
    frequency: float

class EnergyGridSensorSchema(DeviceSchema):
    voltage: float
    current: float
    frequency: float
