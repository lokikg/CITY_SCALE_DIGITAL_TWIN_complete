import axios from 'axios';
import config from '../config';

// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      // You might want to redirect to login page here
    }
    return Promise.reject(error);
  }
);

// API Service for testing
const apiService = {
  // Health check endpoints
  health: {
    checkBackend: () => apiClient.get('/api/health'),
    getStatus: () => apiClient.get('/api/status'),
    getMqttStatus: () => apiClient.get('/api/mqtt/status'),
    getDatabaseStatus: () => apiClient.get('/api/database/status'),
    getMetrics: () => apiClient.get('/api/grafana/city_overview'),
  },

  // Sensor related endpoints - using actual backend routes
  sensors: {
    // Traffic sensors
    traffic: {
      getAll: () => apiClient.get('/api/traffic_sensors/all'),
      getById: (id) => apiClient.get(`/api/traffic_sensors/${id}`),
      create: (data) => apiClient.post('/api/traffic_sensors/add', data),
      update: (id, data) => apiClient.put(`/api/traffic_sensors/${id}`, data),
      delete: (id) => apiClient.delete(`/api/traffic_sensors/${id}`),
      getLatest: () => apiClient.get('/api/traffic_sensors/latest'),
    },
    // Air quality sensors
    airQuality: {
      getAll: () => apiClient.get('/api/air_quality_sensors/all'),
      getById: (id) => apiClient.get(`/api/air_quality_sensors/${id}`),
      create: (data) => apiClient.post('/api/air_quality_sensors/add', data),
      update: (id, data) => apiClient.put(`/api/air_quality_sensors/${id}`, data),
      delete: (id) => apiClient.delete(`/api/air_quality_sensors/${id}`),
      getLatest: () => apiClient.get('/api/air_quality_sensors/latest'),
    },
    // Generic sensor operations
    getAll: () => apiClient.get('/api/traffic_sensors/all'),
    getById: (id) => apiClient.get(`/api/traffic_sensors/${id}`),
    create: (data) => apiClient.post('/api/traffic_sensors/add', data),
    update: (id, data) => apiClient.put(`/api/traffic_sensors/${id}`, data),
    delete: (id) => apiClient.delete(`/api/traffic_sensors/${id}`),
  },

  // Data related endpoints - Grafana metrics
  data: {
    query: (params) => apiClient.get('/api/grafana/city_overview', { params }),
    getLatest: (type) => {
      const endpoints = {
        traffic: '/api/traffic_sensors/latest',
        'air-quality': '/api/air_quality_sensors/latest',
        noise: '/api/noise_sensors/latest',
        weather: '/api/weather_stations/latest',
        energy: '/api/smart_meters/latest',
        waste: '/api/waste_bins/latest',
        parking: '/api/parking_sensors/latest',
        lights: '/api/street_lights/latest',
        transport: '/api/public_transport_trackers/latest',
        surveillance: '/api/surveillance_cameras/latest',
        water: '/api/water_quality_sensors/latest',
        grid: '/api/energy_grid_sensors/latest',
      };
      return apiClient.get(endpoints[type] || endpoints.traffic);
    },
    getByTimeRange: (type, start, end) => 
      apiClient.get(`/api/${type}/all`, { params: { start, end } }),
    getStatistics: (type) => apiClient.get(`/api/grafana/${type}_metrics`),
    submit: (data) => apiClient.post('/api/traffic_sensors/add', data),
  },

  // Simulator endpoints
  simulator: {
    trigger: () => apiClient.post('/api/simulator/trigger'),
    getStatus: () => apiClient.get('/api/simulator/status'),
  },

  // User management endpoints (not implemented in backend yet)
  users: {
    getAll: () => Promise.reject(new Error('User management not implemented')),
    getById: (id) => Promise.reject(new Error('User management not implemented')),
    create: (data) => Promise.reject(new Error('User management not implemented')),
    update: (id, data) => Promise.reject(new Error('User management not implemented')),
    delete: (id) => Promise.reject(new Error('User management not implemented')),
  },

  // Authentication endpoints (not implemented in backend yet)
  auth: {
    login: (credentials) => Promise.reject(new Error('Authentication not implemented')),
    logout: () => Promise.reject(new Error('Authentication not implemented')),
    refreshToken: () => Promise.reject(new Error('Authentication not implemented')),
    checkToken: () => Promise.reject(new Error('Authentication not implemented')),
  },

  // Test execution endpoints
  tests: {
    runApiTest: (testData) => apiClient.post('/api/tests/run_pytest', testData),
    runDatabaseTest: (testData) => apiClient.post('/api/tests/database/query', testData),
    runE2ETest: (testData) => apiClient.post('/api/tests/run_integration', testData),
    runPerformanceTest: (testData) => apiClient.post('/api/tests/database/performance', testData),
    getTestResults: (id) => apiClient.get(`/api/tests/status/${id}`),
    getAllTestResults: () => apiClient.get('/api/tests/list'),
  },

  // Custom request method for advanced testing
  sendRequest: (method, url, data, headers) => {
    return apiClient({
      method,
      url,
      data,
      headers,
    });
  },
};

export default apiService;
