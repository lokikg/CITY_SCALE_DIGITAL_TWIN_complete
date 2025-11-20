import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, BarChart3, Settings, Zap, AlertTriangle } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="bg-white shadow-lg border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">
              Digital Twin City
            </span>
          </div>
          
          {/* Navigation Links */}
          <div className="flex space-x-1">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/analytics"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/analytics') 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </Link>
            <Link
              to="/devices"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/devices') 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Devices</span>
            </Link>
            <Link
              to="/alerts"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/alerts') 
                  ? 'bg-red-100 text-red-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Device Alerts</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;