/**
 * Configuration service for the testing UI
 * Manages connection settings for all components (API, MQTT, Database, Grafana)
 */

const config = {
  // API Configuration
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    useMock: process.env.REACT_APP_MOCK_API === 'true',
    endpoints: {
      sensors: '/api/sensors',
      data: '/api/data',
      events: '/api/events',
      users: '/api/users',
      auth: '/api/auth',
      health: '/api/health',
      metrics: '/api/metrics',
    },
    timeout: 10000, // 10 seconds
  },
  
  // MQTT Configuration
  mqtt: {
    broker: process.env.REACT_APP_MQTT_BROKER || 'ws://broker.hivemq.com:8000/mqtt',
    clientId: `testing-ui-${Math.random().toString(16).substring(2, 10)}`,
    options: {
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
    },
    topics: {
      sensors: 'city/+/#',
      traffic: 'city/traffic_sensors/#',
      airQuality: 'city/air_quality_sensors/#',
      noise: 'city/noise_sensors/#',
      weather: 'city/weather_stations/#',
      energy: 'city/smart_meters/#',
      waste: 'city/waste_bins/#',
      parking: 'city/parking_sensors/#',
      lights: 'city/street_lights/#',
      transport: 'city/public_transport_trackers/#',
      surveillance: 'city/surveillance_cameras/#',
      water: 'city/water_quality_sensors/#',
      grid: 'city/energy_grid_sensors/#',
    },
  },
  
  // Database Configuration - MongoDB
  database: {
    type: process.env.REACT_APP_DB_TYPE || 'mongodb',
    host: process.env.REACT_APP_DB_HOST || 'localhost',
    port: process.env.REACT_APP_DB_PORT || 27017,
    name: process.env.REACT_APP_DB_NAME || 'city_iot',
    user: process.env.REACT_APP_DB_USER || '',
    password: process.env.REACT_APP_DB_PASSWORD || '',
    sslEnabled: process.env.REACT_APP_DB_SSL === 'true',
  },
  
  // Grafana Configuration
  grafana: {
    url: process.env.REACT_APP_GRAFANA_URL || 'http://localhost:3000',
    apiKey: process.env.REACT_APP_GRAFANA_API_KEY || '',
    dashboards: {
      overview: 'city-overview',
      traffic: 'traffic-monitoring',
      energy: 'energy-grid',
      airQuality: 'air-quality',
    },
  },
  
  // Testing Configuration
  testing: {
    defaultTimeout: 30000, // 30 seconds
    retryCount: 3,
    screenshotPath: './screenshots',
    reportPath: './reports',
  },
};

export default config;
