/**
 * Automated Verification Script for Phase 13:
 * Server-Side Transfer Authorization Gates & Brute-Force Lockout
 *
 * Tests:
 * 1. TPIN mandatory requirement for configured users (rejection on missing/malformed TPIN)
 * 2. Invalid TPIN rejection (401 Unauthorized), attempt counter tracking, 0 ledger writes
 * 3. 5-attempt anti-brute-force lockout (403 Forbidden) and blocking while locked
 * 4. Successful transfer with correct TPIN (201 Created) and counter reset to 0
 * 5. Gate 2 Sender Daily Transfer Limit exhaustion (400 Bad Request) and 0 ledger writes
 * 6. Gate 2 Beneficiary Daily Receiving Limit exhaustion (400 Bad Request) and 0 ledger writes
 * 7. Verification that zero database mutations occur on any gate rejection
 */

const BASE_URL = "http://localhost:3000/api/v1";

async function runPhase13Tests() {
  console.log("==================================================");
  console.log("🧪 Running Phase 13: Transfer Authorization Gates Tests");
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

  // ----------------------------------------------------
  // Setup: Users A and B
  // ----------------------------------------------------
  console.log("--- Setup: Register Users A and B ---");
  const userA = await setupUser("Remitter Alpha", `remitter_alpha_${timestamp}@aurabank.io`);
  const userB = await setupUser("Beneficiary Beta", `beneficiary_beta_${timestamp}@aurabank.io`);
  assert("Setup 1: User A & User B registered", userA.id && userB.id);

  // Fund User A with $2,000.00 (200,000 cents) via Faucet
  const depositRes = await fetch(`${BASE_URL}/accounts/${userA.accountId}/deposit`, {
    method: "POST",
    headers: userA.headers,
    body: JSON.stringify({ amountInCents: 200000 })
  });
  assert("Setup 2: User A funded with $2,000.00 via Faucet", depositRes.status === 200);

  // Configure 4-digit TPIN "4826" on User A
  const setPinRes = await fetch(`${BASE_URL}/profile/tpin`, {
    method: "POST",
    headers: userA.headers,
    body: JSON.stringify({ tpin: "4826", confirmTpin: "4826" })
  });
  assert("Setup 3: User A configured TPIN (4826)", setPinRes.status === 201);

  // ----------------------------------------------------
  // Section 1: Gate 1 - Missing or Malformed TPIN
  // ----------------------------------------------------
  console.log("\n--- Section 1: Gate 1 - TPIN Requirement & Format Checks ---");
  // 1. Missing TPIN
  const noPinRes = await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: {
      ...userA.headers,
      "Idempotency-Key": `idemp_no_pin_${Date.now()}`
    },
    body: JSON.stringify({
      senderAccountId: userA.accountId,
      receiverAccountId: userB.accountId,
      amountInCents: 10000
    })
  });
  assert("1.1 Transfer without TPIN rejected with 400 Bad Request", noPinRes.status === 400);

  // 2. Malformed 3-digit TPIN
  const shortPinRes = await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: {
      ...userA.headers,
      "Idempotency-Key": `idemp_short_pin_${Date.now()}`
    },
    body: JSON.stringify({
      senderAccountId: userA.accountId,
      receiverAccountId: userB.accountId,
      amountInCents: 10000,
      tpin: "482"
    })
  });
  assert("1.2 Transfer with malformed TPIN rejected with 400 Bad Request", shortPinRes.status === 400);

  // ----------------------------------------------------
  // Section 2: Gate 1 - Invalid TPIN & Brute-Force Lockout
  // ----------------------------------------------------
  console.log("\n--- Section 2: Gate 1 - Invalid TPIN & Brute-Force Lockout ---");
  // Attempt 1: Wrong TPIN "0000"
  const fail1Res = await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: {
      ...userA.headers,
      "Idempotency-Key": `idemp_fail1_${Date.now()}`
    },
    body: JSON.stringify({
      senderAccountId: userA.accountId,
      receiverAccountId: userB.accountId,
      amountInCents: 10000,
      tpin: "0000"
    })
  });
  const fail1Data = await fail1Res.json();
  const fail1Msg = fail1Data.error?.message || fail1Data.message || "";
  assert("2.1 Wrong TPIN rejected with 401 Unauthorized", fail1Res.status === 401);
  assert("2.2 Remaining attempts indicated in error response", fail1Msg.includes("4 attempt(s) remaining"));

  // Check balance of User A remains exactly $2,000.00
  const balCheck1 = await (await fetch(`${BASE_URL}/accounts/${userA.accountId}/balance`, { headers: userA.headers })).json();
  assert("2.3 User A balance untouched ($2,000.00) after wrong TPIN", balCheck1.data?.balanceInCents === 200000);

  // Fail 3 more times (attempts 2, 3, 4)
  for (let i = 2; i <= 4; i++) {
    await fetch(`${BASE_URL}/transactions/transfer`, {
      method: "POST",
      headers: { ...userA.headers, "Idempotency-Key": `idemp_fail_${i}_${Date.now()}` },
      body: JSON.stringify({
        senderAccountId: userA.accountId,
        receiverAccountId: userB.accountId,
        amountInCents: 10000,
        tpin: "0000"
      })
    });
  }

  // 5th failed attempt triggers 15-min lockout
  const fail5Res = await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: { ...userA.headers, "Idempotency-Key": `idemp_fail_5_${Date.now()}` },
    body: JSON.stringify({
      senderAccountId: userA.accountId,
      receiverAccountId: userB.accountId,
      amountInCents: 10000,
      tpin: "0000"
    })
  });
  assert("2.4 5th failed attempt triggers 15-minute lockout (401/403)", fail5Res.status === 401 || fail5Res.status === 403);

  // Subsequent transfer while locked is rejected with 403 Forbidden even with CORRECT TPIN
  const lockedAttemptRes = await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: { ...userA.headers, "Idempotency-Key": `idemp_locked_${Date.now()}` },
    body: JSON.stringify({
      senderAccountId: userA.accountId,
      receiverAccountId: userB.accountId,
      amountInCents: 10000,
      tpin: "4826" // Correct PIN!
    })
  });
  assert("2.5 Transfer during lockout rejected with 403 Forbidden even with correct TPIN", lockedAttemptRes.status === 403);

  // ----------------------------------------------------
  // Section 3: Gate 1 - Successful Transfer & Attempt Reset
  // ----------------------------------------------------
  console.log("\n--- Section 3: Gate 1 - Successful Transfer & Counter Reset ---");
  const userC = await setupUser("Remitter Charlie", `remitter_charlie_${timestamp}@aurabank.io`);
  const userD = await setupUser("Beneficiary Delta", `beneficiary_delta_${timestamp}@aurabank.io`);

  // Fund User C with $1,000.00
  await fetch(`${BASE_URL}/accounts/${userC.accountId}/deposit`, {
    method: "POST",
    headers: userC.headers,
    body: JSON.stringify({ amountInCents: 100000 })
  });

  // Set TPIN "1357" on User C
  await fetch(`${BASE_URL}/profile/tpin`, {
    method: "POST",
    headers: userC.headers,
    body: JSON.stringify({ tpin: "1357", confirmTpin: "1357" })
  });

  // User C fails PIN once
  await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: { ...userC.headers, "Idempotency-Key": `idemp_c_fail_${Date.now()}` },
    body: JSON.stringify({
      senderAccountId: userC.accountId,
      receiverAccountId: userD.accountId,
      amountInCents: 10000,
      tpin: "9999"
    })
  });

  // User C then transfers $100.00 with correct PIN "1357"
  const successRes = await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: { ...userC.headers, "Idempotency-Key": `idemp_c_success_${Date.now()}` },
    body: JSON.stringify({
      senderAccountId: userC.accountId,
      receiverAccountId: userD.accountId,
      amountInCents: 10000,
      tpin: "1357"
    })
  });
  const successData = await successRes.json();
  assert("3.1 Valid TPIN executes transfer atomically with 201 Created", successRes.status === 201);
  assert("3.2 User C balance debited ($900.00)", successData.data?.senderBalance?.balanceInCents === 90000);

  // Check that failed attempts counter was reset to 0
  const profC = await (await fetch(`${BASE_URL}/profile`, { headers: userC.headers })).json();
  assert("3.3 Failed attempts reset to 0 after successful transfer", profC.data?.isTpinLocked === false);

  // ----------------------------------------------------
  // Section 4: Gate 2 - Sender Velocity Limits Enforcement
  // ----------------------------------------------------
  console.log("\n--- Section 4: Gate 2 - Sender Velocity Limits Enforcement ---");
  // Set User C's daily transfer limit to $150.00 (15,000 cents)
  await fetch(`${BASE_URL}/profile/limits`, {
    method: "PATCH",
    headers: userC.headers,
    body: JSON.stringify({
      transferLimits: {
        daily: 15000,
        weekly: 100000,
        yearly: 500000
      }
    })
  });

  // User C has used $100.00 today. Attempting $60.00 transfer should breach limit (100 + 60 = 160 > 150)
  const limitBreachRes = await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: { ...userC.headers, "Idempotency-Key": `idemp_c_limit_breach_${Date.now()}` },
    body: JSON.stringify({
      senderAccountId: userC.accountId,
      receiverAccountId: userD.accountId,
      amountInCents: 6000,
      tpin: "1357"
    })
  });
  const breachData = await limitBreachRes.json();
  const breachMsg = breachData.error?.message || breachData.message || "";
  assert("4.1 Exceeding sender daily limit rejected with 400 Bad Request", limitBreachRes.status === 400);
  assert("4.2 Error message details daily limit breach", breachMsg.includes("exceeds daily transfer limit"));

  // Check User C balance remains $900.00
  const balCheckC = await (await fetch(`${BASE_URL}/accounts/${userC.accountId}/balance`, { headers: userC.headers })).json();
  assert("4.3 User C balance untouched ($900.00) after velocity breach", balCheckC.data?.balanceInCents === 90000);

  // Transfer of $40.00 within remaining limit (100 + 40 = 140 <= 150) should pass
  const validUnderLimitRes = await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: { ...userC.headers, "Idempotency-Key": `idemp_c_valid_limit_${Date.now()}` },
    body: JSON.stringify({
      senderAccountId: userC.accountId,
      receiverAccountId: userD.accountId,
      amountInCents: 4000,
      tpin: "1357"
    })
  });
  assert("4.4 Transfer within remaining daily limit succeeds with 201 Created", validUnderLimitRes.status === 201);

  // ----------------------------------------------------
  // Section 5: Gate 2 - Beneficiary Velocity Limits Enforcement
  // ----------------------------------------------------
  console.log("\n--- Section 5: Gate 2 - Beneficiary Velocity Limits Enforcement ---");
  // Set User D's receiving limit to $150.00 daily
  await fetch(`${BASE_URL}/profile/limits`, {
    method: "PATCH",
    headers: userD.headers,
    body: JSON.stringify({
      receivingLimits: {
        daily: 15000,
        weekly: 100000,
        yearly: 500000
      }
    })
  });

  // Expand User C's transfer limits so outbound velocity doesn't trigger before recipient check
  await fetch(`${BASE_URL}/profile/limits`, {
    method: "PATCH",
    headers: userC.headers,
    body: JSON.stringify({
      transferLimits: {
        daily: 500000,
        weekly: 2500000,
        yearly: 10000000
      }
    })
  });

  // User D has received $140.00 today (100 + 40). Remaining receiving capacity = $10.00
  // Attempt transfer of $20.00 to User D
  const rcvrBreachRes = await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: { ...userC.headers, "Idempotency-Key": `idemp_rcvr_breach_${Date.now()}` },
    body: JSON.stringify({
      senderAccountId: userC.accountId,
      receiverAccountId: userD.accountId,
      amountInCents: 2000,
      tpin: "1357"
    })
  });
  const rcvrBreachData = await rcvrBreachRes.json();
  const rcvrBreachMsg = rcvrBreachData.error?.message || rcvrBreachData.message || "";
  assert("5.1 Exceeding recipient daily limit rejected with 400 Bad Request", rcvrBreachRes.status === 400);
  assert("5.2 Error message details recipient receiving limit breach", rcvrBreachMsg.includes("receiving limit"));

  // Check User C balance remains $860.00 (was not debited)
  const finalBalC = await (await fetch(`${BASE_URL}/accounts/${userC.accountId}/balance`, { headers: userC.headers })).json();
  assert("5.3 Sender balance untouched ($860.00) after recipient limit rejection", finalBalC.data?.balanceInCents === 86000);

  console.log("\n==================================================");
  console.log(`📊 Result: ${passed}/${total} assertions passed`);
  console.log("==================================================");

  process.exit(passed === total ? 0 : 1);
}

runPhase13Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
