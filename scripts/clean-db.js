require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/user.model");
const Account = require("../src/models/account.model");
const Ledger = require("../src/models/ledger.model");
const Transaction = require("../src/models/transaction.model");
const Blacklist = require("../src/models/blacklist.model");

async function cleanDatabase() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await connectDB();
    console.log("Connected to database successfully!");

    console.log("\n🧹 Cleaning all dummy & test data...");

    const usersResult = await User.deleteMany({});
    console.log(`- Deleted ${usersResult.deletedCount} Users`);

    const accountsResult = await Account.deleteMany({});
    console.log(`- Deleted ${accountsResult.deletedCount} Accounts`);

    const ledgerResult = await Ledger.deleteMany({});
    console.log(`- Deleted ${ledgerResult.deletedCount} Ledger records`);

    const transactionsResult = await Transaction.deleteMany({});
    console.log(`- Deleted ${transactionsResult.deletedCount} Transactions`);

    const blacklistResult = await Blacklist.deleteMany({});
    console.log(`- Deleted ${blacklistResult.deletedCount} Blacklisted tokens`);

    console.log("\n✨ Database is now 100% clean and ready for real use!");
  } catch (error) {
    console.error("❌ Error cleaning database:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
    process.exit(0);
  }
}

cleanDatabase();
