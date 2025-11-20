# Testing UI - Complete Integration Setup Guide

This guide explains how to set up and use the Testing UI with the complete Smart City IoT Platform.

## Overview

The Testing UI is a comprehensive testing dashboard that allows you to:
- Test API endpoints (CRUD operations for all sensor types)
- Monitor MQTT message flow in real-time
- Execute database queries and inspect schema
- Run Python integration tests
- Monitor system performance
- View Grafana dashboards

## Prerequisites

Before starting the Testing UI, ensure the following services are running:

### 1. PostgreSQL Database
- Database name: `city_iot`
- User: `postgres`
- Password: `Lokik2005`
- Port: `5432`
- Host: `localhost`

Check if running:
```bash
psql -U postgres -d city_iot -c "SELECT 1"
```

### 2. Backend API Server
- Port: `8000`
- Host: `localhost`

Start the backend:
```bash
cd backend
source venv/bin/activate
python server.py
```

Or if using uvicorn:
```bash
cd backend
source venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Verify it's running:
```bash
curl http://localhost:8000/api/health
```

Expected response: `{"status": "ok", "message": "Backend is running", ...}`

### 3. Data Simulator (Optional but Recommended)
The data simulator generates realistic sensor data via MQTT.

Start the simulator:
```bash
cd backend
source venv/bin/activate
python data_simulator.py
```

The simulator will:
- Connect to the MQTT broker (broker.hivemq.com)
- Generate data for all 12 sensor types
- Publish to topics like `city/traffic_sensors/SENSOR_ID`
- Auto-sleep after 15 minutes of inactivity
- Wake up when triggered via API

### 4. MQTT Broker
The system uses the public HiveMQ broker:
- Broker: `broker.hivemq.com`
- WebSocket Port: `8000`
- WebSocket URL: `ws://broker.hivemq.com:8000/mqtt`

No setup required - it's a public broker!

### 5. Grafana (Optional)
For viewing metrics dashboards:
- Port: `3000`
- URL: `http://localhost:3000`

Start Grafana:
```bash
cd grafana
docker-compose up -d
```

## Testing UI Setup

### 1. Install Dependencies

```bash
cd testing-ui
npm install
```

or

```bash
cd testing-ui
yarn install
```

### 2. Configure Environment

The `.env` file is already configured with the correct settings:

```properties
PORT=3001
REACT_APP_API_URL=http://localhost:8000
REACT_APP_MQTT_BROKER=ws://broker.hivemq.com:8000/mqtt
REACT_APP_GRAFANA_URL=http://localhost:3000
REACT_APP_DB_HOST=localhost
REACT_APP_DB_PORT=5432
REACT_APP_DB_NAME=city_iot
REACT_APP_DB_USER=postgres
REACT_APP_DB_PASSWORD=Lokik2005
REACT_APP_MOCK_API=false
```

**Important:** `REACT_APP_MOCK_API=false` ensures the UI connects to real services, not mocks.

### 3. Start the Testing UI

```bash
cd testing-ui
npm start
```

or

```bash
cd testing-ui
yarn start
```

The UI will open at: `http://localhost:3001`

## Complete Startup Sequence

Follow this order for the smoothest experience:

```bash
# Terminal 1: Start PostgreSQL (if not already running as a service)
# Usually PostgreSQL runs as a system service, so this may not be needed

# Terminal 2: Start Backend Server
cd backend
source venv/bin/activate
python server.py

# Terminal 3: Start Data Simulator
cd backend
source venv/bin/activate
python data_simulator.py

# Terminal 4: Start Grafana (optional)
cd grafana
docker-compose up -d

# Terminal 5: Start Testing UI
cd testing-ui
npm start
```

## Using the Testing UI

### Dashboard Overview
The main dashboard shows:
- System status (Backend, Database, MQTT, Grafana)
- Quick statistics
- Recent activity

### API Testing Tab
Test REST API endpoints:
1. Select sensor type (Traffic, Air Quality, etc.)
2. Choose operation (GET, POST, PUT, DELETE)
3. Enter test data (for POST/PUT)
4. Click "Run Test"
5. View response

Example test cases:
- **Create Traffic Sensor**: POST to `/api/traffic_sensors/add`
- **Get All Sensors**: GET from `/api/traffic_sensors/all`
- **Update Sensor**: PUT to `/api/traffic_sensors/{id}`
- **Delete Sensor**: DELETE from `/api/traffic_sensors/{id}`

