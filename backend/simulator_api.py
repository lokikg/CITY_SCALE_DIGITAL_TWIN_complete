"""
API for interacting with the data simulator.
This module provides API endpoints to trigger and control the data simulator.
"""

import os
import time
import subprocess
import logging
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
ACTIVITY_CHECK_FILE = "/tmp/city_iot_simulator_activity"
SIMULATOR_SCRIPT = Path(__file__).parent / "data_simulator.py"

# Create router
simulator_router = APIRouter(prefix="/api/simulator", tags=["simulator"])

def ensure_simulator_running():
    """Ensure the data simulator is running as a background process."""
    try:
        # Check if the simulator is already running
        process = subprocess.run(
            ["pgrep", "-f", "data_simulator.py"],
            capture_output=True,
            text=True
        )
        
        if process.returncode == 0:
            logger.info("Data simulator already running")
            return True
        
        # Start the simulator as a background process
        logger.info("Starting data simulator as background process")
        subprocess.Popen(
            ["python3", str(SIMULATOR_SCRIPT)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            start_new_session=True  # Detach from parent process
        )
        
        # Give it a moment to start
        time.sleep(2)
        
        # Verify it started
        process = subprocess.run(
            ["pgrep", "-f", "data_simulator.py"],
            capture_output=True,
            text=True
        )
        
        if process.returncode == 0:
            logger.info("Data simulator started successfully")
            return True
        else:
            logger.error("Failed to start data simulator")
            return False
            
    except Exception as e:
        logger.error(f"Error starting simulator: {str(e)}")
        return False

def trigger_simulator_activity():
    """Signal to the simulator that there's been activity."""
    try:
        # Create the activity signal file
        os.makedirs(os.path.dirname(ACTIVITY_CHECK_FILE), exist_ok=True)
        with open(ACTIVITY_CHECK_FILE, 'w') as f:
            f.write(str(time.time()))
        logger.info("Simulator activity triggered")
        return True
    except Exception as e:
        logger.error(f"Error triggering simulator activity: {str(e)}")
        return False

def background_ensure_simulator():
    """Background task to ensure simulator is running."""
    ensure_simulator_running()
    trigger_simulator_activity()

@simulator_router.post("/trigger")
async def trigger_data_simulation(background_tasks: BackgroundTasks):
    """
    Trigger the data simulator to generate new data.
    This endpoint is called by the frontend to wake up the simulator
    and generate fresh data.
    """
    # Queue the background task to ensure simulator is running
    background_tasks.add_task(background_ensure_simulator)
    
    return {
        "status": "triggered",
        "message": "Data simulation triggered successfully",
        "timestamp": time.time()
    }

@simulator_router.get("/status")
async def get_simulator_status():
    """
    Get the current status of the data simulator.
    """
    try:
        # Check if the simulator is running
        process = subprocess.run(
            ["pgrep", "-f", "data_simulator.py"],
            capture_output=True,
            text=True
        )
        
        is_running = process.returncode == 0
        
        # Check when it was last active
        last_active = None
        if os.path.exists(ACTIVITY_CHECK_FILE):
            try:
                with open(ACTIVITY_CHECK_FILE, 'r') as f:
                    content = f.read().strip()
                    if content:
                        last_active = float(content)
            except Exception:
                pass
        
        return {
            "is_running": is_running,
            "last_active": last_active,
            "current_time": time.time(),
            "is_sleeping": last_active is not None and (time.time() - last_active) > 15 * 60
        }
    except Exception as e:
        logger.error(f"Error checking simulator status: {str(e)}")
        return {
            "is_running": False,
            "error": str(e)
        }

# Create FastAPI app and include the router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="IoT Data Simulator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the simulator router
app.include_router(simulator_router)

@app.get("/")
async def root():
    return {"message": "IoT Data Simulator API", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
