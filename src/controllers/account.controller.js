const mongoose = require("mongoose");
const Account = require("../models/account.model");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const { generateAccountNumber } = require("../utils/generator");
const { formatCurrency } = require("../utils/currency");
const ACCOUNT_STATUS = require("../constants/accountStatus");
const ledgerService = require("../services/ledger.service");

/**
 * 1. Get all accounts belonging to the authenticated customer
 * GET /api/v1/accounts/me
 */
const getMyAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ user: req.user._id });

    return ApiResponse.success(
      res,
      { accounts },
      "Accounts retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Create an additional account (e.g. CHECKING or secondary SAVINGS)
 * POST /api/v1/accounts
 */
const createAccount = async (req, res, next) => {
  try {
    const { accountType, currency } = req.body;
    const targetType = (accountType || "CHECKING").toUpperCase();
    const targetCurrency = (currency || "USD").toUpperCase();

    // Validate allowed account types
    if (!["SAVINGS", "CHECKING"].includes(targetType)) {
      throw ApiError.badRequest("Account type must be either SAVINGS or CHECKING");
    }

    // Check if user already has an account of this type
    const existingAccount = await Account.findOne({
      user: req.user._id,
      accountType: targetType
    });

    if (existingAccount) {
      throw ApiError.conflict(
        `You already have an active ${targetType} account (${existingAccount.accountNumber})`
      );
    }

    // Create new account with 10-digit number
    const account = await Account.create({
      user: req.user._id,
      accountNumber: generateAccountNumber(),
      accountType: targetType,
      currency: targetCurrency,
      status: ACCOUNT_STATUS.ACTIVE
    });

    return ApiResponse.created(
      res,
      {
        account: {
          id: account._id,
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          currency: account.currency,
          status: account.status
        }
      },
      "Account created successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Deposit Faucet (Test funding an account with initial funds)
 * POST /api/v1/accounts/:accountId/deposit
 */
const depositFaucet = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { amountInCents } = req.body;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw ApiError.badRequest("Invalid account ID format");
    }

    if (!amountInCents || typeof amountInCents !== "number" || !Number.isInteger(amountInCents) || amountInCents <= 0) {
      throw ApiError.badRequest("Deposit amount must be a positive integer in cents");
    }

    const account = await Account.findById(accountId);
    if (!account) {
      throw ApiError.notFound("Account not found");
    }

    // Enforce ownership: Authenticated user must own the account
    if (!account.user.equals(req.user._id)) {
      throw ApiError.forbidden("You do not have permission to deposit to this account");
    }

    if (account.status !== ACCOUNT_STATUS.ACTIVE) {
      throw ApiError.badRequest("Cannot deposit into an inactive or frozen account");
    }

    // Record immutable CREDIT journal entry in Double-Entry Ledger
    const { ledgerEntry, balance } = await ledgerService.recordFaucetDeposit(
      account._id,
      amountInCents,
      "Test Faucet Deposit"
    );

    const formattedBalance = formatCurrency(balance.balanceInCents, account.currency);

    return ApiResponse.success(
      res,
      {
        account: {
          id: account._id,
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          currency: account.currency,
          status: account.status
        },
        ledgerEntryId: ledgerEntry._id,
        depositedAmountInCents: amountInCents,
        balanceInCents: balance.balanceInCents,
        formattedBalance
      },
      "Faucet deposit completed successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Get Account Balance (Derived via MongoDB Aggregation Pipeline: Credits - Debits)
 * GET /api/v1/accounts/:accountId/balance
 */
const getBalance = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw ApiError.badRequest("Invalid account ID format");
    }

    const account = await Account.findById(accountId);
    if (!account) {
      throw ApiError.notFound("Account not found");
    }

    // Enforce Account Ownership
    if (!account.user.equals(req.user._id)) {
      throw ApiError.forbidden("You do not have permission to access this account");
    }

    // Derive balance using MongoDB Aggregation Pipeline
    const balance = await ledgerService.getAccountBalance(account._id);
    const formattedBalance = formatCurrency(balance.balanceInCents, account.currency);

    return ApiResponse.success(
      res,
      {
        accountId: account._id,
        accountNumber: account.accountNumber,
        currency: account.currency,
        balanceInCents: balance.balanceInCents,
        formattedBalance,
        totalCredits: balance.totalCredits,
        totalDebits: balance.totalDebits,
        status: account.status
      },
      "Account balance retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Verify Recipient Account (Safe pre-flight verification before transfer)
 * GET /api/v1/accounts/recipient/:accountNumber
 */
const verifyRecipient = async (req, res, next) => {
  try {
    const { accountNumber } = req.params;

    if (!accountNumber || typeof accountNumber !== "string") {
      throw ApiError.badRequest("Recipient account number is required");
    }

    const trimmedNumber = accountNumber.trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(trimmedNumber);
    const is10Digit = /^\d{10}$/.test(trimmedNumber);

    if (!isObjectId && !is10Digit) {
      throw ApiError.badRequest("Please provide a valid 10-digit recipient account number");
    }

    // Lookup recipient account and populate only User.name
    let account = null;
    if (isObjectId) {
      account = await Account.findById(trimmedNumber).populate("user", "name");
    } else {
      account = await Account.findOne({ accountNumber: trimmedNumber }).populate("user", "name");
    }

    if (!account) {
      throw ApiError.notFound("Recipient account not found");
    }

    // Disallow self-transfer verification
    const accountUserId = account.user?._id || account.user;
    if (accountUserId && accountUserId.equals(req.user._id)) {
      throw ApiError.badRequest("Cannot transfer funds to the same account");
    }

    // Verify account status
    if (account.status !== ACCOUNT_STATUS.ACTIVE) {
      throw ApiError.badRequest("This account is currently unavailable for transfers");
    }

    return ApiResponse.success(
      res,
      {
        account: {
          accountNumber: account.accountNumber,
          accountHolderName: account.user?.name || "Account Holder",
          accountType: account.accountType,
          currency: account.currency
        }
      },
      "Recipient account verified successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyAccounts,
  createAccount,
  depositFaucet,
  getBalance,
  verifyRecipient
};
