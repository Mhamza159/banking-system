import api from "./api";

/**
 * Account Service
 * Provides API communication for multi-account management,
 * double-entry ledger balance derivations, and test faucet deposits.
 */
export const accountService = {
  /**
   * Retrieve all bank accounts belonging to the authenticated customer.
   * @returns {Promise<Array<Object>>} List of account objects
   */
  async getMyAccounts() {
    const res = await api.get("/accounts/me");
    return res.data?.accounts || [];
  },

  /**
   * Provision an additional checking or savings account.
   * @param {Object} params
   * @param {"SAVINGS"|"CHECKING"} params.accountType
   * @param {string} [params.currency="USD"]
   * @returns {Promise<Object>} Created account object
   */
  async createAccount({ accountType = "CHECKING", currency = "USD" }) {
    const res = await api.post("/accounts", { accountType, currency });
    return res.data?.account || res.data;
  },

  /**
   * Deposit test funds into an account via sandbox faucet.
   * @param {string} accountId - Target Account MongoDB ObjectId
   * @param {number} amountInCents - Positive integer amount in cents
   * @returns {Promise<{ account: Object, ledgerEntryId: string, depositedAmountInCents: number, balanceInCents: number, formattedBalance: string }>}
   */
  async depositFaucet(accountId, amountInCents) {
    const res = await api.post(`/accounts/${accountId}/deposit`, { amountInCents });
    return res.data;
  },

  /**
   * Fetch real-time derived balance calculated via MongoDB Aggregation Pipeline ($Credits - $Debits).
   * @param {string} accountId - Target Account MongoDB ObjectId
   * @returns {Promise<{ accountId: string, accountNumber: string, currency: string, balanceInCents: number, formattedBalance: string, totalCredits: number, totalDebits: number, status: string }>}
   */
  async getBalance(accountId) {
    const res = await api.get(`/accounts/${accountId}/balance`);
    return res.data;
  },

  /**
   * Verify destination recipient account before proceeding with money transfer.
   * @param {string} accountNumber - 10-digit destination account number or ObjectId
   * @returns {Promise<{ account: { accountNumber: string, accountHolderName: string, accountType: string, currency: string } }>}
   */
  async verifyRecipient(accountNumber) {
    const res = await api.get(`/accounts/recipient/${accountNumber}`);
    return res.data;
  }
};

export default accountService;
