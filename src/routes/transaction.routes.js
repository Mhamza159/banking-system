const express = require("express");
const {
  transfer,
  getHistory,
  getTransactionById
} = require("../controllers/transaction.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// All transaction routes require authentication
router.use(authMiddleware);

// 1. Atomic money transfer with idempotency
router.post("/transfer", transfer);

// 2. Transaction history
router.get("/history", getHistory);

// 3. Single transaction details
router.get("/:id", getTransactionById);

module.exports = router;
