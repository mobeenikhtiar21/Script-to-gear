import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import RoleSelection from './pages/RoleSelection';
import FilmmakerDashboard from './pages/FilmmakerDashboard';
import RentalHouseDashboard from './pages/RentalHouseDashboard';
import CreateProject from './pages/CreateProject';
import ProjectDetail from './pages/ProjectDetail';
import SavedProjects from './pages/SavedProjects';
import BrowseGear from './pages/BrowseGear';
import ManageGear from './pages/ManageGear';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import PaymentSuccess from './pages/PaymentSuccess';
import ProtectedRoute from './components/ProtectedRoute';

export default function AppRouter() {
  const location = useLocation();
  
  // CRITICAL: Check URL fragment for session_id synchronously during render
  // This prevents race conditions by processing new session_id FIRST
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/select-role" element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />
      
      {/* Filmmaker Routes */}
      <Route path="/filmmaker/dashboard" element={<ProtectedRoute><FilmmakerDashboard /></ProtectedRoute>} />
      <Route path="/filmmaker/create-project" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
      <Route path="/filmmaker/projects" element={<ProtectedRoute><SavedProjects /></ProtectedRoute>} />
      <Route path="/filmmaker/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/filmmaker/browse-gear" element={<ProtectedRoute><BrowseGear /></ProtectedRoute>} />
      <Route path="/filmmaker/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
      <Route path="/filmmaker/leads/:leadId" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
      
      {/* Rental House Routes */}
      <Route path="/rental-house/dashboard" element={<ProtectedRoute><RentalHouseDashboard /></ProtectedRoute>} />
      <Route path="/rental-house/gear" element={<ProtectedRoute><ManageGear /></ProtectedRoute>} />
      <Route path="/rental-house/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
      <Route path="/rental-house/leads/:leadId" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
      
      {/* Shared Routes */}
      <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
    </Routes>
  );
}