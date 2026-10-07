import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { BankingProvider } from "./context/BankingContext";
import AppRoutes from "./routes/AppRoutes";

/**
 * Root Application Component
 * Initializes Routing, Dual-Theme Engine, Global Notifications, Session Auth, and Banking Context Providers.
 */
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <BankingProvider>
              <AppRoutes />
            </BankingProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
