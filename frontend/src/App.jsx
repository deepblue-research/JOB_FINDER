import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import ResumeUpload from './pages/ResumeUpload';
import JobResults from './pages/JobResults';
import JobDetail from './pages/JobDetail';
import Profile from './pages/Profile';
import ResumeBuilder from './pages/ResumeBuilder';
import Landing from './pages/Landing';
import Home from './pages/Home';
import JDTailor from './pages/JDTailor';
import ATSBooster from './pages/ATSBooster';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          {/* Animated background blobs */}
          <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div className="blob-1" />
            <div className="blob-2" />
          </div>

          {/* App content */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/onboarding" element={
                  <ProtectedRoute><Onboarding /></ProtectedRoute>
                } />
                <Route path="/upload" element={
                  <ProtectedRoute><ResumeUpload /></ProtectedRoute>
                } />
                <Route path="/jobs" element={
                  <ProtectedRoute><JobResults /></ProtectedRoute>
                } />
                <Route path="/jobs/:job_id" element={
                  <ProtectedRoute><JobDetail /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />
                <Route path="/build-resume" element={
                  <ProtectedRoute><ResumeBuilder /></ProtectedRoute>
                } />
                <Route path="/jd-tailor" element={
                  <ProtectedRoute><JDTailor /></ProtectedRoute>
                } />
                <Route path="/ats-booster" element={
                  <ProtectedRoute><ATSBooster /></ProtectedRoute>
                } />
                <Route path="/home" element={
                  <ProtectedRoute><Home /></ProtectedRoute>
                } />
                <Route path="/" element={<Landing />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toast />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
