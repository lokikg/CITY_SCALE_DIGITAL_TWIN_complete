#!/usr/bin/env python
"""
Data Simulator for City IoT Platform

This script simulates real-time IoT data by continuously updating sensor values
in CSV files and synchronizing those changes to a Neon PostgreSQL database.
It works both locally and when deployed on Render as a background service.

Environment Variables:
    DATABASE_URL: Neon PostgreSQL connection string
    CSV_FILE_PATH: Path to target CSV file (optional, defaults to backend/data directory)
    SIMULATION_INTERVAL_SECONDS: Update frequency (default: 30)
    LOG_LEVEL: Logging verbosity (default: INFO)
    BACKUP_ENABLED: Enable CSV backups (default: true)
    MAX_BACKUPS_PER_FILE: Maximum number of backup files to keep per original file (default: 10)
"""


import os
import sys
import time
import random
import logging
import signal
import pandas as pd
import uuid
import shutil
from datetime import datetime, timezone
from pathlib import Path
import sqlalchemy
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import traceback
import json
import copy
import threading
import queue
# MQTT
import paho.mqtt.client as mqtt

# Load environment variables
load_dotenv()

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("data_simulator")



# Configuration from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/city_iot")
CSV_FILE_PATH = os.getenv("CSV_FILE_PATH", None)  # If None, will use all files in data directory
SIMULATION_INTERVAL_SECONDS = 30  # Always 30 seconds
BACKUP_ENABLED = False  # Disable backups to save storage
MAX_BACKUPS_PER_FILE = 0  # No backups
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "5"))
RETRY_DELAY_BASE = int(os.getenv("RETRY_DELAY_BASE", "2"))

