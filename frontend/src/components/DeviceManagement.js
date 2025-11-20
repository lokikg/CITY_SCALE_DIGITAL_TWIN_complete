import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Car, Wind, Volume2, Cloud, Zap, Trash2, 
  ParkingCircle, Lightbulb, Bus, Camera, 
  Droplets, Battery, Plus, RefreshCw,
  Edit, Trash, Eye, Search
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { simulatorService } from '../services/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const deviceTypes = {
  traffic_sensors: { 
    icon: Car, 
    color: '#ef4444', 
    name: 'Traffic Sensors',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'vehicle_count', label: 'Vehicle Count', type: 'number' },
      { key: 'avg_speed', label: 'Average Speed (km/h)', type: 'number', step: '0.1' }
    ]
  },
  air_quality_sensors: { 
    icon: Wind, 
    color: '#10b981', 
    name: 'Air Quality',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'pm25', label: 'PM2.5 (μg/m³)', type: 'number', step: '0.1' },
      { key: 'pm10', label: 'PM10 (μg/m³)', type: 'number', step: '0.1' },
      { key: 'no2', label: 'NO2 (μg/m³)', type: 'number', step: '0.1' },
      { key: 'co', label: 'CO (mg/m³)', type: 'number', step: '0.1' }
    ]
  },
  noise_sensors: { 
    icon: Volume2, 
    color: '#f59e0b', 
    name: 'Noise Sensors',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'decibel_level', label: 'Decibel Level (dB)', type: 'number', step: '0.1' }
    ]
  },
  weather_stations: { 
    icon: Cloud, 
    color: '#3b82f6', 
    name: 'Weather Stations',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'temperature', label: 'Temperature (°C)', type: 'number', step: '0.1' },
      { key: 'humidity', label: 'Humidity (%)', type: 'number', step: '0.1' },
      { key: 'rainfall', label: 'Rainfall (mm)', type: 'number', step: '0.1' },
      { key: 'wind_speed', label: 'Wind Speed (km/h)', type: 'number', step: '0.1' }
    ]
  },
  smart_meters: { 
    icon: Zap, 
    color: '#8b5cf6', 
    name: 'Smart Meters',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'electricity_usage', label: 'Electricity Usage (kWh)', type: 'number', step: '0.01' },
      { key: 'water_usage', label: 'Water Usage (L)', type: 'number', step: '0.01' }
    ]
  },
  waste_bins: { 
    icon: Trash2, 
    color: '#6b7280', 
    name: 'Waste Bins',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'fill_level', label: 'Fill Level (%)', type: 'number', step: '0.1' },
      { key: 'temperature', label: 'Temperature (°C)', type: 'number', step: '0.1' }
    ]
  },
  parking_sensors: { 
    icon: ParkingCircle, 
    color: '#ec4899', 
    name: 'Parking Sensors',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'is_occupied', label: 'Occupied', type: 'checkbox' }
    ]
  },
  street_lights: { 
    icon: Lightbulb, 
    color: '#f97316', 
    name: 'Street Lights',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'energy_consumption', label: 'Energy Consumption (W)', type: 'number', step: '0.01' }
      // Status is removed as it's automatically determined based on time (ON from 6PM-6AM, OFF from 6AM-6PM)
    ]
  },
  public_transport_trackers: { 
    icon: Bus, 
    color: '#06b6d4', 
    name: 'Public Transport',
    fields: [
      { key: 'bus_id', label: 'Bus ID', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'occupancy', label: 'Occupancy', type: 'number' }
    ]
  },
  surveillance_cameras: { 
    icon: Camera, 
    color: '#dc2626', 
    name: 'Surveillance',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'motion_detected', label: 'Motion Detected', type: 'checkbox' },
      { key: 'object_count', label: 'Object Count', type: 'number' }
    ]
  },
  water_quality_sensors: { 
    icon: Droplets, 
    color: '#0891b2', 
    name: 'Water Quality',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'ph', label: 'pH Level', type: 'number', step: '0.1' },
      { key: 'turbidity', label: 'Turbidity (NTU)', type: 'number', step: '0.1' },
      { key: 'dissolved_oxygen', label: 'Dissolved Oxygen (mg/L)', type: 'number', step: '0.1' }
    ]
  },
  energy_grid_sensors: { 
    icon: Battery, 
    color: '#65a30d', 
    name: 'Energy Grid',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'voltage', label: 'Voltage (V)', type: 'number', step: '0.1' },
      { key: 'current', label: 'Current (A)', type: 'number', step: '0.1' },
      { key: 'frequency', label: 'Frequency (Hz)', type: 'number', step: '0.01' }
    ]
  }
};

