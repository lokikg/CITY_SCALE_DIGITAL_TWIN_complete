import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import apiService from '../services/apiService';

const SystemMonitoring = () => {
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: { usage: 0, cores: 0 },
    memory: { total: 0, used: 0, free: 0 },
    disk: { total: 0, used: 0, free: 0 },
    network: { in: 0, out: 0 },
  });
  
  const [serviceStatus, setServiceStatus] = useState({
    backend: { status: 'unknown', uptime: 0, requests: 0, errors: 0 },
    frontend: { status: 'unknown', uptime: 0, users: 0 },
    database: { status: 'unknown', uptime: 0, connections: 0, queries: 0 },
    mqtt: { status: 'unknown', uptime: 0, messages: 0, clients: 0 },
    grafana: { status: 'unknown', uptime: 0 },
  });
  
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  
  // Fetch real system/service status from backend
  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [statusRes, mqttRes, dbRes] = await Promise.allSettled([
          apiService.health.getStatus(),
          apiService.health.getMqttStatus(),
          apiService.health.getDatabaseStatus()
        ]);

        const newServiceStatus = {
          backend: { status: 'unknown', uptime: 0, requests: 0, errors: 0 },
          frontend: { status: 'online', uptime: 0, users: 0 },
          database: { status: 'unknown', uptime: 0, connections: 0, queries: 0 },
          mqtt: { status: 'unknown', uptime: 0, messages: 0, clients: 0 },
          grafana: { status: 'unknown', uptime: 0 }
        };

        if (statusRes.status === 'fulfilled' && statusRes.value && statusRes.value.data) {
          const s = statusRes.value.data;
          // Backend status endpoint returns fields like backend/database/mqtt statuses
          newServiceStatus.backend.status = s.backend || s.get?.('backend') || 'online';
          if (s.timestamp) {
            newServiceStatus.backend.uptime = 0;
          }
          if (s.database) {
            newServiceStatus.database.status = s.database;
          }
        }

        if (mqttRes.status === 'fulfilled' && mqttRes.value && mqttRes.value.data) {
          const m = mqttRes.value.data;
          newServiceStatus.mqtt.status = m.connected ? 'online' : (m.status || 'offline');
          newServiceStatus.mqtt.clients = m.clients || 0;
        }

        if (dbRes.status === 'fulfilled' && dbRes.value && dbRes.value.data) {
          const d = dbRes.value.data;
          newServiceStatus.database.status = d.connected ? 'online' : (d.status || 'offline');
          if (d.table_counts) {
            newServiceStatus.database.queries = Object.values(d.table_counts).reduce((a, b) => a + b, 0);
          } else if (d.tableStats) {
            newServiceStatus.database.queries = Object.values(d.tableStats).reduce((a, b) => a + b, 0);
          }
        }

        if (mounted) {
          setServiceStatus(newServiceStatus);
          // Keep lightweight system metrics (for visualization) but don't rely on them for health
          setSystemMetrics(prev => ({
            cpu: { usage: prev.cpu.usage || 5, cores: prev.cpu.cores || 8 },
            memory: prev.memory,
            disk: prev.disk,
            network: prev.network
          }));
        }
      } catch (e) {
        console.error('Error fetching system status', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // Initial fetch
    fetchAll();

    const interval = setInterval(fetchAll, refreshInterval * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshInterval]);
  
  // Format bytes to human readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Format minutes to human readable format
  const formatUptime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    } else {
      return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
    }
  };
  
  // Acknowledge an alert
  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Get alert severity color
  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Get log type color
  const getLogTypeColor = (type) => {
    switch (type) {
      case 'info': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">System Monitoring</h1>
      
      {/* Refresh Controls */}
      <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Auto Refresh:</span>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 seconds</option>
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
            <option value="300">5 minutes</option>
          </select>
          
          <span className="text-sm font-medium text-gray-700 ml-4">Time Range:</span>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
        
        <button
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 1000);
          }}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Now
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">System Metrics</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* CPU Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">CPU Usage</h3>
                  <span className="text-sm font-medium text-gray-900">{systemMetrics.cpu.usage}% ({systemMetrics.cpu.cores} cores)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      systemMetrics.cpu.usage < 50 ? 'bg-green-600' :
                      systemMetrics.cpu.usage < 80 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${systemMetrics.cpu.usage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Memory Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Memory Usage</h3>
                  <span className="text-sm font-medium text-gray-900">
                    {formatBytes(systemMetrics.memory.used * 1024 * 1024)} / {formatBytes(systemMetrics.memory.total * 1024 * 1024)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      (systemMetrics.memory.used / systemMetrics.memory.total) < 0.5 ? 'bg-green-600' :
                      (systemMetrics.memory.used / systemMetrics.memory.total) < 0.8 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${(systemMetrics.memory.used / systemMetrics.memory.total) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Disk Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Disk Usage</h3>
                  <span className="text-sm font-medium text-gray-900">
                    {formatBytes(systemMetrics.disk.used * 1024 * 1024)} / {formatBytes(systemMetrics.disk.total * 1024 * 1024)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      (systemMetrics.disk.used / systemMetrics.disk.total) < 0.5 ? 'bg-green-600' :
                      (systemMetrics.disk.used / systemMetrics.disk.total) < 0.8 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${(systemMetrics.disk.used / systemMetrics.disk.total) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Network Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Network Traffic</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Inbound</span>
                      <span className="text-xs font-medium text-gray-900">{systemMetrics.network.in} Mbps</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(systemMetrics.network.in, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Outbound</span>
                      <span className="text-xs font-medium text-gray-900">{systemMetrics.network.out} Mbps</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-purple-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(systemMetrics.network.out * 2, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Service Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Status</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(serviceStatus).map(([service, data]) => (
                <div key={service} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-3 ${getStatusColor(data.status)}`}></div>
                      <h3 className="text-md font-medium text-gray-800 capitalize">{service}</h3>
                    </div>
                    <span className="text-sm font-medium capitalize">{data.status}</span>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="text-xs text-gray-600">
                      Uptime: <span className="font-medium">{formatUptime(data.uptime)}</span>
                    </div>
                    
                    {service === 'backend' && (
                      <>
                        <div className="text-xs text-gray-600">
                          Requests: <span className="font-medium">{data.requests}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Errors: <span className="font-medium">{data.errors}</span>
                        </div>
                      </>
                    )}
                    
                    {service === 'frontend' && (
                      <div className="text-xs text-gray-600">
                        Active Users: <span className="font-medium">{data.users}</span>
                      </div>
                    )}
                    
                    {service === 'database' && (
                      <>
                        <div className="text-xs text-gray-600">
                          Connections: <span className="font-medium">{data.connections}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Queries: <span className="font-medium">{data.queries}</span>
                        </div>
                      </>
                    )}
                    
                    {service === 'mqtt' && (
                      <>
                        <div className="text-xs text-gray-600">
                          Messages: <span className="font-medium">{data.messages}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Clients: <span className="font-medium">{data.clients}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">System Alerts</h2>
          
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No alerts at this time
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`border rounded-md p-4 ${getAlertSeverityColor(alert.severity)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-md font-medium">{alert.type}</h3>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <div className="text-xs mt-2">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-white uppercase">
                        {alert.severity}
                      </span>
                      
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* System Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">System Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Logs
            </button>
          </div>
          
          <div className="h-96 overflow-y-auto border border-gray-200 rounded-md">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No logs available
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs font-medium">
                        <span className={`${getLogTypeColor(log.type)} uppercase`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        {log.source}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-900">
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {/* External Links */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Monitoring Links</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a 
            href="#" 
            className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 className="text-md font-medium text-blue-600">Grafana Dashboards</h3>
            <p className="text-sm text-gray-600 mt-1">View detailed system metrics and dashboards</p>
          </a>
          
          <a 
            href="#" 
            className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 className="text-md font-medium text-blue-600">Prometheus Metrics</h3>
            <p className="text-sm text-gray-600 mt-1">Access raw metrics and configure alerts</p>
          </a>
          
          <a 
            href="#" 
            className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 className="text-md font-medium text-blue-600">Database Admin</h3>
            <p className="text-sm text-gray-600 mt-1">Manage database settings and connections</p>
          </a>
          
          <a 
            href="#" 
            className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 className="text-md font-medium text-blue-600">MQTT Dashboard</h3>
            <p className="text-sm text-gray-600 mt-1">Monitor MQTT broker and message flow</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoring;
