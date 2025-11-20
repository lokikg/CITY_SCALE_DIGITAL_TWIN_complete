from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
import threading
from pathlib import Path
from typing import List
from datetime import datetime, timezone
import time

# Prometheus metrics
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter, Histogram
from starlette.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from database import async_session
from models import (
    TrafficSensor, AirQualitySensor, NoiseSensor, WeatherStation,
    SmartMeter, WasteBin, ParkingSensor, StreetLight,
    PublicTransportTracker, SurveillanceCamera, WaterQualitySensor,
    EnergyGridSensor
)
from schemas import (
    TrafficSensorSchema, AirQualitySensorSchema, NoiseSensorSchema,
    WeatherStationSchema, SmartMeterSchema, WasteBinSchema,
    ParkingSensorSchema, StreetLightSchema, PublicTransportTrackerSchema,
    SurveillanceCameraSchema, WaterQualitySensorSchema, EnergyGridSensorSchema,
    TrafficSensorCreate, AirQualitySensorCreate, NoiseSensorCreate,
    WeatherStationCreate, SmartMeterCreate, WasteBinCreate,
    ParkingSensorCreate, StreetLightCreate, PublicTransportTrackerCreate,
    SurveillanceCameraCreate, WaterQualitySensorCreate, EnergyGridSensorCreate
)
# Import the simulator API router
from simulator_api import simulator_router
# Import the test runner API router
from test_runner import router as test_runner_router
# Import the database testing API router
from database_test_api import database_test_router
# MQTT
import paho.mqtt.client as mqtt
import json
import asyncio

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parent
ENV_PATH = ROOT_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=str(ENV_PATH), override=True)
else:
    print(f"⚠️ .env file not found at {ENV_PATH}", flush=True)

MQTT_BROKER = os.getenv("MQTT_BROKER") or "localhost"
MQTT_PORT = int(os.getenv("MQTT_PORT") or 1883)
MQTT_USERNAME = os.getenv("MQTT_USERNAME") or None
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD") or None
MQTT_TLS = (os.getenv("MQTT_TLS") or "false").strip().lower() == "true"
MQTT_KEEPALIVE = int(os.getenv("MQTT_KEEPALIVE") or 60)

# Create FastAPI app and router early
app = FastAPI(title="Smart City IoT Platform", version="1.0.0")
api_router = APIRouter(prefix="/api", tags=["sensors"])

# List of device types for topic subscription
DEVICE_TOPICS = [
    "traffic_sensors", "air_quality_sensors", "noise_sensors", "weather_stations",
    "smart_meters", "waste_bins", "parking_sensors", "street_lights",
    "public_transport_trackers", "surveillance_cameras", "water_quality_sensors",
    "energy_grid_sensors"
]

def get_mqtt_client():
    client = mqtt.Client()
    if MQTT_USERNAME and MQTT_PASSWORD:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    if MQTT_TLS:
        client.tls_set()
    client.keepalive = MQTT_KEEPALIVE
    return client

# Global MQTT client for status checking
mqtt_client_global = None

def ingest_mqtt_message(device_type, payload, db_session):
    """Insert MQTT message payload into Neon PostgreSQL."""
    try:
        # Map device_type to model and schema
        model_map = {
            "traffic_sensors": TrafficSensor,
            "air_quality_sensors": AirQualitySensor,
            "noise_sensors": NoiseSensor,
            "weather_stations": WeatherStation,
            "smart_meters": SmartMeter,
            "waste_bins": WasteBin,
            "parking_sensors": ParkingSensor,
            "street_lights": StreetLight,
            "public_transport_trackers": PublicTransportTracker,
            "surveillance_cameras": SurveillanceCamera,
            "water_quality_sensors": WaterQualitySensor,
            "energy_grid_sensors": EnergyGridSensor
        }
        schema_map = {
            "traffic_sensors": TrafficSensorCreate,
            "air_quality_sensors": AirQualitySensorCreate,
            "noise_sensors": NoiseSensorCreate,
            "weather_stations": WeatherStationCreate,
            "smart_meters": SmartMeterCreate,
            "waste_bins": WasteBinCreate,
            "parking_sensors": ParkingSensorCreate,
            "street_lights": StreetLightCreate,
            "public_transport_trackers": PublicTransportTrackerCreate,
            "surveillance_cameras": SurveillanceCameraCreate,
            "water_quality_sensors": WaterQualitySensorCreate,
            "energy_grid_sensors": EnergyGridSensorCreate
        }
        model = model_map.get(device_type)
        schema = schema_map.get(device_type)
        if not model or not schema:
            logging.error(f"Unknown device type for MQTT ingestion: {device_type}")
            return
        data = json.loads(payload)
        
        # Handle special case for street lights
        if device_type == "street_lights":
            # Override the status based on time of day
            data["status"] = should_street_light_be_on()
            
        # Validate and create DB object
        obj = model(**data)
        db_session.add(obj)
        db_session.commit()
        logging.info(f"MQTT Ingested {device_type}: {data.get('id', '')}")
    except Exception as e:
        logging.error(f"MQTT ingestion error: {e}")
        print(f"MQTT ingestion error: {e}")

