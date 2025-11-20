import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { 
  Car, Wind, Volume2, Cloud, Zap, Trash2, 
  ParkingCircle, Lightbulb, Bus, Camera, 
  Droplets, Battery, RefreshCw
} from 'lucide-react';
import { simulatorService } from '../services/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// New York City coordinates
const CITY_CENTER = [40.7128, -74.0060];

// Device type configurations
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

// Generate consistent coordinates around the city center as a fallback when real coordinates aren't available
const generateCoordinates = (deviceId, index, total) => {
  // Use the last 4 characters of the device ID as a seed for the offset
  // This ensures the same device always gets the same coordinates
  const seed = deviceId ? 
    deviceId.slice(-4).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
    index * 100;
  
  // Use a deterministic offset based on the seed
  const radius = 0.05; // roughly 5km radius
  const angle = (index / total) * 2 * Math.PI;
  const offsetX = Math.sin(seed) * 0.02;
  const offsetY = Math.cos(seed) * 0.02;
  
  return [
    CITY_CENTER[0] + Math.cos(angle) * radius + offsetX,
    CITY_CENTER[1] + Math.sin(angle) * radius + offsetY
  ];
};

// Create a component to handle map centering
const MapCenter = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, {
        animate: true,
        duration: 1.5
      });
    }
  }, [center, map]);
  
  return null;
};

