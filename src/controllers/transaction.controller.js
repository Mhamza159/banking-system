const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const Account = require("../models/account.model");
const User = require("../models/user.model");
const Ledger = require("../models/ledger.model");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const ledgerService = require("../services/ledger.service");
const velocityService = require("../services/velocity.service");
const SYSTEM_LIMITS = require("../constants/limits");
const { formatCurrency } = require("../utils/currency");
const ACCOUNT_STATUS = require("../constants/accountStatus");
const emailService = require("../services/email.service");

/**
 * 1. Execute Atomic Money Transfer with Idempotency Protection
 * POST /api/v1/transactions/transfer
 * Headers: Idempotency-Key: <unique-uuid>
 */
const transfer = async (req, res, next) => {
  let session = null;
  try {
    const idempotencyKey = req.headers["idempotency-key"] || req.headers["Idempotency-Key"];

    if (!idempotencyKey || typeof idempotencyKey !== "string" || !idempotencyKey.trim()) {
      throw ApiError.badRequest("Idempotency-Key header is required for transfers");
    }

    const trimmedKey = idempotencyKey.trim();

    // 1. Check Idempotency Key deduplication
    const existingTransaction = await Transaction.findOne({ idempotencyKey: trimmedKey })
      .populate({
        path: "senderAccount",
        select: "accountNumber accountType currency user",
        populate: { path: "user", select: "name email" }
      })
      .populate({
        path: "receiverAccount",
        select: "accountNumber accountType currency user",
        populate: { path: "user", select: "name email" }
      });

    if (existingTransaction) {
      if (existingTransaction.status === "COMPLETED") {
        const cachedSender = existingTransaction.senderAccount || {};
        const cachedReceiver = existingTransaction.receiverAccount || {};
        return ApiResponse.success(
          res,
          {
            cached: true,
            transaction: {
              id: existingTransaction._id,
              idempotencyKey: existingTransaction.idempotencyKey,
              amountInCents: existingTransaction.amount,
              formattedAmount: formatCurrency(existingTransaction.amount, existingTransaction.currency),
              currency: existingTransaction.currency,
              senderAccount: cachedSender.accountNumber || "—",
              receiverAccount: cachedReceiver.accountNumber || "—",
              sender: {
                accountNumber: cachedSender.accountNumber || "—",
                accountHolderName: cachedSender.user?.name || "Account Holder",
                accountType: cachedSender.accountType || "CHECKING",
                currency: cachedSender.currency || existingTransaction.currency
              },
              receiver: {
                accountNumber: cachedReceiver.accountNumber || "—",
                accountHolderName: cachedReceiver.user?.name || "Beneficiary",
                accountType: cachedReceiver.accountType || "SAVINGS",
                currency: cachedReceiver.currency || existingTransaction.currency
              },
              status: existingTransaction.status,
              createdAt: existingTransaction.createdAt
            }
          },
          "Transaction previously completed (cached receipt)",
          200
        );
      }

      if (existingTransaction.status === "PENDING") {
        throw ApiError.conflict("A transaction with this Idempotency-Key is currently in progress");
      }
    }

    const { senderAccountId, receiverAccountId, amountInCents, description } = req.body;

    // 2. Validate Inputs
    if (!senderAccountId || !receiverAccountId || amountInCents === undefined || amountInCents === null) {
      throw ApiError.badRequest("senderAccountId, receiverAccountId, and amountInCents are required");
    }

    if (!mongoose.Types.ObjectId.isValid(senderAccountId)) {
      throw ApiError.badRequest("Invalid sender account ID format");
    }

    const isReceiverObjectId = mongoose.Types.ObjectId.isValid(receiverAccountId);
    const isReceiverAccNum = typeof receiverAccountId === "string" && /^\d{10}$/.test(receiverAccountId.trim());

    if (!isReceiverObjectId && !isReceiverAccNum) {
      throw ApiError.badRequest("Receiver account must be a valid ID or 10-digit account number");
    }

    if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
      throw ApiError.badRequest("Transfer amount must be a positive integer in cents");
    }

    // 3. Fetch Sender Account
    const sender = await Account.findById(senderAccountId).populate("user");
    if (!sender) {
      throw ApiError.notFound("Sender account not found");
    }

    // Enforce Ownership of Sender Account
    const senderUserId = sender.user._id || sender.user;
    if (!senderUserId.equals(req.user._id)) {
      throw ApiError.forbidden("You do not have permission to transfer from this account");
    }

    // 4. Fetch Receiver Account (by ObjectId or 10-digit account number)
    let receiver = null;
    if (isReceiverObjectId) {
      receiver = await Account.findById(receiverAccountId).populate("user");
    } else {
      receiver = await Account.findOne({ accountNumber: receiverAccountId.trim() }).populate("user");
    }

    if (!receiver) {
      throw ApiError.notFound("Receiver account not found");
    }

    // 5. Prevent Self-Transfer
    if (sender._id.equals(receiver._id)) {
      throw ApiError.badRequest("Cannot transfer funds to the same account");
    }

    // 5. Verify Account Status
    if (sender.status !== ACCOUNT_STATUS.ACTIVE) {
      throw ApiError.badRequest("Cannot transfer from an inactive or frozen account");
    }

    if (receiver.status !== ACCOUNT_STATUS.ACTIVE) {
      throw ApiError.badRequest("Cannot transfer to an inactive or frozen account");
    }

    // 6. Currency Validation
    if (sender.currency !== receiver.currency) {
      throw ApiError.badRequest("Cross-currency transfers are not supported yet");
    }

    // 7. Gate 1: Transaction PIN (TPIN) Authorization & Anti-Brute-Force Lockout Gate
    const senderUser = await User.findById(sender.user._id || sender.user).select("+tpin");
    if (!senderUser) {
      throw ApiError.notFound("Sender user record not found");
    }

    const hasConfiguredTpin = Boolean(senderUser.tpin || senderUser.isTpinSet);
    const { tpin } = req.body;

    // Enforce TPIN check if sender has configured a TPIN or if tpin is included in the request payload
    if (hasConfiguredTpin || tpin !== undefined) {
      if (!tpin || typeof tpin !== "string" || !SYSTEM_LIMITS.TPIN.REGEX.test(tpin.trim())) {
        throw ApiError.badRequest("4-digit Transaction PIN (TPIN) is required");
      }

      if (!hasConfiguredTpin) {
        throw ApiError.badRequest(
          "Transaction PIN is not configured. Please set your 4-digit TPIN in Profile Settings before transferring funds."
        );
      }

      if (senderUser.isTpinLocked()) {
        const remainingMin = Math.ceil((senderUser.tpinLockedUntil - Date.now()) / 60000);
        throw ApiError.forbidden(
          `Transaction PIN is temporarily locked due to repeated failed attempts. Please try again in ${remainingMin} minute(s).`
        );
      }

      const isTpinValid = await senderUser.compareTpin(tpin.trim());
      if (!isTpinValid) {
        senderUser.tpinFailedAttempts = (senderUser.tpinFailedAttempts || 0) + 1;
        if (senderUser.tpinFailedAttempts >= SYSTEM_LIMITS.TPIN.MAX_FAILED_ATTEMPTS) {
          senderUser.tpinLockedUntil = new Date(Date.now() + SYSTEM_LIMITS.TPIN.LOCKOUT_MINUTES * 60 * 1000);
        }
        await senderUser.save();

        const attemptsLeft = Math.max(0, SYSTEM_LIMITS.TPIN.MAX_FAILED_ATTEMPTS - senderUser.tpinFailedAttempts);
        throw ApiError.unauthorized(
          attemptsLeft > 0
            ? `Incorrect Transaction PIN. ${attemptsLeft} attempt(s) remaining before temporary lockout.`
            : `Transaction PIN locked for ${SYSTEM_LIMITS.TPIN.LOCKOUT_MINUTES} minutes due to repeated failed attempts.`
        );
      }

      // Successful PIN match: reset failed attempts if previously elevated
      if (senderUser.tpinFailedAttempts > 0 || senderUser.tpinLockedUntil) {
        senderUser.tpinFailedAttempts = 0;
        senderUser.tpinLockedUntil = null;
        await senderUser.save();
      }
    }

    // 8. Gate 2: Server-Authoritative Velocity Limits Validation
    // Validate Remitter Outbound Transfer Limits (Daily, Weekly, Yearly)
    await velocityService.validateTransferLimits(senderUser, [sender._id], amountInCents);

    // Validate Beneficiary Inbound Receiving Limits (Daily, Weekly, Yearly)
    const receiverUser = receiver.user;
    await velocityService.validateReceivingLimits(receiverUser, receiver._id, amountInCents);

    // 9. Atomic Orchestration via MongoDB Session
    session = await mongoose.startSession();
    session.startTransaction();

    // 7a. Balance Verification within Session
    const senderBalance = await ledgerService.getAccountBalance(sender._id, session);
    if (senderBalance.balanceInCents < amountInCents) {
      throw ApiError.badRequest(
        `Insufficient funds. Available: ${formatCurrency(senderBalance.balanceInCents, sender.currency)}, Required: ${formatCurrency(amountInCents, sender.currency)}`
      );
    }

    // 7b. Create Transaction Audit Record with status PENDING
    const [transaction] = await Transaction.create(
      [
        {
          idempotencyKey: trimmedKey,
          senderAccount: sender._id,
          receiverAccount: receiver._id,
          amount: amountInCents,
          currency: sender.currency,
          status: "PENDING",
          description: description || `Transfer to ${receiver.accountNumber}`
        }
      ],
      { session, ordered: true }
    );

    // 7c. Write Immutable Double-Entry Ledger Journal Records
    await Ledger.insertMany(
      [
        {
          transactionId: transaction._id,
          accountId: sender._id,
          type: "DEBIT",
          amount: amountInCents,
          description: `Transfer to ${receiver.accountNumber}`
        },
        {
          transactionId: transaction._id,
          accountId: receiver._id,
          type: "CREDIT",
          amount: amountInCents,
          description: `Transfer from ${sender.accountNumber}`
        }
      ],
      { session }
    );

    // 7d. Update Transaction status to COMPLETED
    transaction.status = "COMPLETED";
    await transaction.save({ session });

    // 7e. Commit Transaction Atomically
    await session.commitTransaction();
    session.endSession();
    session = null;

    // 8. Fetch updated balances
    const updatedSenderBalance = await ledgerService.getAccountBalance(sender._id);
    const updatedReceiverBalance = await ledgerService.getAccountBalance(receiver._id);

    // 9. Fire-and-forget asynchronous email notifications
    if (sender.user && sender.user.email) {
      emailService
        .sendDebitAlert(
          sender.user,
          amountInCents,
          receiver.accountNumber,
          updatedSenderBalance.balanceInCents
        )
        .catch((err) => console.error("Non-blocking debit alert error:", err.message));
    }

    if (receiver.user && receiver.user.email) {
      emailService
        .sendCreditAlert(
          receiver.user,
          amountInCents,
          sender.accountNumber,
          updatedReceiverBalance.balanceInCents
        )
        .catch((err) => console.error("Non-blocking credit alert error:", err.message));
    }

    return ApiResponse.created(
      res,
      {
        transaction: {
          id: transaction._id,
          idempotencyKey: transaction.idempotencyKey,
          amountInCents: transaction.amount,
          formattedAmount: formatCurrency(transaction.amount, transaction.currency),
          currency: transaction.currency,
          senderAccount: sender.accountNumber,
          receiverAccount: receiver.accountNumber,
          sender: {
            accountNumber: sender.accountNumber,
            accountHolderName: sender.user?.name || "Account Holder",
            accountType: sender.accountType,
            currency: sender.currency
          },
          receiver: {
            accountNumber: receiver.accountNumber,
            accountHolderName: receiver.user?.name || "Beneficiary",
            accountType: receiver.accountType,
            currency: receiver.currency
          },
          status: transaction.status,
          createdAt: transaction.createdAt
        },
        senderBalance: {
          balanceInCents: updatedSenderBalance.balanceInCents,
          formattedBalance: formatCurrency(updatedSenderBalance.balanceInCents, sender.currency)
        }
      },
      "Transfer completed successfully"
    );
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (abortErr) {
        console.error("Error aborting transaction session:", abortErr);
      }
    }
    next(error);
  }
};

