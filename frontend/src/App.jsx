import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TourProvider } from './context/TourContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TourOverlay from './components/TourOverlay';
import LandingPage from './pages/LandingPage';
import ServicesPage from './pages/ServicesPage';
import CustomerDashboard from './pages/CustomerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Role Guard Component with instant synchronous storage check & tour transition bypass
function RoleRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // If tour is actively navigating between role dashboards, do not redirect to '/'
  if (typeof window !== 'undefined' && window.__tour_target_route__) {
    return children;
  }
  
  const currentUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);
  const currentRole = currentUser?.role;

  if (loading && !currentUser) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Loading profile...</div>;
  }
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TourProvider>
          <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/services" element={<ServicesPage />} />
                
                <Route
                  path="/customer"
                  element={
                    <RoleRoute allowedRoles={['customer', 'admin']}>
                      <CustomerDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/provider"
                  element={
                    <RoleRoute allowedRoles={['provider', 'admin']}>
                      <ProviderDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/technician"
                  element={
                    <RoleRoute allowedRoles={['technician', 'admin']}>
                      <TechnicianDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RoleRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </RoleRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <TourOverlay />
          </div>
        </TourProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
