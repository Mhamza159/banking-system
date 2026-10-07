import api from "./api";

/**
 * Authentication Service
 * Handles customer registration, credential verification, session hydration, and session revocation.
 */
export const authService = {
  /**
   * Register a new customer
   * Automatically triggers backend auto-provisioning of a 10-digit Savings Account.
   * @param {Object} credentials - { name, email, password }
   * @returns {Promise<{ user: Object, account: Object, token: string }>}
   */
  async register({ name, email, password }) {
    const res = await api.post("/auth/register", { name, email, password });
    if (res.data?.token) {
      localStorage.setItem("banking_token", res.data.token);
    }
    return res.data;
  },

  /**
   * Authenticate customer with email and password
   * Issues HttpOnly cookie and JWT token.
   * @param {Object} credentials - { email, password }
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async login({ email, password }) {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.token) {
      localStorage.setItem("banking_token", res.data.token);
    }
    return res.data;
  },

  /**
   * Retrieve current authenticated user profile
   * Used for cold-start session hydration on page refresh.
   * @returns {Promise<{ user: Object }>}
   */
  async getProfile() {
    const res = await api.get("/auth/me");
    return res.data;
  },

  /**
   * Terminate current session
   * Clears HttpOnly cookie and blacklists JWT token on server.
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("banking_token");
      // Fire storage event for cross-tab synchronization
      localStorage.setItem("banking:logout", Date.now().toString());
    }
  }
};

export default authService;
