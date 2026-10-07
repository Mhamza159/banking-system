import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from "react";
import { useAuth } from "./AuthContext";
import { accountService } from "../services/accountService";

const BankingContext = createContext(null);

/**
 * BankingProvider
 * Centralizes banking accounts state, active account selection,
 * multi-account live balance maps, and ledger balance aggregation across the application.
 */
export function BankingProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id || user?.id || null;

  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(() => {
    return localStorage.getItem("banking_active_account_id") || null;
  });
  const activeAccountIdRef = useRef(activeAccountId);

  // Keep ref synchronized with state
  useEffect(() => {
    activeAccountIdRef.current = activeAccountId;
  }, [activeAccountId]);

  const [balance, setBalance] = useState(null);
  const [accountBalances, setAccountBalances] = useState({});
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState(null);

  // Active account resolved from accounts list
  const activeAccount = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;
    if (activeAccountId) {
      const match = accounts.find((a) => (a._id || a.id) === activeAccountId);
      if (match) return match;
    }
    // Default to SAVINGS account if available, otherwise first account
    const savings = accounts.find((a) => a.accountType === "SAVINGS");
    return savings || accounts[0];
  }, [accounts, activeAccountId]);

  /**
   * Fetch real-time derived balance for a given account ID and cache it in accountBalances map.
   * Completely stable callback with zero external state churn.
   */
  const refreshBalance = useCallback(async (targetAccountId = null) => {
    const id = targetAccountId || activeAccountIdRef.current;
    if (!id) {
      setBalance(null);
      return null;
    }

    setLoadingBalance(true);
    try {
      const balanceData = await accountService.getBalance(id);
      // If updating active account, set active balance
      if (!targetAccountId || targetAccountId === activeAccountIdRef.current) {
        setBalance(balanceData);
      }
      setAccountBalances((prev) => ({
        ...prev,
        [id]: balanceData
      }));
      return balanceData;
    } catch (err) {
      console.error(`Failed to load account balance for ${id}:`, err);
      const fallback = {
        balanceInCents: 0,
        formattedBalance: "$0.00",
        totalCredits: 0,
        totalDebits: 0,
        status: "ACTIVE"
      };
      if (!targetAccountId || targetAccountId === activeAccountIdRef.current) {
        setBalance(fallback);
      }
      setAccountBalances((prev) => ({
        ...prev,
        [id]: fallback
      }));
      return fallback;
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  /**
   * Fetch balances for all user accounts in parallel.
   * Stable callback without unstable dependencies.
   */
  const fetchAllBalances = useCallback(async (accountList, targetActiveId = null) => {
    if (!accountList || accountList.length === 0) return {};
    try {
      const results = await Promise.allSettled(
        accountList.map((acc) => {
          const id = acc._id || acc.id;
          return accountService.getBalance(id).then((data) => ({ id, data }));
        })
      );

      const newMap = {};
      results.forEach((res) => {
        if (res.status === "fulfilled" && res.value) {
          newMap[res.value.id] = res.value.data;
        }
      });

      setAccountBalances((prev) => ({ ...prev, ...newMap }));

      const currentActiveId = targetActiveId || activeAccountIdRef.current;
      if (currentActiveId && newMap[currentActiveId]) {
        setBalance(newMap[currentActiveId]);
      }
      return newMap;
    } catch (err) {
      console.error("Error fetching all account balances:", err);
      return {};
    }
  }, []);

  /**
   * Fetch all accounts belonging to the authenticated customer.
   * Only depends on userId and fetchAllBalances (both stable), preventing re-render loops.
   */
  const refreshAccounts = useCallback(async () => {
    if (!userId) {
      setAccounts([]);
      setBalance(null);
      setAccountBalances({});
      return [];
    }

    setLoadingAccounts(true);
    setError(null);
    try {
      const accountsList = await accountService.getMyAccounts();
      setAccounts(accountsList || []);

      // Resolve initial account
      if (accountsList && accountsList.length > 0) {
        const savedId = localStorage.getItem("banking_active_account_id");
        const existing = accountsList.find((a) => (a._id || a.id) === savedId);
        const resolved = existing || accountsList.find((a) => a.accountType === "SAVINGS") || accountsList[0];
        const resolvedId = resolved._id || resolved.id;
        setActiveAccountId(resolvedId);
        activeAccountIdRef.current = resolvedId;
        localStorage.setItem("banking_active_account_id", resolvedId);

        // Fetch balances for all accounts
        await fetchAllBalances(accountsList, resolvedId);
      } else {
        setBalance(null);
        setAccountBalances({});
      }
      return accountsList;
    } catch (err) {
      console.error("Failed to load customer accounts:", err);
      setError(err.message || "Failed to load accounts");
      return [];
    } finally {
      setLoadingAccounts(false);
    }
  }, [userId, fetchAllBalances]);

  /**
   * Switch the active account and immediately fetch its live balance
   */
  const switchActiveAccount = useCallback(async (accountId) => {
    if (!accountId) return;
    setActiveAccountId(accountId);
    activeAccountIdRef.current = accountId;
    localStorage.setItem("banking_active_account_id", accountId);

    setAccountBalances((prev) => {
      if (prev[accountId]) {
        setBalance(prev[accountId]);
      }
      return prev;
    });

    await refreshBalance(accountId);
  }, [refreshBalance]);

  /**
   * Deposit into any specified account, falling back to the active account
   */
  const depositToAccount = useCallback(async (accountId, amountInCents) => {
    const targetId = accountId || activeAccountIdRef.current;
    if (!targetId) {
      throw new Error("No target bank account selected for deposit");
    }
    const result = await accountService.depositFaucet(targetId, amountInCents);
    await refreshBalance(targetId);
    return result;
  }, [refreshBalance]);

  /**
   * Deposit into active account (convenience alias)
   */
  const depositFaucet = useCallback(async (amountInCents) => {
    return depositToAccount(activeAccountIdRef.current, amountInCents);
  }, [depositToAccount]);

  /**
   * Create an additional checking or savings account
   */
  const createAccount = useCallback(async ({ accountType, currency = "USD" }) => {
    const newAccount = await accountService.createAccount({ accountType, currency });
    await refreshAccounts();
    if (newAccount?._id || newAccount?.id) {
      await switchActiveAccount(newAccount._id || newAccount.id);
    }
    return newAccount;
  }, [refreshAccounts, switchActiveAccount]);

  /**
   * Full state reload (both accounts list & active account balance)
   */
  const refreshAll = useCallback(async () => {
    await refreshAccounts();
  }, [refreshAccounts]);

  // Initial bootstrap when user is authenticated - runs ONLY when userId changes
  useEffect(() => {
    if (userId) {
      refreshAccounts();
    } else {
      setAccounts([]);
      setActiveAccountId(null);
      activeAccountIdRef.current = null;
      setBalance(null);
      setAccountBalances({});
      localStorage.removeItem("banking_active_account_id");
    }
  }, [userId, refreshAccounts]);

  // Calculate total assets across all user accounts in cents
  const totalAssetsInCents = useMemo(() => {
    let total = 0;
    accounts.forEach((acc) => {
      const id = acc._id || acc.id;
      const b = accountBalances[id];
      if (b && typeof b.balanceInCents === "number") {
        total += b.balanceInCents;
      }
    });
    return total;
  }, [accounts, accountBalances]);

  const value = useMemo(() => ({
    accounts,
    activeAccount,
    activeAccountId,
    balance,
    accountBalances,
    totalAssetsInCents,
    loadingAccounts,
    loadingBalance,
    error,
    setActiveAccountId: switchActiveAccount,
    refreshAccounts,
    refreshBalance,
    refreshAll,
    depositToAccount,
    depositFaucet,
    createAccount
  }), [
    accounts,
    activeAccount,
    activeAccountId,
    balance,
    accountBalances,
    totalAssetsInCents,
    loadingAccounts,
    loadingBalance,
    error,
    switchActiveAccount,
    refreshAccounts,
    refreshBalance,
    refreshAll,
    depositToAccount,
    depositFaucet,
    createAccount
  ]);

  return (
    <BankingContext.Provider value={value}>
      {children}
    </BankingContext.Provider>
  );
}

/**
 * Hook to access banking context
 */
export function useBanking() {
  const context = useContext(BankingContext);
  if (!context) {
    throw new Error("useBanking must be used within a BankingProvider");
  }
  return context;
}

export default BankingContext;