def mqtt_subscriber_task():
    """Background MQTT subscriber for FastAPI."""
    global mqtt_client_global
    client = get_mqtt_client()
    mqtt_client_global = client  # Store globally for status checks
    
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            logging.info(f"Connected to MQTT broker: {MQTT_BROKER}:{MQTT_PORT}")
            # Subscribe to all device topics with wildcard for device_id
            for device_type in DEVICE_TOPICS:
                topic = f"city/{device_type}/#"
                client.subscribe(topic, qos=1)
                logging.info(f"Subscribed to MQTT topic: {topic}")
        else:
            logging.error(f"Failed to connect to MQTT broker, return code {rc}")

    def on_message(client, userdata, msg):
        topic_parts = msg.topic.split("/")
        if len(topic_parts) < 3:
            logging.warning(f"MQTT topic format invalid: {msg.topic}")
            return
        device_type = topic_parts[1]
        payload = msg.payload.decode()
        # Use a new DB session for each message
        from database import SessionLocal
        db_session = SessionLocal()
        ingest_mqtt_message(device_type, payload, db_session)
        db_session.close()

    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        logging.info(f"Connecting to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, MQTT_KEEPALIVE)
        client.loop_forever()
    except Exception as e:
        logging.error(f"MQTT connection error: {e}")

# Database session dependency
async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


# No simulation functions - only real device data will be used


# Traffic Sensor Endpoints
@api_router.post("/traffic_sensors/add", response_model=TrafficSensorSchema)
async def add_traffic_sensor(sensor: TrafficSensorCreate, db: AsyncSession = Depends(get_db)):
    db_sensor = TrafficSensor(**sensor.model_dump())
    db.add(db_sensor)
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.get("/traffic_sensors/all", response_model=List[TrafficSensorSchema])
async def get_all_traffic_sensors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrafficSensor))
    sensors = result.scalars().all()
    return sensors

@api_router.get("/traffic_sensors/{sensor_id}", response_model=TrafficSensorSchema)
async def get_traffic_sensor(sensor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrafficSensor).where(TrafficSensor.id == sensor_id))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="Traffic sensor not found")
    return sensor

@api_router.put("/traffic_sensors/{sensor_id}", response_model=TrafficSensorSchema)
async def update_traffic_sensor(sensor_id: str, sensor: TrafficSensorCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrafficSensor).where(TrafficSensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Traffic sensor not found")
    
    for key, value in sensor.model_dump().items():
        setattr(db_sensor, key, value)
    
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.delete("/traffic_sensors/{sensor_id}")
async def delete_traffic_sensor(sensor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrafficSensor).where(TrafficSensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Traffic sensor not found")
    
    await db.delete(db_sensor)
    await db.commit()
    return {"message": "Traffic sensor deleted successfully"}

@api_router.get("/traffic_sensors/latest", response_model=TrafficSensorSchema)
async def get_latest_traffic_sensor(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrafficSensor).order_by(desc(TrafficSensor.timestamp)).limit(1))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="No traffic sensors found")
    return sensor




# Air Quality Sensor Endpoints
@api_router.post("/air_quality_sensors/add", response_model=AirQualitySensorSchema)
async def add_air_quality_sensor(sensor: AirQualitySensorCreate, db: AsyncSession = Depends(get_db)):
    db_sensor = AirQualitySensor(**sensor.model_dump())
    db.add(db_sensor)
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.get("/air_quality_sensors/all", response_model=List[AirQualitySensorSchema])
async def get_all_air_quality_sensors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AirQualitySensor))
    sensors = result.scalars().all()
    return sensors

@api_router.get("/air_quality_sensors/{sensor_id}", response_model=AirQualitySensorSchema)
async def get_air_quality_sensor(sensor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AirQualitySensor).where(AirQualitySensor.id == sensor_id))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="Air quality sensor not found")
    return sensor

@api_router.put("/air_quality_sensors/{sensor_id}", response_model=AirQualitySensorSchema)
async def update_air_quality_sensor(sensor_id: str, sensor: AirQualitySensorCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AirQualitySensor).where(AirQualitySensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Air quality sensor not found")
    
    for key, value in sensor.model_dump().items():
        setattr(db_sensor, key, value)
    
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.delete("/air_quality_sensors/{sensor_id}")
async def delete_air_quality_sensor(sensor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AirQualitySensor).where(AirQualitySensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Air quality sensor not found")
    
    await db.delete(db_sensor)
    await db.commit()
    return {"message": "Air quality sensor deleted successfully"}

@api_router.get("/air_quality_sensors/latest", response_model=AirQualitySensorSchema)
async def get_latest_air_quality_sensor(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AirQualitySensor).order_by(desc(AirQualitySensor.timestamp)).limit(1))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="No air quality sensors found")
    return sensor




