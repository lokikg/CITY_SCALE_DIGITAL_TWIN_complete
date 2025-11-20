import axios from 'axios';
import config from '../config';

// Create an axios instance for Grafana API
const grafanaClient = axios.create({
  baseURL: config.grafana.url,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add API key if available
if (config.grafana.apiKey) {
  grafanaClient.defaults.headers.common['Authorization'] = `Bearer ${config.grafana.apiKey}`;
}

const grafanaService = {
  // Test Grafana connection
  testConnection: async () => {
    try {
      const response = await grafanaClient.get('/api/health');
      return {
        success: true,
        data: response.data,
        status: response.data.database === 'ok' ? 'healthy' : 'unhealthy',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  // Get dashboards list
  getDashboards: async () => {
    try {
      const response = await grafanaClient.get('/api/search?type=dash-db');
      return {
        success: true,
        dashboards: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  // Get dashboard by UID
  getDashboard: async (uid) => {
    try {
      const response = await grafanaClient.get(`/api/dashboards/uid/${uid}`);
      return {
        success: true,
        dashboard: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  // Get datasources
  getDatasources: async () => {
    try {
      const response = await grafanaClient.get('/api/datasources');
      return {
        success: true,
        datasources: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  // Test datasource
  testDatasource: async (datasourceId) => {
    try {
      const response = await grafanaClient.post(`/api/datasources/${datasourceId}/health`);
      return {
        success: true,
        status: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  // Render dashboard panel as image
  renderPanel: async (dashboardUid, panelId, width = 800, height = 400) => {
    try {
      // Using a direct URL to the Grafana render endpoint
      const renderUrl = `${config.grafana.url}/render/d-solo/${dashboardUid}?panelId=${panelId}&width=${width}&height=${height}&from=now-1h&to=now`;
      
      // Note: This only returns a URL to render the panel
      // Actual rendering happens in the browser via an iframe or img tag
      return {
        success: true,
        renderUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get Grafana server status
  getServerStatus: async () => {
    try {
      const response = await grafanaClient.get('/api/admin/stats');
      return {
        success: true,
        stats: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  },

  // Get built-in dashboard URLs for the IoT platform
  getBuiltInDashboards: () => {
    return {
      cityOverview: `${config.grafana.url}/d/${config.grafana.dashboards.overview}`,
      trafficMonitoring: `${config.grafana.url}/d/${config.grafana.dashboards.traffic}`,
      energyGrid: `${config.grafana.url}/d/${config.grafana.dashboards.energy}`,
      airQuality: `${config.grafana.url}/d/${config.grafana.dashboards.airQuality}`,
    };
  },

  // Generate iframe URL for embedding dashboards
  getEmbedUrl: (dashboardUid, from = 'now-1h', to = 'now', theme = 'light') => {
    return `${config.grafana.url}/d/${dashboardUid}?from=${from}&to=${to}&theme=${theme}&kiosk`;
  },
};

export default grafanaService;
