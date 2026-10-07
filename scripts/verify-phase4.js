require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const app = require("../src/app");
const User = require("../src/models/user.model");
const Account = require("../src/models/account.model");
const Ledger = require("../src/models/ledger.model");

function makeRequest({ method, path, headers = {}, body = null, port = 3003 }) {
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

async function runPhase4Verification() {
  console.log("==================================================");
  console.log("   PHASE 4 COMPREHENSIVE AUTOMATED VERIFICATION   ");
  console.log("   Double-Entry Ledger & Balance Aggregation Engine");
  console.log("==================================================\n");

  await connectDB();

  const TEST_PORT = 3003;
  const server = app.listen(TEST_PORT);
  await new Promise((r) => setTimeout(r, 500));

  const timestamp = Date.now();
  const userAEmail = `phase4_userA_${timestamp}@banking.local`;
  const userBEmail = `phase4_userB_${timestamp}@banking.local`;
  const testPassword = "Password123!";

  let userACookie = "";
  let userAId = "";
  let userAAccountId = "";

  let userBCookie = "";
  let userBId = "";
  let userBAccountId = "";

  try {
    // ----------------------------------------------------
    // Test 1: User A Registration + Account Auto-Provisioning
    // ----------------------------------------------------
    console.log("Test 1: Registering User A & auto-provisioning savings account...");
    const regResA = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/register",
      body: {
        name: "Ali Khan",
        email: userAEmail,
        password: testPassword
      },
      port: TEST_PORT
    });

    console.log(`- Status: ${regResA.status}`);
    if (regResA.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(regResA.body)}`);
    }

    userAId = regResA.body.data.user.id;
    userAAccountId = regResA.body.data.account ? regResA.body.data.account.id : null;
    const cookieHeaderA = regResA.headers["set-cookie"];
    if (cookieHeaderA && cookieHeaderA.length > 0) {
      userACookie = cookieHeaderA[0].split(";")[0];
    }
    console.log(`  [PASS] User A registered (ID: ${userAId}, Account: ${userAAccountId})`);

    // ----------------------------------------------------
    // Test 2: Initial Balance Check (Zero Balance)
    // ----------------------------------------------------
    console.log("\nTest 2: Verifying initial zero-balance for new account...");
    const initBalanceRes = await makeRequest({
      method: "GET",
      path: `/api/v1/accounts/${userAAccountId}/balance`,
      headers: { Cookie: userACookie },
      port: TEST_PORT
    });

    console.log(`- Status: ${initBalanceRes.status}`);
    console.log(`- Body:`, JSON.stringify(initBalanceRes.body.data));
    if (initBalanceRes.status !== 200) {
      throw new Error(`Expected 200 OK, got ${initBalanceRes.status}`);
    }
    if (
      initBalanceRes.body.data.balanceInCents !== 0 ||
      initBalanceRes.body.data.formattedBalance !== "$0.00" ||
      initBalanceRes.body.data.totalCredits !== 0 ||
      initBalanceRes.body.data.totalDebits !== 0
    ) {
      throw new Error(`Initial balance assertion failed: ${JSON.stringify(initBalanceRes.body.data)}`);
    }
    console.log("  [PASS] Initial balance is exactly 0 cents ($0.00)!");

    // ----------------------------------------------------
    // Test 3: Faucet Deposit -> Ledger Entry & Balance Assertion
    // ----------------------------------------------------
    console.log("\nTest 3: Depositing 50,000 cents ($500.00) via faucet...");
    const deposit1Res = await makeRequest({
      method: "POST",
      path: `/api/v1/accounts/${userAAccountId}/deposit`,
      headers: { Cookie: userACookie },
      body: { amountInCents: 50000 },
      port: TEST_PORT
    });

    console.log(`- Status: ${deposit1Res.status}`);
    if (deposit1Res.status !== 200) {
      throw new Error(`Expected 200 OK, got ${deposit1Res.status}: ${JSON.stringify(deposit1Res.body)}`);
    }
    if (deposit1Res.body.data.balanceInCents !== 50000) {
      throw new Error(`Deposit response balance mismatch: expected 50000, got ${deposit1Res.body.data.balanceInCents}`);
    }

    // Direct Database Verification: Ledger collection check
    const ledgerEntriesAfterDep1 = await Ledger.find({ accountId: userAAccountId });
    console.log(`- Ledger entries count in DB: ${ledgerEntriesAfterDep1.length}`);
    if (ledgerEntriesAfterDep1.length !== 1) {
      throw new Error(`Expected 1 ledger entry, found ${ledgerEntriesAfterDep1.length}`);
    }
    const entry1 = ledgerEntriesAfterDep1[0];
    if (entry1.type !== "CREDIT" || entry1.amount !== 50000) {
      throw new Error(`Ledger entry invalid: ${JSON.stringify(entry1)}`);
    }
    // Verify append-only immutability (no updatedAt)
    if (entry1.updatedAt !== undefined) {
      throw new Error("Ledger schema must not have updatedAt field (append-only violation)");
    }
    console.log("  [PASS] Append-only CREDIT ledger journal entry successfully created in DB!");

    // Verify GET /balance returns $500.00
    const balanceAfterDep1Res = await makeRequest({
      method: "GET",
      path: `/api/v1/accounts/${userAAccountId}/balance`,
      headers: { Cookie: userACookie },
      port: TEST_PORT
    });
    console.log(`- Balance API response:`, JSON.stringify(balanceAfterDep1Res.body.data));
    if (
      balanceAfterDep1Res.body.data.balanceInCents !== 50000 ||
      balanceAfterDep1Res.body.data.formattedBalance !== "$500.00"
    ) {
      throw new Error(`Balance mismatch: expected 50000 / $500.00, got ${balanceAfterDep1Res.body.data.balanceInCents}`);
    }
    console.log("  [PASS] Balance correctly derived as $500.00 (50,000 cents)!");

    // ----------------------------------------------------
    // Test 4: Second Deposit & Aggregation Sum
    // ----------------------------------------------------
    console.log("\nTest 4: Depositing second amount of 25,000 cents ($250.00)...");
    const deposit2Res = await makeRequest({
      method: "POST",
      path: `/api/v1/accounts/${userAAccountId}/deposit`,
      headers: { Cookie: userACookie },
      body: { amountInCents: 25000 },
      port: TEST_PORT
    });

    console.log(`- Status: ${deposit2Res.status}`);
    if (deposit2Res.status !== 200) {
      throw new Error(`Expected 200 OK, got ${deposit2Res.status}`);
    }

    const ledgerEntriesAfterDep2 = await Ledger.find({ accountId: userAAccountId });
    if (ledgerEntriesAfterDep2.length !== 2) {
      throw new Error(`Expected 2 ledger entries, found ${ledgerEntriesAfterDep2.length}`);
    }

    const balanceAfterDep2Res = await makeRequest({
      method: "GET",
      path: `/api/v1/accounts/${userAAccountId}/balance`,
      headers: { Cookie: userACookie },
      port: TEST_PORT
    });
    console.log(`- Balance API after second deposit:`, JSON.stringify(balanceAfterDep2Res.body.data));
    if (
      balanceAfterDep2Res.body.data.balanceInCents !== 75000 ||
      balanceAfterDep2Res.body.data.formattedBalance !== "$750.00" ||
      balanceAfterDep2Res.body.data.totalCredits !== 75000
    ) {
      throw new Error(`Aggregation pipeline sum mismatch: expected 75000, got ${balanceAfterDep2Res.body.data.balanceInCents}`);
    }
    console.log("  [PASS] Aggregation Pipeline correctly summed multiple credits to $750.00 (75,000 cents)!");

    // ----------------------------------------------------
    // Test 5: Register User B & Test Ownership Security Enforcement
    // ----------------------------------------------------
    console.log("\nTest 5: Registering User B and testing balance ownership protection...");
    const regResB = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/register",
      body: {
        name: "Bilal Ahmed",
        email: userBEmail,
        password: testPassword
      },
      port: TEST_PORT
    });

    userBId = regResB.body.data.user.id;
    userBAccountId = regResB.body.data.account ? regResB.body.data.account.id : null;
    const cookieHeaderB = regResB.headers["set-cookie"];
    if (cookieHeaderB && cookieHeaderB.length > 0) {
      userBCookie = cookieHeaderB[0].split(";")[0];
    }
    console.log(`  - User B registered (ID: ${userBId})`);

    // User B tries to view User A's balance -> Should be 403 Forbidden
    const unauthBalanceRes = await makeRequest({
      method: "GET",
      path: `/api/v1/accounts/${userAAccountId}/balance`,
      headers: { Cookie: userBCookie },
      port: TEST_PORT
    });

    console.log(`- Status User B accessing User A balance: ${unauthBalanceRes.status}`);
    if (unauthBalanceRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-account balance access, got ${unauthBalanceRes.status}`);
    }
    console.log("  [PASS] Cross-account balance access blocked with 403 Forbidden!");

    // ----------------------------------------------------
    // Test 6: Cross-Account Deposit Protection
    // ----------------------------------------------------
    console.log("\nTest 6: Testing User B attempting to deposit to User A's account...");
    const crossDepositRes = await makeRequest({
      method: "POST",
      path: `/api/v1/accounts/${userAAccountId}/deposit`,
      headers: { Cookie: userBCookie },
      body: { amountInCents: 10000 },
      port: TEST_PORT
    });

    console.log(`- Status User B depositing to User A account: ${crossDepositRes.status}`);
    if (crossDepositRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unauthorized deposit, got ${crossDepositRes.status}`);
    }
    console.log("  [PASS] Cross-account deposit blocked with 403 Forbidden!");

    // ----------------------------------------------------
    // Test 7: Non-Existent Account Check (404)
    // ----------------------------------------------------
    console.log("\nTest 7: Querying balance for non-existent account ID...");
    const nonExistentId = new mongoose.Types.ObjectId();
    const notFoundRes = await makeRequest({
      method: "GET",
      path: `/api/v1/accounts/${nonExistentId}/balance`,
      headers: { Cookie: userACookie },
      port: TEST_PORT
    });

    console.log(`- Status: ${notFoundRes.status}`);
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected 404 Not Found, got ${notFoundRes.status}`);
    }
    console.log("  [PASS] Non-existent account properly returns 404 Not Found!");

    // ----------------------------------------------------
    // Test 8: Invalid Account ID Format Check (400)
    // ----------------------------------------------------
    console.log("\nTest 8: Querying balance with invalid account ID format...");
    const badIdRes = await makeRequest({
      method: "GET",
      path: `/api/v1/accounts/invalid-id-string/balance`,
      headers: { Cookie: userACookie },
      port: TEST_PORT
    });

    console.log(`- Status: ${badIdRes.status}`);
    if (badIdRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${badIdRes.status}`);
    }
    console.log("  [PASS] Invalid account ID format rejected with 400 Bad Request!");

    // ----------------------------------------------------
    // Test 9: Unauthenticated Balance Query (401)
    // ----------------------------------------------------
    console.log("\nTest 9: Querying balance without authentication cookie...");
    const noAuthRes = await makeRequest({
      method: "GET",
      path: `/api/v1/accounts/${userAAccountId}/balance`,
      port: TEST_PORT
    });

    console.log(`- Status: ${noAuthRes.status}`);
    if (noAuthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${noAuthRes.status}`);
    }
    console.log("  [PASS] Unauthenticated balance request rejected with 401 Unauthorized!");

    // ----------------------------------------------------
    // Test 10: Invalid Deposit Validation Check (400)
    // ----------------------------------------------------
    console.log("\nTest 10: Testing invalid deposit parameters (0 cents)...");
    const zeroDepositRes = await makeRequest({
      method: "POST",
      path: `/api/v1/accounts/${userAAccountId}/deposit`,
      headers: { Cookie: userACookie },
      body: { amountInCents: 0 },
      port: TEST_PORT
    });

    console.log(`- Status: ${zeroDepositRes.status}`);
    if (zeroDepositRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${zeroDepositRes.status}`);
    }
    console.log("  [PASS] Zero/invalid deposit amount rejected with 400 Bad Request!");

    console.log("\n==================================================");
    console.log("   ALL 10 PHASE 4 VERIFICATION TESTS PASSED!     ");
    console.log("==================================================");
  } finally {
    // Teardown and Cleanup
    console.log("\nCleaning up test data from MongoDB...");
    if (userAId) {
      await User.deleteOne({ _id: userAId });
      await Account.deleteMany({ user: userAId });
      if (userAAccountId) {
        await Ledger.deleteMany({ accountId: userAAccountId });
      }
    }
    if (userBId) {
      await User.deleteOne({ _id: userBId });
      await Account.deleteMany({ user: userBId });
      if (userBAccountId) {
        await Ledger.deleteMany({ accountId: userBAccountId });
      }
    }
    server.close();
    await mongoose.connection.close();
    console.log("Cleanup complete and server closed.");
  }
}

runPhase4Verification().catch((err) => {
  console.error("\n❌ PHASE 4 VERIFICATION FAILED:", err);
  process.exit(1);
});