# Noise Sensor Endpoints
@api_router.post("/noise_sensors/add", response_model=NoiseSensorSchema)
async def add_noise_sensor(sensor: NoiseSensorCreate, db: AsyncSession = Depends(get_db)):
    db_sensor = NoiseSensor(**sensor.model_dump())
    db.add(db_sensor)
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.get("/noise_sensors/all", response_model=List[NoiseSensorSchema])
async def get_all_noise_sensors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NoiseSensor))
    sensors = result.scalars().all()
    return sensors

@api_router.get("/noise_sensors/{sensor_id}", response_model=NoiseSensorSchema)
async def get_noise_sensor(sensor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NoiseSensor).where(NoiseSensor.id == sensor_id))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="Noise sensor not found")
    return sensor

@api_router.put("/noise_sensors/{sensor_id}", response_model=NoiseSensorSchema)
async def update_noise_sensor(sensor_id: int, sensor: NoiseSensorCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NoiseSensor).where(NoiseSensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Noise sensor not found")
    
    for key, value in sensor.model_dump().items():
        setattr(db_sensor, key, value)
    
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.delete("/noise_sensors/{sensor_id}")
async def delete_noise_sensor(sensor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NoiseSensor).where(NoiseSensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Noise sensor not found")
    
    await db.delete(db_sensor)
    await db.commit()
    return {"message": "Noise sensor deleted successfully"}

@api_router.get("/noise_sensors/latest", response_model=NoiseSensorSchema)
async def get_latest_noise_sensor(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NoiseSensor).order_by(desc(NoiseSensor.timestamp)).limit(1))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="No noise sensors found")
    return sensor




# Weather Station Endpoints
@api_router.post("/weather_stations/add", response_model=WeatherStationSchema)
async def add_weather_station(station: WeatherStationCreate, db: AsyncSession = Depends(get_db)):
    db_station = WeatherStation(**station.model_dump())
    db.add(db_station)
    await db.commit()
    await db.refresh(db_station)
    return db_station

@api_router.get("/weather_stations/all", response_model=List[WeatherStationSchema])
async def get_all_weather_stations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WeatherStation))
    stations = result.scalars().all()
    return stations

@api_router.get("/weather_stations/{station_id}", response_model=WeatherStationSchema)
async def get_weather_station(station_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WeatherStation).where(WeatherStation.id == station_id))
    station = result.scalar()
    if not station:
        raise HTTPException(status_code=404, detail="Weather station not found")
    return station

@api_router.put("/weather_stations/{station_id}", response_model=WeatherStationSchema)
async def update_weather_station(station_id: int, station: WeatherStationCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WeatherStation).where(WeatherStation.id == station_id))
    db_station = result.scalar()
    if not db_station:
        raise HTTPException(status_code=404, detail="Weather station not found")
    
    for key, value in station.model_dump().items():
        setattr(db_station, key, value)
    
    await db.commit()
    await db.refresh(db_station)
    return db_station

@api_router.delete("/weather_stations/{station_id}")
async def delete_weather_station(station_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WeatherStation).where(WeatherStation.id == station_id))
    db_station = result.scalar()
    if not db_station:
        raise HTTPException(status_code=404, detail="Weather station not found")
    
    await db.delete(db_station)
    await db.commit()
    return {"message": "Weather station deleted successfully"}

@api_router.get("/weather_stations/latest", response_model=WeatherStationSchema)
async def get_latest_weather_station(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WeatherStation).order_by(desc(WeatherStation.timestamp)).limit(1))
    station = result.scalar()
    if not station:
        raise HTTPException(status_code=404, detail="No weather stations found")
    return station




# Smart Meter Endpoints
@api_router.post("/smart_meters/add", response_model=SmartMeterSchema)
async def add_smart_meter(meter: SmartMeterCreate, db: AsyncSession = Depends(get_db)):
    db_meter = SmartMeter(**meter.model_dump())
    db.add(db_meter)
    await db.commit()
    await db.refresh(db_meter)
    return db_meter

@api_router.get("/smart_meters/all", response_model=List[SmartMeterSchema])
async def get_all_smart_meters(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SmartMeter))
    meters = result.scalars().all()
    return meters

@api_router.get("/smart_meters/{meter_id}", response_model=SmartMeterSchema)
async def get_smart_meter(meter_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SmartMeter).where(SmartMeter.id == meter_id))
    meter = result.scalar()
    if not meter:
        raise HTTPException(status_code=404, detail="Smart meter not found")
    return meter

@api_router.put("/smart_meters/{meter_id}", response_model=SmartMeterSchema)
async def update_smart_meter(meter_id: int, meter: SmartMeterCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SmartMeter).where(SmartMeter.id == meter_id))
    db_meter = result.scalar()
    if not db_meter:
        raise HTTPException(status_code=404, detail="Smart meter not found")
    
    for key, value in meter.model_dump().items():
        setattr(db_meter, key, value)
    
    await db.commit()
    await db.refresh(db_meter)
    return db_meter

@api_router.delete("/smart_meters/{meter_id}")
async def delete_smart_meter(meter_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SmartMeter).where(SmartMeter.id == meter_id))
    db_meter = result.scalar()
    if not db_meter:
        raise HTTPException(status_code=404, detail="Smart meter not found")
    
    await db.delete(db_meter)
    await db.commit()
    return {"message": "Smart meter deleted successfully"}