# MQTT HiveMQ Cloud configuration
MQTT_BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
MQTT_PORT = int(os.getenv("MQTT_PORT", "8883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME", None)
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", None)
MQTT_TLS = os.getenv("MQTT_TLS", "true").lower() == "true"
MQTT_KEEPALIVE = int(os.getenv("MQTT_KEEPALIVE", "60"))


# Global variable to track if the script is running
running = True

# MQTT client global
mqtt_client = None

# Define the data types for each sensor column to ensure proper data type preservation
COLUMN_TYPES = {
    "traffic_sensors": {
        "vehicle_count": int,
        "avg_speed": float
    },
    "air_quality_sensors": {
        "pm25": float,
        "pm10": float,
        "no2": float,
        "co": float
    },
    "noise_sensors": {
        "decibel_level": float
    },
    "weather_stations": {
        "temperature": float,
        "humidity": float,
        "rainfall": float,
        "wind_speed": float
    },
    "smart_meters": {
        "electricity_usage": float,
        "water_usage": float
    },
    "waste_bins": {
        "fill_level": float,
        "temperature": float
    },
    "parking_sensors": {
        "is_occupied": bool
    },
    "street_lights": {
        "status": bool,
        "energy_consumption": float
    },
    "public_transport_trackers": {
        "bus_id": str,
        "occupancy": int
    },
    "surveillance_cameras": {
        "motion_detected": bool,
        "object_count": int
    },
    "water_quality_sensors": {
        "ph": float,
        "turbidity": float,
        "dissolved_oxygen": float
    },
    "energy_grid_sensors": {
        "voltage": float,
        "current": float,
        "frequency": float
    }
}

# Define column mappings for any special cases (as in load_data.py)
COLUMN_MAPPINGS = {
    "water_quality_sensors": {
        "ph_level": "ph",
        "chlorine": "dissolved_oxygen"
    },
    "surveillance_cameras": {
        "people_count": "object_count"
    }
}

# Column names that should not be altered during simulation
PROTECTED_COLUMNS = ["id", "location", "latitude", "longitude", "bus_id"]

class DatabaseManager:
    """Manages database connections and operations."""
    
    def __init__(self, database_url):
        """Initialize with database connection URL."""
        self.database_url = database_url
        self.engine = None
        self.Session = None
        self.connection_healthy = False
        self.last_reconnect_attempt = 0
        self.connect()
    
    def connect(self):
        """Establish database connection with retry logic."""
        retry_count = 0
        
        # If we've recently tried to reconnect, don't hammer the database
        current_time = time.time()
        if current_time - self.last_reconnect_attempt < 10:  # Wait at least 10 seconds between attempts
            logger.debug("Skipping reconnect attempt - too soon since last attempt")
            return self.connection_healthy
            
        self.last_reconnect_attempt = current_time
        
        while retry_count < MAX_RETRIES:
            try:
                logger.info("Connecting to database...")
                # Ensure we use the synchronous version of the URL
                sync_url = self.database_url
                if sync_url.startswith("postgresql+asyncpg://"):
                    sync_url = sync_url.replace("postgresql+asyncpg://", "postgresql://", 1)
                elif sync_url.startswith("postgres://"):
                    sync_url = sync_url.replace("postgres://", "postgresql://", 1)
                
                # Add connection pool settings optimized for serverless environments
                self.engine = create_engine(
                    sync_url, 
                    pool_pre_ping=True,
                    pool_recycle=300,  # Recycle connections after 5 minutes
                    pool_timeout=30,   # Connection timeout after 30 seconds
                    pool_size=5,       # Keep pool size small for serverless
                    max_overflow=10    # Allow up to 10 overflow connections
                )
                self.Session = sessionmaker(bind=self.engine)
                
                # Test connection
                with self.engine.connect() as conn:
                    result = conn.execute(text("SELECT 1"))
                    if result.scalar() == 1:
                        logger.info("Database connection successful")
                        self.connection_healthy = True
                        return True
            except SQLAlchemyError as e:
                retry_count += 1
                wait_time = RETRY_DELAY_BASE ** retry_count
                logger.error(f"Database connection failed: {str(e)}")
                logger.info(f"Retrying in {wait_time} seconds... (Attempt {retry_count}/{MAX_RETRIES})")
                time.sleep(wait_time)
        
        self.connection_healthy = False
        logger.critical("Failed to connect to database after maximum retries")
        return False
        
    def ensure_connected(self):
        """Ensure database connection is healthy, reconnect if needed."""
        if not self.connection_healthy or not self.engine:
            return self.connect()
            
        # Check connection is still valid
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                if result.scalar() == 1:
                    return True
                else:
                    logger.warning("Database connection check failed, reconnecting...")
                    return self.connect()
        except SQLAlchemyError as e:
            logger.warning(f"Database connection lost: {str(e)}, reconnecting...")
            return self.connect()
    
    def execute_query(self, query, params=None):
        """Execute a SQL query with retry logic."""
        # First ensure we have a valid connection
        if not self.ensure_connected():
            logger.error("Cannot execute query - database connection is not available")
            return None
            
        retry_count = 0
        while retry_count < MAX_RETRIES:
            try:
                with self.engine.connect() as conn:
                    if params:
                        result = conn.execute(text(query), params)
                    else:
                        result = conn.execute(text(query))
                    conn.commit()
                    return result
            except SQLAlchemyError as e:
                retry_count += 1
                wait_time = RETRY_DELAY_BASE ** retry_count
                logger.error(f"Query execution failed: {str(e)}")
                
                # Check if this is a connection error that requires reconnection
                if "connection" in str(e).lower() or "timeout" in str(e).lower():
                    logger.warning("Connection error detected, reconnecting to database...")
                    self.connection_healthy = False
                    if not self.ensure_connected():
                        logger.error("Failed to reconnect to database")
                        if retry_count >= MAX_RETRIES:
                            break
                
                if retry_count < MAX_RETRIES:
                    logger.info(f"Retrying in {wait_time} seconds... (Attempt {retry_count}/{MAX_RETRIES})")
                    time.sleep(wait_time)
                else:
                    logger.critical("Failed to execute query after maximum retries")
                    raise
        
        return None
    
    def update_sensor_data(self, table_name, data):
        """Update sensor data in the database."""
        # Skip if database connection is not available
        if not self.ensure_connected():
            logger.warning(f"Skipping database update for {table_name} - connection not available")
            return False
            
        session = self.Session()
        try:
            # Start a transaction
            for record in data:
                # Extract the ID and timestamp
                record_id = record['id']
                timestamp = datetime.now(timezone.utc)
                
                # Always ensure the ID is a string to match database schema
                if not isinstance(record_id, str):
                    record_id = str(record_id)
                
                # Build dynamic SET clause based on the record's keys
                set_clauses = []
                params = {}
                
                for key, value in record.items():
                    if key != 'id':  # Skip the ID as it's used in the WHERE clause
                        set_clauses.append(f"{key} = :{key}")
                        params[key] = value
                
                # Add timestamp update
                set_clauses.append("timestamp = :timestamp")
                params['timestamp'] = timestamp
                
                # Combine into a SQL query
                set_clause = ", ".join(set_clauses)
                query = f"UPDATE {table_name} SET {set_clause} WHERE id = :id"
                params['id'] = record_id
                
                # Execute the update
                session.execute(text(query), params)
            
            # Commit the transaction
            session.commit()
            logger.info(f"Successfully updated {len(data)} records in {table_name}")
            return True
        except Exception as e:
            session.rollback()
            
            # Check if this is a connection error that requires reconnection
            if "connection" in str(e).lower() or "timeout" in str(e).lower():
                logger.warning("Connection error detected during update, marking connection unhealthy")
                self.connection_healthy = False
                
            logger.error(f"Error updating {table_name}: {str(e)}")
            return False
        finally:
            session.close()
    
    def close(self):
        """Close database connection."""
        if self.engine:
            self.engine.dispose()
            logger.info("Database connection closed")



class CSVManager:
    """Manages CSV file operations."""
    def __init__(self, data_dir, backup_enabled=False, max_backups_per_file=0):
        self.data_dir = Path(data_dir)
        self.file_locks = {}
        if not self.data_dir.exists():
            raise FileNotFoundError(f"Data directory not found: {self.data_dir}")

    def get_csv_files(self):
        return list(self.data_dir.glob("*.csv"))

    def read_csv(self, csv_path):
        retry_count = 0
        while retry_count < MAX_RETRIES:
            try:
                self.file_locks[csv_path] = True
                df = pd.read_csv(csv_path)
                return df
            except Exception as e:
                retry_count += 1
                wait_time = RETRY_DELAY_BASE ** retry_count
                logger.error(f"Failed to read {csv_path}: {str(e)}")
                if retry_count < MAX_RETRIES:
                    logger.info(f"Retrying in {wait_time} seconds... (Attempt {retry_count}/{MAX_RETRIES})")
                    time.sleep(wait_time)
                else:
                    logger.critical(f"Failed to read {csv_path} after maximum retries")
                    raise
            finally:
                self.file_locks[csv_path] = False

    def write_csv(self, csv_path, df):
        retry_count = 0
        while retry_count < MAX_RETRIES:
            try:
                self.file_locks[csv_path] = True
                df.to_csv(csv_path, index=False)
                logger.info(f"Successfully updated {csv_path}")
                return True
            except Exception as e:
                retry_count += 1
                wait_time = RETRY_DELAY_BASE ** retry_count
                logger.error(f"Failed to write to {csv_path}: {str(e)}")
                if retry_count < MAX_RETRIES:
                    logger.info(f"Retrying in {wait_time} seconds... (Attempt {retry_count}/{MAX_RETRIES})")
                    time.sleep(wait_time)
                else:
                    logger.critical(f"Failed to write to {csv_path} after maximum retries")
                    raise
            finally:
                self.file_locks[csv_path] = False



class DataSimulator:
    """Simulates IoT sensor data changes and publishes to MQTT."""
    def __init__(self, csv_manager, db_manager, mqtt_client=None):
        self.csv_manager = csv_manager
        self.db_manager = db_manager
        self.mqtt_client = mqtt_client
        self.is_street_light_data = False
        self.stats = {
            "updates_attempted": 0,
            "updates_successful": 0,
            "updates_failed": 0,
            "last_update_time": None,
            "files_processed": {}
        }

    def generate_fluctuation(self, value, column_type, column_name):
        # Check if it's a street light status - set based on time of day (6pm-6am = ON, otherwise OFF)
        if column_name == "status" and column_type == bool and self.is_street_light_data:
            current_hour = datetime.now().hour
            # Street lights are ON from 6pm (18) to 6am (6)
            return current_hour >= 18 or current_hour < 6
        
        # For all other fields, use normal fluctuation logic
        return value if column_name in PROTECTED_COLUMNS else (
            not value if column_type == bool and random.random() < 0.1 else value if column_type == bool else (
                max(0, value + random.randint(-3, 3)) if column_type == int and column_name in ["vehicle_count", "occupancy", "object_count"] else value + random.randint(-3, 3) if column_type == int else (
                    min(100.0, max(0.0, value * (1 + random.uniform(-0.07, 0.07)))) if column_type == float and column_name in ["humidity", "fill_level"] else (
                        min(14.0, max(0.0, value * (1 + random.uniform(-0.07, 0.07)))) if column_type == float and column_name == "ph" else (
                            max(0.0, value * (1 + random.uniform(-0.07, 0.07))) if column_type == float and column_name in ["rainfall", "electricity_usage", "water_usage", "energy_consumption"] else (
                                round(value * (1 + random.uniform(-0.07, 0.07)), 2) if column_type == float else value
                            )
                        )
                    )
                )
            )
        )

    def publish_to_mqtt(self, device_type, record):
        """Publish a single device record to MQTT."""
        if not self.mqtt_client:
            logger.warning("MQTT client not initialized, skipping publish.")
            return False
        device_id = record.get("id", "unknown")
        topic = f"city/{device_type}/{device_id}"
        payload = json.dumps(record)
        try:
            result = self.mqtt_client.publish(topic, payload, qos=1)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Published to MQTT: {topic}")
                return True
            else:
                logger.error(f"MQTT publish failed: {topic}, rc={result.rc}")
                return False
        except Exception as e:
            logger.error(f"MQTT publish error: {e}")
            return False

    def simulate_data_changes(self, csv_path):
        try:
            table_name = csv_path.stem
            # Set flag for street light data to handle time-based status
            self.is_street_light_data = (table_name == "street_lights")
            
            df = self.csv_manager.read_csv(csv_path)
            base_table_name = table_name.replace("_sensors", "").replace("_stations", "").replace("_trackers", "")
            if base_table_name in COLUMN_MAPPINGS:
                for old_col, new_col in COLUMN_MAPPINGS[base_table_name].items():
                    if old_col in df.columns:
                        df = df.rename(columns={old_col: new_col})
            original_df = df.copy()
            table_column_types = COLUMN_TYPES.get(table_name, {})
            num_rows = len(df)
            num_rows_to_update = random.randint(max(1, int(num_rows * 0.3)), max(1, int(num_rows * 0.7)))
            rows_to_update = random.sample(range(num_rows), num_rows_to_update)
            db_updates = []
            for idx in rows_to_update:
                row = df.iloc[idx].copy()
                record = {}
                for column in df.columns:
                    if column in table_column_types:
                        column_type = table_column_types[column]
                        current_value = row[column]
                        new_value = self.generate_fluctuation(current_value, column_type, column)
                        df.at[idx, column] = new_value
                        if hasattr(new_value, 'item'):
                            record[column] = new_value.item()
                        else:
                            record[column] = new_value
                if hasattr(row['id'], 'item'):
                    record['id'] = str(row['id'].item())
                else:
                    record['id'] = str(row['id'])
                if 'timestamp' in df.columns:
                    current_time = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
                    df.at[idx, 'timestamp'] = current_time
                db_updates.append(record)
                # Publish to MQTT
                self.publish_to_mqtt(table_name, record)
            if not original_df.equals(df) and db_updates:
                csv_result = self.csv_manager.write_csv(csv_path, df)
                db_result = self.db_manager.update_sensor_data(table_name, db_updates)
                self.stats["updates_attempted"] += 1
                if csv_result and db_result:
                    self.stats["updates_successful"] += 1
                    if table_name not in self.stats["files_processed"]:
                        self.stats["files_processed"][table_name] = 0
                    self.stats["files_processed"][table_name] += 1
                else:
                    self.stats["updates_failed"] += 1
                self.stats["last_update_time"] = datetime.now().isoformat()
                logger.info(f"Updated {len(db_updates)} records in {table_name}")
                return True
            else:
                logger.info(f"No significant changes to simulate for {table_name}")
                return False
        except Exception as e:
            logger.error(f"Error simulating data for {csv_path.name}: {str(e)}")
            logger.debug(traceback.format_exc())
            self.stats["updates_failed"] += 1
            return False

    def run_simulation_cycle(self):
        logger.info("Starting simulation cycle...")
        if CSV_FILE_PATH:
            csv_files = [Path(CSV_FILE_PATH)]
        else:
            csv_files = self.csv_manager.get_csv_files()
        random.shuffle(csv_files)
        num_files = len(csv_files)
        num_files_to_update = random.randint(max(1, int(num_files * 0.3)), max(1, int(num_files * 0.7)))
        files_to_update = random.sample(csv_files, num_files_to_update)
        for csv_path in files_to_update:
            if not running:
                break
            self.simulate_data_changes(csv_path)
        logger.info(f"Simulation cycle completed. Updated {num_files_to_update} files.")

    def get_stats(self):
        return self.stats


def signal_handler(sig, frame):
    """Handle termination signals."""
    global running
    logger.info("Shutdown signal received. Cleaning up...")
    running = False


def setup_signal_handlers():
    """Set up signal handlers for graceful shutdown."""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)


