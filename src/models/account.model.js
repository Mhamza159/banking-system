const mongoose = require("mongoose");
const ACCOUNT_STATUS = require("../constants/accountStatus");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Account must belong to a user"],
      index: true
    },
    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      unique: true,
      length: 10,
      index: true
    },
    accountType: {
      type: String,
      enum: ["SAVINGS", "CHECKING"],
      default: "SAVINGS"
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "PKR", "GBP"],
      default: "USD",
      uppercase: true
    },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound index for fast queries: Find accounts of a specific user by accountType
accountSchema.index({ user: 1, accountType: 1 });

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