@api_router.get("/smart_meters/latest", response_model=SmartMeterSchema)
async def get_latest_smart_meter(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SmartMeter).order_by(desc(SmartMeter.timestamp)).limit(1))
    meter = result.scalar()
    if not meter:
        raise HTTPException(status_code=404, detail="No smart meters found")
    return meter




# Continue with remaining device types...
# Waste Bin Endpoints
@api_router.post("/waste_bins/add", response_model=WasteBinSchema)
async def add_waste_bin(bin: WasteBinCreate, db: AsyncSession = Depends(get_db)):
    db_bin = WasteBin(**bin.model_dump())
    db.add(db_bin)
    await db.commit()
    await db.refresh(db_bin)
    return db_bin

@api_router.get("/waste_bins/all", response_model=List[WasteBinSchema])
async def get_all_waste_bins(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WasteBin))
    bins = result.scalars().all()
    return bins

@api_router.get("/waste_bins/{bin_id}", response_model=WasteBinSchema)
async def get_waste_bin(bin_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WasteBin).where(WasteBin.id == bin_id))
    bin = result.scalar()
    if not bin:
        raise HTTPException(status_code=404, detail="Waste bin not found")
    return bin

@api_router.put("/waste_bins/{bin_id}", response_model=WasteBinSchema)
async def update_waste_bin(bin_id: int, bin: WasteBinCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WasteBin).where(WasteBin.id == bin_id))
    db_bin = result.scalar()
    if not db_bin:
        raise HTTPException(status_code=404, detail="Waste bin not found")
    
    for key, value in bin.model_dump().items():
        setattr(db_bin, key, value)
    
    await db.commit()
    await db.refresh(db_bin)
    return db_bin

@api_router.delete("/waste_bins/{bin_id}")
async def delete_waste_bin(bin_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WasteBin).where(WasteBin.id == bin_id))
    db_bin = result.scalar()
    if not db_bin:
        raise HTTPException(status_code=404, detail="Waste bin not found")
    
    await db.delete(db_bin)
    await db.commit()
    return {"message": "Waste bin deleted successfully"}

@api_router.get("/waste_bins/latest", response_model=WasteBinSchema)
async def get_latest_waste_bin(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WasteBin).order_by(desc(WasteBin.timestamp)).limit(1))
    bin = result.scalar()
    if not bin:
        raise HTTPException(status_code=404, detail="No waste bins found")
    return bin


# Parking Sensor Endpoints
@api_router.post("/parking_sensors/add", response_model=ParkingSensorSchema)
async def add_parking_sensor(sensor: ParkingSensorCreate, db: AsyncSession = Depends(get_db)):
    db_sensor = ParkingSensor(**sensor.model_dump())
    db.add(db_sensor)
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.get("/parking_sensors/all", response_model=List[ParkingSensorSchema])
async def get_all_parking_sensors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ParkingSensor))
    sensors = result.scalars().all()
    return sensors

@api_router.get("/parking_sensors/{sensor_id}", response_model=ParkingSensorSchema)
async def get_parking_sensor(sensor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ParkingSensor).where(ParkingSensor.id == sensor_id))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="Parking sensor not found")
    return sensor

@api_router.put("/parking_sensors/{sensor_id}", response_model=ParkingSensorSchema)
async def update_parking_sensor(sensor_id: int, sensor: ParkingSensorCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ParkingSensor).where(ParkingSensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Parking sensor not found")
    
    for key, value in sensor.model_dump().items():
        setattr(db_sensor, key, value)
    
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.delete("/parking_sensors/{sensor_id}")
async def delete_parking_sensor(sensor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ParkingSensor).where(ParkingSensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Parking sensor not found")
    
    await db.delete(db_sensor)
    await db.commit()
    return {"message": "Parking sensor deleted successfully"}

@api_router.get("/parking_sensors/latest", response_model=ParkingSensorSchema)
async def get_latest_parking_sensor(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ParkingSensor).order_by(desc(ParkingSensor.timestamp)).limit(1))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="No parking sensors found")
    return sensor


# Street Light helper function to determine correct status based on time
def should_street_light_be_on():
    """
    Helper function to determine if street lights should be ON based on time of day.
    Street lights should be ON from 6PM (18:00) to 6AM (06:00).
    """
    current_hour = datetime.now().hour
    return current_hour >= 18 or current_hour < 6


# Street Light Endpoints
@api_router.post("/street_lights/add", response_model=StreetLightSchema)
async def add_street_light(light: StreetLightCreate, db: AsyncSession = Depends(get_db)):
    # Set the correct status based on time of day
    current_hour = datetime.now().hour
    correct_status = should_street_light_be_on()
    
    # Override the status with the correct one
    light_dict = light.model_dump()
    light_dict["status"] = correct_status
    
    db_light = StreetLight(**light_dict)
    db.add(db_light)
    await db.commit()
    await db.refresh(db_light)
    return db_light

@api_router.get("/street_lights/all", response_model=List[StreetLightSchema])
async def get_all_street_lights(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StreetLight))
    lights = result.scalars().all()
    return lights

