import apiService from './apiService';
import mqttService from './mqttService';
import databaseService from './databaseService';
import grafanaService from './grafanaService';

/**
 * Comprehensive testing service that orchestrates tests across all components
 * of the IoT platform: API, MQTT, Database, and Grafana
 */
class TestingService {
  constructor() {
    this.testResults = [];
    this.runningTests = [];
    this.listeners = [];
    this.isRunning = false;
  }

  // Add a listener for test events
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners of a test event
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in test listener:', error);
      }
    });
  }

  // Run a system-wide health check across all components
  async runSystemHealthCheck() {
    this.isRunning = true;
    this.notifyListeners({ type: 'test-start', test: 'system-health' });

    const results = {
      timestamp: new Date().toISOString(),
      type: 'system-health',
      components: {},
      overallStatus: 'pending',
    };

    // Test API health
    try {
      this.notifyListeners({ type: 'component-test-start', component: 'api' });
      const apiHealth = await apiService.health.checkBackend();
      results.components.api = {
        status: apiHealth.data.status === 'ok' ? 'passed' : 'failed',
        details: apiHealth.data,
      };
      this.notifyListeners({ 
        type: 'component-test-complete', 
        component: 'api',
        status: results.components.api.status
      });
    } catch (error) {
      results.components.api = {
        status: 'failed',
        error: error.message,
      };
      this.notifyListeners({ 
        type: 'component-test-error', 
        component: 'api',
        error: error.message
      });
    }

    // Test MQTT connection
    try {
      this.notifyListeners({ type: 'component-test-start', component: 'mqtt' });
      const mqttStatus = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MQTT connection timeout'));
        }, 5000);

        mqttService.connect(
          () => {
            clearTimeout(timeout);
            resolve({ status: 'connected' });
          },
          (err) => {
            clearTimeout(timeout);
            reject(err);
          }
        );
      });

      results.components.mqtt = {
        status: mqttStatus.status === 'connected' ? 'passed' : 'failed',
        details: mqttService.getStatus(),
      };
      
      this.notifyListeners({ 
        type: 'component-test-complete', 
        component: 'mqtt',
        status: results.components.mqtt.status
      });
      
      // Disconnect after test
      await mqttService.disconnect();
    } catch (error) {
      results.components.mqtt = {
        status: 'failed',
        error: error.message,
      };
      this.notifyListeners({ 
        type: 'component-test-error', 
        component: 'mqtt',
        error: error.message
      });
    }

    // Test database connection
    try {
      this.notifyListeners({ type: 'component-test-start', component: 'database' });
      const dbResult = await databaseService.testConnection();
      results.components.database = {
        status: dbResult.success ? 'passed' : 'failed',
        details: dbResult.data || dbResult.error,
      };
      this.notifyListeners({ 
        type: 'component-test-complete', 
        component: 'database',
        status: results.components.database.status
      });
    } catch (error) {
      results.components.database = {
        status: 'failed',
        error: error.message,
      };
      this.notifyListeners({ 
        type: 'component-test-error', 
        component: 'database',
        error: error.message
      });
    }

    // Test Grafana connection
    try {
      this.notifyListeners({ type: 'component-test-start', component: 'grafana' });
      const grafanaResult = await grafanaService.testConnection();
      results.components.grafana = {
        status: grafanaResult.success ? 'passed' : 'failed',
        details: grafanaResult.data || grafanaResult.error,
      };
      this.notifyListeners({ 
        type: 'component-test-complete', 
        component: 'grafana',
        status: results.components.grafana.status
      });
    } catch (error) {
      results.components.grafana = {
        status: 'failed',
        error: error.message,
      };
      this.notifyListeners({ 
        type: 'component-test-error', 
        component: 'grafana',
        error: error.message
      });
    }

    // Calculate overall status
    const componentStatuses = Object.values(results.components).map(c => c.status);
    if (componentStatuses.every(status => status === 'passed')) {
      results.overallStatus = 'passed';
    } else if (componentStatuses.some(status => status === 'failed')) {
      results.overallStatus = 'failed';
    } else {
      results.overallStatus = 'partial';
    }

    this.testResults.push(results);
    this.isRunning = false;
    this.notifyListeners({ 
      type: 'test-complete', 
      test: 'system-health', 
      results,
      status: results.overallStatus
    });

    return results;
  }

  // Run API endpoint tests
  async runApiTests(endpoints) {
    this.isRunning = true;
    this.notifyListeners({ type: 'test-start', test: 'api-endpoints' });

    const results = {
      timestamp: new Date().toISOString(),
      type: 'api-endpoints',
      endpoints: {},
      overallStatus: 'pending',
    };

    for (const endpoint of endpoints) {
      try {
        this.notifyListeners({ 
          type: 'endpoint-test-start', 
          endpoint: endpoint.url,
          method: endpoint.method
        });

        const response = await apiService.sendRequest(
          endpoint.method,
          endpoint.url,
          endpoint.body,
          endpoint.headers
        );

        const success = 
          (endpoint.expectedStatus && response.status === endpoint.expectedStatus) ||
          (response.status >= 200 && response.status < 300);

        results.endpoints[endpoint.url] = {
          method: endpoint.method,
          url: endpoint.url,
          status: success ? 'passed' : 'failed',
          responseStatus: response.status,
          responseData: response.data,
          executionTime: response.headers['x-execution-time'] || null,
          timestamp: new Date().toISOString(),
        };

        this.notifyListeners({ 
          type: 'endpoint-test-complete', 
          endpoint: endpoint.url,
          method: endpoint.method,
          status: results.endpoints[endpoint.url].status
        });
      } catch (error) {
        results.endpoints[endpoint.url] = {
          method: endpoint.method,
          url: endpoint.url,
          status: 'failed',
          error: error.message,
          responseStatus: error.response?.status,
          responseData: error.response?.data,
          timestamp: new Date().toISOString(),
        };

        this.notifyListeners({ 
          type: 'endpoint-test-error', 
          endpoint: endpoint.url,
          method: endpoint.method,
          error: error.message
        });
      }
    }

    // Calculate overall status
    const endpointStatuses = Object.values(results.endpoints).map(e => e.status);
    if (endpointStatuses.every(status => status === 'passed')) {
      results.overallStatus = 'passed';
    } else if (endpointStatuses.some(status => status === 'failed')) {
      results.overallStatus = 'failed';
    } else {
      results.overallStatus = 'partial';
    }

    this.testResults.push(results);
    this.isRunning = false;
    this.notifyListeners({ 
      type: 'test-complete', 
      test: 'api-endpoints', 
      results,
      status: results.overallStatus
    });

    return results;
  }

  // Run MQTT publish/subscribe tests
  async runMqttTests(topics) {
    this.isRunning = true;
    this.notifyListeners({ type: 'test-start', test: 'mqtt-pubsub' });

    const results = {
      timestamp: new Date().toISOString(),
      type: 'mqtt-pubsub',
      topics: {},
      overallStatus: 'pending',
    };

    try {
      // Connect to MQTT broker
      await new Promise((resolve, reject) => {
        mqttService.connect(resolve, reject);
      });

      for (const topic of topics) {
        const testId = Math.random().toString(36).substring(2, 10);
        const testMessage = {
          id: testId,
          text: `Test message for ${topic}`,
          timestamp: new Date().toISOString(),
        };

        try {
          this.notifyListeners({ type: 'topic-test-start', topic });

          // Subscribe to topic
          const messageReceived = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error(`Timeout waiting for message on topic ${topic}`));
            }, 5000);

            mqttService.subscribe(topic, (message) => {
              try {
                const receivedData = JSON.parse(message.message);
                if (receivedData.id === testId) {
                  clearTimeout(timeout);
                  resolve(receivedData);
                }
              } catch (e) {
                console.error('Error parsing MQTT message:', e);
              }
            });
          });

          // Publish test message
          await mqttService.publish(topic, testMessage);

          // Wait for message to be received
          const receivedMessage = await messageReceived;

          results.topics[topic] = {
            status: 'passed',
            sentMessage: testMessage,
            receivedMessage,
            timestamp: new Date().toISOString(),
          };

          this.notifyListeners({ 
            type: 'topic-test-complete', 
            topic,
            status: 'passed'
          });

          // Unsubscribe after test
          await mqttService.unsubscribe(topic);
        } catch (error) {
          results.topics[topic] = {
            status: 'failed',
            error: error.message,
            sentMessage: testMessage,
            timestamp: new Date().toISOString(),
          };

          this.notifyListeners({ 
            type: 'topic-test-error', 
            topic,
            error: error.message
          });

          // Attempt to unsubscribe even if test failed
          try {
            await mqttService.unsubscribe(topic);
          } catch (e) {
            console.error(`Error unsubscribing from ${topic}:`, e);
          }
        }
      }

      // Disconnect after all tests
      await mqttService.disconnect();
    } catch (error) {
      // MQTT connection failure
      for (const topic of topics) {
        results.topics[topic] = {
          status: 'failed',
          error: `MQTT connection failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
      }

      this.notifyListeners({ 
        type: 'test-error', 
        test: 'mqtt-pubsub',
        error: error.message
      });
    }

    // Calculate overall status
    const topicStatuses = Object.values(results.topics).map(t => t.status);
    if (topicStatuses.every(status => status === 'passed')) {
      results.overallStatus = 'passed';
    } else if (topicStatuses.some(status => status === 'failed')) {
      results.overallStatus = 'failed';
    } else {
      results.overallStatus = 'partial';
    }

    this.testResults.push(results);
    this.isRunning = false;
    this.notifyListeners({ 
      type: 'test-complete', 
      test: 'mqtt-pubsub', 
      results,
      status: results.overallStatus
    });

    return results;
  }

  // Run database queries and tests
  async runDatabaseTests(queries) {
    this.isRunning = true;
    this.notifyListeners({ type: 'test-start', test: 'database-queries' });

    const results = {
      timestamp: new Date().toISOString(),
      type: 'database-queries',
      queries: {},
      overallStatus: 'pending',
    };

    for (const query of queries) {
      try {
        this.notifyListeners({ type: 'query-test-start', query: query.name || query.query });

        const queryResult = await databaseService.executeQuery(query.query, query.params);

        results.queries[query.name || query.query] = {
          status: queryResult.success ? 'passed' : 'failed',
          query: query.query,
          params: query.params,
          rows: queryResult.rows,
          rowCount: queryResult.rowCount,
          executionTime: queryResult.executionTime,
          timestamp: new Date().toISOString(),
        };

        this.notifyListeners({ 
          type: 'query-test-complete', 
          query: query.name || query.query,
          status: results.queries[query.name || query.query].status
        });
      } catch (error) {
        results.queries[query.name || query.query] = {
          status: 'failed',
          query: query.query,
          params: query.params,
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        this.notifyListeners({ 
          type: 'query-test-error', 
          query: query.name || query.query,
          error: error.message
        });
      }
    }

    // Calculate overall status
    const queryStatuses = Object.values(results.queries).map(q => q.status);
    if (queryStatuses.every(status => status === 'passed')) {
      results.overallStatus = 'passed';
    } else if (queryStatuses.some(status => status === 'failed')) {
      results.overallStatus = 'failed';
    } else {
      results.overallStatus = 'partial';
    }

    this.testResults.push(results);
    this.isRunning = false;
    this.notifyListeners({ 
      type: 'test-complete', 
      test: 'database-queries', 
      results,
      status: results.overallStatus
    });

    return results;
  }

  // Run Grafana dashboard tests
  async runGrafanaTests(dashboards) {
    this.isRunning = true;
    this.notifyListeners({ type: 'test-start', test: 'grafana-dashboards' });

    const results = {
      timestamp: new Date().toISOString(),
      type: 'grafana-dashboards',
      dashboards: {},
      overallStatus: 'pending',
    };

    // First test Grafana connection
    try {
      const connectionTest = await grafanaService.testConnection();
      if (!connectionTest.success) {
        results.overallStatus = 'failed';
        results.error = 'Grafana connection failed';
        
        this.testResults.push(results);
        this.isRunning = false;
        this.notifyListeners({ 
          type: 'test-error', 
          test: 'grafana-dashboards',
          error: 'Grafana connection failed'
        });
        
        return results;
      }
    } catch (error) {
      results.overallStatus = 'failed';
      results.error = `Grafana connection error: ${error.message}`;
      
      this.testResults.push(results);
      this.isRunning = false;
      this.notifyListeners({ 
        type: 'test-error', 
        test: 'grafana-dashboards',
        error: error.message
      });
      
      return results;
    }

    // Test each dashboard
    for (const dashboard of dashboards) {
      try {
        this.notifyListeners({ type: 'dashboard-test-start', dashboard: dashboard.uid || dashboard.title });

        const dashboardResult = await grafanaService.getDashboard(dashboard.uid);

        results.dashboards[dashboard.uid] = {
          status: dashboardResult.success ? 'passed' : 'failed',
          title: dashboardResult.dashboard?.dashboard?.title || dashboard.title,
          uid: dashboard.uid,
          url: `${grafanaService.getBuiltInDashboards()[dashboard.uid] || `${config.grafana.url}/d/${dashboard.uid}`}`,
          timestamp: new Date().toISOString(),
        };

        this.notifyListeners({ 
          type: 'dashboard-test-complete', 
          dashboard: dashboard.uid || dashboard.title,
          status: results.dashboards[dashboard.uid].status
        });
      } catch (error) {
        results.dashboards[dashboard.uid] = {
          status: 'failed',
          title: dashboard.title,
          uid: dashboard.uid,
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        this.notifyListeners({ 
          type: 'dashboard-test-error', 
          dashboard: dashboard.uid || dashboard.title,
          error: error.message
        });
      }
    }

    // Calculate overall status
    const dashboardStatuses = Object.values(results.dashboards).map(d => d.status);
    if (dashboardStatuses.every(status => status === 'passed')) {
      results.overallStatus = 'passed';
    } else if (dashboardStatuses.some(status => status === 'failed')) {
      results.overallStatus = 'failed';
    } else {
      results.overallStatus = 'partial';
    }

    this.testResults.push(results);
    this.isRunning = false;
    this.notifyListeners({ 
      type: 'test-complete', 
      test: 'grafana-dashboards', 
      results,
      status: results.overallStatus
    });

    return results;
  }

  // Run a comprehensive test suite across all components
  async runAllTests(options = {}) {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    const defaultOptions = {
      runHealthCheck: true,
      runApiTests: true,
      runMqttTests: true,
      runDatabaseTests: true,
      runGrafanaTests: true,
      apiEndpoints: [
        { method: 'GET', url: '/api/health' },
        { method: 'GET', url: '/api/sensors' },
        { method: 'GET', url: '/api/data/latest' },
      ],
      mqttTopics: ['test/topic1', 'test/topic2'],
      databaseQueries: databaseService.getCommonQueries(),
      grafanaDashboards: [
        { uid: 'city-overview', title: 'City Overview' },
        { uid: 'traffic-monitoring', title: 'Traffic Monitoring' },
        { uid: 'energy-grid', title: 'Energy Grid' },
        { uid: 'air-quality', title: 'Air Quality' },
      ],
    };

    const testOptions = { ...defaultOptions, ...options };
    
    this.isRunning = true;
    const allResults = {
      timestamp: new Date().toISOString(),
      components: {},
    };

    this.notifyListeners({ type: 'all-tests-start' });

    try {
      // Run health check
      if (testOptions.runHealthCheck) {
        allResults.components.health = await this.runSystemHealthCheck();
      }

      // Run API tests
      if (testOptions.runApiTests) {
        allResults.components.api = await this.runApiTests(testOptions.apiEndpoints);
      }

      // Run MQTT tests
      if (testOptions.runMqttTests) {
        allResults.components.mqtt = await this.runMqttTests(testOptions.mqttTopics);
      }

      // Run database tests
      if (testOptions.runDatabaseTests) {
        allResults.components.database = await this.runDatabaseTests(testOptions.databaseQueries);
      }

      // Run Grafana tests
      if (testOptions.runGrafanaTests) {
        allResults.components.grafana = await this.runGrafanaTests(testOptions.grafanaDashboards);
      }

      // Calculate overall status
      const componentStatuses = Object.values(allResults.components).map(c => c.overallStatus);
      if (componentStatuses.every(status => status === 'passed')) {
        allResults.overallStatus = 'passed';
      } else if (componentStatuses.some(status => status === 'failed')) {
        allResults.overallStatus = 'failed';
      } else {
        allResults.overallStatus = 'partial';
      }
    } catch (error) {
      allResults.overallStatus = 'error';
      allResults.error = error.message;
      
      this.notifyListeners({ 
        type: 'all-tests-error',
        error: error.message
      });
    }

    this.isRunning = false;
    this.testResults.push(allResults);
    this.notifyListeners({ 
      type: 'all-tests-complete', 
      results: allResults,
      status: allResults.overallStatus
    });

    return allResults;
  }

  // Get all test results
  getTestResults() {
    return [...this.testResults];
  }

  // Get the most recent test result
  getLatestTestResult() {
    return this.testResults.length > 0 
      ? this.testResults[this.testResults.length - 1] 
      : null;
  }

  // Clear test results
  clearTestResults() {
    this.testResults = [];
    this.notifyListeners({ type: 'results-cleared' });
  }

  // Check if tests are currently running
  isTestRunning() {
    return this.isRunning;
  }
}

// Create a singleton instance
const testingService = new TestingService();

export default testingService;
