# 🚀 Quick Reference Card

## One-Command Startup

```bash
# Copy and paste into separate terminals

# T1: Backend
cd "/Users/lokikganeriwal/Documents/SWE_Project/app-main copy/backend" && source venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 5000

# T2: Simulator
cd "/Users/lokikganeriwal/Documents/SWE_Project/app-main copy/backend" && source venv/bin/activate && python data_simulator.py

# T3: Frontend
cd "/Users/lokikganeriwal/Documents/SWE_Project/app-main copy/frontend" && npm start

# T4: Testing UI (RUNNING)
# Already started on http://localhost:3001

# T5: Locust
cd "/Users/lokikganeriwal/Documents/SWE_Project/app-main copy/backend" && source venv/bin/activate && locust -f locustfile.py --host=http://localhost:5000
```

## Access URLs

- 🧪 **Testing UI**: http://localhost:3001
- 🎨 **Frontend**: http://localhost:3000
- 🔧 **Backend**: http://localhost:5000
- 📖 **API Docs**: http://localhost:5000/docs
- 📊 **Locust**: http://localhost:8089

## Quick Tests

```bash
# Health Check
curl http://localhost:5000/api/health

# Get Traffic Sensors
curl http://localhost:5000/api/traffic_sensors/all | jq

# Get Air Quality
curl http://localhost:5000/api/air_quality_sensors/all | jq

# Database Check
psql -U postgres -d city_iot -c "SELECT COUNT(*) FROM traffic_sensors;"
```

## Testing UI Tests

1. Open http://localhost:3001
2. Go to "API Testing" tab
3. Click "Run All Tests"
4. View results in real-time

## System Status

✅ Backend API: Port 5000  
✅ Data Simulator: Running  
✅ PostgreSQL: localhost:5432  
✅ MQTT Broker: broker.hivemq.com  
✅ Testing UI: Port 3001  
⚠️ Frontend: Port 3000 (start if needed)

## Key Files

- `backend/.env` - Backend config
- `frontend/.env` - Frontend config  
- `testing-ui/.env` - Testing UI config
- `TESTING_SETUP.md` - Full documentation
- `COMPLETE_SETUP_SUMMARY.md` - Detailed summary