@api_router.get("/street_lights/{light_id}", response_model=StreetLightSchema)
async def get_street_light(light_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StreetLight).where(StreetLight.id == light_id))
    light = result.scalar()
    if not light:
        raise HTTPException(status_code=404, detail="Street light not found")
    return light

@api_router.put("/street_lights/{light_id}", response_model=StreetLightSchema)
async def update_street_light(light_id: int, light: StreetLightCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StreetLight).where(StreetLight.id == light_id))
    db_light = result.scalar()
    if not db_light:
        raise HTTPException(status_code=404, detail="Street light not found")
    
    # Set the correct status based on time of day
    light_dict = light.model_dump()
    light_dict["status"] = should_street_light_be_on()
    
    for key, value in light_dict.items():
        setattr(db_light, key, value)
    
    await db.commit()
    await db.refresh(db_light)
    return db_light

@api_router.delete("/street_lights/{light_id}")
async def delete_street_light(light_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StreetLight).where(StreetLight.id == light_id))
    db_light = result.scalar()
    if not db_light:
        raise HTTPException(status_code=404, detail="Street light not found")
    
    await db.delete(db_light)
    await db.commit()
    return {"message": "Street light deleted successfully"}

@api_router.get("/street_lights/latest", response_model=StreetLightSchema)
async def get_latest_street_light(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StreetLight).order_by(desc(StreetLight.timestamp)).limit(1))
    light = result.scalar()
    if not light:
        raise HTTPException(status_code=404, detail="No street lights found")
    return light


# Public Transport Tracker Endpoints
@api_router.post("/public_transport_trackers/add", response_model=PublicTransportTrackerSchema)
async def add_transport_tracker(tracker: PublicTransportTrackerCreate, db: AsyncSession = Depends(get_db)):
    db_tracker = PublicTransportTracker(**tracker.model_dump())
    db.add(db_tracker)
    await db.commit()
    await db.refresh(db_tracker)
    return db_tracker

@api_router.get("/public_transport_trackers/all", response_model=List[PublicTransportTrackerSchema])
async def get_all_transport_trackers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PublicTransportTracker))
    trackers = result.scalars().all()
    return trackers

@api_router.get("/public_transport_trackers/{tracker_id}", response_model=PublicTransportTrackerSchema)
async def get_transport_tracker(tracker_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PublicTransportTracker).where(PublicTransportTracker.id == tracker_id))
    tracker = result.scalar()
    if not tracker:
        raise HTTPException(status_code=404, detail="Transport tracker not found")
    return tracker

@api_router.put("/public_transport_trackers/{tracker_id}", response_model=PublicTransportTrackerSchema)
async def update_transport_tracker(tracker_id: int, tracker: PublicTransportTrackerCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PublicTransportTracker).where(PublicTransportTracker.id == tracker_id))
    db_tracker = result.scalar()
    if not db_tracker:
        raise HTTPException(status_code=404, detail="Transport tracker not found")
    
    for key, value in tracker.model_dump().items():
        setattr(db_tracker, key, value)
    
    await db.commit()
    await db.refresh(db_tracker)
    return db_tracker

@api_router.delete("/public_transport_trackers/{tracker_id}")
async def delete_transport_tracker(tracker_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PublicTransportTracker).where(PublicTransportTracker.id == tracker_id))
    db_tracker = result.scalar()
    if not db_tracker:
        raise HTTPException(status_code=404, detail="Transport tracker not found")
    
    await db.delete(db_tracker)
    await db.commit()
    return {"message": "Transport tracker deleted successfully"}

@api_router.get("/public_transport_trackers/latest", response_model=PublicTransportTrackerSchema)
async def get_latest_transport_tracker(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PublicTransportTracker).order_by(desc(PublicTransportTracker.timestamp)).limit(1))
    tracker = result.scalar()
    if not tracker:
        raise HTTPException(status_code=404, detail="No transport trackers found")
    return tracker


# Surveillance Camera Endpoints
@api_router.post("/surveillance_cameras/add", response_model=SurveillanceCameraSchema)
async def add_surveillance_camera(camera: SurveillanceCameraCreate, db: AsyncSession = Depends(get_db)):
    db_camera = SurveillanceCamera(**camera.model_dump())
    db.add(db_camera)
    await db.commit()
    await db.refresh(db_camera)
    return db_camera

@api_router.get("/surveillance_cameras/all", response_model=List[SurveillanceCameraSchema])
async def get_all_surveillance_cameras(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SurveillanceCamera))
    cameras = result.scalars().all()
    return cameras

@api_router.get("/surveillance_cameras/{camera_id}", response_model=SurveillanceCameraSchema)
async def get_surveillance_camera(camera_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SurveillanceCamera).where(SurveillanceCamera.id == camera_id))
    camera = result.scalar()
    if not camera:
        raise HTTPException(status_code=404, detail="Surveillance camera not found")
    return camera

