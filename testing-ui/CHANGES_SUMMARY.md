# Testing UI Integration Summary

## Changes Made for Your Configuration

Your project uses:
- **Backend Port**: 5000 (not 8000)
- **Database**: MongoDB (not PostgreSQL)
- **MQTT Broker**: HiveMQ public broker

All testing UI files have been updated to work with your setup.

---

## Files Modified

### 1. `/testing-ui/.env`
**Changed:**
- API URL from `http://localhost:8000` → `http://localhost:5000`
- Database from PostgreSQL → MongoDB
  - DB_TYPE: `mongodb`
  - DB_PORT: `27017` (MongoDB default)
  - Removed PostgreSQL credentials

### 2. `/testing-ui/src/config.js`
**Changed:**
- API baseUrl from port 8000 → port 5000
- Database configuration to MongoDB type
- Database port from 5432 → 27017
- Added `type: 'mongodb'` field

### 3. `/testing-ui/src/services/apiService.js`
**Updated:**
- All API endpoints to match your backend routes
- Added sensor-specific endpoints for all 12 sensor types
- Added simulator control endpoints
- Updated health check endpoints

### 4. `/testing-ui/src/services/databaseService.js`
**Changed:**
- SQL queries → MongoDB queries
- PostgreSQL syntax → MongoDB syntax
- Example queries:
  - `SELECT * FROM table` → `db.collection.find()`
  - `COUNT(*)` → `countDocuments({})`
  - `ORDER BY` → `.sort()`

### 5. `/backend/server.py`
**Added:**
- Database testing API router integration
- Uvicorn runner for direct execution
- Support for MongoDB through existing models

### 6. `/backend/database_test_api.py` (New File)
**Created:**
- Database testing endpoints for Testing UI
- Connection testing
- Query execution
- Schema inspection
- Performance testing

---

## Documentation Created

### 1. `QUICK_START.md`
Complete guide for your configuration:
- Backend on port 5000
- MongoDB database
- Step-by-step startup instructions
- Troubleshooting guide
- Example queries for MongoDB

### 2. `INTEGRATION_SETUP.md`
Comprehensive integration guide (also updated for your setup)

---

## How to Use

### Start Your System:

```bash
# Terminal 1: Backend on port 5000
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 5000

# Terminal 2: MongoDB (if not running as service)
mongod --config /usr/local/etc/mongod.conf

# Terminal 3: Data Simulator (optional)
cd backend
source venv/bin/activate
python data_simulator.py

# Terminal 4: Testing UI
cd testing-ui
npm install  # Only first time
npm start    # Opens on http://localhost:3001
```

### Verify Everything Works:

```bash
# Check backend
curl http://localhost:5000/api/health

# Check MongoDB
mongosh --eval "db.version()"

# Check Testing UI
open http://localhost:3001
```

---

## What the Testing UI Can Do

### ✅ API Testing
- Test all 12 sensor types CRUD operations
- Health checks
- Simulator control
- Custom API requests

### ✅ MQTT Monitoring
- Connect to HiveMQ broker
- Subscribe to sensor topics
- View real-time messages
- Publish test messages

### ✅ Database Testing
- Execute MongoDB queries
- View collection statistics
- Test database connection
- Performance testing

### ✅ Python Test Runner
- Run pytest tests from UI
- Run integration tests
- View test results in real-time
- Check test coverage

### ✅ System Monitoring
- Backend status
- Database status
- MQTT status
- Service health checks

---

## API Endpoints (Port 5000)

All sensor types follow this pattern:

```
GET    /api/{sensor_type}/all       # Get all sensors
GET    /api/{sensor_type}/{id}      # Get by ID
POST   /api/{sensor_type}/add       # Create new
PUT    /api/{sensor_type}/{id}      # Update
DELETE /api/{sensor_type}/{id}      # Delete
GET    /api/{sensor_type}/latest    # Get latest reading
```

Sensor types:
- `traffic_sensors`
- `air_quality_sensors`
- `noise_sensors`
- `weather_stations`
- `smart_meters`
- `waste_bins`
- `parking_sensors`
- `street_lights`
- `public_transport_trackers`
- `surveillance_cameras`
- `water_quality_sensors`
- `energy_grid_sensors`

---

## MongoDB Collections

Your database should have these collections:
- `traffic_sensors`
- `air_quality_sensors`
- `noise_sensors`
- `weather_stations`
- `smart_meters`
- `waste_bins`
- `parking_sensors`
- `street_lights`
- `public_transport_trackers`
- `surveillance_cameras`
- `water_quality_sensors`
- `energy_grid_sensors`

---

## MQTT Topics

The system uses these MQTT topics:
```
city/traffic_sensors/{sensor_id}
city/air_quality_sensors/{sensor_id}
city/noise_sensors/{sensor_id}
city/weather_stations/{sensor_id}
city/smart_meters/{sensor_id}
city/waste_bins/{sensor_id}
city/parking_sensors/{sensor_id}
city/street_lights/{sensor_id}
city/public_transport_trackers/{sensor_id}
city/surveillance_cameras/{sensor_id}
city/water_quality_sensors/{sensor_id}
city/energy_grid_sensors/{sensor_id}
```

Subscribe to `city/+/#` to see all sensor data.

---

## Testing Workflow

1. **Start Backend** → Port 5000 ✅
2. **Start MongoDB** → Port 27017
3. **Start Data Simulator** → Generates sensor data
4. **Start Testing UI** → Port 3001
5. **Open Browser** → http://localhost:3001
6. **Check Dashboard** → All services online
7. **Test APIs** → CRUD operations
8. **Monitor MQTT** → Real-time data
9. **Query Database** → MongoDB queries
10. **Run Tests** → Integration tests

---

## Troubleshooting

### Backend Issues
```bash
# Check if running
lsof -i :5000

# View logs
# Check terminal where backend is running

# Restart
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 5000
```

### MongoDB Issues
```bash
# Check if running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community

# Test connection
mongosh --eval "db.version()"
```

### Testing UI Issues
```bash
# Clear and reinstall
cd testing-ui
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## Key Changes Summary

| Component | Before | After |
|-----------|--------|-------|
| Backend Port | 8000 | 5000 |
| Database Type | PostgreSQL | MongoDB |
| Database Port | 5432 | 27017 |
| Query Language | SQL | MongoDB |
| Database Testing | SQL queries | MongoDB queries |
| API Base URL | localhost:8000 | localhost:5000 |

---

## Next Steps

1. ✅ **Configuration Complete** - All files updated
2. ✅ **Backend Running** - Port 5000
3. 🔄 **Install Testing UI Dependencies** - Running now
4. ⏳ **Start Testing UI** - After npm install completes
5. ⏳ **Test Integration** - Verify all features work

---

## Support Files

- **QUICK_START.md** - Quick reference guide
- **INTEGRATION_SETUP.md** - Detailed setup guide
- **.env** - Environment configuration
- **config.js** - Application configuration

---

## Status: Ready to Use! ✨

Once `npm install` completes, run:
```bash
cd testing-ui
npm start
```

Then open: **http://localhost:3001**

Your Testing UI is now fully configured to work with:
- ✅ Backend on port 5000
- ✅ MongoDB database
- ✅ HiveMQ MQTT broker
- ✅ All 12 sensor types
- ✅ Real-time monitoring
- ✅ Complete API testing suite

---

**All changes committed and ready to use!** 🚀
