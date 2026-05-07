// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Dashboard/Statistics';
import Complaints from './pages/Complaints';
import Map from './pages/Map';
import Teams from './pages/Teams';
import Employees from './pages/Employees';
import AdminUsers from './pages/AdminUsers';
import Region from './pages/Region';
import Settings from './pages/Settings';
import LogsPage from './pages/Logs';
import LoginPage from './pages/Login';
import ProtectedRoute from './components/common/ProtectedRoute';
import { Toaster } from 'react-hot-toast';


function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        containerStyle={{
          zIndex: 999999,
        }}
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
      <Routes>
        {/* Route Publique */}
        <Route path="/login" element={<LoginPage />} />

        {/* Routes Protégées */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/stats" element={<Statistics />} />
          <Route path="regions" element={<Region />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="map" element={<Map />} />
          <Route path="teams" element={<Teams />} />
          <Route path="employees" element={<Employees />} />
          <Route path="admin-users" element={<AdminUsers />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
