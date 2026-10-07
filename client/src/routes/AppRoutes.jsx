import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import DashboardLayout from "../components/layout/DashboardLayout";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import AccountsPage from "../pages/AccountsPage";
import TransferPage from "../pages/TransferPage";
import TransactionsPage from "../pages/TransactionsPage";
import ProfilePage from "../pages/ProfilePage";
import NotFoundPage from "../pages/NotFoundPage";

/**
 * Master Application Router
 * Configures public routes, guest-only auth routes, and protected routes within DashboardLayout.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Marketing Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Guest-Only Authentication Routes */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      {/* 3. Protected Banking Routes within DashboardLayout Shell */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/transfer" element={<TransferPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* 4. Catch-all fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
