import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiService = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API methods for data simulation
const simulatorService = {
  /**
   * Trigger data simulation
   * This will wake up the data simulator if it's sleeping and generate fresh data
   * @returns {Promise} - Promise with simulator trigger response
   */
  triggerSimulation: () => {
    return apiService.post('/simulator/trigger');
  },

  /**
   * Get simulator status
   * Returns information about whether the simulator is running and when it was last active
   * @returns {Promise} - Promise with simulator status
   */
  getSimulatorStatus: () => {
    return apiService.get('/simulator/status');
  }
};

// Export both services
export { simulatorService };
export default apiService;