def health_check(db_manager, simulator, stop_event):
    """Run periodic health checks and report status."""
    while not stop_event.is_set():
        try:
            # Skip detailed health checks if in sleep mode
            if is_sleeping:
                logger.debug("Health check: Simulator is in sleep mode")
                time.sleep(60)  # Check less frequently during sleep
                continue
                
            # Check database connection
            db_healthy = db_manager.ensure_connected()
            
            # Get simulator stats
            stats = simulator.get_stats()
            
            # Log health status
            logger.info(f"Health check: Database {'✓' if db_healthy else '✗'}, "
                       f"Updates (success/fail): {stats['updates_successful']}/{stats['updates_failed']}")
            
            # Wait for next check
            for _ in range(60):  # Check every minute
                if stop_event.is_set():
                    break
                time.sleep(1)
                
        except Exception as e:
            logger.error(f"Health check error: {str(e)}")
            time.sleep(10)  # Wait a bit before retrying


# Global variables to control simulator state
simulator_instance = None
last_activity_time = time.time()
is_sleeping = False
activity_check_file = "/tmp/city_iot_simulator_activity"

def check_for_activity_signal():
    """
    Check if there's been a signal to indicate recent activity.
    This allows the API server to communicate with the simulator.
    """
    global last_activity_time, is_sleeping
    
    try:
        # Check if the activity signal file exists
        if os.path.exists(activity_check_file):
            with open(activity_check_file, 'r') as f:
                content = f.read().strip()
                if content:
                    try:
                        file_timestamp = float(content)
                        if file_timestamp > last_activity_time:
                            last_activity_time = file_timestamp
                            if is_sleeping:
                                logger.info("Activity detected! Waking up simulator.")
                                is_sleeping = False
                            return True
                    except ValueError:
                        pass
    except Exception as e:
        logger.error(f"Error checking for activity signal: {str(e)}")
    
    # Check if we should go to sleep
    if not is_sleeping and (time.time() - last_activity_time) > 15 * 60:  # 15 minutes
        logger.info("No activity for 15 minutes, entering sleep mode")
        is_sleeping = True
        
    return False

