require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const app = require("../src/app");
const User = require("../src/models/user.model");
const Account = require("../src/models/account.model");

function makeRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: 3002, // Test on port 3002
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

async function runPhase3Verification() {
  console.log("==================================================");
  console.log("   PHASE 3 COMPREHENSIVE AUTOMATED VERIFICATION   ");
  console.log("==================================================\n");

  await connectDB();

  const server = app.listen(3002);
  await new Promise((r) => setTimeout(r, 500));

  const testEmail = `phase3_user_${Date.now()}@banking.local`;
  const testPassword = "SuperPassword123!";
  const testName = "Rashid Minhas";
  let authCookie = "";
  let defaultAccountId = "";
  let createdUserId = "";

  try {
    // ----------------------------------------------------
    // Test 1: User Registration + Auto-Provision Savings Account
    // ----------------------------------------------------
    console.log("Test 1: Registering user & auto-provisioning savings account...");
    const regRes = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/register",
      body: {
        name: testName,
        email: testEmail,
        password: testPassword
      }
    });

    console.log(`- Status: ${regRes.status}`);
    if (regRes.status !== 201 || !regRes.body.data.account) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
    }

    const acct = regRes.body.data.account;
    defaultAccountId = acct.id;
    createdUserId = regRes.body.data.user.id;

    if (!acct.accountNumber || acct.accountNumber.length !== 10) {
      throw new Error(`Expected 10-digit account number, got ${acct.accountNumber}`);
    }
    if (acct.accountType !== "SAVINGS" || acct.status !== "ACTIVE") {
      throw new Error(`Unexpected account state: ${JSON.stringify(acct)}`);
    }

    const setCookie = regRes.headers["set-cookie"];
    authCookie = setCookie[0].split(";")[0];
    console.log(`  [PASS] Auto-provisioned 10-digit Savings Account: ${acct.accountNumber}`);

    // ----------------------------------------------------
    // Test 2: Get Customer Accounts (GET /api/v1/accounts/me)
    // ----------------------------------------------------
    console.log("\nTest 2: Fetching customer accounts via GET /api/v1/accounts/me...");
    const getRes = await makeRequest({
      method: "GET",
      path: "/api/v1/accounts/me",
      headers: { Cookie: authCookie }
    });

    console.log(`- Status: ${getRes.status}`);
    if (getRes.status !== 200 || !Array.isArray(getRes.body.data.accounts)) {
      throw new Error(`Failed to fetch accounts: ${JSON.stringify(getRes.body)}`);
    }
    if (getRes.body.data.accounts.length !== 1) {
      throw new Error(`Expected 1 account, found ${getRes.body.data.accounts.length}`);
    }
    console.log("  [PASS] Successfully retrieved 1 active savings account for user!");

    // ----------------------------------------------------
    // Test 3: Create Additional CHECKING Account
    // ----------------------------------------------------
    console.log("\nTest 3: Creating secondary CHECKING account (POST /api/v1/accounts)...");
    const createRes = await makeRequest({
      method: "POST",
      path: "/api/v1/accounts",
      headers: { Cookie: authCookie },
      body: { accountType: "CHECKING", currency: "USD" }
    });

    console.log(`- Status: ${createRes.status}`);
    if (createRes.status !== 201 || createRes.body.data.account.accountType !== "CHECKING") {
      throw new Error(`Failed to create checking account: ${JSON.stringify(createRes.body)}`);
    }
    console.log(`  [PASS] Secondary Checking Account created: ${createRes.body.data.account.accountNumber}`);

    // ----------------------------------------------------
    // Test 4: Duplicate Account Type Rejection (409 Conflict)
    // ----------------------------------------------------
    console.log("\nTest 4: Attempting to create duplicate CHECKING account (Should return 409)...");
    const dupRes = await makeRequest({
      method: "POST",
      path: "/api/v1/accounts",
      headers: { Cookie: authCookie },
      body: { accountType: "CHECKING" }
    });

    console.log(`- Status: ${dupRes.status}`);
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict, got ${dupRes.status}`);
    }
    console.log("  [PASS] Duplicate account creation correctly rejected with 409 Conflict!");

    // ----------------------------------------------------
    // Test 5: Faucet Deposit (POST /api/v1/accounts/:accountId/deposit)
    // ----------------------------------------------------
    console.log("\nTest 5: Testing Faucet Deposit of $500.00 (50,000 cents)...");
    const depositRes = await makeRequest({
      method: "POST",
      path: `/api/v1/accounts/${defaultAccountId}/deposit`,
      headers: { Cookie: authCookie },
      body: { amountInCents: 50000 }
    });

    console.log(`- Status: ${depositRes.status}`);
    if (depositRes.status !== 200 || depositRes.body.data.depositedAmountInCents !== 50000) {
      throw new Error(`Deposit failed: ${JSON.stringify(depositRes.body)}`);
    }
    console.log("  [PASS] Faucet deposit of 50,000 cents ($500.00) completed successfully!");

    // ----------------------------------------------------
    // Test 6: Invalid Deposit Amount (Validation check)
    // ----------------------------------------------------
    console.log("\nTest 6: Testing invalid negative deposit (Should return 400)...");
    const badDepositRes = await makeRequest({
      method: "POST",
      path: `/api/v1/accounts/${defaultAccountId}/deposit`,
      headers: { Cookie: authCookie },
      body: { amountInCents: -500 }
    });

    console.log(`- Status: ${badDepositRes.status}`);
    if (badDepositRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${badDepositRes.status}`);
    }
    console.log("  [PASS] Invalid deposit amount rejected with 400 Bad Request!");

    // ----------------------------------------------------
    // Test 7: Unauthorized Access Check (No Cookie)
    // ----------------------------------------------------
    console.log("\nTest 7: Accessing /api/v1/accounts/me without cookie (Should return 401)...");
    const noAuthRes = await makeRequest({
      method: "GET",
      path: "/api/v1/accounts/me"
    });

    console.log(`- Status: ${noAuthRes.status}`);
    if (noAuthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${noAuthRes.status}`);
    }
    console.log("  [PASS] Unauthenticated access blocked with 401 Unauthorized!");

    console.log("\n==================================================");
    console.log("   ALL 7 PHASE 3 VERIFICATION TESTS PASSED!       ");
    console.log("==================================================");
  } finally {
    // Cleanup
    if (createdUserId) {
      await User.deleteOne({ _id: createdUserId });
      await Account.deleteMany({ user: createdUserId });
    }
    server.close();
    await mongoose.connection.close();
  }
}

runPhase3Verification().catch((err) => {
  console.error("\n❌ PHASE 3 VERIFICATION FAILED:", err);
  process.exit(1);
});
