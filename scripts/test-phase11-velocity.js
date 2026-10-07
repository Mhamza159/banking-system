/**
 * Automated Verification Script for Phase 11:
 * Foundational Security Schema, Constants & Velocity Engine
 *
 * Tests:
 * 1. System Limits and Constraints (SYSTEM_LIMITS values, structure, immutability)
 * 2. User Security Model & TPIN methods:
 *    - Schema defaults for limits and lockouts
 *    - select: false on TPIN
 *    - compareTpin with bcrypt matching and mismatch rejection
 *    - isTpinLocked method against future vs expired lockout timestamps
 *    - hasTpin virtual property
 * 3. Authoritative Velocity Calculation Engine:
 *    - getPeriodBoundaries UTC calendar start calculations
 *    - getTransferUsage aggregation on COMPLETED transactions only
 *    - getReceivingUsage aggregation on COMPLETED transactions only
 *    - validateTransferLimits boundary enforcement (Daily, Weekly, Yearly)
 *    - validateReceivingLimits boundary enforcement
 *    - Minimum transfer limit enforcement
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const SYSTEM_LIMITS = require("../src/constants/limits");
const User = require("../src/models/user.model");
const Account = require("../src/models/account.model");
const Transaction = require("../src/models/transaction.model");
const velocityService = require("../src/services/velocity.service");
const ACCOUNT_STATUS = require("../src/constants/accountStatus");

async function runPhase11Tests() {
  console.log("==================================================");
  console.log("🧪 Running Phase 11: Security Schema & Velocity Engine Tests");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(name, condition, extraInfo = "") {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name} ${extraInfo}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${extraInfo}`);
    }
  }

  // Connect to Database
  await connectDB();
  console.log("Connected to MongoDB Atlas\n");

  const cleanupIds = { users: [], accounts: [], transactions: [] };

  try {
    // ----------------------------------------------------
    // Test Section 1: System Limits Constants
    // ----------------------------------------------------
    console.log("--- Section 1: System Limits Constants ---");
    assert(
      "1.1 SYSTEM_LIMITS.TRANSFER ceilings defined",
      SYSTEM_LIMITS.TRANSFER.MAX_DAILY === 50000000 &&
      SYSTEM_LIMITS.TRANSFER.MAX_WEEKLY === 250000000 &&
      SYSTEM_LIMITS.TRANSFER.MAX_YEARLY === 1000000000 &&
      SYSTEM_LIMITS.TRANSFER.MIN === 100
    );

    assert(
      "1.2 SYSTEM_LIMITS.RECEIVING ceilings defined",
      SYSTEM_LIMITS.RECEIVING.MAX_DAILY === 50000000 &&
      SYSTEM_LIMITS.RECEIVING.MAX_WEEKLY === 250000000 &&
      SYSTEM_LIMITS.RECEIVING.MAX_YEARLY === 1000000000 &&
      SYSTEM_LIMITS.RECEIVING.MIN === 100
    );

    assert(
      "1.3 SYSTEM_LIMITS.TPIN constraints defined",
      SYSTEM_LIMITS.TPIN.MAX_FAILED_ATTEMPTS === 5 &&
      SYSTEM_LIMITS.TPIN.LOCKOUT_MINUTES === 15 &&
      SYSTEM_LIMITS.TPIN.REGEX instanceof RegExp
    );

    // ----------------------------------------------------
    // Test Section 2: User Security Schema & TPIN Methods
    // ----------------------------------------------------
    console.log("\n--- Section 2: User Model & TPIN Security ---");
    const testEmail = `velocity_test_${Date.now()}@aurabank.io`;
    const testUser = await User.create({
      name: "Velocity Test User",
      email: testEmail,
      password: "TestPassword123!"
    });
    cleanupIds.users.push(testUser._id);

    assert("2.1 User created with default transfer limits",
      testUser.transferLimits.daily === 500000 &&
      testUser.transferLimits.weekly === 2500000 &&
      testUser.transferLimits.yearly === 10000000
    );

    assert("2.2 User created with default receiving limits",
      testUser.receivingLimits.daily === 1000000 &&
      testUser.receivingLimits.weekly === 5000000 &&
      testUser.receivingLimits.yearly === 20000000
    );

    assert("2.3 User initially has no TPIN",
      testUser.tpin === null &&
      testUser.hasTpin === false &&
      testUser.tpinFailedAttempts === 0 &&
      testUser.tpinLockedUntil === null &&
      testUser.isTpinLocked() === false
    );

    // Set TPIN
    testUser.tpin = "4826";
    await testUser.save();

    // Re-query from DB without +tpin (verifying select: false)
    const queriedWithoutTpin = await User.findById(testUser._id);
    assert("2.4 select: false excludes tpin from standard queries",
      queriedWithoutTpin.tpin === undefined &&
      queriedWithoutTpin.hasTpin === true
    );

    // Re-query with +tpin
    const queriedWithTpin = await User.findById(testUser._id).select("+tpin");
    assert("2.5 TPIN is bcrypt hashed (not plaintext)",
      queriedWithTpin.tpin &&
      queriedWithTpin.tpin.startsWith("$2b$") &&
      queriedWithTpin.tpin.length >= 50
    );

    // Compare candidate TPIN
    const correctMatch = await queriedWithTpin.compareTpin("4826");
    const wrongMatch = await queriedWithTpin.compareTpin("0000");
    assert("2.6 compareTpin validates correct 4-digit PIN", correctMatch === true);
    assert("2.7 compareTpin rejects incorrect 4-digit PIN", wrongMatch === false);

    // Test TPIN Lockout method
    assert("2.8 isTpinLocked returns false when not locked", queriedWithTpin.isTpinLocked() === false);

    // Set lock in future
    queriedWithTpin.tpinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    assert("2.9 isTpinLocked returns true when lockout is active in future", queriedWithTpin.isTpinLocked() === true);

    // Set lock in past
    queriedWithTpin.tpinLockedUntil = new Date(Date.now() - 1000);
    assert("2.10 isTpinLocked returns false when lockout has expired", queriedWithTpin.isTpinLocked() === false);

    // ----------------------------------------------------
    // Test Section 3: UTC Boundary Calculation
    // ----------------------------------------------------
    console.log("\n--- Section 3: UTC Boundary Calculation ---");
    // Wednesday 2026-09-17 14:30:00 UTC
    const refDate = new Date(Date.UTC(2026, 8, 17, 14, 30, 0));
    const boundaries = velocityService.getPeriodBoundaries(refDate);

    assert("3.1 startOfDay is UTC midnight",
      boundaries.startOfDay.toISOString() === "2026-09-17T00:00:00.000Z"
    );

    assert("3.2 startOfWeek is Monday UTC midnight (2026-09-14)",
      boundaries.startOfWeek.toISOString() === "2026-09-14T00:00:00.000Z"
    );

    assert("3.3 startOfYear is Jan 1 UTC midnight (2026-01-01)",
      boundaries.startOfYear.toISOString() === "2026-01-01T00:00:00.000Z"
    );

    // ----------------------------------------------------
    // Test Section 4: Velocity Usage Aggregation
    // ----------------------------------------------------
    console.log("\n--- Section 4: Velocity Aggregation & Limits Enforcement ---");
    // Provision 2 Accounts
    const senderAccount = await Account.create({
      user: testUser._id,
      accountNumber: "9901" + Math.floor(100000 + Math.random() * 900000),
      accountType: "CHECKING",
      currency: "USD",
      status: ACCOUNT_STATUS.ACTIVE
    });
    cleanupIds.accounts.push(senderAccount._id);

    const receiverUser = await User.create({
      name: "Velocity Receiver User",
      email: `receiver_${Date.now()}@aurabank.io`,
      password: "TestPassword123!",
      receivingLimits: {
        daily: 100000,   // $1,000.00
        weekly: 500000,  // $5,000.00
        yearly: 2000000  // $20,000.00
      }
    });
    cleanupIds.users.push(receiverUser._id);

    const receiverAccount = await Account.create({
      user: receiverUser._id,
      accountNumber: "9902" + Math.floor(100000 + Math.random() * 900000),
      accountType: "SAVINGS",
      currency: "USD",
      status: ACCOUNT_STATUS.ACTIVE
    });
    cleanupIds.accounts.push(receiverAccount._id);

    // Initial usage should be zero
    const initialSenderUsage = await velocityService.getTransferUsage(senderAccount._id);
    const initialReceiverUsage = await velocityService.getReceivingUsage(receiverAccount._id);

    assert("4.1 Initial sender transfer usage is 0",
      initialSenderUsage.daily === 0 &&
      initialSenderUsage.weekly === 0 &&
      initialSenderUsage.yearly === 0
    );

    assert("4.2 Initial receiver usage is 0",
      initialReceiverUsage.daily === 0 &&
      initialReceiverUsage.weekly === 0 &&
      initialReceiverUsage.yearly === 0
    );

    // Create a COMPLETED transaction for $200.00 (20,000 cents)
    const tx1 = await Transaction.create({
      idempotencyKey: `velocity_test_tx1_${Date.now()}`,
      senderAccount: senderAccount._id,
      receiverAccount: receiverAccount._id,
      amount: 20000,
      currency: "USD",
      status: "COMPLETED",
      description: "Test completed transfer"
    });
    cleanupIds.transactions.push(tx1._id);

    // Create a FAILED transaction for $500.00 (should NOT count toward velocity)
    const txFailed = await Transaction.create({
      idempotencyKey: `velocity_test_tx_failed_${Date.now()}`,
      senderAccount: senderAccount._id,
      receiverAccount: receiverAccount._id,
      amount: 50000,
      currency: "USD",
      status: "FAILED",
      description: "Test failed transfer"
    });
    cleanupIds.transactions.push(txFailed._id);

    const updatedSenderUsage = await velocityService.getTransferUsage(senderAccount._id);
    const updatedReceiverUsage = await velocityService.getReceivingUsage(receiverAccount._id);

    assert("4.3 Transfer usage reflects only COMPLETED transactions ($200.00)",
      updatedSenderUsage.daily === 20000 &&
      updatedSenderUsage.weekly === 20000 &&
      updatedSenderUsage.yearly === 20000
    );

    assert("4.4 Receiving usage reflects only COMPLETED transactions ($200.00)",
      updatedReceiverUsage.daily === 20000 &&
      updatedReceiverUsage.weekly === 20000 &&
      updatedReceiverUsage.yearly === 20000
    );

    // ----------------------------------------------------
    // Test Section 5: Limit Enforcement Gate
    // ----------------------------------------------------
    console.log("\n--- Section 5: Limit Enforcement Gate ---");
    // Remitter has $5,000 daily limit. Has used $200.
    // Transfer of $1,000 should pass:
    const transferPass = await velocityService.validateTransferLimits(testUser, senderAccount._id, 100000);
    assert("5.1 validateTransferLimits allows transfer within daily limit", transferPass.valid === true);

    // Transfer below minimum ($0.50) should throw AMOUNT_BELOW_MINIMUM:
    let minErrorThrown = false;
    try {
      await velocityService.validateTransferLimits(testUser, senderAccount._id, 50);
    } catch (err) {
      minErrorThrown = err.errorCode === "AMOUNT_BELOW_MINIMUM";
    }
    assert("5.2 validateTransferLimits rejects transfer below minimum limit ($1.00)", minErrorThrown);

    // Transfer of $4,900 should fail (200 + 4900 = 5100 > 5000):
    let dailyExceededThrown = false;
    try {
      await velocityService.validateTransferLimits(testUser, senderAccount._id, 490000);
    } catch (err) {
      dailyExceededThrown = err.errorCode === "TRANSFER_LIMIT_EXCEEDED_DAILY";
    }
    assert("5.3 validateTransferLimits rejects transfer exceeding daily limit", dailyExceededThrown);

    // Beneficiary has $1,000 daily receiving limit. Has received $200.
    // Inbound transfer of $500 should pass (200 + 500 = 700 <= 1000):
    const receiverPass = await velocityService.validateReceivingLimits(receiverUser, receiverAccount._id, 50000);
    assert("5.4 validateReceivingLimits allows inbound transfer within receiving limit", receiverPass.valid === true);

    // Inbound transfer of $900 should fail (200 + 900 = 1100 > 1000):
    let receiverExceededThrown = false;
    try {
      await velocityService.validateReceivingLimits(receiverUser, receiverAccount._id, 90000);
    } catch (err) {
      receiverExceededThrown = err.errorCode === "RECEIVER_LIMIT_EXCEEDED_DAILY";
    }
    assert("5.5 validateReceivingLimits rejects transfer exceeding recipient daily limit", receiverExceededThrown);

  } catch (error) {
    console.error("Test execution encountered an error:", error);
  } finally {
    // Clean up test data
    console.log("\n--- Cleaning up test artifacts ---");
    if (cleanupIds.transactions.length > 0) {
      await Transaction.deleteMany({ _id: { $in: cleanupIds.transactions } });
    }
    if (cleanupIds.accounts.length > 0) {
      await Account.deleteMany({ _id: { $in: cleanupIds.accounts } });
    }
    if (cleanupIds.users.length > 0) {
      await User.deleteMany({ _id: { $in: cleanupIds.users } });
    }
    console.log("Cleanup complete.\n");

    console.log("==================================================");
    console.log(`📊 Result: ${passed}/${total} assertions passed`);
    console.log("==================================================");

    await mongoose.connection.close();
    process.exit(passed === total ? 0 : 1);
  }
}

runPhase11Tests();
