# 🏙️ Smart City IoT Platform - Digital Twin

A comprehensive **City-Scale Digital Twin Platform** that simulates and monitors real-time IoT sensor data across various urban infrastructure systems. This full-stack application provides real-time monitoring, analytics, device management, and visualization capabilities for smart city operations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19.0.0-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.1-009688.svg)](https://fastapi.tiangolo.com/)

## 📋 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Sensor Types](#-sensor-types)
- [Monitoring & Analytics](#-monitoring--analytics)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔄 Real-Time Data Simulation
- **12 Different IoT Sensor Types** with realistic data patterns
- **MQTT-based** real-time data streaming (HiveMQ Cloud integration)
- **Automated data generation** with intelligent fluctuation algorithms
- **Time-aware logic** (e.g., street lights automatically adjust based on time of day)

### 📊 Interactive Dashboard
- **3D City Visualization** with real-time sensor overlays
- **Interactive Map** with geospatial sensor positioning using Leaflet
- **Live Metrics** and KPI tracking
- **Device Status Monitoring** with health indicators
- **Responsive Design** with Tailwind CSS and shadcn/ui components

### 🎯 Device Management
- **CRUD Operations** for all sensor types
- **Bulk Actions** for efficient device administration
- **Search & Filter** capabilities
- **Status Tracking** and health monitoring
- **API Testing Interface** with built-in test runner

### 📈 Analytics & Monitoring
- **Time-Series Analysis** with interactive charts (Recharts)
- **Historical Data Visualization**
- **Trend Analysis** for traffic, air quality, energy consumption
- **Alert System** for critical thresholds
- **Grafana Dashboards** for advanced monitoring
- **Prometheus Metrics** collection and visualization

### 🧪 Comprehensive Testing
- **Dedicated Testing UI** with mock API server
- **Unit Tests** with Jest and React Testing Library
- **API Integration Tests** with pytest
- **Load Testing** with Locust
- **Coverage Reports** and test runners

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Main UI    │  │  Testing UI  │  │   Grafana    │      │
│  │  (React 19)  │  │  (React 18)  │  │  Dashboards  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│              FastAPI Server (Port 8000)                      │
│  • REST API Endpoints      • Prometheus Metrics             │
│  • MQTT Subscriber         • CORS Middleware                │
│  • WebSocket Support       • Health Checks                  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Data Simulator         │  │   MQTT Broker            │
│   (Background Worker)    │  │   (Mosquitto/HiveMQ)     │
│  • CSV Data Management   │  │  • Pub/Sub Topics        │
│  • Periodic Updates      │  │  • QoS 1 Messaging       │
│  • Smart Fluctuations    │  │  • TLS/SSL Support       │
└──────────────────────────┘  └──────────────────────────┘
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│         Neon PostgreSQL (Serverless)                        │
│  • 12 Sensor Tables        • Async SQLAlchemy ORM           │
│  • Alembic Migrations      • Connection Pooling             │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy** (async) - ORM for database interactions
- **PostgreSQL** (Neon) - Serverless database
- **Paho MQTT** - MQTT client for real-time messaging
- **Alembic** - Database migration tool
- **Prometheus Client** - Metrics collection
- **Pydantic** - Data validation using Python type annotations
- **Uvicorn** - ASGI server

### Frontend
- **React 19** - Main application UI
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API requests
- **Leaflet** / **React-Leaflet** - Interactive maps
- **Recharts** - Data visualization and charting
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Radix UI** - Accessible UI primitives

### Testing
- **Jest** - JavaScript testing framework
- **React Testing Library** - React component testing
- **pytest** - Python testing framework
- **Locust** - Load testing tool
- **json-server** - Mock REST API

### Monitoring & DevOps
- **Grafana** - Visualization and monitoring dashboards
- **Prometheus** - Metrics collection and time-series database
- **Docker** - Containerization
- **Render** - Cloud deployment platform
- **Vercel** - Frontend hosting (optional)

## 📁 Project Structure

```
app-main/
├── backend/                      # Python FastAPI backend
│   ├── alembic/                 # Database migrations
│   │   ├── versions/            # Migration versions
│   │   └── env.py              # Alembic environment config
│   ├── data/                    # CSV sensor data files
│   │   ├── traffic_sensors.csv
│   │   ├── air_quality_sensors.csv
│   │   └── ...                 # 12 sensor types total
│   ├── server.py               # Main FastAPI application
│   ├── models.py               # SQLAlchemy database models
│   ├── schemas.py              # Pydantic schemas for validation
│   ├── database.py             # Database connection setup
│   ├── data_simulator.py       # IoT data simulation worker
│   ├── simulator_api.py        # Simulator control API
│   ├── test_runner.py          # API test runner
│   ├── database_test_api.py    # Database testing endpoints
│   ├── load_data.py            # Initial data loader
│   ├── locustfile.py           # Load testing configuration
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables (not in repo)
│
├── frontend/                    # React main application
│   ├── public/                 # Static assets
│   │   ├── background.mp4      # Background video
│   │   └── index.html
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Dashboard.js    # Main dashboard
│   │   │   ├── Analytics.js    # Analytics view
│   │   │   ├── DeviceManagement.js
│   │   │   ├── DeviceAlertsTab.js
│   │   │   └── Navbar.js
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API service layer
│   │   ├── lib/                # Utility functions
│   │   ├── App.js              # Root component
│   │   └── index.js            # Entry point
│   ├── package.json            # Node dependencies
│   ├── tailwind.config.js      # Tailwind configuration
│   └── craco.config.js         # Create React App config override
│
├── testing-ui/                  # Dedicated testing interface
│   ├── src/                    # Test UI components
│   ├── mock-api/               # Mock API server
│   │   ├── db.json            # Mock data
│   │   ├── routes.json        # Custom routes
│   │   └── middleware.js      # Custom middleware
│   ├── package.json
│   └── README.md              # Testing documentation
│
├── grafana/                     # Monitoring dashboards
│   ├── dashboards/             # Pre-configured dashboards
│   │   ├── city-overview.json
│   │   ├── traffic-monitoring.json
│   │   ├── air-quality.json
│   │   └── energy-grid.json
│   ├── provisioning/           # Grafana provisioning configs
│   │   ├── dashboards/
│   │   └── datasources/
│   ├── prometheus/
│   │   └── prometheus.yml     # Prometheus configuration
│   ├── docker-compose.yml     # Grafana + Prometheus stack
│   └── Dockerfile             # Custom Grafana image
│
├── render.yaml                  # Render.com deployment config
├── .gitignore
└── README.md                   # This file
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** and **npm/yarn** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** (or Neon account) - [Neon](https://neon.tech/)
- **Mosquitto MQTT Broker** (optional, for local testing) - [Install](https://mosquitto.org/download/)
- **Docker & Docker Compose** (for Grafana/Prometheus) - [Install](https://docs.docker.com/get-docker/)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/smart-city-iot-platform.git
cd smart-city-iot-platform
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies (using yarn)
yarn install

# Or using npm
npm install
```

### 4. Testing UI Setup (Optional)

```bash
cd ../testing-ui

# Install dependencies
yarn install
```

### 5. Grafana Setup (Optional)

```bash
cd ../grafana

# Start Grafana and Prometheus using Docker Compose
docker-compose up -d
```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
# For Neon: postgresql://username:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require

# MQTT Configuration
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=8883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MQTT_TLS=true
MQTT_KEEPALIVE=60

# Simulation Configuration
SIMULATION_INTERVAL_SECONDS=30
LOG_LEVEL=INFO
BACKUP_ENABLED=false

# API Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Server Configuration
PORT=8000
```

### Database Setup

```bash
cd backend

# Run database migrations
alembic upgrade head

# Load initial sensor data
python load_data.py
```

### MQTT Broker Setup (Local Development)

#### Option 1: Using HiveMQ Cloud (Recommended for production)
Sign up at [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/) and use the provided credentials.

#### Option 2: Local Mosquitto Broker

```bash
# Install Mosquitto (macOS)
brew install mosquitto

# Start Mosquitto
mosquitto -v

# Or as a service
brew services start mosquitto
```

## 🏃 Running the Application

### Development Mode

#### 1. Start the MQTT Broker (if running locally)

```bash
mosquitto -v
```

#### 2. Start the Backend API Server

```bash
cd backend
source venv/bin/activate  # Activate virtual environment
python server.py

# Or using uvicorn directly
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

API will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

#### 3. Start the Data Simulator

```bash
cd backend
source venv/bin/activate
python data_simulator.py
```

#### 4. Start the Frontend

```bash
cd frontend
yarn start

# Or using npm
npm start
```

Frontend will be available at: `http://localhost:3000`

#### 5. Start Testing UI (Optional)

```bash
cd testing-ui
yarn start
```

Testing UI will be available at: `http://localhost:3001`

#### 6. Access Grafana (Optional)

```bash
cd grafana
docker-compose up -d
```

Grafana will be available at: `http://localhost:3000`
- Default username: `admin`
- Default password: `admin123`

Prometheus will be available at: `http://localhost:9090`

### Production Mode

Refer to the [Deployment](#-deployment) section for production deployment instructions.

## 📚 API Documentation

### Base URL

- **Local Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

### Interactive API Docs

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

#### Health & Status

```http
GET /api/health
GET /api/status
GET /api/mqtt/status
GET /api/database/status
```

#### Sensor Data Endpoints (Example: Traffic Sensors)

```http
# Get all traffic sensors
GET /api/traffic_sensors/all

# Get specific sensor
GET /api/traffic_sensors/{sensor_id}

# Add new sensor
POST /api/traffic_sensors/add

# Update sensor
PUT /api/traffic_sensors/{sensor_id}

# Delete sensor
DELETE /api/traffic_sensors/{sensor_id}

# Get latest reading
GET /api/traffic_sensors/latest
```

**Note**: Similar endpoints exist for all 12 sensor types (see [Sensor Types](#-sensor-types)).

#### Grafana Data Endpoints

```http
GET /api/grafana/city_overview
GET /api/grafana/traffic_metrics
GET /api/grafana/air_quality_metrics
GET /api/grafana/energy_grid_metrics
```

#### Prometheus Metrics

```http
GET /metrics
```

#### Simulator Control

```http
POST /simulator/start
POST /simulator/stop
GET /simulator/status
```

#### Test Runner

```http
POST /test-runner/run
GET /test-runner/results
```

### Authentication

Currently, the API does not require authentication. For production deployment, consider implementing:
- JWT tokens
- API keys
- OAuth 2.0

## 🌡️ Sensor Types

The platform supports **12 different IoT sensor types**:

| Sensor Type | Measurements | Use Case |
|------------|--------------|----------|
| **Traffic Sensors** | Vehicle count, average speed | Traffic management & congestion monitoring |
| **Air Quality Sensors** | PM2.5, PM10, NO2, CO | Environmental monitoring & health |
| **Noise Sensors** | Decibel levels | Noise pollution tracking |
| **Weather Stations** | Temperature, humidity, rainfall, wind speed | Climate monitoring |
| **Smart Meters** | Electricity usage, water usage | Resource consumption tracking |
| **Waste Bins** | Fill level, temperature | Waste management optimization |
| **Parking Sensors** | Occupancy status | Smart parking solutions |
| **Street Lights** | Status (on/off), energy consumption | Smart lighting & energy efficiency |
| **Public Transport Trackers** | Bus ID, occupancy, location | Public transit optimization |
| **Surveillance Cameras** | Motion detection, object count | Security & crowd monitoring |
| **Water Quality Sensors** | pH, turbidity, dissolved oxygen | Water safety monitoring |
| **Energy Grid Sensors** | Voltage, current, frequency | Power grid health monitoring |

### Data Flow

1. **Data Simulator** generates realistic sensor data based on predefined patterns
2. **CSV files** store the current sensor states
3. **PostgreSQL database** maintains historical data
4. **MQTT broker** publishes real-time updates
5. **FastAPI backend** subscribes to MQTT topics and exposes REST APIs
6. **Frontend** consumes APIs and displays real-time visualizations

## 📈 Monitoring & Analytics

### Grafana Dashboards

Pre-configured dashboards include:

1. **City Overview Dashboard**
   - Total device counts
   - System health status
   - Active alerts
   - Real-time metrics summary

2. **Traffic Monitoring Dashboard**
   - Vehicle flow analysis
   - Average speed trends
   - Congestion heatmaps
   - Historical comparisons

3. **Air Quality Dashboard**
   - AQI calculations
   - Pollutant levels (PM2.5, PM10, NO2, CO)
   - Location-based air quality maps
   - Health impact indicators

4. **Energy Grid Dashboard**
   - Voltage/current/frequency monitoring
   - Power consumption trends
   - Grid health indicators
   - Anomaly detection

### Prometheus Metrics

The backend exposes the following metrics:

- `http_requests_total` - Total HTTP requests by method, endpoint, and status
- `http_request_latency_seconds` - Request latency histogram by endpoint
- Custom business metrics (sensor counts, update rates, etc.)

### Alerts

Alert conditions are monitored for:
- High pollution levels (PM2.5 > 55.4 μg/m³)
- Traffic congestion (vehicle count > 100)
- Waste bin overflow (fill level > 90%)
- Grid anomalies (voltage/frequency out of range)
- Device offline status

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest test_api.py
```

### Frontend Tests

```bash
cd frontend

# Run tests
yarn test

# Run with coverage
yarn test:coverage

# Run in watch mode
yarn test --watch
```

### Load Testing

```bash
cd backend

# Start Locust
locust -f locustfile.py --host=http://localhost:8000

# Access Locust web UI at http://localhost:8089
```

### API Integration Testing

Use the dedicated Testing UI:

```bash
cd testing-ui
yarn start
```

Access at `http://localhost:3001` and use the built-in test runner to execute API tests.

## 🚢 Deployment

### Deploy to Render (Backend)

1. **Prerequisites**:
   - Create a [Render](https://render.com) account
   - Set up a [Neon](https://neon.tech) PostgreSQL database
   - Configure [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/) MQTT broker

2. **Update `render.yaml`**:
   ```yaml
   # Update the CORS_ORIGINS with your frontend URL
   - key: CORS_ORIGINS
     value: "https://your-frontend-domain.vercel.app"
   ```

3. **Deploy**:
   - Connect your GitHub repository to Render
   - Render will automatically detect `render.yaml`
   - Add environment variables in Render dashboard:
     - `DATABASE_URL`
     - `MQTT_BROKER`, `MQTT_USERNAME`, `MQTT_PASSWORD`
   - Deploy the services

### Deploy Frontend to Vercel

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts and configure environment variables
```

Or use the Vercel GitHub integration for automatic deployments.

### Deploy Grafana

Grafana can be deployed to:
- **Render** (using Docker)
- **AWS ECS/Fargate**
- **DigitalOcean App Platform**
- **Self-hosted** using Docker

Ensure to configure the PostgreSQL datasource with your Neon database credentials.

### Environment Variables for Production

```env
# Backend
DATABASE_URL=<neon-postgres-url>
MQTT_BROKER=<hivemq-broker-url>
MQTT_PORT=8883
MQTT_USERNAME=<username>
MQTT_PASSWORD=<password>
MQTT_TLS=true
CORS_ORIGINS=<frontend-url>

# Frontend
REACT_APP_API_URL=<backend-api-url>
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style

- **Python**: Follow PEP 8, use `black` for formatting
- **JavaScript/React**: Follow Airbnb style guide, use ESLint + Prettier
- Write tests for new features
- Update documentation as needed
  

## 👥 Authors

- **Lokik Ganeriwal** - [GitHub](https://github.com/lokikg)
- **Arjit Mathur** - [GitHub](https://github.com/arjitMathur)



---

**⭐ If you find this project useful, please consider giving it a star!**

