import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { 
  Car, Wind, Volume2, Cloud, Zap, Trash2, 
  ParkingCircle, Lightbulb, Bus, Camera, 
  Droplets, Battery, TrendingUp, AlertTriangle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const deviceTypes = {
  traffic_sensors: { icon: Car, color: '#ef4444', name: 'Traffic Sensors' },
  air_quality_sensors: { icon: Wind, color: '#10b981', name: 'Air Quality' },
  noise_sensors: { icon: Volume2, color: '#f59e0b', name: 'Noise Sensors' },
  weather_stations: { icon: Cloud, color: '#3b82f6', name: 'Weather Stations' },
  smart_meters: { icon: Zap, color: '#8b5cf6', name: 'Smart Meters' },
  waste_bins: { icon: Trash2, color: '#6b7280', name: 'Waste Bins' },
  parking_sensors: { icon: ParkingCircle, color: '#ec4899', name: 'Parking Sensors' },
  street_lights: { icon: Lightbulb, color: '#f97316', name: 'Street Lights' },
  public_transport_trackers: { icon: Bus, color: '#06b6d4', name: 'Public Transport' },
  surveillance_cameras: { icon: Camera, color: '#dc2626', name: 'Surveillance' },
  water_quality_sensors: { icon: Droplets, color: '#0891b2', name: 'Water Quality' },
  energy_grid_sensors: { icon: Battery, color: '#65a30d', name: 'Energy Grid' }
};

const Analytics = () => {
  const [selectedDeviceType, setSelectedDeviceType] = useState('traffic_sensors');
  const [deviceData, setDeviceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchDeviceData = async (deviceType) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/${deviceType}/all`);
      setDeviceData(response.data);
      processAnalyticsData(response.data, deviceType);
    } catch (error) {
      console.error(`Error fetching ${deviceType} data:`, error);
      setDeviceData([]);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (data, deviceType) => {
    if (!data.length) {
      setAnalyticsData(null);
      return;
    }

    // Group data by location for location-based charts
    const locationData = data.reduce((acc, device) => {
      if (!acc[device.location]) {
        acc[device.location] = [];
      }
      acc[device.location].push(device);
      return acc;
    }, {});

    // Generate time-series data (last 24 data points)
    const timeSeriesData = data.slice(-24).map((device, index) => ({
      time: new Date(device.timestamp).toLocaleTimeString(),
      ...getDeviceMetrics(device, deviceType),
      location: device.location
    }));

    // Generate location summary
    const locationSummary = Object.entries(locationData).map(([location, devices]) => {
      const avgMetrics = getAverageMetrics(devices, deviceType);
      return {
        location,
        count: devices.length,
        ...avgMetrics
      };
    });

    setAnalyticsData({
      timeSeries: timeSeriesData,
      locationSummary,
      totalDevices: data.length,
      latestReading: data[data.length - 1]
    });
  };

  const getDeviceMetrics = (device, deviceType) => {
    switch (deviceType) {
      case 'traffic_sensors':
        return { 
          primary: device.vehicle_count, 
          secondary: device.avg_speed,
          primaryLabel: 'Vehicle Count',
          secondaryLabel: 'Avg Speed (km/h)'
        };
      case 'air_quality_sensors':
        return { 
          primary: device.pm25, 
          secondary: device.pm10,
          primaryLabel: 'PM2.5 (μg/m³)',
          secondaryLabel: 'PM10 (μg/m³)'
        };
      case 'noise_sensors':
        return { 
          primary: device.decibel_level, 
          secondary: device.decibel_level,
          primaryLabel: 'Decibel Level',
          secondaryLabel: 'Noise Level'
        };
      case 'weather_stations':
        return { 
          primary: device.temperature, 
          secondary: device.humidity,
          primaryLabel: 'Temperature (°C)',
          secondaryLabel: 'Humidity (%)'
        };
      case 'smart_meters':
        return { 
          primary: device.electricity_usage, 
          secondary: device.water_usage,
          primaryLabel: 'Electricity (kWh)',
          secondaryLabel: 'Water (L)'
        };
      case 'waste_bins':
        return { 
          primary: device.fill_level, 
          secondary: device.temperature,
          primaryLabel: 'Fill Level (%)',
          secondaryLabel: 'Temperature (°C)'
        };
      case 'energy_grid_sensors':
        return { 
          primary: device.voltage, 
          secondary: device.current,
          primaryLabel: 'Voltage (V)',
          secondaryLabel: 'Current (A)'
        };
      default:
        return { primary: 0, secondary: 0, primaryLabel: 'Value', secondaryLabel: 'Value' };
    }
  };

  const getAverageMetrics = (devices, deviceType) => {
    if (!devices.length) return { primary: 0, secondary: 0 };
    
    const metrics = devices.map(device => getDeviceMetrics(device, deviceType));
    const avgPrimary = metrics.reduce((sum, m) => sum + m.primary, 0) / metrics.length;
    const avgSecondary = metrics.reduce((sum, m) => sum + m.secondary, 0) / metrics.length;
    
    return {
      primary: Math.round(avgPrimary * 100) / 100,
      secondary: Math.round(avgSecondary * 100) / 100,
      primaryLabel: metrics[0]?.primaryLabel || 'Value',
      secondaryLabel: metrics[0]?.secondaryLabel || 'Value'
    };
  };

  useEffect(() => {
    fetchDeviceData(selectedDeviceType);
  }, [selectedDeviceType]);

  const getStatusColor = (value, type) => {
    // Define thresholds for different device types
    const thresholds = {
      'air_quality_sensors': { good: 50, warning: 100 }, // PM2.5
      'noise_sensors': { good: 55, warning: 70 }, // Decibels
      'waste_bins': { good: 70, warning: 90 }, // Fill level
      'traffic_sensors': { good: 50, warning: 100 } // Vehicle count
    };
    
    const threshold = thresholds[type];
    if (!threshold) return '#10b981';
    
    if (value <= threshold.good) return '#10b981'; // Green
    if (value <= threshold.warning) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-800" style={{background: 'rgba(255,255,255,0.6)', borderRadius: '0.75rem', padding: '0.5rem 1.5rem', width: 'fit-content', margin: '0 auto'}}>Analytics Dashboard</h1>
        <p className="text-slate-600" style={{background: 'rgba(255,255,255,0.6)', borderRadius: '0.75rem', padding: '0.5rem 1.5rem', width: 'fit-content', margin: '0 auto'}}>Analyze trends and patterns from IoT device data</p>
      </div>

      {/* Device Type Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Select Device Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(deviceTypes).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setSelectedDeviceType(type)}
              className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                selectedDeviceType === type
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <config.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{config.name}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading analytics data...</p>
          </div>
        </div>
      ) : analyticsData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Devices</p>
                  <p className="text-2xl font-bold text-slate-800">{analyticsData.totalDevices}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  {React.createElement(deviceTypes[selectedDeviceType].icon, {
                    className: "h-6 w-6 text-blue-600"
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Locations</p>
                  <p className="text-2xl font-bold text-slate-800">{analyticsData.locationSummary.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Last Update</p>
                  <p className="text-lg font-bold text-slate-800">
                    {new Date(analyticsData.latestReading.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Time Series Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Time Series Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="primary" 
                  stroke={deviceTypes[selectedDeviceType].color}
                  strokeWidth={2}
                  name={analyticsData.timeSeries[0]?.primaryLabel || 'Primary'}
                />
                <Line 
                  type="monotone" 
                  dataKey="secondary" 
                  stroke="#8884d8"
                  strokeWidth={2}
                  name={analyticsData.timeSeries[0]?.secondaryLabel || 'Secondary'}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Location Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">By Location</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.locationSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="location" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar 
                    dataKey="primary" 
                    fill={deviceTypes[selectedDeviceType].color}
                    name={analyticsData.locationSummary[0]?.primaryLabel || 'Value'}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Device Distribution Pie Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Device Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.locationSummary}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ location, count }) => `${location} (${count})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.locationSummary.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`hsl(${(index * 137.5) % 360}, 70%, 60%)`} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Location Details Table */}
          <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Location Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Devices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Avg {analyticsData.locationSummary[0]?.primaryLabel}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {analyticsData.locationSummary.map((location, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {location.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {location.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {location.primary}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ 
                            backgroundColor: getStatusColor(location.primary, selectedDeviceType) 
                          }}
                        >
                          {location.primary <= 50 ? 'Good' : location.primary <= 75 ? 'Warning' : 'Critical'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600" style={{background: 'rgba(255,255,255,0.6)', borderRadius: '0.75rem', padding: '0.5rem 1.5rem', width: 'fit-content', margin: '0.5rem auto'}}>No data available for the selected device type.</p>
          <p className="text-sm text-slate-500 mt-2" style={{background: 'rgba(255,255,255,0.6)', borderRadius: '0.75rem', padding: '0.5rem 1.5rem', width: 'fit-content', margin: '0.5rem auto'}}>Try simulating some data from the Dashboard first.</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;