const mongoose = require("mongoose");
const Ledger = require("../models/ledger.model");
const ApiError = require("../utils/apiError");

/**
 * Ledger Service
 * Handles financial balance derivations via MongoDB Aggregation Pipelines
 * and immutable ledger journal recording.
 */
class LedgerService {
  /**
   * Derives real-time account balance using MongoDB Aggregation Pipeline ($Credits - $Debits)
   *
   * @param {string|mongoose.Types.ObjectId} accountId - Target Account ObjectId
   * @param {mongoose.ClientSession|null} session - Optional MongoDB transaction session
   * @returns {Promise<{ balanceInCents: number, totalCredits: number, totalDebits: number }>}
   */
  async getAccountBalance(accountId, session = null) {
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw ApiError.badRequest("Invalid account ID format");
    }

    const objectId = new mongoose.Types.ObjectId(accountId);

    const pipeline = [
      {
        $match: {
          accountId: objectId
        }
      },
      {
        $group: {
          _id: "$accountId",
          totalCredits: {
            $sum: {
              $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0]
            }
          },
          totalDebits: {
            $sum: {
              $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          accountId: "$_id",
          totalCredits: 1,
          totalDebits: 1,
          balanceInCents: { $subtract: ["$totalCredits", "$totalDebits"] }
        }
      }
    ];

    const aggregation = Ledger.aggregate(pipeline);
    if (session) {
      aggregation.session(session);
    }

    const result = await aggregation;

    if (!result || result.length === 0) {
      return {
        balanceInCents: 0,
        totalCredits: 0,
        totalDebits: 0
      };
    }

    return {
      balanceInCents: result[0].balanceInCents,
      totalCredits: result[0].totalCredits,
      totalDebits: result[0].totalDebits
    };
  }

  /**
   * Records a test faucet initial deposit directly into the append-only Ledger journal
   *
   * @param {string|mongoose.Types.ObjectId} accountId - Target Account ObjectId
   * @param {number} amountInCents - Positive integer amount in cents
   * @param {string} description - Transaction description
   * @param {mongoose.ClientSession|null} session - Optional transaction session
   * @returns {Promise<{ ledgerEntry: Object, balance: Object }>}
   */
  async recordFaucetDeposit(accountId, amountInCents, description = "Test Faucet Deposit", session = null) {
    if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
      throw ApiError.badRequest("Deposit amount must be a positive integer in cents");
    }

    const entries = await Ledger.create(
      [
        {
          accountId,
          type: "CREDIT",
          amount: amountInCents,
          description
        }
      ],
      session ? { session } : {}
    );

    const ledgerEntry = entries[0];
    const balance = await this.getAccountBalance(accountId, session);

    return {
      ledgerEntry,
      balance
    };
  }
}

module.exports = new LedgerService();