/**
 * 2. Get Transaction History for Authenticated User
 * GET /api/v1/transactions/history
 */
const getHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Find all accounts owned by this user
    const userAccounts = await Account.find({ user: req.user._id }).select("_id");
    const accountIds = userAccounts.map((acc) => acc._id);

    const filter = {
      $or: [
        { senderAccount: { $in: accountIds } },
        { receiverAccount: { $in: accountIds } }
      ]
    };

    // Optional filter by specific account ID
    if (req.query.accountId && mongoose.Types.ObjectId.isValid(req.query.accountId)) {
      const accId = new mongoose.Types.ObjectId(req.query.accountId);
      filter.$or = [
        { senderAccount: accId },
        { receiverAccount: accId }
      ];
    }

    // Optional filter by status (COMPLETED, PENDING, FAILED)
    if (req.query.status && typeof req.query.status === "string" && req.query.status.toUpperCase() !== "ALL") {
      const targetStatus = req.query.status.toUpperCase();
      if (["COMPLETED", "PENDING", "FAILED"].includes(targetStatus)) {
        filter.status = targetStatus;
      }
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate({
        path: "senderAccount",
        select: "accountNumber accountType currency user",
        populate: { path: "user", select: "name email" }
      })
      .populate({
        path: "receiverAccount",
        select: "accountNumber accountType currency user",
        populate: { path: "user", select: "name email" }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return ApiResponse.success(
      res,
      {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      "Transaction history retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get Single Transaction By ID
 * GET /api/v1/transactions/:id
 */
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest("Invalid transaction ID format");
    }

    const transaction = await Transaction.findById(id)
      .populate({
        path: "senderAccount",
        select: "accountNumber accountType user currency",
        populate: { path: "user", select: "name email" }
      })
      .populate({
        path: "receiverAccount",
        select: "accountNumber accountType user currency",
        populate: { path: "user", select: "name email" }
      });

    if (!transaction) {
      throw ApiError.notFound("Transaction not found");
    }

    // Verify ownership: User must own either the sender account or the receiver account
    const senderUserId = transaction.senderAccount?.user?._id || transaction.senderAccount?.user;
    const receiverUserId = transaction.receiverAccount?.user?._id || transaction.receiverAccount?.user;

    const isSenderOwner = senderUserId && senderUserId.equals(req.user._id);
    const isReceiverOwner = receiverUserId && receiverUserId.equals(req.user._id);

    if (!isSenderOwner && !isReceiverOwner) {
      throw ApiError.forbidden("You do not have permission to view this transaction");
    }

    return ApiResponse.success(
      res,
      { transaction },
      "Transaction details retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  transfer,
  getHistory,
  getTransactionById
};
