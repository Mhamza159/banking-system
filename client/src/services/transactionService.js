import api from "./api";

/**
 * Transaction Service
 * Manages atomic money transfers with Idempotency Key protection,
 * historical ledger queries, and single receipt inspection.
 */
export const transactionService = {
  /**
   * Execute an atomic money transfer between accounts.
   * Injects an RFC 4122 UUID v4 Idempotency-Key header for duplicate-submission safety.
   * @param {Object} payload - { senderAccountId, receiverAccountId, amountInCents, description, tpin }
   * @param {string} [idempotencyKey] - UUID v4 key
   * @returns {Promise<Object>} Transfer result with transaction receipt & updated sender balance
   */
  async transfer(payload, idempotencyKey) {
    const headers = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    const res = await api.post("/transactions/transfer", payload, { headers });
    return res.data;
  },

  /**
   * Retrieve paginated transaction history for the authenticated user.
   * Supports both legacy signature getHistory(page, limit) and params object { page, limit, status, accountId }.
   * @param {number|Object} [params=1]
   * @param {number} [limit=10]
   * @returns {Promise<{ transactions: Array<Object>, pagination: Object }>}
   */
  async getHistory(params = 1, limitParam = 10) {
    let page = 1;
    let limit = 10;
    let status = null;
    let accountId = null;

    if (typeof params === "number") {
      page = params;
      limit = limitParam || 10;
    } else if (params && typeof params === "object") {
      page = params.page || 1;
      limit = params.limit || 10;
      status = params.status;
      accountId = params.accountId;
    }

    const query = new URLSearchParams();
    query.set("page", page);
    query.set("limit", limit);
    if (status && status !== "ALL") {
      query.set("status", status);
    }
    if (accountId) {
      query.set("accountId", accountId);
    }

    const res = await api.get(`/transactions/history?${query.toString()}`);
    return res.data;
  },

  /**
   * Retrieve single transaction receipt details by ID.
   * @param {string} id - Transaction MongoDB ObjectId
   * @returns {Promise<{ transaction: Object }>}
   */
  async getTransactionById(id) {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
  }
};

export default transactionService;
