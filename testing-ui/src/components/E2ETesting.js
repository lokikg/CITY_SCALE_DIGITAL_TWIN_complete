import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import {
  Play, CheckCircle2, XCircle, AlertCircle, ChevronDown, Clock,
  Target, Zap, BarChart3, TrendingUp, Activity, Code
} from 'lucide-react';

const E2ETesting = () => {
  const [selectedTest, setSelectedTest] = useState('all');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [expandedTestId, setExpandedTestId] = useState(null);
  
  // Test scenarios
  const testScenarios = [
    { id: 'all', name: 'All Tests', description: 'Run all end-to-end test scenarios' },
    { id: 'sensor-create', name: 'Sensor Creation Flow', description: 'Test the complete flow of creating new sensors through API and verifying in frontend' },
    { id: 'sensor-update', name: 'Sensor Update Flow', description: 'Test updating sensor data and verifying the changes propagate correctly' },
    { id: 'sensor-delete', name: 'Sensor Deletion Flow', description: 'Test deleting sensors and verifying they are removed from the system' },
    { id: 'mqtt-ingest', name: 'MQTT Ingestion Flow', description: 'Test MQTT message ingestion and verification in database and frontend' },
    { id: 'grafana-dashboard', name: 'Grafana Dashboard Flow', description: 'Test data visualization in Grafana dashboards' },
    { id: 'authentication', name: 'Authentication Flow', description: 'Test user authentication and authorization workflows' },
    { id: 'user-journey', name: 'Complete User Journey', description: 'Test the entire user journey from login to data visualization' },
  ];
  
  // Run E2E tests
  const runTests = () => {
    setRunning(true);
    
    // Simulate running tests (would call actual test framework in real implementation)
    setTimeout(() => {
      // Generate simulated test results
      const testId = crypto.randomUUID();
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 15000); // Simulate 15 second test run
      
      const scenarios = selectedTest === 'all' 
        ? testScenarios.filter(s => s.id !== 'all') 
        : testScenarios.filter(s => s.id === selectedTest);
      
      const testResults = scenarios.map(scenario => {
        const success = Math.random() > 0.2; // 80% chance of success
        return {
          id: crypto.randomUUID(),
          name: scenario.name,
          success,
          duration: Math.floor(Math.random() * 5000) + 1000, // 1-6 seconds
          steps: generateTestSteps(scenario.id, success),
          error: success ? null : generateRandomError(scenario.id),
          screenshot: success ? null : 'error-screenshot.png' // In real app, this would be an actual screenshot
        };
      });
      
      const totalTests = testResults.length;
      const passedTests = testResults.filter(t => t.success).length;
      const failedTests = totalTests - passedTests;
      
      const results = {
        id: testId,
        startTime,
        endTime,
        duration: (endTime - startTime) / 1000,
        totalTests,
        passedTests,
        failedTests,
        scenarios: testResults
      };
      
      setResults(results);
      setTestHistory(prev => [results, ...prev]);
      setRunning(false);
    }, 15000); // Simulate tests taking 15 seconds
  };
  
  // Generate random test steps for a scenario
  const generateTestSteps = (scenarioId, success) => {
    const steps = [];
    let numSteps;
    
    switch (scenarioId) {
      case 'sensor-create':
        numSteps = 5;
        steps.push(
          { name: 'Navigate to Create Sensor page', success: true, duration: 532 },
          { name: 'Fill sensor details form', success: true, duration: 789 },
          { name: 'Submit form', success: true, duration: 654 },
          { name: 'Verify sensor in database', success, duration: 876 },
          { name: 'Verify sensor appears in frontend', success, duration: 1243 }
        );
        break;
      case 'mqtt-ingest':
        numSteps = 4;
        steps.push(
          { name: 'Connect to MQTT broker', success: true, duration: 432 },
          { name: 'Publish test message', success: true, duration: 234 },
          { name: 'Verify message received by backend', success, duration: 765 },
          { name: 'Verify data stored in database', success, duration: 876 }
        );
        break;
      case 'grafana-dashboard':
        numSteps = 3;
        steps.push(
          { name: 'Navigate to Grafana dashboard', success: true, duration: 654 },
          { name: 'Verify dashboard loads with data', success, duration: 987 },
          { name: 'Verify metrics update in real-time', success, duration: 1432 }
        );
        break;
      default:
        numSteps = Math.floor(Math.random() * 5) + 3; // 3-7 steps
        for (let i = 0; i < numSteps; i++) {
          // If test ultimately fails, make the last step fail
          const stepSuccess = success || i < numSteps - 1;
          steps.push({
            name: `Test step ${i + 1}`,
            success: stepSuccess,
            duration: Math.floor(Math.random() * 1000) + 200
          });
        }
    }
    
    return steps;
  };
  
  // Generate a random error message
  const generateRandomError = (scenarioId) => {
    const errors = [
      'Element not found in DOM',
      'Timeout waiting for element to be visible',
      'Expected value "123" but found "456"',
      'API returned 500 status code',
      'Failed to connect to database',
      'Message not received by MQTT broker',
      'Authentication failed',
      'Network request failed',
      'Expected true to be false',
      'Dashboard failed to load'
    ];
    
    // Return more specific error based on scenario type
    switch (scenarioId) {
      case 'sensor-create':
        return 'Failed to verify sensor exists in database';
      case 'mqtt-ingest':
        return 'Message not properly ingested by backend';
      case 'grafana-dashboard':
        return 'Dashboard metrics failed to update';
      default:
        return errors[Math.floor(Math.random() * errors.length)];
    }
  };
  
  // Toggle expanded test details
  const toggleExpandTest = (testId) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
  };
  
  return (
    <div className="min-h-screen py-8 px-4 md:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h1 className="title-large text-gradient">End-to-End Testing</h1>
        </div>
        <p className="text-muted-foreground">Execute complete user journey and system workflow tests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
        {/* Test Scenario Selection */}
        <div className="lg:col-span-1">
          <Card className="glass-effect border-0 shadow-lg sticky top-24">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                <CardTitle>Test Scenarios</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {testScenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedTest(scenario.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedTest === scenario.id
                        ? 'glass-effect border border-primary shadow-md bg-primary/5'
                        : 'border border-border hover:border-primary/50'
                    }`}
                  >
                    <h3 className="text-sm font-semibold">{scenario.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{scenario.description}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={runTests}
                disabled={running}
                size="lg"
                className="w-full gradient-primary text-white font-semibold button-hover"
              >
                {running ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Tests
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <div className="lg:col-span-2">
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <CardTitle>Test Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {running ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-gradient-primary rounded-full animate-ping opacity-20"></div>
                    <div className="absolute inset-2 bg-gradient-primary rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-lg font-semibold">Running end-to-end tests...</p>
                  <p className="text-sm text-muted-foreground">This may take a few moments</p>
                </div>
              ) : results ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Total Tests</p>
                      <p className="text-2xl font-bold">{results.scenarios.length}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-xs font-semibold text-green-600 mb-1">Passed</p>
                      <p className="text-2xl font-bold text-green-600">{results.passedTests}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs font-semibold text-red-600 mb-1">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{results.failedTests}</p>
                    </div>
                  </div>

                  {/* Test Results */}
                  <div className="space-y-3">
                    {results.scenarios.map(scenario => (
                      <div
                        key={scenario.id}
                        onClick={() => toggleExpandTest(scenario.id)}
                        className={`rounded-lg border transition-all cursor-pointer overflow-hidden ${
                          scenario.success
                            ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10'
                            : 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                        }`}
                      >
                        <div className="p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {scenario.success ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <div>
                              <p className="font-semibold">{scenario.name}</p>
                              <p className="text-xs text-muted-foreground">{scenario.duration}ms</p>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              expandedTestId === scenario.id ? 'rotate-180' : ''
                            }`}
                          />
                        </div>

                        {expandedTestId === scenario.id && (
                          <div className="border-t border-border/50 p-4 space-y-3 bg-background">
                            {scenario.error && (
                              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                <p className="text-xs font-semibold text-red-600 mb-1">Error</p>
                                <p className="text-sm text-red-700">{scenario.error}</p>
                              </div>
                            )}
                            
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Test Steps</p>
                              <div className="space-y-1">
                                {scenario.steps.map((step, index) => (
                                  <div key={index} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${step.success ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                      <span>{step.name}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{step.duration}ms</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No test results yet. Select a scenario and run tests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test History */}
      <Card className="glass-effect border-0 shadow-lg mt-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle>Test History</CardTitle>
              <Badge className="ml-2">{testHistory.length}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {testHistory.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No test history yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-semibold text-muted-foreground">Date/Time</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Duration</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Total</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Passed</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Failed</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {testHistory.map(test => {
                    const passRate = Math.round((test.passedTests / test.totalTests) * 100);
                    return (
                      <tr
                        key={test.id}
                        onClick={() => {
                          setResults(test);
                          setExpandedTestId(null);
                        }}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="p-2 text-xs">{new Date(test.startTime).toLocaleString()}</td>
                        <td className="p-2 font-mono">{test.duration}s</td>
                        <td className="p-2 font-semibold">{test.totalTests}</td>
                        <td className="p-2">
                          <Badge className="bg-green-100 text-green-800 border-green-300">{test.passedTests}</Badge>
                        </td>
                        <td className="p-2">
                          <Badge className={test.failedTests > 0 ? 'bg-red-100 text-red-800 border-red-300' : 'bg-gray-100 text-gray-800'}>
                            {test.failedTests}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge className={
                            passRate === 100 ? 'bg-green-100 text-green-800 border-green-300' :
                            passRate >= 80 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            'bg-red-100 text-red-800 border-red-300'
                          }>
                            {passRate}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default E2ETesting;