### MQTT Testing Tab
Monitor real-time MQTT messages:
1. Click "Connect to MQTT Broker"
2. Subscribe to topics (e.g., `city/traffic_sensors/#`)
3. View incoming messages in real-time
4. Publish test messages
5. Clear message log as needed

Topics:
- `city/traffic_sensors/#` - Traffic sensor data
- `city/air_quality_sensors/#` - Air quality data
- `city/weather_stations/#` - Weather data
- `city/+/#` - All city sensor data

### Database Testing Tab
Execute SQL queries and inspect database:
1. Use pre-defined queries or write custom SQL
2. Click "Execute Query"
3. View results in table format
4. Check execution time
5. Export results

Example queries:
```sql
-- Get all traffic sensors
SELECT * FROM traffic_sensors LIMIT 100;

-- Recent air quality readings
SELECT * FROM air_quality_sensors 
ORDER BY timestamp DESC LIMIT 50;

-- Count occupied parking spots
SELECT COUNT(*) FROM parking_sensors 
WHERE is_occupied = true;
```

### Python Test Runner
Run the backend integration tests:
1. Select test suite:
   - Health Endpoints
   - Error Handling
   - Data Validation
   - Device Operations
   - Full Integration Test
2. Click "Run Test"
3. View test progress
4. See detailed results with pass/fail status

### System Monitoring
View system metrics:
- API response times
- Database connection status
- MQTT broker status
- Memory/CPU usage (if available)
- Request counts

### Performance Testing
Run performance tests:
1. Select test type (API load test, Database query performance)
2. Configure parameters (requests, concurrency)
3. Run test
4. Analyze results

## Sensor Types and Endpoints

The system supports 12 sensor types:

| Sensor Type | Endpoints |
|------------|-----------|
| Traffic Sensors | `/api/traffic_sensors/*` |
| Air Quality Sensors | `/api/air_quality_sensors/*` |
| Noise Sensors | `/api/noise_sensors/*` |
| Weather Stations | `/api/weather_stations/*` |
| Smart Meters | `/api/smart_meters/*` |
| Waste Bins | `/api/waste_bins/*` |
| Parking Sensors | `/api/parking_sensors/*` |
| Street Lights | `/api/street_lights/*` |
| Public Transport | `/api/public_transport_trackers/*` |
| Surveillance Cameras | `/api/surveillance_cameras/*` |
| Water Quality | `/api/water_quality_sensors/*` |
| Energy Grid | `/api/energy_grid_sensors/*` |

Each sensor type supports:
- `GET /all` - Get all sensors
- `GET /{id}` - Get sensor by ID
- `POST /add` - Create new sensor
- `PUT /{id}` - Update sensor
- `DELETE /{id}` - Delete sensor
- `GET /latest` - Get latest reading

## Troubleshooting

### Backend Not Connecting
**Error:** "Network Error" or "Connection Refused"

**Solution:**
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Verify port 8000 is not in use: `lsof -i :8000`
3. Check backend logs for errors
4. Ensure CORS is enabled in backend

### MQTT Not Connecting
**Error:** "MQTT Connection Failed"

**Solution:**
1. Check internet connection (using public broker)
2. Verify WebSocket URL: `ws://broker.hivemq.com:8000/mqtt`
3. Check browser console for WebSocket errors
4. Try restarting the data simulator
5. Test connection: Open browser console and try:
   ```javascript
   new WebSocket('ws://broker.hivemq.com:8000/mqtt')
   ```

### Database Errors
**Error:** "Database connection failed"

**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env` file
3. Test connection: `psql -U postgres -d city_iot -c "SELECT 1"`
4. Check database exists: `psql -U postgres -l | grep city_iot`
5. If database doesn't exist, create it:
   ```bash
   psql -U postgres -c "CREATE DATABASE city_iot"
   cd backend
   python load_data.py
   ```

### No Data Showing
**Error:** Empty results or "No data found"

**Solution:**
1. Run the data simulator to generate data
2. Wait 30 seconds for data to be generated
3. Check MQTT messages are being published
4. Verify data in database:
   ```sql
   SELECT COUNT(*) FROM traffic_sensors;
   ```
5. Trigger simulator manually:
   ```bash
   curl -X POST http://localhost:8000/api/simulator/trigger
   ```

### Grafana Not Loading
**Error:** "Failed to load Grafana"

**Solution:**
1. Check Grafana is running: `curl http://localhost:3000`
2. Start Grafana: `cd grafana && docker-compose up -d`
3. Check Docker is running: `docker ps`
4. Access Grafana directly: `http://localhost:3000`

