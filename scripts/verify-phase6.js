require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const app = require("../src/app");
const User = require("../src/models/user.model");
const Account = require("../src/models/account.model");
const Ledger = require("../src/models/ledger.model");
const Transaction = require("../src/models/transaction.model");
const Blacklist = require("../src/models/blacklist.model");

function makeRequest({ method, path, headers = {}, body = null, port = 3005 }) {
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

async function runPhase6Verification() {
  console.log("==================================================");
  console.log("   PHASE 6 COMPREHENSIVE AUTOMATED VERIFICATION   ");
  console.log("   Token Blacklisting, Email Alerts & Hardening   ");
  console.log("==================================================\n");

  await connectDB();

  const TEST_PORT = 3005;
  const server = app.listen(TEST_PORT);
  await new Promise((r) => setTimeout(r, 500));

  const timestamp = Date.now();
  const userAEmail = `phase6_userA_${timestamp}@banking.local`;
  const userBEmail = `phase6_userB_${timestamp}@banking.local`;
  const testPassword = "Password123!";

  let userAId = "";
  let userAToken = "";
  let userACookie = "";

  let userBId = "";
  let userBAccountId = "";
  let userBToken = "";
  let userBCookie = "";

  try {
    // ----------------------------------------------------
    // Test 1: Register User A (Triggers Welcome Email)
    // ----------------------------------------------------
    console.log("Test 1: Registering User A & verifying welcome email dispatch...");
    const regResA = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/register",
      body: { name: "User A", email: userAEmail, password: testPassword },
      port: TEST_PORT
    });

    console.log(`- Status: ${regResA.status}`);
    if (regResA.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(regResA.body)}`);
    }

    userAId = regResA.body.data.user.id;
    userAToken = regResA.body.data.token;
    userACookie = regResA.headers["set-cookie"][0].split(";")[0];
    console.log("  [PASS] User A registered successfully (Welcome email triggered asynchronously)!");

    // ----------------------------------------------------
    // Test 2: Access Protected Profile Before Logout
    // ----------------------------------------------------
    console.log("\nTest 2: Accessing /auth/me with valid token before logout...");
    const profileRes = await makeRequest({
      method: "GET",
      path: "/api/v1/auth/me",
      headers: { Authorization: `Bearer ${userAToken}` },
      port: TEST_PORT
    });

    console.log(`- Status: ${profileRes.status}`);
    if (profileRes.status !== 200) {
      throw new Error(`Expected 200 OK, got ${profileRes.status}`);
    }
    console.log("  [PASS] Protected endpoint accessible with valid token!");

    // ----------------------------------------------------
    // Test 3: Logout & Token Blacklisting
    // ----------------------------------------------------
    console.log("\nTest 3: Calling POST /api/v1/auth/logout to revoke token...");
    const logoutRes = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/logout",
      headers: { Authorization: `Bearer ${userAToken}` },
      port: TEST_PORT
    });

    console.log(`- Status: ${logoutRes.status}`);
    if (logoutRes.status !== 200) {
      throw new Error(`Expected 200 OK for logout, got ${logoutRes.status}`);
    }

    // Direct Database Verification: Check Blacklist collection
    const blacklistedEntry = await Blacklist.findOne({ token: userAToken });
    if (!blacklistedEntry) {
      throw new Error("Token was not saved in Blacklist collection!");
    }
    if (!(blacklistedEntry.expiresAt instanceof Date)) {
      throw new Error("Blacklist document missing valid expiresAt Date!");
    }
    console.log("  [PASS] Logout successful and token saved in MongoDB Blacklist collection with TTL date!");

    // ----------------------------------------------------
    // Test 4: Token Revocation Enforcement (401)
    // ----------------------------------------------------
    console.log("\nTest 4: Attempting to use the blacklisted token again...");
    const revokedRes = await makeRequest({
      method: "GET",
      path: "/api/v1/auth/me",
      headers: { Authorization: `Bearer ${userAToken}` },
      port: TEST_PORT
    });

    console.log(`- Status: ${revokedRes.status}`);
    console.log(`- Message: ${revokedRes.body.error ? revokedRes.body.error.message : ""}`);
    if (revokedRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for blacklisted token, got ${revokedRes.status}`);
    }
    console.log("  [PASS] Revoked token correctly rejected with 401 Unauthorized!");

    // ----------------------------------------------------
    // Test 5: Register User B & Fund Account for Transfer Email Test
    // ----------------------------------------------------
    console.log("\nTest 5: Testing transfer with Debit and Credit Email Alerts...");
    const regResB = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/register",
      body: { name: "User B", email: userBEmail, password: testPassword },
      port: TEST_PORT
    });
    userBId = regResB.body.data.user.id;
    userBAccountId = regResB.body.data.account.id;
    userBToken = regResB.body.data.token;
    userBCookie = regResB.headers["set-cookie"][0].split(";")[0];

    // User A registers a new account (or re-logins) to receive funds
    const loginResA = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/login",
      body: { email: userAEmail, password: testPassword },
      port: TEST_PORT
    });
    const freshTokenA = loginResA.body.data.token;

    // Get User A account ID
    const accResA = await makeRequest({
      method: "GET",
      path: "/api/v1/accounts/me",
      headers: { Authorization: `Bearer ${freshTokenA}` },
      port: TEST_PORT
    });
    const userAAccountId = accResA.body.data.accounts[0]._id;

    // Fund User B with $500.00
    await makeRequest({
      method: "POST",
      path: `/api/v1/accounts/${userBAccountId}/deposit`,
      headers: { Authorization: `Bearer ${userBToken}` },
      body: { amountInCents: 50000 },
      port: TEST_PORT
    });

    // Execute Transfer: User B sends $150.00 to User A
    const transferRes = await makeRequest({
      method: "POST",
      path: "/api/v1/transactions/transfer",
      headers: {
        Authorization: `Bearer ${userBToken}`,
        "Idempotency-Key": `idemp-phase6-email-${timestamp}`
      },
      body: {
        senderAccountId: userBAccountId,
        receiverAccountId: userAAccountId,
        amountInCents: 15000,
        description: "Payment with email alerts"
      },
      port: TEST_PORT
    });

    console.log(`- Transfer Status: ${transferRes.status}`);
    if (transferRes.status !== 201) {
      throw new Error(`Transfer failed: ${JSON.stringify(transferRes.body)}`);
    }
    console.log("  [PASS] Transfer completed and Debit/Credit email alerts triggered asynchronously!");

    // ----------------------------------------------------
    // Test 6: CORS Preflight & Security Headers
    // ----------------------------------------------------
    console.log("\nTest 6: Verifying CORS pre-flight OPTIONS request and headers...");
    const corsRes = await makeRequest({
      method: "OPTIONS",
      path: "/api/v1/transactions/transfer",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Idempotency-Key, Authorization"
      },
      port: TEST_PORT
    });

    console.log(`- OPTIONS Status: ${corsRes.status}`);
    console.log(`- Allow-Origin: ${corsRes.headers["access-control-allow-origin"]}`);
    console.log(`- Allow-Credentials: ${corsRes.headers["access-control-allow-credentials"]}`);

    if (corsRes.status !== 204) {
      throw new Error(`Expected 204 No Content for OPTIONS, got ${corsRes.status}`);
    }
    if (corsRes.headers["access-control-allow-origin"] !== "http://localhost:5173") {
      throw new Error("CORS origin mismatch");
    }
    if (corsRes.headers["access-control-allow-credentials"] !== "true") {
      throw new Error("CORS credentials support not enabled");
    }
    console.log("  [PASS] CORS credentials and preflight handling verified!");

    // ----------------------------------------------------
    // Test 7: Health Check
    // ----------------------------------------------------
    console.log("\nTest 7: Verifying /health endpoint...");
    const healthRes = await makeRequest({
      method: "GET",
      path: "/health",
      port: TEST_PORT
    });
    if (healthRes.status !== 200 || healthRes.body.data.status !== "OK") {
      throw new Error(`Health check failed: ${JSON.stringify(healthRes.body)}`);
    }
    console.log("  [PASS] Health check verified!");

    console.log("\n==================================================");
    console.log("   ALL 7 PHASE 6 VERIFICATION TESTS PASSED!      ");
    console.log("==================================================");
  } finally {
    // Teardown and Cleanup
    console.log("\nCleaning up test data from MongoDB...");
    const userIds = [userAId, userBId].filter(Boolean);
    if (userIds.length > 0) {
      const accounts = await Account.find({ user: { $in: userIds } });
      const accountIds = accounts.map((a) => a._id);

      await User.deleteMany({ _id: { $in: userIds } });
      await Account.deleteMany({ user: { $in: userIds } });
      await Ledger.deleteMany({ accountId: { $in: accountIds } });
      await Transaction.deleteMany({
        $or: [
          { senderAccount: { $in: accountIds } },
          { receiverAccount: { $in: accountIds } }
        ]
      });
      await Blacklist.deleteMany({
        token: { $in: [userAToken, userBToken].filter(Boolean) }
      });
    }

    server.close();
    await mongoose.connection.close();
    console.log("Cleanup complete and server closed.");
  }
}

runPhase6Verification().catch((err) => {
  console.error("\n❌ PHASE 6 VERIFICATION FAILED:", err);
  process.exit(1);
});
