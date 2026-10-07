import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield } from "lucide-react";

/**
 * GuestRoute Guard
 * Prevents authenticated users from accessing login/register, redirecting to /dashboard.
 */
export const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

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
          Verifying credentials...
        </p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default GuestRoute;
