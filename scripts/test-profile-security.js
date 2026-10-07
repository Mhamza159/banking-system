/**
 * Comprehensive Automated Verification Suite for Milestone 3:
 * Profile Security Settings, Transfer Limits & Transaction TPIN Controls
 *
 * Covers:
 * 1. User Profile Retrieval & Mass-Assignment Safe Name Updates
 * 2. In-Session Password Rotation & Credential Verification
 * 3. 4-Digit Cryptographic TPIN Setup, Validation & auth/me Hydration
 * 4. Outbound Transfer Authorization: TPIN Mandatory Gate
 * 5. TPIN Failure Tracking, Zero Ledger Mutation & Anti-Brute-Force Lockout (15 min)
 * 6. Velocity Limits Configuration, Institutional Ceilings ($500k Daily Ceiling)
 * 7. Outbound Sender Velocity Limit Gate & Rejection
 * 8. Inbound Beneficiary Velocity Limit Gate & Rejection
 * 9. Successful Atomic Transfer with Correct TPIN and Counter Reset
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../src/config/db");
const User = require("../src/models/user.model");

const BASE_URL = "http://localhost:3000/api/v1";

async function runProfileSecurityTests() {
  console.log("==================================================================");
  console.log("🔒 Running Milestone 3 Comprehensive Profile & Security Audit Suite");
  console.log("==================================================================\n");

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

  const timestamp = Date.now();

  // Helper to register user, extract auth cookie and token, and get account
  async function setupUser(name, email, password = "TestPassword123!") {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const regData = await regRes.json();
    const token = regData.data?.token;
    const cookie = regRes.headers.get("set-cookie") || "";
    const headers = {
      "Content-Type": "application/json",
      Cookie: cookie,
      Authorization: `Bearer ${token}`
    };
    return {
      id: regData.data?.user?.id,
      accountId: regData.data?.account?.id,
      accountNumber: regData.data?.account?.accountNumber,
      headers
    };
  }

  // Connect to DB for direct setup/reset where needed
  await connectDB();

  try {
    // ----------------------------------------------------------------
    // SECTION 1: Profile Retrieval & Mass-Assignment Protection
    // ----------------------------------------------------------------
    console.log("--- SECTION 1: Profile Retrieval & Mass-Assignment Protection ---");
    const userA = await setupUser(
      "Original Name",
      `test-profile-${timestamp}@bank.internal`
    );

    // 1.1 GET /api/v1/profile
    const profileRes = await fetch(`${BASE_URL}/profile`, {
      headers: userA.headers
    });
    const profileData = await profileRes.json();
    assert(
      "GET /profile returns 200 OK",
      profileRes.status === 200,
      `Status: ${profileRes.status}`
    );
    assert(
      "Profile response contains user, limits, usage, and ceilings",
      Boolean(
        profileData.data?.id &&
        profileData.data?.transferLimits &&
        profileData.data?.receivingLimits &&
        profileData.data?.usage &&
        profileData.data?.systemCeilings
      )
    );
    assert(
      "Initial TPIN status reports hasTpin === false",
      profileData.data?.hasTpin === false
    );

    // 1.2 Verify /auth/me hydration
    const authMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: userA.headers
    });
    const authMeData = await authMeRes.json();
    assert(
      "GET /auth/me hydrates hasTpin === false and isTpinLocked === false",
      authMeData.data?.user?.hasTpin === false && authMeData.data?.user?.isTpinLocked === false
    );

    // 1.3 Mass-Assignment Attack Test: Attempt to escalate role to ADMIN
    const updateRes = await fetch(`${BASE_URL}/profile`, {
      method: "PATCH",
      headers: userA.headers,
      body: JSON.stringify({
        name: "Verified Executive",
        role: "ADMIN",
        isEmailVerified: true,
        tpin: "9999"
      })
    });
    const updateData = await updateRes.json();
    assert(
      "PATCH /profile returns 200 OK for legal name update",
      updateRes.status === 200
    );
    assert(
      "Legal name successfully updated",
      (updateData.data?.name || updateData.data?.user?.name) === "Verified Executive"
    );
    assert(
      "Mass-assignment protection: role remained CUSTOMER",
      (updateData.data?.role || updateData.data?.user?.role) === "CUSTOMER"
    );

    // ----------------------------------------------------------------
    // SECTION 2: In-Session Password Rotation
    // ----------------------------------------------------------------
    console.log("\n--- SECTION 2: In-Session Password Rotation ---");
    // 2.1 Wrong current password
    const badPassRes = await fetch(`${BASE_URL}/profile/password`, {
      method: "PATCH",
      headers: userA.headers,
      body: JSON.stringify({
        currentPassword: "WrongPassword!",
        newPassword: "BrandNewPassword123!",
        confirmPassword: "BrandNewPassword123!"
      })
    });
    assert(
      "Password change with wrong current password rejected with 401 Unauthorized",
      badPassRes.status === 401
    );

    // 2.2 Valid password change
    const goodPassRes = await fetch(`${BASE_URL}/profile/password`, {
      method: "PATCH",
      headers: userA.headers,
      body: JSON.stringify({
        currentPassword: "TestPassword123!",
        newPassword: "BrandNewPassword123!",
        confirmPassword: "BrandNewPassword123!"
      })
    });
    assert(
      "Password change with valid current password succeeds with 200 OK",
      goodPassRes.status === 200
    );

    // 2.3 Verify old password rejected, new password accepted
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test-profile-${timestamp}@bank.internal`,
        password: "TestPassword123!"
      })
    });
    assert("Old password cannot log in (401 Unauthorized)", oldLoginRes.status === 401);

    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test-profile-${timestamp}@bank.internal`,
        password: "BrandNewPassword123!"
      })
    });
    assert("New password successfully logs in (200 OK)", newLoginRes.status === 200);

    // ----------------------------------------------------------------
    // SECTION 3: 4-Digit TPIN Setup & Validation
    // ----------------------------------------------------------------
    console.log("\n--- SECTION 3: 4-Digit TPIN Setup & Validation ---");
    // 3.1 Invalid TPIN format (3 digits, non-numeric)
    const shortPinRes = await fetch(`${BASE_URL}/profile/tpin`, {
      method: "POST",
      headers: userA.headers,
      body: JSON.stringify({ tpin: "123", confirmTpin: "123" })
    });
    assert("3-digit TPIN rejected with 400 Bad Request", shortPinRes.status === 400);

    const letterPinRes = await fetch(`${BASE_URL}/profile/tpin`, {
      method: "POST",
      headers: userA.headers,
      body: JSON.stringify({ tpin: "abcd", confirmTpin: "abcd" })
    });
    assert("Non-numeric TPIN rejected with 400 Bad Request", letterPinRes.status === 400);

    // 3.2 Valid TPIN setup
    const setPinRes = await fetch(`${BASE_URL}/profile/tpin`, {
      method: "POST",
      headers: userA.headers,
      body: JSON.stringify({ tpin: "7412", confirmTpin: "7412" })
    });
    assert("Valid 4-digit TPIN set with 201 Created", setPinRes.status === 201);

    // 3.3 Verify /auth/me now returns hasTpin === true
    const authMeWithPinRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: userA.headers
    });
    const authMeWithPinData = await authMeWithPinRes.json();
    assert(
      "/auth/me now reflects hasTpin === true",
      authMeWithPinData.data?.user?.hasTpin === true
    );

    // 3.4 Duplicate TPIN setup rejected
    const dupPinRes = await fetch(`${BASE_URL}/profile/tpin`, {
      method: "POST",
      headers: userA.headers,
      body: JSON.stringify({ tpin: "9999", confirmTpin: "9999" })
    });
    assert(
      "Setting TPIN when already active rejected with 409 Conflict or 400 Bad Request",
      dupPinRes.status === 409 || dupPinRes.status === 400,
      `Status: ${dupPinRes.status}`
    );

    // ----------------------------------------------------------------
    // SECTION 4: Transfer Gate 1 - TPIN Enforcement & Anti-Brute-Force Lockout
    // ----------------------------------------------------------------
    console.log("\n--- SECTION 4: Transfer Gate 1 - TPIN & Anti-Brute-Force Lockout ---");
    // Fund User A with $1,000.00 (100,000 cents)
    await fetch(`${BASE_URL}/accounts/${userA.accountId}/deposit`, {
      method: "POST",
      headers: userA.headers,
      body: JSON.stringify({ amountInCents: 100000 })
    });

    const userB = await setupUser(
      "Beneficiary User",
      `beneficiary-${timestamp}@bank.internal`
    );

    // 4.1 Missing TPIN on configured sender
    const noPinRes = await fetch(`${BASE_URL}/transactions/transfer`, {
      method: "POST",
      headers: {
        ...userA.headers,
        "Idempotency-Key": `idemp-no-pin-${timestamp}`
      },
      body: JSON.stringify({
        senderAccountId: userA.accountId,
        receiverAccountId: userB.accountId,
        amountInCents: 5000,
        description: "Missing TPIN transfer"
      })
    });
    assert("Transfer without TPIN on configured account rejected with 400 Bad Request", noPinRes.status === 400);

    // 4.2 Incorrect TPIN
    const wrongPinRes = await fetch(`${BASE_URL}/transactions/transfer`, {
      method: "POST",
      headers: {
        ...userA.headers,
        "Idempotency-Key": `idemp-wrong-pin-1-${timestamp}`
      },
      body: JSON.stringify({
        senderAccountId: userA.accountId,
        receiverAccountId: userB.accountId,
        amountInCents: 5000,
        tpin: "0000",
        description: "Wrong TPIN transfer"
      })
    });
    const wrongPinData = await wrongPinRes.json();
    assert("Wrong TPIN rejected with 401 Unauthorized", wrongPinRes.status === 401);
    assert(
      "Error payload specifies remaining attempts",
      Boolean(wrongPinData.error?.details?.remainingAttempts === 4 || wrongPinData.error?.message?.includes("4"))
    );

    // 4.3 Brute-force lockout (fail 4 more times $\to$ total 5 failures)
    for (let i = 2; i <= 5; i++) {
      await fetch(`${BASE_URL}/transactions/transfer`, {
        method: "POST",
        headers: {
          ...userA.headers,
          "Idempotency-Key": `idemp-wrong-pin-${i}-${timestamp}`
        },
        body: JSON.stringify({
          senderAccountId: userA.accountId,
          receiverAccountId: userB.accountId,
          amountInCents: 5000,
          tpin: "0000"
        })
      });
    }

    // 4.4 Attempt transfer while locked even with correct TPIN
    const lockedRes = await fetch(`${BASE_URL}/transactions/transfer`, {
      method: "POST",
      headers: {
        ...userA.headers,
        "Idempotency-Key": `idemp-locked-${timestamp}`
      },
      body: JSON.stringify({
        senderAccountId: userA.accountId,
        receiverAccountId: userB.accountId,
        amountInCents: 5000,
        tpin: "7412"
      })
    });
    assert("Transfer during brute-force lockout rejected with 403 Forbidden", lockedRes.status === 403);

    // Reset lockout for User A to continue testing
    await User.updateOne(
      { _id: userA.id },
      { $set: { tpinFailedAttempts: 0, tpinLockedUntil: null } }
    );

    // ----------------------------------------------------------------
    // SECTION 5: Transfer Gate 2 - Velocity Limits & Institutional Ceilings
    // ----------------------------------------------------------------
    console.log("\n--- SECTION 5: Transfer Gate 2 - Velocity Limits Engine ---");
    // 5.1 Set limit exceeding institutional ceiling ($500,000 daily ceiling = 50,000,000 cents)
    const excessLimitRes = await fetch(`${BASE_URL}/profile/limits`, {
      method: "PATCH",
      headers: userA.headers,
      body: JSON.stringify({
        transferLimits: {
          daily: 60000000 // $600k (exceeds $500k ceiling)
        }
      })
    });
    assert(
      "Setting limit above institutional ceiling rejected with 400 Bad Request",
      excessLimitRes.status === 400
    );

    // 5.2 Set user daily transfer limit to $150.00 (15,000 cents)
    const setLimitRes = await fetch(`${BASE_URL}/profile/limits`, {
      method: "PATCH",
      headers: userA.headers,
      body: JSON.stringify({
        transferLimits: {
          daily: 15000,
          weekly: 50000,
          yearly: 200000
        }
      })
    });
    assert("Setting valid transfer limits returns 200 OK", setLimitRes.status === 200);

    // 5.3 Transfer within limit ($100.00 = 10,000 cents)
    const validTransferRes = await fetch(`${BASE_URL}/transactions/transfer`, {
      method: "POST",
      headers: {
        ...userA.headers,
        "Idempotency-Key": `idemp-valid-1-${timestamp}`
      },
      body: JSON.stringify({
        senderAccountId: userA.accountId,
        receiverAccountId: userB.accountId,
        amountInCents: 10000,
        tpin: "7412",
        description: "Valid transfer within limit"
      })
    });
    assert(
      "Transfer with correct TPIN within daily limit succeeds with 201 Created",
      validTransferRes.status === 201
    );

    // 5.4 Transfer exceeding daily remaining limit ($100 spent, $150 limit, attempting $100 more)
    const breachTransferRes = await fetch(`${BASE_URL}/transactions/transfer`, {
      method: "POST",
      headers: {
        ...userA.headers,
        "Idempotency-Key": `idemp-breach-${timestamp}`
      },
      body: JSON.stringify({
        senderAccountId: userA.accountId,
        receiverAccountId: userB.accountId,
        amountInCents: 10000,
        tpin: "7412",
        description: "Breach transfer"
      })
    });
    assert(
      "Transfer exceeding daily limit rejected with 400 Bad Request",
      breachTransferRes.status === 400
    );

    // 5.5 Inbound Receiving Limit Gate
    // Set User B's receiving daily limit to $50.00 (5,000 cents)
    await fetch(`${BASE_URL}/profile/limits`, {
      method: "PATCH",
      headers: userB.headers,
      body: JSON.stringify({
        receivingLimits: {
          daily: 5000,
          weekly: 20000,
          yearly: 100000
        }
      })
    });

    // Reset User A's transfer limits higher so User A doesn't hit sender limit
    await fetch(`${BASE_URL}/profile/limits`, {
      method: "PATCH",
      headers: userA.headers,
      body: JSON.stringify({
        transferLimits: {
          daily: 500000,
          weekly: 2500000,
          yearly: 10000000
        }
      })
    });

    // User A attempts to send $80.00 to User B whose daily receiving limit is $50.00
    const receiverBreachRes = await fetch(`${BASE_URL}/transactions/transfer`, {
      method: "POST",
      headers: {
        ...userA.headers,
        "Idempotency-Key": `idemp-receiver-breach-${timestamp}`
      },
      body: JSON.stringify({
        senderAccountId: userA.accountId,
        receiverAccountId: userB.accountId,
        amountInCents: 8000,
        tpin: "7412",
        description: "Receiver limit breach transfer"
      })
    });
    assert(
      "Transfer exceeding beneficiary receiving limit rejected with 400 Bad Request",
      receiverBreachRes.status === 400
    );

    // ----------------------------------------------------------------
    // SECTION 6: Balance Invariance & Ledger Integrity
    // ----------------------------------------------------------------
    console.log("\n--- SECTION 6: Balance Invariance & Ledger Integrity ---");
    // Initial deposit: 100,000 cents.
    // Succeeded transfer: 10,000 cents.
    // Expected User A balance: exactly 90,000 cents ($900.00).
    const balRes = await fetch(`${BASE_URL}/accounts/${userA.accountId}/balance`, {
      headers: userA.headers
    });
    const balData = await balRes.json();
    assert(
      "User A final balance is exactly $900.00 (all rejected transfers caused zero ledger changes)",
      balData.data?.balanceInCents === 90000,
      `Balance: ${balData.data?.balanceInCents}`
    );

    // User B received exactly 10,000 cents ($100.00).
    const balBRes = await fetch(`${BASE_URL}/accounts/${userB.accountId}/balance`, {
      headers: userB.headers
    });
    const balBData = await balBRes.json();
    assert(
      "User B final balance is exactly $100.00",
      balBData.data?.balanceInCents === 10000,
      `Balance: ${balBData.data?.balanceInCents}`
    );

    console.log("\n==================================================================");
    console.log(`📊 MILESTONE 3 COMPREHENSIVE AUDIT RESULTS: ${passed}/${total} PASSED`);
    if (passed === total) {
      console.log("🎉 ALL MILESTONE 3 ASSERTIONS PASSED WITH 100% INTEGRITY!");
    } else {
      console.error(`⚠️ ${total - passed} ASSERTIONS FAILED!`);
      process.exitCode = 1;
    }
    console.log("==================================================================\n");
  } finally {
    await mongoose.disconnect();
  }
}

runProfileSecurityTests().catch((err) => {
  console.error("Test Suite Unhandled Exception:", err);
  process.exit(1);
});
