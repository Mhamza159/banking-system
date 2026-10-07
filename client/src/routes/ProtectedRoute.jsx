import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield } from "lucide-react";

/**
 * ProtectedRoute Guard
 * Directs unauthenticated users to /login, preserving their intended destination in location.state.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center animate-pulse">
            <Shield className="w-8 h-8 text-brand-accent" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-brand-accent/30 border-t-brand-accent animate-spin" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-400 tracking-wide">
          Verifying secure session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
