from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import subprocess
import sys
import os
import uuid
import json
from datetime import datetime
import asyncio
from contextlib import asynccontextmanager

# Store test results in memory
active_tests = {}

class TestRequest(BaseModel):
    testPath: str
    verbose: bool = True
    captureOutput: bool = True

class IntegrationTestRequest(BaseModel):
    baseUrl: str = "http://localhost:8000/api"
    deviceTypes: Optional[List[str]] = None

class TestResult(BaseModel):
    id: str
    status: str  # "running", "completed", "failed"
    command: str
    startTime: str
    endTime: Optional[str] = None
    exitCode: Optional[int] = None
    output: Optional[str] = None
    summary: Optional[Dict[str, Any]] = None

router = APIRouter(
    prefix="/api/tests",
    tags=["tests"],
    responses={404: {"description": "Not found"}},
)

@asynccontextmanager
async def run_process(command, test_id, capture_output=True):
    """Run a subprocess and capture its output"""
    process = None
    try:
        # Start the process
        if capture_output:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
        else:
            process = await asyncio.create_subprocess_shell(command)
        
        yield process
    finally:
        # Make sure to terminate the process if it's still running
        if process and process.returncode is None:
            process.terminate()
            try:
                await asyncio.wait_for(process.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                process.kill()

async def run_test_in_background(test_id, command, capture_output=True):
    """Run a test in the background and update its status"""
    try:
        active_tests[test_id]["status"] = "running"
        
        async with run_process(command, test_id, capture_output) as process:
            if capture_output:
                stdout, stderr = await process.communicate()
                output = stdout.decode('utf-8') + stderr.decode('utf-8')
                active_tests[test_id]["output"] = output
            else:
                await process.wait()
                output = "Output not captured"
            
            active_tests[test_id]["exitCode"] = process.returncode
            active_tests[test_id]["status"] = "completed" if process.returncode == 0 else "failed"
            active_tests[test_id]["endTime"] = datetime.now().isoformat()
            
            # Parse test results if possible
            try:
                if capture_output and "FINAL TEST RESULTS" in output:
                    # Parse backend_test.py style output
                    results_section = output.split("FINAL TEST RESULTS")[1]
                    tests_line = [line for line in results_section.split('\n') if "Tests passed:" in line][0]
                    tests_passed, tests_total = map(int, tests_line.split(":")[1].strip().split('/'))
                    
                    active_tests[test_id]["summary"] = {
                        "passed": tests_passed,
                        "total": tests_total,
                        "success_rate": (tests_passed / tests_total) * 100 if tests_total > 0 else 0
                    }
                elif capture_output and "passed" in output and "failed" in output:
                    # Parse pytest style output
                    passed = output.count(" passed")
                    failed = output.count(" failed")
                    skipped = output.count(" skipped")
                    total = passed + failed + skipped
                    
                    active_tests[test_id]["summary"] = {
                        "passed": passed,
                        "failed": failed,
                        "skipped": skipped,
                        "total": total,
                        "success_rate": (passed / total) * 100 if total > 0 else 0
                    }
            except Exception as e:
                print(f"Error parsing test results: {str(e)}")
                # If parsing fails, we still have the raw output
                pass
            
    except Exception as e:
        active_tests[test_id]["status"] = "failed"
        active_tests[test_id]["output"] = f"Error running test: {str(e)}"
        active_tests[test_id]["endTime"] = datetime.now().isoformat()

@router.post("/run_pytest")
async def run_pytest(
    background_tasks: BackgroundTasks,
    request: TestRequest
):
    """Run pytest on a specified test file"""
    test_id = str(uuid.uuid4())
    
    # Determine the Python path
    python_executable = sys.executable
    
    # Get the backend directory path
    backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
    
    # Build the command
    verbose_flag = "-v" if request.verbose else ""
    command = f"cd {backend_dir} && {python_executable} -m pytest {request.testPath} {verbose_flag}"
    
    # Store test information
    active_tests[test_id] = {
        "id": test_id,
        "status": "pending",
        "command": command,
        "startTime": datetime.now().isoformat(),
        "endTime": None,
        "exitCode": None,
        "output": None,
        "summary": None
    }
    
    # Run the test in the background
    background_tasks.add_task(
        run_test_in_background, 
        test_id, 
        command, 
        request.captureOutput
    )
    
    return {
        "testId": test_id,
        "status": "started",
        "command": command
    }

@router.post("/run_integration")
async def run_integration_test(
    background_tasks: BackgroundTasks,
    request: IntegrationTestRequest
):
    """Run the integration test script (backend_test.py)"""
    test_id = str(uuid.uuid4())
    
    # Determine the Python path
    python_executable = sys.executable
    
    # Get the root directory path
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Build the command
    device_types_param = ""
    if request.deviceTypes:
        device_types_str = ",".join(request.deviceTypes)
        device_types_param = f" --device-types {device_types_str}"
    
    command = f"cd {root_dir} && {python_executable} backend_test.py --base-url {request.baseUrl}{device_types_param}"
    
    # Store test information
    active_tests[test_id] = {
        "id": test_id,
        "status": "pending",
        "command": command,
        "startTime": datetime.now().isoformat(),
        "endTime": None,
        "exitCode": None,
        "output": None,
        "summary": None
    }
    
    # Run the test in the background
    background_tasks.add_task(
        run_test_in_background, 
        test_id, 
        command, 
        True  # Always capture output for integration tests
    )
    
    return {
        "testId": test_id,
        "status": "started",
        "command": command
    }

@router.get("/status/{test_id}")
async def get_test_status(test_id: str):
    """Get the status of a running or completed test"""
    if test_id not in active_tests:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test_info = active_tests[test_id]
    
    # Create a TestResult object with the current status
    result = TestResult(
        id=test_info["id"],
        status=test_info["status"],
        command=test_info["command"],
        startTime=test_info["startTime"],
        endTime=test_info["endTime"],
        exitCode=test_info["exitCode"],
        output=test_info["output"],
        summary=test_info["summary"]
    )
    
    return result

@router.get("/list")
async def list_active_tests():
    """List all active and recent tests"""
    return {
        "tests": [
            {
                "id": test_id,
                "status": info["status"],
                "startTime": info["startTime"],
                "endTime": info["endTime"]
            }
            for test_id, info in active_tests.items()
        ]
    }