const Dashboard = () => {
  const [allDeviceData, setAllDeviceData] = useState({});
  const [deviceCoordinates, setDeviceCoordinates] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedDeviceType, setSelectedDeviceType] = useState(null); // Track selected device type
  const [selectedDevice, setSelectedDevice] = useState(null); // Track selected device for centering map
  const [mapCenter, setMapCenter] = useState(CITY_CENTER);


  const fetchAllDeviceData = async () => {
    try {
      const results = {};
      
      console.log('BACKEND_URL:', BACKEND_URL);
      console.log('API URL:', API);
      
      for (const deviceType of Object.keys(deviceTypes)) {
        try {
          const url = `${API}/${deviceType}/all`;
          console.log(`Fetching from URL: ${url}`);
          
          const response = await axios.get(url);
          console.log(`Response for ${deviceType}:`, response.data);
          results[deviceType] = response.data;
          
          // Pre-generate coordinates for any new devices
          response.data.forEach((device, index) => {
            const deviceKey = `${deviceType}-${device.id}`;
            if (!deviceCoordinates[deviceKey]) {
              setDeviceCoordinates(prev => ({
                ...prev,
                [deviceKey]: generateCoordinates(
                  device.id, 
                  index + parseInt(deviceType.charCodeAt(0)), 
                  response.data.length + 5
                )
              }));
            }
          });
        } catch (error) {
          console.error(`Error fetching ${deviceType}:`, error);
          results[deviceType] = [];
        }
      }
      
      setAllDeviceData(results);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching device data:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Trigger the data simulator to generate new data
      await simulatorService.triggerSimulation();
      
      // Wait a moment for the simulator to update data
      setTimeout(() => {
        // Then fetch the updated data
        fetchAllDeviceData();
      }, 2000);
    } catch (error) {
      console.error("Failed to trigger data simulation:", error);
      // Still try to fetch data even if simulation trigger fails
      fetchAllDeviceData();
    }
  };

  useEffect(() => {
    fetchAllDeviceData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAllDeviceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTotalDeviceCount = () => {
    return Object.values(allDeviceData).reduce((total, devices) => total + devices.length, 0);
  };

  const getActiveDevicesCount = () => {
    let active = 0;
    Object.entries(allDeviceData).forEach(([type, devices]) => {
      devices.forEach(device => {
        if (type === 'street_lights' && device.status) active++;
        else if (type === 'parking_sensors' && !device.is_occupied) active++;
        else if (type === 'surveillance_cameras' && device.motion_detected) active++;
        else if (!['street_lights', 'parking_sensors', 'surveillance_cameras'].includes(type)) active++;
      });
    });
    return active;
  };
  
  const renderDeviceStatus = (type, device) => {
    let statusText = '';
    let statusClass = 'status-normal';
    
    switch (type) {
      case 'traffic_sensors':
        statusText = `${device.vehicle_count} vehicles`;
        statusClass = device.vehicle_count > 20 ? 'status-warning' : 'status-normal';
        break;
      case 'air_quality_sensors':
        statusText = device.air_quality_index ? `AQI: ${device.air_quality_index}` : `PM2.5: ${device.pm25}`;
        statusClass = (device.air_quality_index > 100 || device.pm25 > 35) ? 'status-alert' : 'status-normal';
        break;
      case 'noise_sensors':
        statusText = `${device.decibel_level} dB`;
        statusClass = device.decibel_level > 70 ? 'status-warning' : 'status-normal';
        break;
      case 'weather_stations':
        statusText = `${device.temperature}°C, ${device.humidity}%`;
        statusClass = 'status-info';
        break;
      case 'smart_meters':
        statusText = `${device.current_reading} kWh`;
        statusClass = 'status-info';
        break;
      case 'waste_bins':
        statusText = `${device.fill_level}% full`;
        statusClass = device.fill_level > 80 ? 'status-alert' : device.fill_level > 50 ? 'status-warning' : 'status-normal';
        break;
      case 'parking_sensors':
        statusText = device.is_occupied ? 'Occupied' : 'Available';
        statusClass = device.is_occupied ? 'status-warning' : 'status-normal';
        break;
      case 'street_lights':
        statusText = device.status ? 'On' : 'Off';
        statusClass = device.status ? 'status-info' : 'status-warning';
        break;
      case 'public_transport_trackers':
        statusText = device.status || 'On route';
        statusClass = device.status === 'Delayed' ? 'status-alert' : 'status-normal';
        break;
      case 'surveillance_cameras':
        statusText = device.motion_detected ? 'Motion detected' : 'No motion';
        statusClass = device.motion_detected ? 'status-alert' : 'status-normal';
        break;
      case 'water_quality_sensors':
        statusText = device.ph_level ? `pH: ${device.ph_level}` : 'Monitoring';
        statusClass = (device.ph_level < 6.5 || device.ph_level > 8.5) ? 'status-warning' : 'status-normal';
        break;
      case 'energy_grid_sensors':
        statusText = device.status || 'Operational';
        statusClass = device.status === 'Alert' ? 'status-alert' : 'status-normal';
        break;
      default:
        statusText = 'Active';
        statusClass = 'status-normal';
    }
    
    return (
      <span className={`status-badge ${statusClass}`}>
        {statusText}
      </span>
    );
  };

  const renderDeviceMarkers = () => {
    const markers = [];
    
    Object.entries(allDeviceData).forEach(([deviceType, devices]) => {
      // Skip this device type if a specific type is selected and it's not this one
      if (selectedDeviceType && deviceType !== selectedDeviceType) return;
      
      const config = deviceTypes[deviceType];
      
      devices.forEach((device, index) => {
        // Use real coordinates from the device data
        // Fallback to generating coordinates if latitude/longitude not available
        let coordinates;
        if (device.latitude && device.longitude) {
          coordinates = [device.latitude, device.longitude];
        } else {
          // Generate a key for this device
          const deviceKey = `${deviceType}-${device.id}`;
          
          // If we don't have coordinates for this device, generate them
          if (!deviceCoordinates[deviceKey]) {
            // This code only runs the first time we see a device
            const newCoordinates = { ...deviceCoordinates };
            newCoordinates[deviceKey] = generateCoordinates(
              device.id, 
              index + parseInt(deviceType.charCodeAt(0)), 
              devices.length + 5
            );
            setDeviceCoordinates(newCoordinates);
          }
          
          // Use the stored coordinates for this device or generate fallback
          coordinates = deviceCoordinates[deviceKey] || 
            generateCoordinates(device.id, index + parseInt(deviceType.charCodeAt(0)), devices.length + 5);
        }
        
        const deviceKey = `${deviceType}-${device.id}`;
        const isSelected = selectedDevice === deviceKey;
        
        const customIcon = L.divIcon({
          html: `<div style="background-color: ${config.color}; border-radius: 50%; width: ${isSelected ? '28px' : '20px'}; height: ${isSelected ? '28px' : '20px'}; display: flex; align-items: center; justify-content: center; border: ${isSelected ? '3px' : '2px'} solid white; box-shadow: ${isSelected ? '0 0 10px #3b82f6, 0 0 5px #3b82f6' : '0 2px 4px rgba(0,0,0,0.2)'};"></div>`,
          className: 'custom-marker',
          iconSize: [isSelected ? 28 : 20, isSelected ? 28 : 20],
          iconAnchor: [isSelected ? 14 : 10, isSelected ? 14 : 10]
        });

        markers.push(
          <Marker 
            key={`${deviceType}-${device.id}`} 
            position={coordinates} 
            icon={customIcon}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center space-x-2 mb-2">
                  <config.icon className="h-4 w-4" style={{ color: config.color }} />
                  <h3 className="font-semibold text-sm">{config.name}</h3>
                </div>
                <div className="text-xs space-y-1">
                  <p><strong>Location:</strong> {device.location}</p>
                  <p><strong>ID:</strong> {device.id.slice(0, 8)}...</p>
                  <p><strong>Last Update:</strong> {new Date(device.timestamp).toLocaleTimeString()}</p>
                  
                  {/* Device-specific data */}
                  {deviceType === 'traffic_sensors' && (
                    <>
                      <p><strong>Vehicles:</strong> {device.vehicle_count}</p>
                      <p><strong>Avg Speed:</strong> {device.avg_speed} km/h</p>
                    </>
                  )}
                  {deviceType === 'air_quality_sensors' && (
                    <>
                      <p><strong>PM2.5:</strong> {device.pm25} μg/m³</p>
                      <p><strong>PM10:</strong> {device.pm10} μg/m³</p>
                    </>
                  )}
                  {deviceType === 'weather_stations' && (
                    <>
                      <p><strong>Temperature:</strong> {device.temperature}°C</p>
                      <p><strong>Humidity:</strong> {device.humidity}%</p>
                    </>
                  )}
                  {deviceType === 'waste_bins' && (
                    <>
                      <p><strong>Fill Level:</strong> {device.fill_level}%</p>
                    </>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      });
    });
    
    return markers;
  };

  const handleDeviceSelect = (type, device) => {
    setSelectedDeviceType(type);
    setSelectedDevice(`${type}-${device.id}`);
    
    // Get device coordinates
    let coordinates;
    if (device.latitude && device.longitude) {
      coordinates = [device.latitude, device.longitude];
    } else {
      const deviceKey = `${type}-${device.id}`;
      coordinates = deviceCoordinates[deviceKey];
    }
    
    // Update map center if we have coordinates
    if (coordinates) {
      setMapCenter(coordinates);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading city data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-800" style={{background: 'rgba(255,255,255,0.6)', borderRadius: '0.75rem', padding: '0.5rem 1.5rem', width: 'fit-content', margin: '0 auto'}}>City Dashboard</h1>
        <p className="text-slate-600" style={{background: 'rgba(255,255,255,0.6)', borderRadius: '0.75rem', padding: '0.5rem 1.5rem', width: 'fit-content', margin: '0 auto'}}>Real-time monitoring of city infrastructure and IoT devices</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid mb-8">
        <div className="stat-card">
          <div className="stat-value">{getTotalDeviceCount()}</div>
          <div className="stat-label">Total Devices</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <div className="stat-value">{getActiveDevicesCount()}</div>
          <div className="stat-label">Active Devices</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
          <div className="stat-value">{Object.keys(deviceTypes).length}</div>
          <div className="stat-label">Device Types</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
          <div className="stat-value">{lastUpdate.toLocaleTimeString()}</div>
          <div className="stat-label">Last Update</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
  <h2 className="text-xl font-semibold text-slate-800" style={{background: 'rgba(255,255,255,0.6)', borderRadius: '0.75rem', padding: '0.5rem 1.5rem', width: 'fit-content'}}>
          City Map View
          {selectedDeviceType && (
            <span className="ml-2 text-sm font-normal text-blue-600">
              Showing only: {deviceTypes[selectedDeviceType].name}
            </span>
          )}
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setSelectedDeviceType(null); // Reset filter
              setSelectedDevice(null); // Reset selected device
              setMapCenter(CITY_CENTER); // Reset map center
              handleRefresh(); // Use our new handler that triggers the simulator
            }}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>

        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <MapContainer 
          center={CITY_CENTER} 
          zoom={13} 
          className="leaflet-container"
          maxBounds={[
            [40.5, -74.3], // Southwest coordinates
            [40.9, -73.7]  // Northeast coordinates
          ]}
          minZoom={11}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapCenter center={mapCenter} />
          {renderDeviceMarkers()}
        </MapContainer>
      </div>

      {/* Device Type Legend */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Device Types</h3>
          {selectedDeviceType && (
            <button 
              onClick={() => {
                setSelectedDeviceType(null);
                setSelectedDevice(null);
                setMapCenter(CITY_CENTER);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Show All Devices
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(deviceTypes).map(([type, config]) => (
            <div 
              key={type} 
              className={`device-type-card flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors duration-200
                ${selectedDeviceType === type ? 
                  'selected bg-blue-50 border border-blue-200' : 
                  'bg-slate-50 hover:bg-slate-100'}`}
              onClick={() => {
                if (selectedDeviceType === type) {
                  // If already selected, clear the filter
                  setSelectedDeviceType(null);
                  setSelectedDevice(null);
                  setMapCenter(CITY_CENTER);
                } else {
                  // Select new type but clear specific device selection
                  setSelectedDeviceType(type);
                  setSelectedDevice(null);
                }
              }}
            >
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: config.color }}
              ></div>
              <div>
                <div className="flex items-center space-x-2">
                  <config.icon className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">{config.name}</span>
                </div>
                <span className="text-xs text-slate-500">
                  {allDeviceData[type]?.length || 0} devices
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Device List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {selectedDeviceType ? `${deviceTypes[selectedDeviceType].name} List` : 'All Devices'}
          </h3>
          <span className="text-sm text-slate-500">
            {selectedDeviceType ? 
              `${allDeviceData[selectedDeviceType]?.length || 0} devices` : 
              `${getTotalDeviceCount()} total devices`}
          </span>
        </div>
        
        <div className="overflow-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(allDeviceData)
                .filter(([type]) => !selectedDeviceType || type === selectedDeviceType)
                .flatMap(([type, devices]) => 
                  devices.map(device => (
                    <tr 
                      key={`${type}-${device.id}`}
                      className={`device-table-row hover:bg-gray-50 cursor-pointer transition-colors ${selectedDevice === `${type}-${device.id}` ? 'bg-blue-50' : ''}`}
                      onClick={() => handleDeviceSelect(type, device)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
                            {React.createElement(deviceTypes[type].icon, { 
                              className: "h-5 w-5", 
                              style: { color: deviceTypes[type].color } 
                            })}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {deviceTypes[type].name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {device.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {device.location || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderDeviceStatus(type, device)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(device.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;