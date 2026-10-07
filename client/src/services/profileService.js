import api from "./api";

/**
 * Profile & Security Settings API Client Service
 * Interacts with /api/v1/profile for identity updates, credential rotation,
 * cryptographic 4-digit TPIN management, and velocity limits.
 */
export const profileService = {
  /**
   * Retrieve current authenticated user profile, TPIN status, configured limits, live usage, and system ceilings
   * @returns {Promise<Object>}
   */
  async getProfile() {
    const res = await api.get("/profile");
    return res.data;
  },

  /**
   * Update legal display name (mass-assignment protected)
   * @param {Object} payload - { name }
   * @returns {Promise<Object>}
   */
  async updateProfile({ name }) {
    const res = await api.patch("/profile", { name });
    return res.data;
  },

  /**
   * Rotate account password in-session
   * @param {Object} payload - { currentPassword, newPassword, confirmPassword }
   * @returns {Promise<Object>}
   */
  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    const res = await api.patch("/profile/password", {
      currentPassword,
      newPassword,
      confirmPassword
    });
    return res.data;
  },

  /**
   * Configure initial 4-digit Transaction PIN (TPIN)
   * @param {Object} payload - { tpin, confirmTpin }
   * @returns {Promise<{ hasTpin: boolean }>}
   */
  async setTpin({ tpin, confirmTpin }) {
    const res = await api.post("/profile/tpin", { tpin, confirmTpin });
    return res.data;
  },

  /**
   * Rotate/change existing 4-digit Transaction PIN
   * @param {Object} payload - { currentTpin, newTpin, confirmTpin }
   * @returns {Promise<{ hasTpin: boolean }>}
   */
  async changeTpin({ currentTpin, newTpin, confirmTpin }) {
    const res = await api.patch("/profile/tpin", {
      currentTpin,
      newTpin,
      confirmTpin
    });
    return res.data;
  },

  /**
   * Fetch velocity limits, institutional system ceilings, and live spending/receiving usage
   * @returns {Promise<Object>}
   */
  async getLimits() {
    const res = await api.get("/profile/limits");
    return res.data;
  },

  /**
   * Update transfer and/or receiving velocity limits (amounts in integer cents)
   * @param {Object} payload - { transferLimits, receivingLimits }
   * @returns {Promise<Object>}
   */
  async updateLimits({ transferLimits, receivingLimits }) {
    const res = await api.patch("/profile/limits", {
      transferLimits,
      receivingLimits
    });
    return res.data;
  }
};

export default profileService;