## Data Flow

Understanding the data flow helps with debugging:

```
1. Data Simulator generates sensor data
   ↓
2. Publishes to MQTT (broker.hivemq.com)
   Topic: city/{sensor_type}/{sensor_id}
   ↓
3. Backend subscribes to MQTT topics
   ↓
4. Backend saves data to PostgreSQL
   ↓
5. Testing UI queries data via REST API
   ↓
6. Testing UI subscribes to MQTT for real-time updates
   ↓
7. Grafana queries PostgreSQL for visualizations
```

## API Endpoints Reference

### Health & Status
- `GET /api/health` - Backend health check
- `GET /api/status` - System status (backend, database, MQTT)
- `GET /api/mqtt/status` - MQTT broker status
- `GET /api/database/status` - Database status with table counts

### Simulator Control
- `POST /api/simulator/trigger` - Wake up/trigger data generation
- `GET /api/simulator/status` - Get simulator status

### Testing Endpoints
- `POST /api/tests/run_pytest` - Run pytest tests
- `POST /api/tests/run_integration` - Run integration tests
- `GET /api/tests/status/{test_id}` - Get test status
- `GET /api/tests/list` - List all tests

### Database Testing
- `POST /api/tests/database/connection` - Test database connection
- `POST /api/tests/database/query` - Execute SQL query
- `GET /api/tests/database/schema` - Get database schema
- `GET /api/tests/database/tables/{name}` - Get table info
- `POST /api/tests/database/performance` - Run performance test

### Grafana Data
- `GET /api/grafana/city_overview` - City overview metrics
- `GET /api/grafana/traffic_metrics` - Traffic metrics
- `GET /api/grafana/air_quality_metrics` - Air quality metrics
- `GET /api/grafana/energy_grid_metrics` - Energy grid metrics

## Testing Scenarios

### Scenario 1: Test Complete Data Flow
1. Start all services
2. In Testing UI → MQTT Tab: Connect and subscribe to `city/+/#`
3. In Terminal: Trigger simulator: `curl -X POST http://localhost:8000/api/simulator/trigger`
4. Watch MQTT messages arrive in real-time
5. In Testing UI → API Tab: Query `/api/traffic_sensors/all`
6. Verify data is stored in database
7. In Testing UI → Database Tab: Run query: `SELECT COUNT(*) FROM traffic_sensors`

### Scenario 2: Test API CRUD Operations
1. Create a new sensor (POST)
2. Verify it exists (GET all)
3. Get sensor by ID (GET by ID)
4. Update the sensor (PUT)
5. Verify update (GET by ID)
6. Delete the sensor (DELETE)
7. Verify deletion (GET by ID should fail)

### Scenario 3: Performance Testing
1. Run database performance test on traffic sensors
2. Run API load test with multiple concurrent requests
3. Monitor response times
4. Check system resource usage
5. Verify no errors under load

## Development Tips

### Debugging API Requests
Open browser DevTools (F12) → Network tab to see all API requests and responses.

### Debugging MQTT
Open browser DevTools → Console to see MQTT connection logs and messages.

### Hot Reload
Both Testing UI and Backend support hot reload:
- Testing UI: Changes to React components reload automatically
- Backend: If using `uvicorn --reload`, changes reload automatically

### Custom API Tests
You can write custom API test scripts and run them via the Python Test Runner.

## Support

For issues or questions:
1. Check the logs in browser console (F12)
2. Check backend logs in the terminal
3. Review this documentation
4. Check the main project README.md

## Architecture

```
Testing UI (React - Port 3001)
    ↓ REST API
Backend (FastAPI - Port 8000)
    ↓ MQTT Subscribe
MQTT Broker (HiveMQ - broker.hivemq.com)
    ↑ MQTT Publish
Data Simulator (Python)
    ↓ SQLAlchemy ORM
PostgreSQL Database (Port 5432)
    ↑ Queries
Grafana (Port 3000)
```

## Security Notes

- The Testing UI is for development/testing only
- Database credentials are in plain text (development only)
- No authentication is required (development only)
- For production, implement proper authentication and security

## Next Steps

After everything is working:
1. Explore all tabs in the Testing UI
2. Run the integration test suite
3. Create custom test scenarios
4. Monitor system performance
5. Experiment with different sensor data patterns
6. View data in Grafana dashboards

Happy Testing! 🚀
