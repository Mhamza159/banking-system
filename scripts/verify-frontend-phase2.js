/**
 * Automated Verification Script for Phase 2: Authentication & Frontend Integration
 * Validates:
 * 1. Vite dev server responsiveness on http://localhost:5173/
 * 2. Registration API contract (with auto-provisioned savings account)
 * 3. Login API contract and cookie issuance
 * 4. Session hydration via /auth/me
 * 5. Session revocation via /auth/logout and token blacklisting
 */

const http = require("http");

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on("error", (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runVerification() {
  console.log("==================================================");
  console.log("🧪 Running Phase 2 Automated Verification Suite");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(name, condition) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
    }
  }

  // 1. Check Vite Frontend Dev Server
  try {
    const viteRes = await request({
      hostname: "localhost",
      port: 5173,
      path: "/",
      method: "GET"
    });
    assert("1. Vite Dev Server responds with HTTP 200", viteRes.statusCode === 200);
    assert("2. Vite HTML includes title and root container", typeof viteRes.data === "string" && viteRes.data.includes("AuraBank"));
  } catch (err) {
    assert("1. Vite Dev Server responsiveness", false);
  }

  // 2. Test Customer Registration (with auto-provisioned savings account)
  const timestamp = Date.now();
  const testUser = {
    name: "Evelyn Reed",
    email: `evelyn.reed.${timestamp}@aurabank.io`,
    password: "SecurePassword123!"
  };

  let token = null;
  let cookie = null;

  try {
    const regRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/v1/auth/register",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      testUser
    );

    assert("3. Registration returns HTTP 201 Created", regRes.statusCode === 201);
    assert("4. Registration returns user object with CUSTOMER role", regRes.data?.data?.user?.role === "CUSTOMER");
    assert("5. Registration auto-provisions 10-digit Savings Account", !!regRes.data?.data?.account?.accountNumber && regRes.data.data.account.accountNumber.length === 10);
    assert("6. Registration sets HttpOnly token cookie", !!regRes.headers["set-cookie"] && regRes.headers["set-cookie"][0].includes("token="));

    token = regRes.data?.data?.token;
    cookie = regRes.headers["set-cookie"]?.[0]?.split(";")[0];
  } catch (err) {
    assert("3. Registration flow error: " + err.message, false);
  }

  // 3. Test Customer Login
  try {
    const loginRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/v1/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      {
        email: testUser.email,
        password: testUser.password
      }
    );

    assert("7. Login returns HTTP 200 OK", loginRes.statusCode === 200);
    assert("8. Login returns valid JWT token", typeof loginRes.data?.data?.token === "string" && loginRes.data.data.token.length > 20);
    cookie = loginRes.headers["set-cookie"]?.[0]?.split(";")[0];
  } catch (err) {
    assert("7. Login flow error: " + err.message, false);
  }

  // 4. Test Session Hydration via /auth/me
  try {
    const meRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/v1/auth/me",
      method: "GET",
      headers: {
        Cookie: cookie,
        Authorization: `Bearer ${token}`
      }
    });

    assert("9. Session hydration /auth/me returns HTTP 200", meRes.statusCode === 200);
    assert("10. /auth/me returns verified user profile", meRes.data?.data?.user?.email === testUser.email);
  } catch (err) {
    assert("9. Session hydration error: " + err.message, false);
  }

  // 5. Test Logout & Token Blacklist
  try {
    const logoutRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/v1/auth/logout",
      method: "POST",
      headers: {
        Cookie: cookie,
        Authorization: `Bearer ${token}`
      }
    });

    assert("11. Logout returns HTTP 200 OK", logoutRes.statusCode === 200);

    // Verify revoked token is now rejected
    const verifyRevokedRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/v1/auth/me",
      method: "GET",
      headers: {
        Cookie: cookie,
        Authorization: `Bearer ${token}`
      }
    });

    assert("12. Revoked token is rejected with HTTP 401 Unauthorized", verifyRevokedRes.statusCode === 401);
  } catch (err) {
    assert("11. Logout revocation error: " + err.message, false);
  }

  console.log("\n==================================================");
  console.log(`🏁 Phase 2 Verification Result: ${passed}/${total} Passed`);
  console.log("==================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
