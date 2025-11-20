import apiService from './apiService';
import config from '../config';

/**
 * Service for testing database connectivity and operations
 * Note: This service uses the API as a proxy to test database operations
 * for security reasons, direct database connections from the browser are not recommended
 */
const databaseService = {
  // Test database connection
  testConnection: async () => {
    try {
      const response = await apiService.sendRequest('POST', '/api/tests/database/connection', {
        host: config.database.host,
        port: config.database.port,
        name: config.database.name,
        user: config.database.user,
        password: config.database.password,
        ssl: config.database.sslEnabled,
      });
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  // Execute a database query (read-only for safety)
  executeQuery: async (query, params = []) => {
    try {
      const response = await apiService.sendRequest('POST', '/api/tests/database/query', {
        query,
        params,
        readOnly: true, // Force read-only for safety
      });
      
      return {
        success: true,
        data: response.data,
        rows: response.data.rows,
        rowCount: response.data.rowCount,
        fields: response.data.fields,
        executionTime: response.data.executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  // Get database schema information
  getSchema: async () => {
    try {
      const response = await apiService.sendRequest('GET', '/api/tests/database/schema');
      
      return {
        success: true,
        tables: response.data.tables,
        views: response.data.views,
        functions: response.data.functions,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  // Get table information
  getTableInfo: async (tableName) => {
    try {
      const response = await apiService.sendRequest('GET', `/api/tests/database/tables/${tableName}`);
      
      return {
        success: true,
        columns: response.data.columns,
        primaryKey: response.data.primaryKey,
        foreignKeys: response.data.foreignKeys,
        indices: response.data.indices,
        rowCount: response.data.rowCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  // Test database performance
  testPerformance: async (query, iterations = 3) => {
    try {
      const response = await apiService.sendRequest('POST', '/api/tests/database/performance', {
        query,
        iterations,
      });
      
      return {
        success: true,
        averageTime: response.data.averageTime,
        minTime: response.data.minTime,
        maxTime: response.data.maxTime,
        results: response.data.results,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  // Get common queries for testing - MongoDB queries
  getCommonQueries: () => [
    {
      name: 'List All Traffic Sensors',
      query: 'db.traffic_sensors.find().limit(100)',
      description: 'Retrieves all traffic sensors with a limit of 100 records',
    },
    {
      name: 'Recent Traffic Sensor Data',
      query: 'db.traffic_sensors.find().sort({timestamp: -1}).limit(50)',
      description: 'Retrieves the 50 most recent traffic sensor data points',
    },
    {
      name: 'List All Air Quality Sensors',
      query: 'db.air_quality_sensors.find().limit(100)',
      description: 'Retrieves all air quality sensors with a limit of 100 records',
    },
    {
      name: 'Count All Traffic Sensors',
      query: 'db.traffic_sensors.countDocuments({})',
      description: 'Counts the total number of traffic sensors',
    },
    {
      name: 'Recent Weather Data',
      query: 'db.weather_stations.find().sort({timestamp: -1}).limit(50)',
      description: 'Retrieves the 50 most recent weather station readings',
    },
    {
      name: 'Smart Meter Statistics',
      query: 'db.smart_meters.aggregate([{$group: {_id: null, avg_consumption: {$avg: "$power_consumption"}, max_consumption: {$max: "$power_consumption"}}}])',
      description: 'Gets average and maximum power consumption from smart meters',
    },
    {
      name: 'Occupied Parking Spots',
      query: 'db.parking_sensors.countDocuments({is_occupied: true})',
      description: 'Counts the number of occupied parking spots',
    },
    {
      name: 'Active Street Lights',
      query: 'db.street_lights.countDocuments({status: true})',
      description: 'Counts the number of active street lights',
    },
  ],
};

export default databaseService;