def record_activity():
    """Record that there's been API activity to wake up the simulator."""
    global last_activity_time, is_sleeping
    
    current_time = time.time()
    last_activity_time = current_time
    is_sleeping = False
    
    try:
        # Create the activity signal file
        os.makedirs(os.path.dirname(activity_check_file), exist_ok=True)
        with open(activity_check_file, 'w') as f:
            f.write(str(current_time))
    except Exception as e:
        logger.error(f"Error recording activity signal: {str(e)}")

def run_single_simulation_cycle():
    """Run a single simulation cycle on demand."""
    global simulator_instance
    
    if simulator_instance is None:
        logger.error("Simulator not initialized, can't run cycle")
        return False
    
    record_activity()
    logger.info("Running on-demand simulation cycle")
    return simulator_instance.run_simulation_cycle()



def setup_mqtt_client():
    """Setup and return a connected MQTT client."""
    client = mqtt.Client()
    if MQTT_USERNAME and MQTT_PASSWORD:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    if MQTT_TLS:
        client.tls_set()
    client.keepalive = MQTT_KEEPALIVE
    # Resilience: reconnect on disconnect
    def on_disconnect(client, userdata, rc):
        logger.warning(f"MQTT disconnected (rc={rc}), attempting reconnect...")
        while True:
            try:
                client.reconnect()
                logger.info("MQTT reconnected.")
                break
            except Exception as e:
                logger.error(f"MQTT reconnect failed: {e}")
                time.sleep(5)
    client.on_disconnect = on_disconnect
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, MQTT_KEEPALIVE)
        logger.info(f"Connected to MQTT broker {MQTT_BROKER}:{MQTT_PORT}")
    except Exception as e:
        logger.error(f"Failed to connect to MQTT broker: {e}")
        client = None
    return client

