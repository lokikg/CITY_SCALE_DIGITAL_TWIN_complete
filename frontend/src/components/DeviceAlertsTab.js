import React, { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert } from "./ui/alert";
import { AlertTriangle, ChevronDown } from "lucide-react";
import axios from "axios";

const DEVICE_CATEGORIES = [
  "traffic_sensors", "air_quality_sensors", "noise_sensors", "weather_stations",
  "smart_meters", "waste_bins", "parking_sensors", "street_lights",
  "public_transport_trackers", "surveillance_cameras", "water_quality_sensors",
  "energy_grid_sensors"
];

const CATEGORY_LABELS = {
  traffic_sensors: "Traffic Sensors",
  air_quality_sensors: "Air Quality Sensors",
  noise_sensors: "Noise Sensors",
  weather_stations: "Weather Stations",
  smart_meters: "Smart Meters",
  waste_bins: "Waste Bins",
  parking_sensors: "Parking Sensors",
  street_lights: "Street Lights",
  public_transport_trackers: "Public Transport Trackers",
  surveillance_cameras: "Surveillance Cameras",
  water_quality_sensors: "Water Quality Sensors",
  energy_grid_sensors: "Energy Grid Sensors"
};

function getAlertStatus(device) {
  // Special handling for street lights based on time
  if (device.__typename === "StreetLight" || (device.energy_consumption !== undefined && device.status !== undefined)) {
    const currentHour = new Date().getHours();
    const shouldBeOn = currentHour >= 18 || currentHour < 6;
    
    // If the light is OFF when it should be ON, or ON when it should be OFF
    if ((shouldBeOn && !device.status) || (!shouldBeOn && device.status)) {
      return "critical";
    }
  }
  
  // Example logic for other device types
  if (device.status === false || device.is_critical || device.aqi_value > 100 || device.grid_health === "Warning") {
    return "critical";
  }
  return "normal";
}

export default function DeviceAlertsTab() {
  const [devices, setDevices] = useState({});
  const [loading, setLoading] = useState(false);
  const [openAccordions, setOpenAccordions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all(
      DEVICE_CATEGORIES.map((cat) =>
        axios.get(`/api/${cat}/all`).then((res) => ({ cat, data: res.data })).catch(() => ({ cat, data: [] }))
      )
    ).then((results) => {
      const grouped = {};
      results.forEach(({ cat, data }) => {
        grouped[cat] = data.filter((d) => getAlertStatus(d) === "critical");
      });
      setDevices(grouped);
      setLoading(false);
    });
  }, []);

  // Calculate total critical devices and categories with alerts
  const totalCriticalDevices = Object.values(devices).reduce(
    (total, deviceList) => total + deviceList.length, 
    0
  );
  const categoriesWithAlerts = Object.entries(devices).filter(
    ([_, deviceList]) => deviceList && deviceList.length > 0
  ).length;
  
  // Filter categories based on search term
  const filteredCategories = searchTerm 
    ? DEVICE_CATEGORIES.filter(cat => 
        CATEGORY_LABELS[cat].toLowerCase().includes(searchTerm.toLowerCase()) ||
        (devices[cat] && devices[cat].some(device => 
          (device.location && device.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (device.id && device.id.toString().includes(searchTerm.toLowerCase()))
        ))
      )
    : DEVICE_CATEGORIES;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 shadow">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Critical Devices</h3>
            <div className="text-3xl font-bold text-blue-600">{totalCriticalDevices}</div>
            <p className="text-sm text-blue-500 mt-1">Across {categoriesWithAlerts} categories</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 shadow">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Alert Categories</h3>
            <div className="text-3xl font-bold text-red-600">{categoriesWithAlerts} / {DEVICE_CATEGORIES.length}</div>
            <p className="text-sm text-red-500 mt-1">{(categoriesWithAlerts / DEVICE_CATEGORIES.length * 100).toFixed(1)}% requiring attention</p>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-5 shadow">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Search Devices</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by location or ID..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-40 animate-pulse text-xl text-gray-400">Loading...</div>
      ) : (
        <div className="accordion" id="device-alerts-accordion">
          {filteredCategories.map((cat) => {
            const isOpen = openAccordions.includes(cat);
            const hasAlerts = devices[cat] && devices[cat].length > 0;
            return (
              <div key={cat} className="accordion-item bg-white rounded-xl shadow mb-4 border border-slate-200">
                <h2 className="accordion-header" id={`heading-${cat}`}>
                  <button
                    className={`accordion-button flex items-center justify-between w-full px-6 py-4 text-lg font-semibold text-slate-800 bg-white rounded-xl transition-all duration-200 ${isOpen ? '' : 'collapsed'} focus:outline-none`}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`collapse-${cat}`}
                    onClick={() => {
                      setOpenAccordions((prev) =>
                        prev.includes(cat)
                          ? prev.filter((c) => c !== cat)
                          : [...prev, cat]
                      );
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {CATEGORY_LABELS[cat]}
                      <Badge className={hasAlerts ? "bg-red-600 text-white px-2 py-0.5 ml-2" : "bg-green-500 text-white px-2 py-0.5 ml-2"}>
                        {hasAlerts ? `${devices[cat].length} Critical` : "Healthy"}
                      </Badge>
                    </span>
                    <ChevronDown className={`ml-2 h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </h2>
                <div
                  id={`collapse-${cat}`}
                  className={`accordion-collapse transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[800px] py-4 px-6' : 'max-h-0 py-0 px-6'}`}
                  aria-labelledby={`heading-${cat}`}
                >
                  {hasAlerts ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {devices[cat].map((device) => (
                        <Card key={device.id} className="p-5 flex flex-col gap-3 border border-red-200 shadow hover:shadow-lg transition duration-200 rounded-xl bg-gradient-to-br from-white via-red-50 to-blue-50" style={{ minHeight: '180px', maxHeight: '220px', overflow: 'auto' }}>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 rounded-full h-8 w-8 shadow">
                              <AlertTriangle className="text-white h-5 w-5" />
                            </span>
                            <div>
                              <div className="font-bold text-lg text-gray-900">{device.location || device.id}</div>
                              <div className="text-xs text-gray-500">ID: {device.id}</div>
                            </div>
                          </div>
                          <Badge className="bg-red-600 text-white px-3 py-1 rounded-full shadow">Critical</Badge>
                          <Alert variant="destructive" className="mt-2 bg-red-50 border-red-200 text-red-700 font-medium shadow">
                            {(device.energy_consumption !== undefined && device.status !== undefined) ? (
                              // Street light specific message
                              <>
                                Street light {device.status ? "ON" : "OFF"} at wrong time. 
                                {new Date().getHours() >= 18 || new Date().getHours() < 6 
                                  ? "Should be ON between 6PM-6AM" 
                                  : "Should be OFF between 6AM-6PM"}
                              </>
                            ) : (
                              // Generic message for other devices
                              "Device not working properly or in critical state."
                            )}
                          </Alert>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <span className="inline-flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-400 rounded-full h-14 w-14 mb-4 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="h-8 w-8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                        </svg>
                      </span>
                      <div className="text-2xl font-semibold text-green-600">No critical alerts for this category.</div>
                      <div className="text-gray-500 mt-2">All devices are healthy and operational.</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
