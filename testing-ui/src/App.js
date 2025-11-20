import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import './styles/App.css';
import { ThemeProvider } from './components/ui/theme-provider';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import APITesting from './components/APITesting';
import MQTTTesting from './components/MQTTTesting';
import DatabaseTesting from './components/DatabaseTesting';
import PerformanceTesting from './components/PerformanceTesting';
import E2ETesting from './components/E2ETesting';
import SystemMonitoring from './components/SystemMonitoring';
import TestScenarios from './components/TestScenarios';
import TestRunner from './components/TestRunner';

function App() {
  return (
    <ThemeProvider>
    <div className="App min-h-screen flex flex-col bg-background">
        <BrowserRouter>
          <Navbar />
      <div className="flex-1 container mx-auto p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/api-testing" element={<APITesting />} />
              <Route path="/mqtt-testing" element={<MQTTTesting />} />
              <Route path="/database-testing" element={<DatabaseTesting />} />
              <Route path="/performance-testing" element={<PerformanceTesting />} />
              <Route path="/e2e-testing" element={<E2ETesting />} />
              <Route path="/system-monitoring" element={<SystemMonitoring />} />
              <Route path="/test-scenarios" element={<TestScenarios />} />
              <Route path="/test-runner" element={<TestRunner />} />
            </Routes>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'bg-card text-card-foreground border border-border shadow-md data-[type=success]:border-l-4 data-[type=success]:border-green-500 data-[type=error]:border-l-4 data-[type=error]:border-red-500 data-[type=warning]:border-l-4 data-[type=warning]:border-yellow-500',
                description: 'text-muted-foreground',
                actionButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
                cancelButton: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              },
            }}
          />
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
