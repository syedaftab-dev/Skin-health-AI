import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground font-mono font-bold">
        <div className="animate-pulse">LOADING_SKINAI...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to home if user doesn't have the right role
    const defaultRoute = user.role === 'admin' ? '/admin/dashboard' : (user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