@api_router.put("/surveillance_cameras/{camera_id}", response_model=SurveillanceCameraSchema)
async def update_surveillance_camera(camera_id: int, camera: SurveillanceCameraCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SurveillanceCamera).where(SurveillanceCamera.id == camera_id))
    db_camera = result.scalar()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Surveillance camera not found")
    
    for key, value in camera.model_dump().items():
        setattr(db_camera, key, value)
    
    await db.commit()
    await db.refresh(db_camera)
    return db_camera

@api_router.delete("/surveillance_cameras/{camera_id}")
async def delete_surveillance_camera(camera_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SurveillanceCamera).where(SurveillanceCamera.id == camera_id))
    db_camera = result.scalar()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Surveillance camera not found")
    
    await db.delete(db_camera)
    await db.commit()
    return {"message": "Surveillance camera deleted successfully"}

@api_router.get("/surveillance_cameras/latest", response_model=SurveillanceCameraSchema)
async def get_latest_surveillance_camera(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SurveillanceCamera).order_by(desc(SurveillanceCamera.timestamp)).limit(1))
    camera = result.scalar()
    if not camera:
        raise HTTPException(status_code=404, detail="No surveillance cameras found")
    return camera


# Water Quality Sensor Endpoints
@api_router.post("/water_quality_sensors/add", response_model=WaterQualitySensorSchema)
async def add_water_quality_sensor(sensor: WaterQualitySensorCreate, db: AsyncSession = Depends(get_db)):
    db_sensor = WaterQualitySensor(**sensor.model_dump())
    db.add(db_sensor)
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.get("/water_quality_sensors/all", response_model=List[WaterQualitySensorSchema])
async def get_all_water_quality_sensors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WaterQualitySensor))
    sensors = result.scalars().all()
    return sensors

@api_router.get("/water_quality_sensors/{sensor_id}", response_model=WaterQualitySensorSchema)
async def get_water_quality_sensor(sensor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WaterQualitySensor).where(WaterQualitySensor.id == sensor_id))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="Water quality sensor not found")
    return sensor

@api_router.put("/water_quality_sensors/{sensor_id}", response_model=WaterQualitySensorSchema)
async def update_water_quality_sensor(sensor_id: int, sensor: WaterQualitySensorCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WaterQualitySensor).where(WaterQualitySensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Water quality sensor not found")
    
    for key, value in sensor.model_dump().items():
        setattr(db_sensor, key, value)
    
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.delete("/water_quality_sensors/{sensor_id}")
async def delete_water_quality_sensor(sensor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WaterQualitySensor).where(WaterQualitySensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Water quality sensor not found")
    
    await db.delete(db_sensor)
    await db.commit()
    return {"message": "Water quality sensor deleted successfully"}

@api_router.get("/water_quality_sensors/latest", response_model=WaterQualitySensorSchema)
async def get_latest_water_quality_sensor(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WaterQualitySensor).order_by(desc(WaterQualitySensor.timestamp)).limit(1))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="No water quality sensors found")
    return sensor


# Energy Grid Sensor Endpoints
@api_router.post("/energy_grid_sensors/add", response_model=EnergyGridSensorSchema)
async def add_energy_grid_sensor(sensor: EnergyGridSensorCreate, db: AsyncSession = Depends(get_db)):
    db_sensor = EnergyGridSensor(**sensor.model_dump())
    db.add(db_sensor)
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.get("/energy_grid_sensors/all", response_model=List[EnergyGridSensorSchema])
async def get_all_energy_grid_sensors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EnergyGridSensor))
    sensors = result.scalars().all()
    return sensors

@api_router.get("/energy_grid_sensors/{sensor_id}", response_model=EnergyGridSensorSchema)
async def get_energy_grid_sensor(sensor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EnergyGridSensor).where(EnergyGridSensor.id == sensor_id))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="Energy grid sensor not found")
    return sensor

@api_router.put("/energy_grid_sensors/{sensor_id}", response_model=EnergyGridSensorSchema)
async def update_energy_grid_sensor(sensor_id: int, sensor: EnergyGridSensorCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EnergyGridSensor).where(EnergyGridSensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Energy grid sensor not found")
    
    for key, value in sensor.model_dump().items():
        setattr(db_sensor, key, value)
    
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor

@api_router.delete("/energy_grid_sensors/{sensor_id}")
async def delete_energy_grid_sensor(sensor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EnergyGridSensor).where(EnergyGridSensor.id == sensor_id))
    db_sensor = result.scalar()
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Energy grid sensor not found")
    
    await db.delete(db_sensor)
    await db.commit()
    return {"message": "Energy grid sensor deleted successfully"}

@api_router.get("/energy_grid_sensors/latest", response_model=EnergyGridSensorSchema)
async def get_latest_energy_grid_sensor(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EnergyGridSensor).order_by(desc(EnergyGridSensor.timestamp)).limit(1))
    sensor = result.scalar()
    if not sensor:
        raise HTTPException(status_code=404, detail="No energy grid sensors found")
    return sensor


