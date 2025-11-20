from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, func
from database import Base
import uuid
from datetime import datetime

class BaseModel(Base):
    __abstract__ = True
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)  # Added for map positioning
    longitude = Column(Float, nullable=True)  # Added for map positioning
    timestamp = Column(DateTime, default=datetime.utcnow)

class TrafficSensor(BaseModel):
    __tablename__ = "traffic_sensors"
    vehicle_count = Column(Integer, nullable=False)
    avg_speed = Column(Float, nullable=False)

class AirQualitySensor(BaseModel):
    __tablename__ = "air_quality_sensors"
    pm25 = Column(Float, nullable=False)
    pm10 = Column(Float, nullable=False)
    no2 = Column(Float, nullable=False)
    co = Column(Float, nullable=False)

class NoiseSensor(BaseModel):
    __tablename__ = "noise_sensors"
    decibel_level = Column(Float, nullable=False)

class WeatherStation(BaseModel):
    __tablename__ = "weather_stations"
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)
    wind_speed = Column(Float, nullable=False)

class SmartMeter(BaseModel):
    __tablename__ = "smart_meters"
    electricity_usage = Column(Float, nullable=False)
    water_usage = Column(Float, nullable=False)

class WasteBin(BaseModel):
    __tablename__ = "waste_bins"
    fill_level = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)

class ParkingSensor(BaseModel):
    __tablename__ = "parking_sensors"
    is_occupied = Column(Boolean, nullable=False)

class StreetLight(BaseModel):
    __tablename__ = "street_lights"
    status = Column(Boolean, nullable=False)
    energy_consumption = Column(Float, nullable=False)

class PublicTransportTracker(BaseModel):
    __tablename__ = "public_transport_trackers"
    bus_id = Column(String, nullable=False)
    occupancy = Column(Integer, nullable=False)

class SurveillanceCamera(BaseModel):
    __tablename__ = "surveillance_cameras"
    motion_detected = Column(Boolean, nullable=False)
    object_count = Column(Integer, nullable=False)

class WaterQualitySensor(BaseModel):
    __tablename__ = "water_quality_sensors"
    ph = Column(Float, nullable=False)
    turbidity = Column(Float, nullable=False)
    dissolved_oxygen = Column(Float, nullable=False)

class EnergyGridSensor(BaseModel):
    __tablename__ = "energy_grid_sensors"
    voltage = Column(Float, nullable=False)
    current = Column(Float, nullable=False)
    frequency = Column(Float, nullable=False)
