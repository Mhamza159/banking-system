const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const ApiError = require("../utils/apiError");
const SYSTEM_LIMITS = require("../constants/limits");
const { formatCurrency } = require("../utils/currency");

/**
 * Velocity Service
 * Authoritative calculations querying MongoDB for completed transaction totals
 * against UTC calendar boundaries (Day, Week, Year) and enforcing user risk limits.
 */
class VelocityService {
  /**
   * Computes calendar boundary UTC dates for day, week, and year
   *
   * @param {Date} [referenceDate=new Date()] - Optional date for deterministic testing
   * @returns {{ startOfDay: Date, startOfWeek: Date, startOfYear: Date }}
   */
  getPeriodBoundaries(referenceDate = new Date()) {
    const now = new Date(referenceDate);

    // UTC Daily Start: 00:00:00.000Z
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
    );

    // UTC Weekly Start: Monday 00:00:00.000Z
    const dayOfWeek = now.getUTCDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday, 0, 0, 0, 0)
    );

    // UTC Yearly Start: Jan 1 00:00:00.000Z
    const startOfYear = new Date(
      Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0)
    );

    return { startOfDay, startOfWeek, startOfYear };
  }

  /**
   * Aggregates completed transfer spending in minor unit cents for the given sender accounts
   *
   * @param {string|mongoose.Types.ObjectId|Array<string|mongoose.Types.ObjectId>} senderAccountIds
   * @param {mongoose.ClientSession|null} [session=null]
   * @returns {Promise<{ daily: number, weekly: number, yearly: number }>}
   */
  async getTransferUsage(senderAccountIds, session = null) {
    const ids = (Array.isArray(senderAccountIds) ? senderAccountIds : [senderAccountIds])
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (ids.length === 0) {
      return { daily: 0, weekly: 0, yearly: 0 };
    }

    const { startOfDay, startOfWeek, startOfYear } = this.getPeriodBoundaries();

    const pipeline = [
      {
        $match: {
          senderAccount: { $in: ids },
          status: "COMPLETED",
          createdAt: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: null,
          daily: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", startOfDay] }, "$amount", 0]
            }
          },
          weekly: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", startOfWeek] }, "$amount", 0]
            }
          },
          yearly: {
            $sum: "$amount"
          }
        }
      },
      {
        $project: {
          _id: 0,
          daily: 1,
          weekly: 1,
          yearly: 1
        }
      }
    ];

    const aggregation = Transaction.aggregate(pipeline);
    if (session) {
      aggregation.session(session);
    }

    const results = await aggregation;
    if (!results || results.length === 0) {
      return { daily: 0, weekly: 0, yearly: 0 };
    }

    return {
      daily: results[0].daily || 0,
      weekly: results[0].weekly || 0,
      yearly: results[0].yearly || 0
    };
  }

  /**
   * Aggregates completed receiving volume in minor unit cents for the given receiver account(s)
   *
   * @param {string|mongoose.Types.ObjectId|Array<string|mongoose.Types.ObjectId>} receiverAccountId
   * @param {mongoose.ClientSession|null} [session=null]
   * @returns {Promise<{ daily: number, weekly: number, yearly: number }>}
   */
  async getReceivingUsage(receiverAccountId, session = null) {
    const ids = (Array.isArray(receiverAccountId) ? receiverAccountId : [receiverAccountId])
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (ids.length === 0) {
      return { daily: 0, weekly: 0, yearly: 0 };
    }

    const { startOfDay, startOfWeek, startOfYear } = this.getPeriodBoundaries();

    const pipeline = [
      {
        $match: {
          receiverAccount: { $in: ids },
          status: "COMPLETED",
          createdAt: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: null,
          daily: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", startOfDay] }, "$amount", 0]
            }
          },
          weekly: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", startOfWeek] }, "$amount", 0]
            }
          },
          yearly: {
            $sum: "$amount"
          }
        }
      },
      {
        $project: {
          _id: 0,
          daily: 1,
          weekly: 1,
          yearly: 1
        }
      }
    ];

    const aggregation = Transaction.aggregate(pipeline);
    if (session) {
      aggregation.session(session);
    }

    const results = await aggregation;
    if (!results || results.length === 0) {
      return { daily: 0, weekly: 0, yearly: 0 };
    }

    return {
      daily: results[0].daily || 0,
      weekly: results[0].weekly || 0,
      yearly: results[0].yearly || 0
    };
  }

  /**
   * Validates that an outbound transfer amount complies with the remitter's configured limits
   *
   * @param {Object} user - Sender user document containing transferLimits
   * @param {string|mongoose.Types.ObjectId|Array} senderAccountIds - Sender account(s)
   * @param {number} proposedAmountInCents - Integer cents
   * @returns {Promise<{ valid: boolean, currentUsage: Object }>}
   */
  async validateTransferLimits(user, senderAccountIds, proposedAmountInCents) {
    if (!Number.isInteger(proposedAmountInCents) || proposedAmountInCents <= 0) {
      throw ApiError.badRequest("Transfer amount must be a positive integer in cents");
    }

    if (proposedAmountInCents < SYSTEM_LIMITS.TRANSFER.MIN) {
      throw ApiError.badRequest(
        `Transfer amount is below the minimum allowed transfer of ${formatCurrency(SYSTEM_LIMITS.TRANSFER.MIN)}`,
        "AMOUNT_BELOW_MINIMUM"
      );
    }

    const usage = await this.getTransferUsage(senderAccountIds);

    const limits = {
      daily: user?.transferLimits?.daily ?? SYSTEM_LIMITS.TRANSFER.DEFAULT_DAILY,
      weekly: user?.transferLimits?.weekly ?? SYSTEM_LIMITS.TRANSFER.DEFAULT_WEEKLY,
      yearly: user?.transferLimits?.yearly ?? SYSTEM_LIMITS.TRANSFER.DEFAULT_YEARLY
    };

    if (usage.daily + proposedAmountInCents > limits.daily) {
      const remaining = Math.max(0, limits.daily - usage.daily);
      throw ApiError.badRequest(
        `Transfer exceeds daily transfer limit of ${formatCurrency(limits.daily)}. Remaining available limit today: ${formatCurrency(remaining)}.`,
        "TRANSFER_LIMIT_EXCEEDED_DAILY",
        {
          period: "daily",
          limit: limits.daily,
          currentUsage: usage.daily,
          proposedAmount: proposedAmountInCents,
          remaining
        }
      );
    }

    if (usage.weekly + proposedAmountInCents > limits.weekly) {
      const remaining = Math.max(0, limits.weekly - usage.weekly);
      throw ApiError.badRequest(
        `Transfer exceeds weekly transfer limit of ${formatCurrency(limits.weekly)}. Remaining available limit this week: ${formatCurrency(remaining)}.`,
        "TRANSFER_LIMIT_EXCEEDED_WEEKLY",
        {
          period: "weekly",
          limit: limits.weekly,
          currentUsage: usage.weekly,
          proposedAmount: proposedAmountInCents,
          remaining
        }
      );
    }

    if (usage.yearly + proposedAmountInCents > limits.yearly) {
      const remaining = Math.max(0, limits.yearly - usage.yearly);
      throw ApiError.badRequest(
        `Transfer exceeds yearly transfer limit of ${formatCurrency(limits.yearly)}. Remaining available limit this year: ${formatCurrency(remaining)}.`,
        "TRANSFER_LIMIT_EXCEEDED_YEARLY",
        {
          period: "yearly",
          limit: limits.yearly,
          currentUsage: usage.yearly,
          proposedAmount: proposedAmountInCents,
          remaining
        }
      );
    }

    return {
      valid: true,
      currentUsage: usage
    };
  }

  /**
   * Validates that an incoming transfer amount complies with the beneficiary's configured limits
   *
   * @param {Object} receiverUser - Beneficiary user document containing receivingLimits
   * @param {string|mongoose.Types.ObjectId|Array} receiverAccountId - Beneficiary account(s)
   * @param {number} proposedAmountInCents - Integer cents
   * @returns {Promise<{ valid: boolean, currentUsage: Object }>}
   */
  async validateReceivingLimits(receiverUser, receiverAccountId, proposedAmountInCents) {
    if (!Number.isInteger(proposedAmountInCents) || proposedAmountInCents <= 0) {
      throw ApiError.badRequest("Transfer amount must be a positive integer in cents");
    }

    const usage = await this.getReceivingUsage(receiverAccountId);

    const limits = {
      daily: receiverUser?.receivingLimits?.daily ?? SYSTEM_LIMITS.RECEIVING.DEFAULT_DAILY,
      weekly: receiverUser?.receivingLimits?.weekly ?? SYSTEM_LIMITS.RECEIVING.DEFAULT_WEEKLY,
      yearly: receiverUser?.receivingLimits?.yearly ?? SYSTEM_LIMITS.RECEIVING.DEFAULT_YEARLY
    };

    if (usage.daily + proposedAmountInCents > limits.daily) {
      const remaining = Math.max(0, limits.daily - usage.daily);
      throw ApiError.badRequest(
        `Transfer exceeds recipient's daily receiving limit of ${formatCurrency(limits.daily)}. Remaining available limit today: ${formatCurrency(remaining)}.`,
        "RECEIVER_LIMIT_EXCEEDED_DAILY",
        {
          period: "daily",
          limit: limits.daily,
          currentUsage: usage.daily,
          proposedAmount: proposedAmountInCents,
          remaining
        }
      );
    }

    if (usage.weekly + proposedAmountInCents > limits.weekly) {
      const remaining = Math.max(0, limits.weekly - usage.weekly);
      throw ApiError.badRequest(
        `Transfer exceeds recipient's weekly receiving limit of ${formatCurrency(limits.weekly)}. Remaining available limit this week: ${formatCurrency(remaining)}.`,
        "RECEIVER_LIMIT_EXCEEDED_WEEKLY",
        {
          period: "weekly",
          limit: limits.weekly,
          currentUsage: usage.weekly,
          proposedAmount: proposedAmountInCents,
          remaining
        }
      );
    }

    if (usage.yearly + proposedAmountInCents > limits.yearly) {
      const remaining = Math.max(0, limits.yearly - usage.yearly);
      throw ApiError.badRequest(
        `Transfer exceeds recipient's yearly receiving limit of ${formatCurrency(limits.yearly)}. Remaining available limit this year: ${formatCurrency(remaining)}.`,
        "RECEIVER_LIMIT_EXCEEDED_YEARLY",
        {
          period: "yearly",
          limit: limits.yearly,
          currentUsage: usage.yearly,
          proposedAmount: proposedAmountInCents,
          remaining
        }
      );
    }

    return {
      valid: true,
      currentUsage: usage
    };
  }
}

module.exports = new VelocityService();
