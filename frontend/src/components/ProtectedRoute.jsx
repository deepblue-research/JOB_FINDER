import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children }) => {
  const { token, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  // Check both state and localStorage directly to avoid flicker on initial mount
  const hasToken = token || localStorage.getItem('jm_token');

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;