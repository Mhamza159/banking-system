const express = require("express");
const authRoutes = require("./auth.routes");
const accountRoutes = require("./account.routes");
const transactionRoutes = require("./transaction.routes");
const profileRoutes = require("./profile.routes");

const router = express.Router();

// Mount Feature Sub-routers
router.use("/auth", authRoutes);
router.use("/accounts", accountRoutes);
router.use("/transactions", transactionRoutes);
router.use("/profile", profileRoutes);

module.exports = router;
