import axios from "axios";

/**
 * Centralized Axios HTTP Client
 * Configured for session cookies (withCredentials: true), base URL, and standardized error interception.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15000 // 15 second request timeout
});

// Request Interceptor: Attach Bearer token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("banking_token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardizes data unwrapping & error normalization
api.interceptors.response.use(
  (response) => {
    // Unwraps standardized ApiResponse envelope
    return response.data;
  },
  (error) => {
    const errorData = error.response?.data?.error;
    const status = error.response?.status;

    const normalizedError = {
      status: status || 500,
      code: errorData?.code || "NETWORK_ERROR",
      message: errorData?.message || error.message || "Failed to communicate with the banking server",
      details: errorData?.details || null
    };

    // If 401 Unauthorized occurs (session expired or revoked via Blacklist)
    if (status === 401) {
      window.dispatchEvent(
        new CustomEvent("banking:unauthorized", { detail: normalizedError })
      );
    }

    return Promise.reject(normalizedError);
  }
);

export default api;
