import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

// Mock axios
jest.mock('axios');
const mockedAxios = require('axios');

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: () => <div data-testid="marker" />,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>
}));

// Mock leaflet
jest.mock('leaflet', () => ({
  divIcon: jest.fn(() => ({ options: {} })),
  Icon: {
    Default: {
      prototype: { _getIconUrl: jest.fn() },
      mergeOptions: jest.fn()
    }
  }
}));

const mockDeviceData = {
  traffic_sensors: [
    {
      id: 'test-traffic-1',
      location: 'Test Location',
      vehicle_count: 50,
      avg_speed: 35.5,
      timestamp: '2024-01-15T10:30:00Z'
    }
  ],
  air_quality_sensors: [
    {
      id: 'test-air-1',
      location: 'Test Park',
      pm25: 25.5,
      pm10: 45.0,
      no2: 30.0,
      co: 5.5,
      timestamp: '2024-01-15T10:30:00Z'
    }
  ]
};

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset mocks
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
  });

  test('renders dashboard title and description', () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    
    renderDashboard();
    
    expect(screen.getByText('City Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Real-time monitoring of city infrastructure and IoT devices')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderDashboard();
    
    expect(screen.getByText('Loading city data...')).toBeInTheDocument();
  });

  test('renders map container', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  test('displays stats cards with device counts', async () => {
    // Mock API responses for different device types
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('traffic_sensors')) return Promise.resolve({ data: mockDeviceData.traffic_sensors });
      if (url.includes('air_quality_sensors')) return Promise.resolve({ data: mockDeviceData.air_quality_sensors });
      return Promise.resolve({ data: [] });
    });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Total Devices')).toBeInTheDocument();
      expect(screen.getByText('Active Devices')).toBeInTheDocument();
      expect(screen.getByText('Device Types')).toBeInTheDocument();
      expect(screen.getByText('Last Update')).toBeInTheDocument();
    });
  });

  test('handles simulate all button click', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValue({ data: { message: 'Success' } });
    
    renderDashboard();
    
    await waitFor(() => {
      const simulateButton = screen.getByText('Simulate All');
      expect(simulateButton).toBeInTheDocument();
    });

    const simulateButton = screen.getByText('Simulate All');
    fireEvent.click(simulateButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/simulate_all')
      );
    });
  });

  test('handles refresh button click', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    
    renderDashboard();
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Should trigger additional API calls
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(24); // 12 device types x 2 calls
    });
  });

  test('displays device type legend', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Device Types')).toBeInTheDocument();
      expect(screen.getByText('Traffic Sensors')).toBeInTheDocument();
      expect(screen.getByText('Air Quality')).toBeInTheDocument();
      expect(screen.getByText('Noise Sensors')).toBeInTheDocument();
    });
  });

  test('displays City Map View section', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('City Map View')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));
    
    renderDashboard();
    
    // Should not crash and should eventually show the interface
    await waitFor(() => {
      expect(screen.getByText('City Dashboard')).toBeInTheDocument();
    });
  });
});