const DeviceManagement = () => {
  const [selectedDeviceType, setSelectedDeviceType] = useState('traffic_sensors');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState({ tested: false, working: false, message: 'Not tested' });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({});

  // A function to test the API connectivity
  const testConnection = async () => {
    setApiStatus({ tested: true, working: false, message: 'Testing connection...' });
    
    try {
      console.log('Testing API GET connection...');
      const getResponse = await axios.get(`${BACKEND_URL}/api/health`);
      console.log('API GET connection test successful:', getResponse.data);
      
      setApiStatus({ 
        tested: true, 
        working: true, 
        message: 'GET /api/health: Success' 
      });

      // Test PUT request - first let's get a device to update
      console.log('Testing a direct PUT request...');
      
      try {
        // First try the basic axios PUT request
        const testUrl = `${API}/${selectedDeviceType}/test-put`;
        const testData = { test: true };
        
        // Try with fetch first
        console.log('Testing PUT with fetch API...');
        const fetchResponse = await fetch(`${API}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (fetchResponse.ok) {
          console.log('Fetch GET test successful:', await fetchResponse.json());
          setApiStatus(prev => ({ 
            ...prev, 
            message: prev.message + '\nFetch GET test: Success' 
          }));
        } else {
          console.error('Fetch GET test failed:', fetchResponse.status);
          setApiStatus(prev => ({ 
            ...prev, 
            message: prev.message + `\nFetch GET test: Failed (${fetchResponse.status})` 
          }));
        }
        
        // Now try a test with axios to a different endpoint
        console.log('Testing with axios to different endpoint...');
        const corsTestUrl = `${BACKEND_URL}/`;
        const corsResponse = await axios.get(corsTestUrl);
        console.log('Root endpoint test successful:', corsResponse.data);
        
        setApiStatus(prev => ({ 
          ...prev, 
          message: prev.message + `\nGET /: Success` 
        }));
        
        alert(`API connection tests completed:\n- GET /api/health: Success\n- GET /: ${corsResponse.status === 200 ? 'Success' : 'Failed'}`);
      } catch (putError) {
        console.error('PUT test failed:', putError);
        setApiStatus(prev => ({ 
          ...prev, 
          message: prev.message + `\nPUT test: Failed - ${putError.message}` 
        }));
        alert(`API GET connection successful, but PUT test failed: ${putError.message}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      
      let errorMessage = 'Unknown error';
      if (error.response) {
        errorMessage = `Server responded with ${error.response.status}`;
      } else if (error.request) {
        errorMessage = `No response from server at ${BACKEND_URL}`;
      } else {
        errorMessage = error.message;
      }
      
      setApiStatus({ 
        tested: true, 
        working: false, 
        message: `Connection failed: ${errorMessage}` 
      });
      
      alert(`API connection failed: ${errorMessage}`);
      return false;
    }
  };

  const fetchDevices = async (deviceType) => {
    setLoading(true);
    try {
      console.log(`Fetching ${deviceType} from ${API}/${deviceType}/all`);
      const response = await axios.get(`${API}/${deviceType}/all`);
      console.log(`Received ${response.data.length} ${deviceType}:`, response.data);
      setDevices(response.data);
    } catch (error) {
      console.error(`Error fetching ${deviceType}:`, error);
      setDevices([]);
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
        fetchDevices(selectedDeviceType);
      }, 2000);
    } catch (error) {
      console.error("Failed to trigger data simulation:", error);
      // Still try to fetch data even if simulation trigger fails
      fetchDevices(selectedDeviceType);
    }
  };
  
  const testApiConnection = async () => {
    setApiStatus({ tested: true, working: false, message: 'Testing...' });
    try {
      // Try a simple GET request to the backend
      const response = await axios.get(`${API}/ping`);
      setApiStatus({ 
        tested: true, 
        working: true, 
        message: `Connected successfully: ${response.data.message || 'API is running'}` 
      });
    } catch (error) {
      console.error('API connection test failed:', error);
      let errorMessage = 'Unknown error';
      
      if (error.response) {
        // The server responded, but with an error status
        errorMessage = `Server responded with ${error.response.status}`;
        // Even though we got an error status, the API is still working
        setApiStatus({ 
          tested: true, 
          working: true, 
          message: `API is running but returned error: ${errorMessage}` 
        });
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = `No response from server at ${BACKEND_URL}`;
        setApiStatus({ tested: true, working: false, message: errorMessage });
      } else {
        // Something happened in setting up the request
        errorMessage = error.message;
        setApiStatus({ tested: true, working: false, message: errorMessage });
      }
    }
  };



  // Function to handle form submissions (add only, update disabled)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingDevice) {
        // Block update functionality
        alert('Update functionality has been disabled by the administrator.');
        setShowAddForm(false);
        setEditingDevice(null);
        setFormData({});
      } else {
        // This is a new device - allow this to proceed
        const dataToSubmit = { ...formData };
        
        // For street lights, automatically set status based on current time
        if (selectedDeviceType === 'street_lights') {
          const currentHour = new Date().getHours();
          dataToSubmit.status = (currentHour >= 18 || currentHour < 6);
        }
        
        await axios.post(`${API}/${selectedDeviceType}/add`, dataToSubmit);
        setShowAddForm(false);
        setEditingDevice(null);
        setFormData({});
        await fetchDevices(selectedDeviceType);
      }
    } catch (error) {
      console.error('Error saving device:', error);
      alert(`Unable to add device. Please try again later.`);
    }
  };

  const startEdit = (device) => {
    console.log('Edit functionality disabled');
    alert('Edit functionality has been disabled by the administrator.');
  };

  const startAdd = () => {
    setEditingDevice(null);
    setFormData({});
    setShowAddForm(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [field]: value
      };
      
      // Ensure ID is preserved if we're editing
      if (editingDevice && editingDevice.id && !updatedData.id) {
        updatedData.id = editingDevice.id;
      }
      
      return updatedData;
    });
  };

  useEffect(() => {
    fetchDevices(selectedDeviceType);
  }, [selectedDeviceType]);

  const filteredDevices = devices.filter(device =>
    device.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentDeviceConfig = deviceTypes[selectedDeviceType];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-800" style={{background: 'rgba(255,255,255,0.6)', borderRadius: '0.75rem', padding: '0.5rem 1.5rem', width: 'fit-content', margin: '0 auto'}}>Device Management</h1>
        <p className="text-slate-600" style={{background: 'rgba(255,255,255,0.6)', borderRadius: '0.75rem', padding: '0.5rem 1.5rem', width: 'fit-content', margin: '0 auto'}}>Manage and monitor your IoT devices across the city</p>
      </div>

      {/* Device Type Tabs */}
      <Tabs value={selectedDeviceType} onValueChange={setSelectedDeviceType} className="mb-8">
        <TabsList className="grid grid-cols-4 lg:grid-cols-6 w-full h-auto p-1 bg-slate-100 rounded-lg">
          {Object.entries(deviceTypes).map(([type, config]) => (
            <TabsTrigger
              key={type}
              value={type}
              className="flex flex-col items-center space-y-1 p-3 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <config.icon className="h-4 w-4" style={{ color: config.color }} />
              <span className="hidden sm:block">{config.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedDeviceType} className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <CardTitle className="flex items-center space-x-3">
                  <currentDeviceConfig.icon 
                    className="h-6 w-6" 
                    style={{ color: currentDeviceConfig.color }} 
                  />
                  <span>{currentDeviceConfig.name}</span>
                  <Badge variant="secondary">{devices.length} devices</Badge>
                </CardTitle>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  
                  <Button 
                    onClick={testConnection}
                    variant="outline"
                    size="sm"
                  >
                    Test API
                  </Button>
                  
                  <Button onClick={startAdd} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Device
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* API Status Display */}
            {apiStatus.tested && (
              <div className={`px-6 py-2 mb-4 text-sm border ${apiStatus.working ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${apiStatus.working ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">{apiStatus.working ? 'API Connected' : 'API Connection Failed'}</span>
                </div>
                <div className="mt-1 ml-4 text-xs whitespace-pre-line">{apiStatus.message}</div>
              </div>
            )}

            <CardContent>
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search devices by location or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Add/Edit Form */}
              {showAddForm && (
                <Card className="mb-6 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingDevice ? 'Edit Device' : 'Add New Device'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Hidden field for ID when editing */}
                      {editingDevice && editingDevice.id && (
                        <input 
                          type="hidden" 
                          id="id" 
                          name="id" 
                          value={formData.id || editingDevice.id} 
                        />
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedDeviceType === 'street_lights' && (
                          <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
                            <div className="flex items-start space-x-2">
                              <div className="mt-0.5">
                                <Lightbulb className="h-5 w-5 text-amber-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-amber-800">Street Light Status is Time-Based</p>
                                <p className="text-xs text-amber-700 mt-1">
                                  Street lights are automatically turned ON from 6PM to 6AM and OFF from 6AM to 6PM. 
                                  Status cannot be manually set.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {currentDeviceConfig.fields.map(field => (
                          <div key={field.key}>
                            <label htmlFor={field.key} className="block text-sm font-medium text-slate-700 mb-1">
                              {field.label}
                            </label>
                            {field.type === 'checkbox' ? (
                              <input
                                type="checkbox"
                                id={field.key}
                                checked={formData[field.key] || false}
                                onChange={(e) => handleInputChange(field.key, e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-slate-300"
                              />
                            ) : (
                              <Input
                                type={field.type}
                                id={field.key}
                                step={field.step}
                                value={formData[field.key] || ''}
                                onChange={(e) => handleInputChange(field.key, 
                                  field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                                )}
                                required
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2 pt-4">
                        <Button 
                          type="submit"
                          disabled={!!editingDevice}
                          className={editingDevice ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          {editingDevice ? 'Update Disabled' : 'Add Device'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowAddForm(false);
                            setEditingDevice(null);
                            setFormData({});
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Devices List */}
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-slate-600">Loading devices...</p>
                </div>
              ) : filteredDevices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDevices.map(device => (
                    <Card key={device.id} className="device-card">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <currentDeviceConfig.icon 
                              className="h-5 w-5" 
                              style={{ color: currentDeviceConfig.color }} 
                            />
                            <Badge variant="outline" className="text-xs">
                              {device.id.slice(0, 8)}...
                            </Badge>
                          </div>
                          {/* Edit button removed */}
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Location</p>
                            <p className="text-sm text-slate-600">{device.location}</p>
                          </div>
                          
                          {/* Device-specific data display */}
                          {selectedDeviceType === 'street_lights' ? (
                            <>
                              <div>
                                <p className="text-xs font-medium text-slate-500">Energy Consumption</p>
                                <p className="text-sm text-slate-700">{device.energy_consumption} W</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500">Current Status</p>
                                <p className="text-sm text-slate-700">
                                  {(() => {
                                    const currentHour = new Date().getHours();
                                    const isOn = currentHour >= 18 || currentHour < 6;
                                    return (
                                      <span className={`inline-flex items-center ${isOn ? 'text-green-600' : 'text-slate-600'}`}>
                                        <span className={`h-2 w-2 rounded-full mr-1.5 ${isOn ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                        {isOn ? 'ON (6PM-6AM)' : 'OFF (6AM-6PM)'}
                                      </span>
                                    );
                                  })()}
                                </p>
                              </div>
                            </>
                          ) : (
                            currentDeviceConfig.fields.slice(1, 3).map(field => (
                              <div key={field.key}>
                                <p className="text-xs font-medium text-slate-500">{field.label}</p>
                                <p className="text-sm text-slate-700">
                                  {field.type === 'checkbox' 
                                    ? (device[field.key] ? 'Yes' : 'No')
                                    : device[field.key]
                                  }
                                </p>
                              </div>
                            ))
                          )}
                          
                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-500">
                              Last update: {new Date(device.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <currentDeviceConfig.icon 
                    className="h-12 w-12 text-slate-300 mx-auto mb-4" 
                  />
                  <p className="text-slate-600">
                    {searchTerm ? 'No devices found matching your search.' : 'No devices found.'}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    {!searchTerm && 'Try adding a new device.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeviceManagement;