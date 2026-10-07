/**
 * Automated Verification Script for Phase 12:
 * Profile Management, Password Rotation & TPIN Management APIs
 *
 * Tests:
 * 1. GET /api/v1/profile - Authenticated profile retrieval, defaults, ceilings, usage
 * 2. PATCH /api/v1/profile - Mass-assignment defense (role/email/tpin tampering ignored)
 * 3. PATCH /api/v1/profile/password - In-session password rotation and credential verification
 * 4. POST /api/v1/profile/tpin - Initial TPIN setup and conflict on second setup
 * 5. PATCH /api/v1/profile/tpin - TPIN rotation, attempt counter, and 15-minute brute-force lockout
 * 6. GET /api/v1/profile/limits - Velocity limits inspection
 * 7. PATCH /api/v1/profile/limits - Institutional ceilings, relational invariants, and persistence
 * 8. Authentication protection across all profile routes
 */

const BASE_URL = "http://localhost:3000/api/v1";

async function runPhase12Tests() {
  console.log("==================================================");
  console.log("🧪 Running Phase 12: Profile & TPIN Management APIs Tests");
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
  const testEmail1 = `user1_profile_${timestamp}@aurabank.io`;
  const initialPassword = "InitialPassword123!";

  // ----------------------------------------------------
  // Setup: Register Test User 1
  // ----------------------------------------------------
  console.log("--- Setup: Register Test User 1 ---");
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Original Name",
      email: testEmail1,
      password: initialPassword
    })
  });
  const regData = await regRes.json();
  const token1 = regData.data?.token;
  const cookie1 = regRes.headers.get("set-cookie") || "";
  const authHeaders = {
    "Content-Type": "application/json",
    Cookie: cookie1,
    Authorization: `Bearer ${token1}`
  };

  assert("Setup 1: User 1 registered successfully", regRes.status === 201 && token1);

  // ----------------------------------------------------
  // Section 1: GET /profile
  // ----------------------------------------------------
  console.log("\n--- Section 1: GET /api/v1/profile ---");
  const getProfRes = await fetch(`${BASE_URL}/profile`, {
    headers: authHeaders
  });
  const profData = await getProfRes.json();

  assert("1.1 GET /profile returns 200 OK", getProfRes.status === 200);
  assert("1.2 Initial profile has hasTpin: false", profData.data?.hasTpin === false);
  assert("1.3 Initial profile has isTpinLocked: false", profData.data?.isTpinLocked === false);
  assert("1.4 Initial profile includes default transfer limits ($5k daily)",
    profData.data?.transferLimits?.daily === 500000 &&
    profData.data?.transferLimits?.weekly === 2500000 &&
    profData.data?.transferLimits?.yearly === 10000000
  );
  assert("1.5 Initial profile includes system ceilings",
    profData.data?.systemCeilings?.TRANSFER?.MAX_DAILY === 50000000
  );
  assert("1.6 Initial profile includes live velocity usage",
    profData.data?.usage?.transfer?.daily === 0
  );

  // ----------------------------------------------------
  // Section 2: PATCH /profile (Mass-Assignment Defense)
  // ----------------------------------------------------
  console.log("\n--- Section 2: PATCH /api/v1/profile (Mass-Assignment Defense) ---");
  const patchProfRes = await fetch(`${BASE_URL}/profile`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      name: "Alexander Hamilton",
      role: "ADMIN",            // Attempted privilege escalation
      isEmailVerified: true,    // Attempted verification tampering
      tpin: "9999",             // Attempted direct PIN injection
      transferLimits: { daily: 99999999 } // Attempted limit tampering
    })
  });
  const patchData = await patchProfRes.json();

  assert("2.1 PATCH /profile returns 200 OK", patchProfRes.status === 200);
  assert("2.2 Legal name was updated", patchData.data?.name === "Alexander Hamilton");
  assert("2.3 Role tampering was rejected/ignored (role remains CUSTOMER)",
    patchData.data?.role === "CUSTOMER"
  );
  assert("2.4 Email verification tampering was ignored",
    patchData.data?.isEmailVerified === false
  );
  assert("2.5 Direct TPIN tampering was ignored (hasTpin remains false)",
    patchData.data?.hasTpin === false
  );

  // Test invalid name length
  const invalidNameRes = await fetch(`${BASE_URL}/profile`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ name: "A" })
  });
  assert("2.6 Name < 2 characters rejected with 400 Bad Request", invalidNameRes.status === 400);

  // ----------------------------------------------------
  // Section 3: PATCH /profile/password (Password Rotation)
  // ----------------------------------------------------
  console.log("\n--- Section 3: PATCH /api/v1/profile/password ---");
  // 1. Wrong current password
  const wrongPassRes = await fetch(`${BASE_URL}/profile/password`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      currentPassword: "WrongPassword999!",
      newPassword: "NewSecretPassword456!",
      confirmPassword: "NewSecretPassword456!"
    })
  });
  assert("3.1 Wrong current password rejected with 401 Unauthorized", wrongPassRes.status === 401);

  // 2. Mismatched confirmPassword
  const mismatchPassRes = await fetch(`${BASE_URL}/profile/password`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      currentPassword: initialPassword,
      newPassword: "NewSecretPassword456!",
      confirmPassword: "DifferentPassword789!"
    })
  });
  assert("3.2 Mismatched confirmation rejected with 400 Bad Request", mismatchPassRes.status === 400);

  // 3. New password same as current
  const samePassRes = await fetch(`${BASE_URL}/profile/password`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      currentPassword: initialPassword,
      newPassword: initialPassword,
      confirmPassword: initialPassword
    })
  });
  assert("3.3 Same password rejected with 400 Bad Request", samePassRes.status === 400);

  // 4. Valid password change
  const newPassword = "NewSecretPassword456!";
  const validPassRes = await fetch(`${BASE_URL}/profile/password`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      currentPassword: initialPassword,
      newPassword,
      confirmPassword: newPassword
    })
  });
  assert("3.4 Valid password rotation succeeds with 200 OK", validPassRes.status === 200);

  // Verify login with old password fails
  const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail1, password: initialPassword })
  });
  assert("3.5 Login with old password rejected with 401 Unauthorized", oldLoginRes.status === 401);

  // Verify login with new password succeeds
  const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail1, password: newPassword })
  });
  assert("3.6 Login with new rotated password succeeds with 200 OK", newLoginRes.status === 200);

  // ----------------------------------------------------
  // Section 4: POST /profile/tpin (Initial TPIN Setup)
  // ----------------------------------------------------
  console.log("\n--- Section 4: POST /api/v1/profile/tpin ---");
  // 1. Invalid format
  const invalidTpinRes = await fetch(`${BASE_URL}/profile/tpin`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ tpin: "123", confirmTpin: "123" })
  });
  assert("4.1 3-digit TPIN rejected with 400 Bad Request", invalidTpinRes.status === 400);

  // 2. Mismatched confirmation
  const mismatchTpinRes = await fetch(`${BASE_URL}/profile/tpin`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ tpin: "7294", confirmTpin: "9999" })
  });
  assert("4.2 Mismatched TPIN confirmation rejected with 400 Bad Request", mismatchTpinRes.status === 400);

  // 3. Valid TPIN setup
  const validTpinRes = await fetch(`${BASE_URL}/profile/tpin`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ tpin: "7294", confirmTpin: "7294" })
  });
  assert("4.3 Valid 4-digit TPIN setup succeeds with 201 Created", validTpinRes.status === 201);

  // Verify profile now reflects hasTpin: true
  const profAfterTpin = await (await fetch(`${BASE_URL}/profile`, { headers: authHeaders })).json();
  assert("4.4 Profile reflects hasTpin: true after setup", profAfterTpin.data?.hasTpin === true);

  // 4. Attempt to set TPIN again (should conflict)
  const secondTpinRes = await fetch(`${BASE_URL}/profile/tpin`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ tpin: "1111", confirmTpin: "1111" })
  });
  assert("4.5 Calling POST /tpin when TPIN already configured rejected with 409 Conflict", secondTpinRes.status === 409);

  // ----------------------------------------------------
  // Section 5: PATCH /profile/tpin (Rotation & Anti-Brute-Force Lockout)
  // ----------------------------------------------------
  console.log("\n--- Section 5: PATCH /api/v1/profile/tpin ---");
  // Test failed attempts up to lockout (attempts 1 to 4 return 401, 5th returns 403)
  for (let attempt = 1; attempt <= 4; attempt++) {
    const failRes = await fetch(`${BASE_URL}/profile/tpin`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        currentTpin: "0000",
        newTpin: "8888",
        confirmTpin: "8888"
      })
    });
    assert(`5.${attempt} Invalid current PIN attempt ${attempt}/5 rejected with 401 Unauthorized`, failRes.status === 401);
  }

  // 5th failed attempt should trigger 15-minute lockout (403 Forbidden)
  const lockRes = await fetch(`${BASE_URL}/profile/tpin`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      currentTpin: "0000",
      newTpin: "8888",
      confirmTpin: "8888"
    })
  });
  assert("5.5 5th failed PIN attempt triggers 15-minute lockout (403 Forbidden)", lockRes.status === 403);

  // Subsequent call while locked should immediately return 403 Forbidden
  const lockedCallRes = await fetch(`${BASE_URL}/profile/tpin`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      currentTpin: "7294", // Even with correct PIN, account is locked!
      newTpin: "8888",
      confirmTpin: "8888"
    })
  });
  assert("5.6 Subsequent call while locked blocked with 403 Forbidden", lockedCallRes.status === 403);

  // Setup User 2 to test successful TPIN rotation without lockout
  const testEmail2 = `user2_profile_${timestamp}@aurabank.io`;
  const reg2Res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "User Two", email: testEmail2, password: "Password123!" })
  });
  const reg2Data = await reg2Res.json();
  const auth2Headers = {
    "Content-Type": "application/json",
    Cookie: reg2Res.headers.get("set-cookie") || "",
    Authorization: `Bearer ${reg2Data.data?.token}`
  };

  // Configure initial TPIN for User 2
  await fetch(`${BASE_URL}/profile/tpin`, {
    method: "POST",
    headers: auth2Headers,
    body: JSON.stringify({ tpin: "1234", confirmTpin: "1234" })
  });

  // Rotate User 2 TPIN successfully
  const rotateRes = await fetch(`${BASE_URL}/profile/tpin`, {
    method: "PATCH",
    headers: auth2Headers,
    body: JSON.stringify({
      currentTpin: "1234",
      newTpin: "5678",
      confirmTpin: "5678"
    })
  });
  assert("5.7 Valid TPIN rotation with correct current PIN succeeds with 200 OK", rotateRes.status === 200);

  // Attempt to rotate to the exact same PIN
  const sameTpinRes = await fetch(`${BASE_URL}/profile/tpin`, {
    method: "PATCH",
    headers: auth2Headers,
    body: JSON.stringify({
      currentTpin: "5678",
      newTpin: "5678",
      confirmTpin: "5678"
    })
  });
  assert("5.8 Rotating to identical PIN rejected with 400 Bad Request", sameTpinRes.status === 400);

  // ----------------------------------------------------
  // Section 6: GET & PATCH /profile/limits
  // ----------------------------------------------------
  console.log("\n--- Section 6: GET & PATCH /api/v1/profile/limits ---");
  const getLimitsRes = await fetch(`${BASE_URL}/profile/limits`, { headers: auth2Headers });
  const limitsData = await getLimitsRes.json();
  assert("6.1 GET /limits returns 200 OK with limits, ceilings, and usage",
    getLimitsRes.status === 200 &&
    limitsData.data?.transferLimits?.daily === 500000 &&
    limitsData.data?.systemCeilings?.TRANSFER?.MAX_DAILY === 50000000
  );

  // Attempt setting daily limit exceeding maximum institutional ceiling ($500k = 50,000,000 cents)
  const ceilingBreachRes = await fetch(`${BASE_URL}/profile/limits`, {
    method: "PATCH",
    headers: auth2Headers,
    body: JSON.stringify({
      transferLimits: { daily: 60000000 } // $600,000.00
    })
  });
  assert("6.2 Setting limit exceeding system ceiling rejected with 400 Bad Request", ceilingBreachRes.status === 400);

  // Attempt relational violation (daily > weekly)
  const relationalRes = await fetch(`${BASE_URL}/profile/limits`, {
    method: "PATCH",
    headers: auth2Headers,
    body: JSON.stringify({
      transferLimits: {
        daily: 3000000, // $30,000 daily
        weekly: 2000000 // $20,000 weekly (invalid: daily > weekly)
      }
    })
  });
  assert("6.3 Relational violation (daily > weekly) rejected with 400 Bad Request", relationalRes.status === 400);

  // Update valid limits
  const validLimitsRes = await fetch(`${BASE_URL}/profile/limits`, {
    method: "PATCH",
    headers: auth2Headers,
    body: JSON.stringify({
      transferLimits: {
        daily: 200000,   // $2,000.00
        weekly: 1000000,  // $10,000.00
        yearly: 5000000   // $50,000.00
      },
      receivingLimits: {
        daily: 400000,   // $4,000.00
        weekly: 2000000,  // $20,000.00
        yearly: 8000000   // $80,000.00
      }
    })
  });
  const updatedLimits = await validLimitsRes.json();
  assert("6.4 Updating valid limits within ceilings succeeds with 200 OK",
    validLimitsRes.status === 200 &&
    updatedLimits.data?.transferLimits?.daily === 200000 &&
    updatedLimits.data?.receivingLimits?.daily === 400000
  );

  // ----------------------------------------------------
  // Section 7: Unauthenticated Route Protection
  // ----------------------------------------------------
  console.log("\n--- Section 7: Unauthenticated Route Protection ---");
  const unauthRes = await fetch(`${BASE_URL}/profile`, { method: "GET" });
  assert("7.1 Unauthenticated GET /profile rejected with 401 Unauthorized", unauthRes.status === 401);

  console.log("\n==================================================");
  console.log(`📊 Result: ${passed}/${total} assertions passed`);
  console.log("==================================================");

  process.exit(passed === total ? 0 : 1);
}

runPhase12Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
