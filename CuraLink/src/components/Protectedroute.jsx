import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from './authUtils';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}