require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const app = require("../src/app");
const User = require("../src/models/user.model");

// Helper to make local HTTP requests using built-in http module
function makeRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: 3001, // Test on port 3001
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

async function runPhase2Verification() {
  console.log("==================================================");
  console.log("   PHASE 2 COMPREHENSIVE AUTOMATED VERIFICATION   ");
  console.log("==================================================\n");

  await connectDB();

  // Start test server on 3001
  const server = app.listen(3001);
  await new Promise((r) => setTimeout(r, 500));

  const testEmail = `phase2_test_${Date.now()}@banking.local`;
  const testPassword = "SuperSecurePassword123!";
  const testName = "Zubair Ahmed";
  let authCookie = "";

  try {
    // ----------------------------------------------------
    // Test 1: User Registration (POST /api/v1/auth/register)
    // ----------------------------------------------------
    console.log("Test 1: Registering new customer...");
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
    if (regRes.status !== 201) {
      throw new Error(`Expected 201 but got ${regRes.status}: ${JSON.stringify(regRes.body)}`);
    }
    if (!regRes.body.success || !regRes.body.data.token) {
      throw new Error("Registration response missing success or token");
    }
    if (regRes.body.data.user.password) {
      throw new Error("CRITICAL SECURITY FLAW: Password leaked in registration response!");
    }

    const setCookie = regRes.headers["set-cookie"];
    if (!setCookie || !setCookie[0] || !setCookie[0].includes("token=")) {
      throw new Error("Set-Cookie header missing token");
    }
    if (!setCookie[0].includes("HttpOnly") || !setCookie[0].includes("SameSite=Strict")) {
      throw new Error("Cookie missing HttpOnly or SameSite=Strict security flags");
    }
    authCookie = setCookie[0].split(";")[0]; // "token=ey..."
    console.log("  [PASS] 201 Created with valid token, password hidden, and secure cookie!");

    // Verify in database that password is encrypted
    const dbUser = await User.findOne({ email: testEmail }).select("+password");
    if (!dbUser.password.startsWith("$2b$10$")) {
      throw new Error("User password in database was NOT hashed with bcrypt 10 salt rounds!");
    }
    console.log("  [PASS] Verified MongoDB Atlas document: Password is cryptographically hashed!");

    // ----------------------------------------------------
    // Test 2: Duplicate Registration Rejection (409 Conflict)
    // ----------------------------------------------------
    console.log("\nTest 2: Attempting duplicate email registration...");
    const dupRes = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/register",
      body: {
        name: testName,
        email: testEmail,
        password: testPassword
      }
    });
    console.log(`- Status: ${dupRes.status}`);
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict but got ${dupRes.status}`);
    }
    console.log("  [PASS] Correctly returned 409 Conflict for duplicate registration!");

    // ----------------------------------------------------
    // Test 3: Login with Correct Credentials (200 OK)
    // ----------------------------------------------------
    console.log("\nTest 3: Logging in with valid credentials...");
    const loginRes = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/login",
      body: {
        email: testEmail,
        password: testPassword
      }
    });
    console.log(`- Status: ${loginRes.status}`);
    if (loginRes.status !== 200 || !loginRes.body.data.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }
    console.log("  [PASS] 200 OK with fresh JWT and cookie issued!");

    // ----------------------------------------------------
    // Test 4: Login with Incorrect Password (401 Unauthorized)
    // ----------------------------------------------------
    console.log("\nTest 4: Attempting login with incorrect password...");
    const wrongLoginRes = await makeRequest({
      method: "POST",
      path: "/api/v1/auth/login",
      body: {
        email: testEmail,
        password: "WrongPassword999!"
      }
    });
    console.log(`- Status: ${wrongLoginRes.status}`);
    if (wrongLoginRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized but got ${wrongLoginRes.status}`);
    }
    console.log("  [PASS] Correctly rejected invalid credentials with 401 Unauthorized!");

    // ----------------------------------------------------
    // Test 5: Protected Route GET /api/v1/auth/me (With Cookie)
    // ----------------------------------------------------
    console.log("\nTest 5: Accessing protected GET /api/v1/auth/me with Cookie...");
    const meRes = await makeRequest({
      method: "GET",
      path: "/api/v1/auth/me",
      headers: {
        Cookie: authCookie
      }
    });
    console.log(`- Status: ${meRes.status}`);
    if (meRes.status !== 200 || meRes.body.data.user.email !== testEmail) {
      throw new Error(`Protected route failed: ${JSON.stringify(meRes.body)}`);
    }
    console.log("  [PASS] Profile retrieved successfully via HTTP-only cookie authentication!");

    // ----------------------------------------------------
    // Test 6: Protected Route Without Auth (401 Unauthorized)
    // ----------------------------------------------------
    console.log("\nTest 6: Accessing protected GET /api/v1/auth/me without Cookie/Token...");
    const noAuthRes = await makeRequest({
      method: "GET",
      path: "/api/v1/auth/me"
    });
    console.log(`- Status: ${noAuthRes.status}`);
    if (noAuthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized but got ${noAuthRes.status}`);
    }
    console.log("  [PASS] Correctly rejected unauthenticated request with 401 Unauthorized!");

    console.log("\n==================================================");
    console.log("   ALL 6 PHASE 2 VERIFICATION TESTS PASSED!       ");
    console.log("==================================================");
  } finally {
    // Cleanup test user
    await User.deleteOne({ email: testEmail });
    server.close();
    await mongoose.connection.close();
  }
}

runPhase2Verification().catch((err) => {
  console.error("\n❌ VERIFICATION FAILED:", err);
  process.exit(1);
});
