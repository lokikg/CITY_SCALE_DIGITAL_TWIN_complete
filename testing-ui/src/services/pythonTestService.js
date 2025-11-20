import apiService from './apiService';

/**
 * Service to run the existing Python tests from the testing UI
 * This service creates a bridge between the React frontend and the Python backend tests
 */
const pythonTestService = {
  /**
   * Run the backend pytest tests (test_api.py or test_api_sync.py)
   * @param {Object} options - Test options
   * @param {boolean} options.sync - Whether to use the sync test version
   * @param {string} options.testModule - Specific test module to run
   * @param {string} options.testClass - Specific test class to run
   * @param {string} options.testFunction - Specific test function to run
   * @returns {Promise<Object>} - Test results
   */
  runBackendTests: async (options = {}) => {
    try {
      // Default options
      const testOptions = {
        sync: true,
        verbose: true,
        testModule: null,
        testClass: null,
        testFunction: null,
        ...options
      };
      
      // Build the test path based on options
      let testPath = testOptions.sync ? 'test_api_sync.py' : 'test_api.py';
      
      if (testOptions.testClass) {
        testPath += `::${testOptions.testClass}`;
        
        if (testOptions.testFunction) {
          testPath += `::${testOptions.testFunction}`;
        }
      }
      
      // Make API request to run the tests
      const response = await apiService.sendRequest(
        'POST',
        '/api/tests/run_pytest',
        {
          testPath,
          verbose: testOptions.verbose,
          captureOutput: true
        }
      );
      
      return {
        success: response.status === 200,
        data: response.data,
        testPath
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  },
  
  /**
   * Run the complete API integration test suite (backend_test.py)
   * @param {Object} options - Test options
   * @param {string} options.baseUrl - Base URL for the API
   * @param {Array<string>} options.deviceTypes - Specific device types to test
   * @returns {Promise<Object>} - Test results
   */
  runIntegrationTests: async (options = {}) => {
    try {
      // Default options
      const testOptions = {
        baseUrl: 'http://localhost:8000/api',
        deviceTypes: null, // all device types
        ...options
      };
      
      // Make API request to run the tests
      const response = await apiService.sendRequest(
        'POST',
        '/api/tests/run_integration',
        {
          baseUrl: testOptions.baseUrl,
          deviceTypes: testOptions.deviceTypes
        }
      );
      
      return {
        success: response.status === 200,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  },
  
  /**
   * Run specific backend test by name
   * @param {string} testName - The name of the test to run
   * @returns {Promise<Object>} - Test results
   */
  runNamedTest: async (testName) => {
    try {
      // Use a predefined mapping of test names to actual test paths
      const testMap = {
        'health': 'test_api_sync.py::test_health_endpoints',
        'error-handling': 'test_api_sync.py::test_error_handling',
        'data-validation': 'test_api_sync.py::test_data_validation',
        'device-operations': 'test_api_sync.py::test_basic_device_operations',
        'boolean-fields': 'test_api_sync.py::test_boolean_and_timestamp_fields'
      };
      
      const testPath = testMap[testName];
      
      if (!testPath) {
        throw new Error(`Unknown test name: ${testName}`);
      }
      
      // Make API request to run the test
      const response = await apiService.sendRequest(
        'POST',
        '/api/tests/run_pytest',
        {
          testPath,
          verbose: true,
          captureOutput: true
        }
      );
      
      return {
        success: response.status === 200,
        data: response.data,
        testName,
        testPath
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
        testName
      };
    }
  },
  
  /**
   * Get available tests
   * @returns {Array<Object>} - List of available tests
   */
  getAvailableTests: () => {
    return [
      {
        id: 'health',
        name: 'Health Endpoints',
        description: 'Tests the API health endpoints',
        type: 'api'
      },
      {
        id: 'error-handling',
        name: 'Error Handling',
        description: 'Tests API error handling for invalid requests',
        type: 'api'
      },
      {
        id: 'data-validation',
        name: 'Data Validation',
        description: 'Tests input validation for device creation',
        type: 'api'
      },
      {
        id: 'device-operations',
        name: 'Device Operations',
        description: 'Tests basic CRUD operations for devices',
        type: 'api'
      },
      {
        id: 'boolean-fields',
        name: 'Boolean & Timestamp Fields',
        description: 'Tests boolean fields and timestamp generation',
        type: 'api'
      },
      {
        id: 'integration',
        name: 'Full Integration Test',
        description: 'Runs the complete API integration test suite',
        type: 'integration'
      }
    ];
  },
  
  /**
   * Get the status of a running test
   * @param {string} testId - The ID of the test to check
   * @returns {Promise<Object>} - Test status
   */
  getTestStatus: async (testId) => {
    try {
      const response = await apiService.sendRequest(
        'GET',
        `/api/tests/status/${testId}`
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default pythonTestService;
