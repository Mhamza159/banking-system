const mongoose = require("mongoose");

/**
 * Transaction Schema
 * Represents the top-level financial transfer entity with Idempotency Key protection.
 */
const transactionSchema = new mongoose.Schema(
  {
    idempotencyKey: {
      type: String,
      required: [true, "Idempotency key is required"],
      unique: true,
      trim: true,
      index: true
    },
    senderAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Sender account is required"],
      index: true
    },
    receiverAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Receiver account is required"],
      index: true
    },
    amount: {
      type: Number,
      required: [true, "Amount in cents is required"],
      min: [1, "Transfer amount must be at least 1 cent"],
      validate: {
        validator: Number.isInteger,
        message: "Amount must be an integer minor unit (cents)"
      }
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "COMPLETED", "FAILED"],
        message: "Status must be PENDING, COMPLETED, or FAILED"
      },
      default: "PENDING",
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: "Account to Account Transfer"
    },
    failureReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound indexes for history queries
transactionSchema.index({ senderAccount: 1, createdAt: -1 });
transactionSchema.index({ receiverAccount: 1, createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
