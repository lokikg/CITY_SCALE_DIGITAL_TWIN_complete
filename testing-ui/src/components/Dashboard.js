import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Server, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  TrendingUp, 
  Activity,
  Clock,
  FileText,
  Play,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const [systemStatus, setSystemStatus] = useState({
    backend: 'unknown',
    frontend: 'unknown',
    mqtt: 'unknown',
    database: 'unknown',
    grafana: 'unknown'
  });
  
  const [testResults, setTestResults] = useState({
    apiTests: { total: 0, passed: 0, failed: 0, lastRun: null },
    mqttTests: { total: 0, passed: 0, failed: 0, lastRun: null },
    databaseTests: { total: 0, passed: 0, failed: 0, lastRun: null },
    performanceTests: { total: 0, passed: 0, failed: 0, lastRun: null },
    e2eTests: { total: 0, passed: 0, failed: 0, lastRun: null },
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        // Use apiService so requests are sent to the configured backend baseUrl
        const [apiHealth, mqttStatus, dbStatus] = await Promise.allSettled([
          apiService.health.checkBackend(),
          apiService.health.getMqttStatus(),
          apiService.health.getDatabaseStatus(),
        ]);

        const grafanaCheck = await (async () => {
          try {
            // grafanaService may not be configured for health endpoint, fallback to config url
            const res = await fetch(`${window.location.origin}`);
            return { ok: res.ok };
          } catch (e) {
            return { ok: false };
          }
        })();

        setSystemStatus({
          backend: apiHealth.status === 'fulfilled' && apiHealth.value.data?.status === 'ok' ? 'online' : 'offline',
          frontend: 'online', // frontend is the UI we're running in
          mqtt: mqttStatus.status === 'fulfilled' && (mqttStatus.value.data?.status === 'online' || mqttStatus.value.data?.connected) ? 'online' : 'offline',
          database: dbStatus.status === 'fulfilled' && dbStatus.value.data?.connected ? 'online' : 'offline',
          grafana: grafanaCheck.ok ? 'online' : 'offline',
        });
        
        // In a real app, you would fetch actual test results from a storage
        // For now, we'll use mock data
        setTestResults({
          apiTests: { total: 125, passed: 120, failed: 5, lastRun: '2025-08-30 14:30' },
          mqttTests: { total: 45, passed: 42, failed: 3, lastRun: '2025-08-30 14:35' },
          databaseTests: { total: 60, passed: 58, failed: 2, lastRun: '2025-08-30 14:32' },
          performanceTests: { total: 15, passed: 12, failed: 3, lastRun: '2025-08-30 14:00' },
          e2eTests: { total: 8, passed: 7, failed: 1, lastRun: '2025-08-30 13:45' },
        });
        
      } catch (error) {
        console.error('Error checking system status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSystemStatus();
    
    // Poll every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return { badge: 'bg-green-100 text-green-800 border-green-300', dot: 'bg-green-500', icon: CheckCircle };
      case 'offline': return { badge: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500', icon: AlertCircle };
      default: return { badge: 'bg-gray-100 text-gray-800 border-gray-300', dot: 'bg-gray-500', icon: Loader };
    }
  };
  
  const getTestPassRate = (result) => {
    return result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
  };
  
  const getPassRateColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getProgressBarColor = (rate) => {
    if (rate >= 90) return 'bg-gradient-success';
    if (rate >= 75) return 'bg-gradient-warning';
    return 'bg-gradient-danger';
  };
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 bg-gradient-primary rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-2 bg-gradient-primary rounded-full animate-pulse"></div>
          <Activity className="absolute inset-4 text-primary animate-spin" />
        </div>
        <p className="text-lg font-semibold text-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-6 lg:px-8 animate-fade-in">
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="title-large text-gradient mb-2">Testing Dashboard</h1>
            <p className="text-muted-foreground">Monitor all system components and test results in real-time</p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            className="gap-2 shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Section */}
      <div className="mb-12 animate-slide-up">
        <div className="flex items-center gap-2 mb-6">
          <Server className="w-5 h-5 text-primary" />
          <h2 className="title-small font-semibold">System Status</h2>
          <Badge className="ml-2">5 Services</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { name: 'Backend', key: 'backend', icon: Server },
            { name: 'Frontend', key: 'frontend', icon: Zap },
            { name: 'MQTT Broker', key: 'mqtt', icon: Activity },
            { name: 'Database', key: 'database', icon: BarChart3 },
            { name: 'Grafana', key: 'grafana', icon: TrendingUp },
          ].map(({ name, key, icon: Icon }) => {
            const status = systemStatus[key];
            const colors = getStatusColor(status);
            const StatusIcon = colors.icon;
            
            return (
              <Card key={key} className="card-hover glass-effect border-2 overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className={`w-3 h-3 rounded-full ${colors.dot} animate-pulse`}></div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{name}</p>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 ${colors.dot.replace('bg-', 'text-')}`} />
                    <span className={`text-lg font-bold capitalize ${colors.dot.replace('bg-', 'text-')}`}>
                      {status}
                    </span>
                  </div>
                  <Badge className={`mt-3 w-full justify-center ${colors.badge}`}>
                    {status === 'online' ? 'Connected' : status === 'offline' ? 'Disconnected' : 'Checking...'}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Test Results Summary */}
      <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle className="w-5 h-5 text-primary" />
          <h2 className="title-small font-semibold">Test Results Overview</h2>
          <Badge className="ml-2">5 Test Suites</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(testResults).map(([key, result]) => {
            const passRate = getTestPassRate(result);
            const testName = key
              .replace('Tests', '')
              .replace(/([A-Z])/g, ' $1')
              .trim();
            
            return (
              <Card 
                key={key} 
                className="card-hover glass-effect border-l-4 overflow-hidden"
                style={{ borderLeftColor: passRate >= 90 ? '#22c55e' : passRate >= 75 ? '#eab308' : '#ef4444' }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{testName}</h3>
                    {passRate === 100 && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-muted-foreground">Pass Rate</span>
                      <span className={`text-2xl font-bold ${getPassRateColor(passRate)}`}>
                        {passRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(passRate)}`}
                        style={{ width: `${passRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded bg-primary/5">
                      <p className="text-2xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold">{result.total}</p>
                    </div>
                    <div className="text-center p-2 rounded bg-green-500/5">
                      <p className="text-2xs text-muted-foreground">Passed</p>
                      <p className="text-lg font-bold text-green-600">{result.passed}</p>
                    </div>
                    <div className="text-center p-2 rounded bg-red-500/5">
                      <p className="text-2xs text-muted-foreground">Failed</p>
                      <p className="text-lg font-bold text-red-600">{result.failed}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {result.lastRun ? new Date(result.lastRun).toLocaleTimeString() : 'N/A'}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-2 mb-6">
          <Play className="w-5 h-5 text-primary" />
          <h2 className="title-small font-semibold">Quick Actions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button className="h-14 gap-2 shadow-lg button-hover gradient-primary text-primary-foreground">
            <Play className="w-4 h-4" />
            Run API Tests
          </Button>
          <Button className="h-14 gap-2 shadow-lg button-hover gradient-primary text-primary-foreground">
            <Zap className="w-4 h-4" />
            Run MQTT Tests
          </Button>
          <Button className="h-14 gap-2 shadow-lg button-hover gradient-primary text-primary-foreground">
            <FileText className="w-4 h-4" />
            Generate Report
          </Button>
          <Button className="h-14 gap-2 shadow-lg button-hover gradient-primary text-primary-foreground">
            <BarChart3 className="w-4 h-4" />
            View History
          </Button>
        </div>
      </div>

      {/* Recent Test Runs Table */}
      <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="title-small font-semibold">Recent Test Runs</h2>
        </div>

        <Card className="glass-effect overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Test Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Timestamp</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { type: 'API Testing', status: 'passed', duration: '42s', timestamp: '2025-11-15 14:30:15' },
                  { type: 'Database Testing', status: 'passed', duration: '28s', timestamp: '2025-11-15 14:32:22' },
                  { type: 'MQTT Testing', status: 'failed', duration: '35s', timestamp: '2025-11-15 14:35:45' },
                  { type: 'Performance Testing', status: 'passed', duration: '118s', timestamp: '2025-11-15 14:00:10' },
                  { type: 'E2E Testing', status: 'passed', duration: '186s', timestamp: '2025-11-15 13:45:30' },
                ].map((test, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{test.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        className={test.status === 'passed' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${test.status === 'passed' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{test.duration}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{test.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:bg-primary/10"
                      >
                        Details →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
