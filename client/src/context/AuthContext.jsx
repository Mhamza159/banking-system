import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cold-start session hydration from /auth/me
  const initAuth = useCallback(async () => {
    try {
      // If we don't have a token or cookie, we can still attempt getProfile()
      const data = await authService.getProfile();
      if (data?.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    // 1. Listen for global 401 Unauthorized events from api.js response interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("banking_token");
    };

    // 2. Cross-tab logout synchronization
    const handleStorageChange = (e) => {
      if (e.key === "banking:logout") {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener("banking:unauthorized", handleUnauthorized);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("banking:unauthorized", handleUnauthorized);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [initAuth]);

  /**
   * Log in customer with email and password
   */
  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password });
    if (data?.user) {
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  /**
   * Register customer and receive auto-provisioned savings account
   */
  const register = async ({ name, email, password }) => {
    const data = await authService.register({ name, email, password });
    if (data?.user) {
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  /**
   * Log out customer and revoke session on server
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Logout error handled:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Manually re-fetch latest profile state
   */
  const refreshProfile = async () => {
    try {
      const data = await authService.getProfile();
      if (data?.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
