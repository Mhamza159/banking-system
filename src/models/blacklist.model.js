const mongoose = require("mongoose");

/**
 * Blacklist Schema
 * Stores revoked JWT tokens upon logout.
 * Uses a MongoDB TTL (Time-To-Live) index so expired tokens are automatically
 * removed by MongoDB's background threads, preventing indefinite database bloat.
 */
const blacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "Token is required for blacklisting"],
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required for TTL index"],
      // MongoDB TTL Index: Document expires when current time reaches expiresAt
      expires: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const Blacklist = mongoose.model("Blacklist", blacklistSchema);

module.exports = Blacklist;
