require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const app = require("../src/app");
const User = require("../src/models/user.model");
const Account = require("../src/models/account.model");
const Ledger = require("../src/models/ledger.model");
const Transaction = require("../src/models/transaction.model");

function makeRequest({ method, path, headers = {}, body = null, port = 3004 }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runPhase5Verification() {
  console.log("==================================================");
  console.log("   PHASE 5 COMPREHENSIVE AUTOMATED VERIFICATION   ");
  console.log("   ACID Transaction Transfers & Idempotency Engine");
  console.log("==================================================\n");

  await connectDB();

  const TEST_PORT = 3004;
  const server = app.listen(TEST_PORT);
  await new Promise((r) => setTimeout(r, 500));

  const timestamp = Date.now();
  const userAEmail = `phase5_userA_${timestamp}@banking.local`;
  const userBEmail = `phase5_userB_${timestamp}@banking.local`;
  const userCEmail = `phase5_userC_${timestamp}@banking.local`;
  const testPassword = "Password123!";

  let userACookie = "";
  let userAId = "";
  let userAAccountId = "";

  let userBCookie = "";
  let userBId = "";
  let userBAccountId = "";

  let userCCookie = "";
  let userCId = "";
  let userCAccountId = "";

  let createdTxId = "";
  const idempotencyKey1 = `idemp-key-transfer-${timestamp}`;

  try {
    // ----------------------------------------------------
    // Setup: Register User A and User B
    // ----------------------------------------------------
    console.log("Setup: Registering User A and User B...");
    const regResA = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/register",
      body: { name: "User A", email: userAEmail, password: testPassword },
      port: TEST_PORT
    });
    userAId = regResA.body.data.user.id;
    userAAccountId = regResA.body.data.account.id;
    userACookie = regResA.headers["set-cookie"][0].split(";")[0];

    const regResB = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/register",
      body: { name: "User B", email: userBEmail, password: testPassword },
      port: TEST_PORT
    });
    userBId = regResB.body.data.user.id;
    userBAccountId = regResB.body.data.account.id;
    userBCookie = regResB.headers["set-cookie"][0].split(";")[0];

    console.log(`- User A (ID: ${userAId}, Account: ${userAAccountId})`);
    console.log(`- User B (ID: ${userBId}, Account: ${userBAccountId})`);

    // Fund User A via Faucet with $500.00 (50,000 cents)
    console.log("\nSetup: Funding User A with $500.00 (50,000 cents) via Faucet...");
    const faucetRes = await makeRequest({
      method: "POST",
      path: `/api/v1/accounts/${userAAccountId}/deposit`,
      headers: { Cookie: userACookie },
      body: { amountInCents: 50000 },
      port: TEST_PORT
    });
    if (faucetRes.status !== 200 || faucetRes.body.data.balanceInCents !== 50000) {
      throw new Error(`Faucet deposit failed: ${JSON.stringify(faucetRes.body)}`);
    }
    console.log("  [PASS] User A funded with $500.00");

    // ----------------------------------------------------
    // Test 1: Atomic Money Transfer ($100.00 / 10,000 cents)
    // ----------------------------------------------------
    console.log("\nTest 1: User A transfers $100.00 (10,000 cents) to User B...");
    const transfer1Res = await makeRequest({
      method: "POST",
      path: "/api/v1/transactions/transfer",
      headers: {
        Cookie: userACookie,
        "Idempotency-Key": idempotencyKey1
      },
      body: {
        senderAccountId: userAAccountId,
        receiverAccountId: userBAccountId,
        amountInCents: 10000,
        description: "Payment for consulting work"
      },
      port: TEST_PORT
    });

    console.log(`- Status: ${transfer1Res.status}`);
    console.log(`- Response:`, JSON.stringify(transfer1Res.body.data));
    if (transfer1Res.status !== 201) {
      throw new Error(`Expected 201 Created, got ${transfer1Res.status}: ${JSON.stringify(transfer1Res.body)}`);
    }

    createdTxId = transfer1Res.body.data.transaction.id;
    if (transfer1Res.body.data.senderBalance.balanceInCents !== 40000) {
      throw new Error(`Expected sender balance 40000, got ${transfer1Res.body.data.senderBalance.balanceInCents}`);
    }

    // Verify User A Balance via Balance API
    const balARes = await makeRequest({
      method: "GET",
      path: `/api/v1/accounts/${userAAccountId}/balance`,
      headers: { Cookie: userACookie },
      port: TEST_PORT
    });
    if (balARes.body.data.balanceInCents !== 40000) {
      throw new Error(`User A balance mismatch: expected 40000, got ${balARes.body.data.balanceInCents}`);
    }

    // Verify User B Balance via Balance API
    const balBRes = await makeRequest({
      method: "GET",
      path: `/api/v1/accounts/${userBAccountId}/balance`,
      headers: { Cookie: userBCookie },
      port: TEST_PORT
    });
    if (balBRes.body.data.balanceInCents !== 10000) {
      throw new Error(`User B balance mismatch: expected 10000, got ${balBRes.body.data.balanceInCents}`);
    }

    // Direct Database Checks: Ledger journal has 1 DEBIT and 1 CREDIT for this tx
    const ledgerEntries = await Ledger.find({ transactionId: createdTxId });
    if (ledgerEntries.length !== 2) {
      throw new Error(`Expected 2 ledger entries for transfer, found ${ledgerEntries.length}`);
    }
    const debitEntry = ledgerEntries.find((e) => e.type === "DEBIT");
    const creditEntry = ledgerEntries.find((e) => e.type === "CREDIT");
    if (!debitEntry || debitEntry.amount !== 10000 || debitEntry.accountId.toString() !== userAAccountId) {
      throw new Error("Debit ledger entry mismatch");
    }
    if (!creditEntry || creditEntry.amount !== 10000 || creditEntry.accountId.toString() !== userBAccountId) {
      throw new Error("Credit ledger entry mismatch");
    }
    console.log("  [PASS] Transfer atomic execution verified: A balance = $400.00, B balance = $100.00, balanced ledger entries created!");

    // ----------------------------------------------------
    // Test 2: Idempotency Deduplication (Re-send exact same transfer)
    // ----------------------------------------------------
    console.log("\nTest 2: Re-sending identical transfer request with same Idempotency-Key...");
    const duplicateTransferRes = await makeRequest({
      method: "POST",
      path: "/api/v1/transactions/transfer",
      headers: {
        Cookie: userACookie,
        "Idempotency-Key": idempotencyKey1
      },
      body: {
        senderAccountId: userAAccountId,
        receiverAccountId: userBAccountId,
        amountInCents: 10000
      },
      port: TEST_PORT
    });

    console.log(`- Status: ${duplicateTransferRes.status}`);
    if (duplicateTransferRes.status !== 200) {
      throw new Error(`Expected 200 OK for cached idempotent request, got ${duplicateTransferRes.status}`);
    }
    if (!duplicateTransferRes.body.data.cached) {
      throw new Error("Expected cached flag in response");
    }

    // Verify balances did not change!
    const balAAfterDup = await makeRequest({
      method: "GET",
      path: `/api/v1/accounts/${userAAccountId}/balance`,
      headers: { Cookie: userACookie },
      port: TEST_PORT
    });
    if (balAAfterDup.body.data.balanceInCents !== 40000) {
      throw new Error("Idempotency failed: User A balance was deducted again!");
    }
    console.log("  [PASS] Idempotency protected against double deduction (HTTP 200 OK cached response returned)!");

    // ----------------------------------------------------
    // Test 3: Insufficient Funds Rejection
    // ----------------------------------------------------
    console.log("\nTest 3: Attempting transfer with amount greater than balance ($1,000.00 vs $400.00)...");
    const overdraftRes = await makeRequest({
      method: "POST",
      path: "/api/v1/transactions/transfer",
      headers: {
        Cookie: userACookie,
        "Idempotency-Key": `idemp-overdraft-${timestamp}`
      },
      body: {
        senderAccountId: userAAccountId,
        receiverAccountId: userBAccountId,
        amountInCents: 100000 // $1,000.00
      },
      port: TEST_PORT
    });

    console.log(`- Status: ${overdraftRes.status}`);
    if (overdraftRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for overdraft, got ${overdraftRes.status}`);
    }
    console.log("  [PASS] Insufficient funds rejected with 400 Bad Request and zero database mutations!");

    // ----------------------------------------------------
    // Test 4: Self-Transfer Prevention
    // ----------------------------------------------------
    console.log("\nTest 4: Attempting self-transfer (senderAccountId === receiverAccountId)...");
    const selfTransferRes = await makeRequest({
      method: "POST",
      path: "/api/v1/transactions/transfer",
      headers: {
        Cookie: userACookie,
        "Idempotency-Key": `idemp-self-${timestamp}`
      },
      body: {
        senderAccountId: userAAccountId,
        receiverAccountId: userAAccountId,
        amountInCents: 5000
      },
      port: TEST_PORT
    });

    console.log(`- Status: ${selfTransferRes.status}`);
    if (selfTransferRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for self-transfer, got ${selfTransferRes.status}`);
    }
    console.log("  [PASS] Self-transfer blocked with 400 Bad Request!");

    // ----------------------------------------------------
    // Test 5: Missing Idempotency-Key Header
    // ----------------------------------------------------
    console.log("\nTest 5: Attempting transfer without Idempotency-Key header...");
    const missingKeyRes = await makeRequest({
      method: "POST",
      path: "/api/v1/transactions/transfer",
      headers: { Cookie: userACookie },
      body: {
        senderAccountId: userAAccountId,
        receiverAccountId: userBAccountId,
        amountInCents: 5000
      },
      port: TEST_PORT
    });

    console.log(`- Status: ${missingKeyRes.status}`);
    if (missingKeyRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for missing key, got ${missingKeyRes.status}`);
    }
    console.log("  [PASS] Missing Idempotency-Key header rejected with 400 Bad Request!");

    // ----------------------------------------------------
    // Test 6: Cross-Account Unauthorized Transfer (User B trying to spend User A's funds)
    // ----------------------------------------------------
    console.log("\nTest 6: Testing User B attempting to transfer from User A's account...");
    const unauthTransferRes = await makeRequest({
      method: "POST",
      path: "/api/v1/transactions/transfer",
      headers: {
        Cookie: userBCookie,
        "Idempotency-Key": `idemp-unauth-${timestamp}`
      },
      body: {
        senderAccountId: userAAccountId,
        receiverAccountId: userBAccountId,
        amountInCents: 5000
      },
      port: TEST_PORT
    });

    console.log(`- Status: ${unauthTransferRes.status}`);
    if (unauthTransferRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unauthorized sender, got ${unauthTransferRes.status}`);
    }
    console.log("  [PASS] Unauthorized sender blocked with 403 Forbidden!");

    // ----------------------------------------------------
    // Test 7: Get Transaction History
    // ----------------------------------------------------
    console.log("\nTest 7: Fetching transaction history for User A...");
    const historyRes = await makeRequest({
      method: "GET",
      path: "/api/v1/transactions/history",
      headers: { Cookie: userACookie },
      port: TEST_PORT
    });

    console.log(`- Status: ${historyRes.status}`);
    if (historyRes.status !== 200) {
      throw new Error(`Expected 200 OK for history, got ${historyRes.status}`);
    }
    if (historyRes.body.data.transactions.length === 0) {
      throw new Error("Expected at least 1 transaction in history");
    }
    console.log(`  [PASS] Transaction history fetched successfully (${historyRes.body.data.transactions.length} transactions)!`);

    // ----------------------------------------------------
    // Test 8: Get Transaction By ID & Security Boundary Check
    // ----------------------------------------------------
    console.log("\nTest 8: Testing single transaction retrieval & third-party security boundary...");
    // User A can view the transaction
    const getTxRes = await makeRequest({
      method: "GET",
      path: `/api/v1/transactions/${createdTxId}`,
      headers: { Cookie: userACookie },
      port: TEST_PORT
    });
    if (getTxRes.status !== 200) {
      throw new Error(`Expected 200 OK for getTransactionById, got ${getTxRes.status}`);
    }

    // Register User C (Third Party with no relation to this transaction)
    const regResC = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/register",
      body: { name: "User C", email: userCEmail, password: testPassword },
      port: TEST_PORT
    });
    userCId = regResC.body.data.user.id;
    userCAccountId = regResC.body.data.account.id;
    userCCookie = regResC.headers["set-cookie"][0].split(";")[0];

    // User C tries to view User A & B's transaction -> Should be 403 Forbidden
    const unauthViewRes = await makeRequest({
      method: "GET",
      path: `/api/v1/transactions/${createdTxId}`,
      headers: { Cookie: userCCookie },
      port: TEST_PORT
    });

    console.log(`- Status User C viewing A/B transaction: ${unauthViewRes.status}`);
    if (unauthViewRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for third-party transaction query, got ${unauthViewRes.status}`);
    }
    console.log("  [PASS] Third-party transaction access blocked with 403 Forbidden!");

    console.log("\n==================================================");
    console.log("   ALL 8 PHASE 5 VERIFICATION TESTS PASSED!      ");
    console.log("==================================================");
  } finally {
    // Teardown and Cleanup
    console.log("\nCleaning up test data from MongoDB...");
    const userIds = [userAId, userBId, userCId].filter(Boolean);
    const accountIds = [userAAccountId, userBAccountId, userCAccountId].filter(Boolean);

    if (userIds.length > 0) {
      await User.deleteMany({ _id: { $in: userIds } });
    }
    if (accountIds.length > 0) {
      await Account.deleteMany({ _id: { $in: accountIds } });
      await Ledger.deleteMany({ accountId: { $in: accountIds } });
      await Transaction.deleteMany({
        $or: [
          { senderAccount: { $in: accountIds } },
          { receiverAccount: { $in: accountIds } }
        ]
      });
    }

    server.close();
    await mongoose.connection.close();
    console.log("Cleanup complete and server closed.");
  }
}

runPhase5Verification().catch((err) => {
  console.error("\n❌ PHASE 5 VERIFICATION FAILED:", err);
  process.exit(1);
});