def main():
    global simulator_instance, last_activity_time, mqtt_client

    logger.info("Starting City IoT Data Simulator...")

    # Set up signal handlers for graceful shutdown
    setup_signal_handlers()

    # Setup MQTT client
    mqtt_client = setup_mqtt_client()

    try:
        script_dir = Path(__file__).parent
        data_dir = script_dir / "data"
        db_manager = DatabaseManager(DATABASE_URL)
        csv_manager = CSVManager(data_dir, backup_enabled=False, max_backups_per_file=0)
        simulator = DataSimulator(csv_manager, db_manager, mqtt_client=mqtt_client)
        simulator_instance = simulator
        record_activity()
        stop_event = threading.Event()
        health_thread = threading.Thread(target=health_check, args=(db_manager, simulator, stop_event))
        health_thread.daemon = True
        health_thread.start()
        while running:
            activity_detected = check_for_activity_signal()
            if not is_sleeping or activity_detected:
                simulator.run_simulation_cycle()
                if simulator.stats["updates_attempted"] % 5 == 0:
                    logger.info(f"Simulation stats: {json.dumps(simulator.stats, indent=2)}")
            else:
                logger.debug("Simulator in sleep mode, skipping cycle")
                if random.random() < 0.05:
                    logger.debug("Attempting database reconnection check during sleep")
                    db_manager.ensure_connected()
            for _ in range(30):
                if not running:
                    break
                if _ % 5 == 0:
                    check_for_activity_signal()
                time.sleep(1)
        logger.info("Shutting down simulator...")
        stop_event.set()
        health_thread.join(timeout=5)
        db_manager.close()
        logger.info("Simulator shutdown complete.")
    except KeyboardInterrupt:
        logger.info("Simulator interrupted by user.")
    except Exception as e:
        logger.critical(f"Fatal error: {str(e)}")
        logger.debug(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()
