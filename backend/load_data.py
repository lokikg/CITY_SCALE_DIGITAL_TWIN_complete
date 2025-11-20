#!/usr/bin/env python
import os
import pandas as pd
import asyncio
from datetime import datetime
import psycopg2
from dotenv import load_dotenv
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import all models
from models import (
    TrafficSensor, AirQualitySensor, NoiseSensor, WeatherStation,
    SmartMeter, WasteBin, ParkingSensor, StreetLight,
    PublicTransportTracker, SurveillanceCamera, WaterQualitySensor,
    EnergyGridSensor, Base
)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get database URL (use the synchronous version for pandas/sqlalchemy)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/city_iot")
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    SYNC_DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)
else:
    SYNC_DATABASE_URL = DATABASE_URL

# Map CSV files to model classes
MODEL_MAP = {
    "traffic_sensors.csv": TrafficSensor,
    "air_quality_sensors.csv": AirQualitySensor,
    "noise_sensors.csv": NoiseSensor,
    "weather_stations.csv": WeatherStation,
    "smart_meters.csv": SmartMeter,
    "waste_bins.csv": WasteBin,
    "parking_sensors.csv": ParkingSensor,
    "street_lights.csv": StreetLight,
    "public_transport_trackers.csv": PublicTransportTracker,
    "surveillance_cameras.csv": SurveillanceCamera,
    "water_quality_sensors.csv": WaterQualitySensor,
    "energy_grid_sensors.csv": EnergyGridSensor
}

def load_data():
    """Load data from CSV files into the database using synchronous SQLAlchemy."""
    # Create synchronous engine
    engine = create_engine(SYNC_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # First, clear existing data in all tables to avoid ID conflicts
        for model_class in MODEL_MAP.values():
            try:
                logger.info(f"Clearing data from {model_class.__tablename__}")
                session.query(model_class).delete()
                session.commit()
            except Exception as e:
                session.rollback()
                logger.error(f"Error clearing {model_class.__tablename__}: {str(e)}")
        
        # Column name mappings for specific files
        column_mappings = {
            "water_quality_sensors.csv": {
                "ph_level": "ph",
                "chlorine": "dissolved_oxygen",  # Map chlorine to dissolved_oxygen
                "conductivity": None  # Skip this column
            },
            "energy_grid_sensors.csv": {
                "power_factor": None,  # Skip this column
                "load": None  # Skip this column
            },
            "surveillance_cameras.csv": {
                "status": None,  # Skip this column
                "people_count": "object_count"  # Map people_count to object_count
            }
        }
        
        # For each CSV file in the data directory
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
        
        for filename in os.listdir(data_dir):
            if filename.endswith(".csv") and filename in MODEL_MAP:
                model_class = MODEL_MAP[filename]
                csv_path = os.path.join(data_dir, filename)
                
                logger.info(f"Loading data from {filename}...")
                
                try:
                    # Read CSV file
                    df = pd.read_csv(csv_path)
                    
                    # Apply column mappings if they exist for this file
                    if filename in column_mappings:
                        mapping = column_mappings[filename]
                        for old_col, new_col in mapping.items():
                            if old_col in df.columns:
                                if new_col is None:
                                    # Drop columns that should be skipped
                                    df = df.drop(columns=[old_col])
                                else:
                                    # Rename columns that need mapping
                                    df = df.rename(columns={old_col: new_col})
                    
                    # Process each row
                    for _, row in df.iterrows():
                        # Convert row to dict and handle date formatting
                        data = row.to_dict()
                        
                        # Parse timestamp if it exists
                        if 'timestamp' in data:
                            if isinstance(data['timestamp'], str):
                                data['timestamp'] = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
                        
                        # For SurveillanceCamera, default motion_detected to True
                        if filename == "surveillance_cameras.csv" and "motion_detected" not in data:
                            data["motion_detected"] = True
                        
                        # Create model instance
                        model_instance = model_class(**data)
                        
                        # Add to session
                        session.add(model_instance)
                    
                    # Commit after each file
                    session.commit()
                    logger.info(f"Successfully loaded {filename}")
                    
                except Exception as e:
                    session.rollback()
                    logger.error(f"Error loading {filename}: {str(e)}")
        
        logger.info("Data loading complete!")
    
    finally:
        session.close()

def main():
    """Main function to run the data loading process."""
    load_data()

if __name__ == "__main__":
    main()
