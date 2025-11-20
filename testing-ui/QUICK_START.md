# Testing UI - Quick Start Guide

## Your Current Configuration

✅ **Backend**: Running on `http://localhost:5000`
✅ **Database**: MongoDB (instead of PostgreSQL)
✅ **MQTT Broker**: `ws://broker.hivemq.com:8000/mqtt` (public HiveMQ)
✅ **Testing UI**: Will run on `http://localhost:3001`

## Prerequisites Running

Make sure these are running before starting the Testing UI:

### 1. Backend Server (Port 5000) ✓
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 5000
```

**Check if running:**
```bash
curl http://localhost:5000/api/health
```

### 2. MongoDB Database
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"
```

If not running, start MongoDB:
```bash
brew services start mongodb-community
# OR
mongod --config /usr/local/etc/mongod.conf
```

### 3. Data Simulator (Optional)
```bash
cd backend
source venv/bin/activate
python data_simulator.py
```

## Start Testing UI

### Method 1: Using NPM
```bash
cd testing-ui
npm install  # Only needed once or if dependencies change
npm start
```

### Method 2: Using Yarn
```bash
cd testing-ui
yarn install  # Only needed once
yarn start
```

The Testing UI will automatically open at: **http://localhost:3001**

## Configuration Files Already Updated

### ✅ `.env` File
- API URL: `http://localhost:5000`
- Database: MongoDB
- MQTT: HiveMQ public broker

### ✅ `config.js`
- All endpoints configured for port 5000
- Database type set to MongoDB
- MQTT topics configured for city sensors

## Using the Testing UI

Once started, you can:

### 1. **Dashboard Tab**
- View system status
- See connection status for Backend, Database, MQTT
- Quick statistics overview

### 2. **API Testing Tab**
Test your backend endpoints:
- Traffic Sensors: `GET /api/traffic_sensors/all`
- Air Quality: `GET /api/air_quality_sensors/all`
- Create, Read, Update, Delete operations for all sensor types

### 3. **MQTT Testing Tab**
Monitor real-time sensor data:
- Connect to MQTT broker
- Subscribe to topics: `city/traffic_sensors/#`, `city/air_quality_sensors/#`, etc.
- View live messages
- Publish test messages

### 4. **Database Testing Tab**
**Note:** Since you're using MongoDB (not PostgreSQL), the database testing will work differently:
- MongoDB queries instead of SQL
- Example queries are provided in MongoDB format
- Use the backend API to interact with MongoDB

MongoDB Query Examples:
```javascript
// Count all traffic sensors
db.traffic_sensors.countDocuments({})

// Get recent traffic data
db.traffic_sensors.find().sort({timestamp: -1}).limit(50)

// Find occupied parking spots
db.parking_sensors.countDocuments({is_occupied: true})
```

### 5. **Python Test Runner Tab**
Run backend integration tests:
- Health endpoint tests
- CRUD operation tests
- Data validation tests
- Full integration test suite

### 6. **System Monitoring Tab**
Monitor system health:
- API response times
- Request counts
- Error rates
- Service status

## API Endpoints Available

All endpoints use base URL: `http://localhost:5000`

### Health & Status
- `GET /api/health` - Backend health check
- `GET /api/status` - System status
- `GET /api/mqtt/status` - MQTT status
- `GET /api/database/status` - Database status

### Sensor Types (All support CRUD operations)
- Traffic Sensors: `/api/traffic_sensors/*`
- Air Quality: `/api/air_quality_sensors/*`
- Noise Sensors: `/api/noise_sensors/*`
- Weather Stations: `/api/weather_stations/*`
- Smart Meters: `/api/smart_meters/*`
- Waste Bins: `/api/waste_bins/*`
- Parking Sensors: `/api/parking_sensors/*`
- Street Lights: `/api/street_lights/*`
- Public Transport: `/api/public_transport_trackers/*`
- Surveillance Cameras: `/api/surveillance_cameras/*`
- Water Quality: `/api/water_quality_sensors/*`
- Energy Grid: `/api/energy_grid_sensors/*`

### Simulator Control
- `POST /api/simulator/trigger` - Trigger data generation
- `GET /api/simulator/status` - Get simulator status

### Testing Endpoints
- `POST /api/tests/run_pytest` - Run pytest tests
- `POST /api/tests/run_integration` - Run integration tests
- `GET /api/tests/status/{test_id}` - Get test status

## Troubleshooting

### Backend Not Responding
```bash
# Check if backend is running
lsof -i :5000

# Restart backend
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 5000
```

### MongoDB Connection Issues
```bash
# Check MongoDB status
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community

# Check connection
mongosh --eval "db.version()"
```

### MQTT Not Connecting
- The Testing UI uses WebSocket connection to public HiveMQ broker
- Check your internet connection
- WebSocket URL: `ws://broker.hivemq.com:8000/mqtt`
- No authentication required for public broker

### Testing UI Port Already in Use
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in .env file
PORT=3002
```

### Permission Issues with npm/yarn
If you get permission errors:
```bash
# Remove and reinstall dependencies
cd testing-ui
rm -rf node_modules package-lock.json
npm install

# Or use yarn
rm -rf node_modules yarn.lock
yarn install
```

## Testing Workflow Example

1. **Start Backend** (port 5000)
2. **Start MongoDB**
3. **Start Data Simulator** (generates sensor data)
4. **Start Testing UI** (port 3001)
5. **Open browser** to http://localhost:3001
6. **In Dashboard**: Check all services are "online"
7. **In MQTT Tab**: Connect and subscribe to `city/+/#`
8. **Watch real-time data** flowing from simulator
9. **In API Tab**: Test CRUD operations
10. **In Database Tab**: Query MongoDB data
11. **In Test Runner**: Run integration tests

## Quick Health Check

Run these commands to verify everything is working:

```bash
# 1. Check backend
curl http://localhost:5000/api/health

# 2. Check MongoDB
mongosh --eval "db.adminCommand('ping')"

# 3. Check MQTT (backend logs should show MQTT connected)

# 4. Test API endpoint
curl http://localhost:5000/api/traffic_sensors/all

# 5. Trigger simulator
curl -X POST http://localhost:5000/api/simulator/trigger
```

## Development Tips

### Hot Reload
Both backend and frontend support hot reload:
- **Backend**: Uses uvicorn's `--reload` flag (add it if needed)
- **Frontend**: React automatically reloads on file changes

### Debug Mode
Open browser DevTools (F12):
- **Console**: See logs, errors, MQTT messages
- **Network**: See all API requests/responses
- **Application**: Check localStorage, session storage

### Custom Tests
You can add custom tests in the Testing UI:
1. Go to API Testing tab
2. Select "Custom Request"
3. Enter endpoint, method, and data
4. Run test

## Next Steps

1. ✅ Verify backend is running on port 5000
2. ✅ Verify MongoDB is accessible
3. ✅ Start Testing UI
4. 🔄 Test API endpoints
5. 🔄 Monitor MQTT messages
6. 🔄 Run integration tests
7. 🔄 Explore all testing features

## Support

- Check browser console for frontend errors
- Check backend terminal for API errors
- Check MongoDB logs for database issues
- Review this guide for configuration issues

---

**Your system is now configured to:**
- Backend: `localhost:5000`
- Database: MongoDB
- MQTT: HiveMQ public broker
- Testing UI: `localhost:3001`

Happy Testing! 🚀
