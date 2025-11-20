import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";
import DeviceManagement from "./components/DeviceManagement";
import DeviceAlertsTab from "./components/DeviceAlertsTab";
import Navbar from "./components/Navbar";

function App() {
  return (
    <div className="App" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: -1,
        }}
      >
        <source src={process.env.PUBLIC_URL + '/background.mp4'} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <BrowserRouter>
        <Navbar />
        <div className="min-h-screen" style={{ background: 'transparent' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/devices" element={<DeviceManagement />} />
            <Route path="/alerts" element={<DeviceAlertsTab />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;