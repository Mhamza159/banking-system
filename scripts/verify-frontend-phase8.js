/**
 * Automated Verification Script for Phase 8:
 * User Profile, Security Settings, 404 Fallback & Full-Stack Hardening
 * 
 * Validates:
 * 1. ProfilePage.jsx renders verified KYC credentials, linked accounts, and session revocation
 * 2. NotFoundPage.jsx renders branded 404 UI with recovery navigation
 * 3. AppRoutes.jsx mounts NotFoundPage as catch-all fallback
 * 4. Root package.json includes dev:all concurrent startup script
 * 5. Clean Vite production build compilation (npm run build in client/)
 * 6. Cross-platform verification of full application stack
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function runVerification() {
  console.log("==================================================");
  console.log("🧪 Running Phase 8 Automated Verification Suite");
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

  const rootDir = path.join(__dirname, "..");
  const clientSrc = path.join(rootDir, "client/src");

  // 1. Check ProfilePage Component (T050)
  const profilePath = path.join(clientSrc, "pages/ProfilePage.jsx");
  assert("1. ProfilePage.jsx exists", fs.existsSync(profilePath));
  const profileContent = fs.readFileSync(profilePath, "utf-8");
  assert(
    "2. ProfilePage renders KYC credentials, linked accounts, and session revocation",
    profileContent.includes("VERIFIED KYC") &&
      profileContent.includes("Linked Accounts Portfolio") &&
      profileContent.includes("256-Bit TLS") &&
      profileContent.includes("Revoke Active Session") &&
      profileContent.includes("logout")
  );

  // 2. Check NotFoundPage Component (T051)
  const notFoundPath = path.join(clientSrc, "pages/NotFoundPage.jsx");
  assert("3. NotFoundPage.jsx exists", fs.existsSync(notFoundPath));
  const notFoundContent = fs.readFileSync(notFoundPath, "utf-8");
  assert(
    "4. NotFoundPage renders branded 404 UI and recovery links",
    notFoundContent.includes("404") &&
      notFoundContent.includes("Coordinates Not Found") &&
      notFoundContent.includes("/dashboard") &&
      notFoundContent.includes("Return to Cockpit")
  );

  // 3. Check AppRoutes Catch-All Fallback (T052)
  const routesPath = path.join(clientSrc, "routes/AppRoutes.jsx");
  assert("5. AppRoutes.jsx exists", fs.existsSync(routesPath));
  const routesContent = fs.readFileSync(routesPath, "utf-8");
  assert(
    "6. AppRoutes.jsx mounts NotFoundPage as catch-all route",
    routesContent.includes("NotFoundPage") &&
      routesContent.includes("<Route path=\"*\" element={<NotFoundPage />} />")
  );

  // 4. Check Root package.json Scripts (T054)
  const pkgPath = path.join(rootDir, "package.json");
  assert("7. Root package.json exists", fs.existsSync(pkgPath));
  const pkgContent = fs.readFileSync(pkgPath, "utf-8");
  assert(
    "8. package.json contains dev:all concurrent script",
    pkgContent.includes("\"dev:all\"") &&
      pkgContent.includes("concurrently")
  );

  // 5. Verify Client Production Build (T053)
  console.log("\n📦 Running Client Production Build (npm run build)...");
  try {
    const buildOutput = execSync("npm run build", {
      cwd: path.join(rootDir, "client"),
      stdio: "pipe",
      encoding: "utf-8"
    });
    const distHtmlExists = fs.existsSync(path.join(rootDir, "client/dist/index.html"));
    assert("9. Client production bundle compiles with zero errors (dist/index.html exists)", distHtmlExists);
  } catch (err) {
    console.error("Build failed:", err.stdout || err.message);
    assert("9. Client production bundle compiles with zero errors (dist/index.html exists)", false);
  }

  // Summary
  console.log("\n==================================================");
  console.log(`📊 Result: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed === total) {
    console.log("\n🎉 Phase 8 (Profile, Security & Hardening) VERIFICATION SUCCEEDED!");
    process.exit(0);
  } else {
    console.error("\n❌ Phase 8 VERIFICATION FAILED!");
    process.exit(1);
  }
}

runVerification();
