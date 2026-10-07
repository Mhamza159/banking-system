const mongoose = require("mongoose");

/**
 * Immutable Double-Entry Ledger Entry Schema
 *
 * Implements the financial accounting journal.
 * Crucial rule: Financial entries are immutable and append-only.
 * updatedAt is explicitly omitted to guarantee that records cannot be altered.
 */
const ledgerSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Account ID is required for ledger entry"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["DEBIT", "CREDIT"],
        message: "Type must be either DEBIT or CREDIT",
      },
      required: [true, "Entry type (DEBIT or CREDIT) is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount in cents is required"],
      min: [1, "Amount must be at least 1 cent"],
      validate: {
        validator: Number.isInteger,
        message: "Amount must be an integer minor unit (cents)",
      },
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    // Append-only: record createdAt timestamp, disable updatedAt
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// Compound index for fast chronological statements
ledgerSchema.index({ accountId: 1, createdAt: -1 });

// Compound covering index for high-speed aggregation pipelines ($Credits - $Debits)
ledgerSchema.index({ accountId: 1, type: 1, amount: 1 });

const Ledger = mongoose.model("Ledger", ledgerSchema);

module.exports = Ledger;