# Grafana Data Endpoints - Special endpoints for Grafana monitoring
@api_router.get("/grafana/city_overview")
async def get_city_overview(db: AsyncSession = Depends(get_db)):
    """Get aggregated city data for Grafana dashboard"""
    overview = {}
    
    # Get counts for all device types
    model_map = {
        "traffic_sensors": TrafficSensor,
        "air_quality_sensors": AirQualitySensor,
        "noise_sensors": NoiseSensor,
        "weather_stations": WeatherStation,
        "smart_meters": SmartMeter,
        "waste_bins": WasteBin,
        "parking_sensors": ParkingSensor,
        "street_lights": StreetLight,
        "public_transport_trackers": PublicTransportTracker,
        "surveillance_cameras": SurveillanceCamera,
        "water_quality_sensors": WaterQualitySensor,
        "energy_grid_sensors": EnergyGridSensor
    }
    
    for device_type, model in model_map.items():
        try:
            result = await db.execute(select(func.count()).select_from(model))
            count = result.scalar()
            overview[f"{device_type}_count"] = count
        except Exception as e:
            logger.error(f"Error counting {device_type}: {e}")
            overview[f"{device_type}_count"] = 0
    
    # Calculate active devices (example logic)
    try:
        # Count active street lights
        result = await db.execute(select(func.count()).select_from(StreetLight).where(StreetLight.status == True))
        active_lights = result.scalar()
        
        # Count available parking spots
        result = await db.execute(select(func.count()).select_from(ParkingSensor).where(ParkingSensor.is_occupied == False))
        available_parking = result.scalar()
        
        # Count cameras with motion detection
        result = await db.execute(select(func.count()).select_from(SurveillanceCamera).where(SurveillanceCamera.motion_detected == True))
        active_cameras = result.scalar()
        
        overview.update({
            "active_street_lights": active_lights,
            "available_parking_spots": available_parking,
            "active_surveillance_cameras": active_cameras,
            "total_devices": sum([v for k, v in overview.items() if k.endswith("_count")]),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error calculating active devices: {e}")
    
    return overview

@api_router.get("/grafana/traffic_metrics")
async def get_traffic_metrics(db: AsyncSession = Depends(get_db)):
    """Get traffic data for Grafana traffic dashboard"""
    try:
        result = await db.execute(
            select(TrafficSensor)
            .order_by(desc(TrafficSensor.timestamp))
            .limit(50)
        )
        traffic_data = result.scalars().all()
        
        metrics = []
        for sensor in traffic_data:
            metrics.append({
                "timestamp": sensor.timestamp.isoformat(),
                "location": sensor.location,
                "vehicle_count": sensor.vehicle_count,
                "avg_speed": sensor.avg_speed,
                "congestion_level": "High" if sensor.vehicle_count > 100 else "Medium" if sensor.vehicle_count > 50 else "Low"
            })
        
        return {"traffic_metrics": metrics}
    except Exception as e:
        logger.error(f"Error fetching traffic metrics: {e}")
        return {"traffic_metrics": []}

@api_router.get("/grafana/air_quality_metrics")
async def get_air_quality_metrics(db: AsyncSession = Depends(get_db)):
    """Get air quality data for Grafana AQI dashboard"""
    try:
        result = await db.execute(
            select(AirQualitySensor)
            .order_by(desc(AirQualitySensor.timestamp))
            .limit(50)
        )
        air_data = result.scalars().all()
        
        metrics = []
        for sensor in air_data:
            # Calculate simplified AQI based on PM2.5 (simplified formula)
            pm25 = sensor.pm25
            if pm25 <= 12:
                aqi = "Good"
                aqi_value = pm25 * 4.17  # Scale to 0-50
            elif pm25 <= 35.4:
                aqi = "Moderate"
                aqi_value = 51 + (pm25 - 12.1) * 2.1  # Scale to 51-100
            elif pm25 <= 55.4:
                aqi = "Unhealthy for Sensitive"
                aqi_value = 101 + (pm25 - 35.5) * 2.5  # Scale to 101-150
            else:
                aqi = "Unhealthy"
                aqi_value = min(200, 151 + (pm25 - 55.5) * 1.0)  # Scale to 151-200
            
            metrics.append({
                "timestamp": sensor.timestamp.isoformat(),
                "location": sensor.location,
                "pm25": sensor.pm25,
                "pm10": sensor.pm10,
                "no2": sensor.no2,
                "co": sensor.co,
                "aqi_category": aqi,
                "aqi_value": round(aqi_value, 1)
            })
        
        return {"air_quality_metrics": metrics}
    except Exception as e:
        logger.error(f"Error fetching air quality metrics: {e}")
        return {"air_quality_metrics": []}

@api_router.get("/grafana/energy_grid_metrics")
async def get_energy_grid_metrics(db: AsyncSession = Depends(get_db)):
    """Get energy grid data for Grafana energy dashboard"""
    try:
        result = await db.execute(
            select(EnergyGridSensor)
            .order_by(desc(EnergyGridSensor.timestamp))
            .limit(50)
        )
        energy_data = result.scalars().all()
        
        metrics = []
        for sensor in energy_data:
            # Calculate power (P = V * I)
            power = sensor.voltage * sensor.current
            
            # Determine grid status based on voltage and frequency
            voltage_status = "Normal" if 220 <= sensor.voltage <= 240 else "Warning"
            freq_status = "Normal" if 49.5 <= sensor.frequency <= 50.5 else "Warning"
            
            metrics.append({
                "timestamp": sensor.timestamp.isoformat(),
                "location": sensor.location,
                "voltage": sensor.voltage,
                "current": sensor.current,
                "frequency": sensor.frequency,
                "power_kw": round(power / 1000, 2),  # Convert to kW
                "voltage_status": voltage_status,
                "frequency_status": freq_status,
                "grid_health": "Healthy" if voltage_status == "Normal" and freq_status == "Normal" else "Warning"
            })
        
        return {"energy_grid_metrics": metrics}
    except Exception as e:
        logger.error(f"Error fetching energy grid metrics: {e}")
        return {"energy_grid_metrics": []}


# General endpoints
@api_router.get("/health")
async def health_check():
    """Health check endpoint compatible with Testing UI expectations"""
    return {
        "status": "ok",  # Testing UI expects "ok" not "healthy"
        "message": "Backend is running",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/status")
async def system_status(db: AsyncSession = Depends(get_db)):
    """Comprehensive system status check for all services"""
    status = {
        "backend": "online",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "unknown",
        "mqtt": "unknown"
    }
    
    # Check database connection
    try:
        await db.execute(select(1))
        status["database"] = "online"
    except Exception as e:
        logging.error(f"Database health check failed: {e}")
        status["database"] = "offline"
    
    # Check MQTT connection
    try:
        if mqtt_client_global and mqtt_client_global.is_connected():
            status["mqtt"] = "online"
        else:
            status["mqtt"] = "offline"
    except Exception as e:
        logging.error(f"MQTT health check failed: {e}")
        status["mqtt"] = "offline"
    
    return status

@api_router.get("/mqtt/status")
async def mqtt_status():
    """Check MQTT connection status"""
    try:
        is_connected = mqtt_client_global and mqtt_client_global.is_connected()
        return {
            "status": "online" if is_connected else "offline",
            "broker": MQTT_BROKER,
            "port": MQTT_PORT,
            "connected": is_connected,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logging.error(f"MQTT status check failed: {e}")
        return {
            "status": "offline",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

@api_router.get("/database/status")
async def database_status(db: AsyncSession = Depends(get_db)):
    """Check database connection status"""
    try:
        # Try to execute a simple query
        await db.execute(select(1))
        
        # Get table counts
        table_counts = {}
        tables = [
            ("traffic_sensors", TrafficSensor),
            ("air_quality_sensors", AirQualitySensor),
            ("noise_sensors", NoiseSensor),
            ("weather_stations", WeatherStation),
            ("smart_meters", SmartMeter),
        ]
        
        for table_name, model in tables:
            try:
                result = await db.execute(select(func.count()).select_from(model))
                count = result.scalar()
                table_counts[table_name] = count
            except:
                table_counts[table_name] = 0
        
        return {
            "status": "online",
            "connected": True,
            "table_counts": table_counts,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logging.error(f"Database status check failed: {e}")
        return {
            "status": "offline",
            "connected": False,
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Root endpoint for the main app
@app.get("/")
async def root():
    return {"message": "City-Scale Digital Twin API", "version": "1.0.0", "docs_url": "/docs"}


# MQTT Background Task Manager
class MQTTBackgroundTask:
    def __init__(self):
        self.thread: threading.Thread | None = None

    def start(self):
        if self.thread and self.thread.is_alive():
            return
        self.thread = threading.Thread(target=mqtt_subscriber_task, daemon=True)
        self.thread.start()

    def stop(self):
        if self.thread and self.thread.is_alive():
            logging.info("MQTT subscriber thread will stop with app shutdown.")

mqtt_background_task = MQTTBackgroundTask()

@app.on_event("startup")
async def startup_event():
    logger.info("Starting MQTT subscriber background task...")
    mqtt_background_task.start()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Stopping MQTT subscriber background task...")
    mqtt_background_task.stop()


# Include the router in the main app
app.include_router(api_router)
# Include the simulator API router
app.include_router(simulator_router)
# Include the test runner API router
app.include_router(test_runner_router)
# Include the database testing API router
app.include_router(database_test_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# Prometheus metric instruments
REQUEST_COUNT = Counter(
    'http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status']
)
REQUEST_LATENCY = Histogram(
    'http_request_latency_seconds', 'Request latency seconds', ['endpoint']
)


@app.middleware("http")
async def prometheus_middleware(request, call_next):
    """Simple middleware to collect request counts and latency."""
    start = time.time()
    response = await call_next(request)
    latency = time.time() - start
    try:
        endpoint = request.url.path
    except Exception:
        endpoint = "unknown"
    REQUEST_COUNT.labels(method=request.method, endpoint=endpoint, status=str(response.status_code)).inc()
    REQUEST_LATENCY.labels(endpoint=endpoint).observe(latency)
    return response


@app.get("/metrics")
async def metrics():
    """Expose Prometheus metrics."""
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)


# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
