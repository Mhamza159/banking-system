const express = require("express");
const {
  getMyAccounts,
  createAccount,
  depositFaucet,
  getBalance,
  verifyRecipient
} = require("../controllers/account.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// All account routes require authentication
router.use(authMiddleware);

// 1. Get logged-in customer's accounts
router.get("/me", getMyAccounts);

// 2. Create additional account
router.post("/", createAccount);

// 3. Faucet deposit for testing
router.post("/:accountId/deposit", depositFaucet);

// 4. Get Account Balance (Double-entry aggregated balance)
router.get("/:accountId/balance", getBalance);

// 5. Verify Recipient Account (Safe pre-flight verification)
router.get("/recipient/:accountNumber", verifyRecipient);

module.exports = router;
