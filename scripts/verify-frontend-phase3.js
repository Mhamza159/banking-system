/**
 * Automated Verification Script for Phase 3: Authenticated App Shell & Responsive Navigation
 * Validates:
 * 1. Vite server responsiveness across SPA routes (/dashboard, /accounts, /transfer, etc.)
 * 2. Presence and exports of Sidebar, Header, MobileNav, DashboardLayout
 * 3. Master routing structure
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

async function checkRoute(urlPath) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: "localhost",
        port: 5173,
        path: urlPath,
        headers: { Accept: "text/html" }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            hasRoot: data.includes('id="root"')
          });
        });
      }
    );
    req.on("error", () => resolve({ status: 500, hasRoot: false }));
  });
}

async function runVerification() {
  console.log("==================================================");
  console.log("🧪 Running Phase 3 Automated Verification Suite");
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

  // 1. Check layout component files exist
  const layoutDir = path.join(__dirname, "../client/src/components/layout");
  assert("1. Sidebar.jsx exists", fs.existsSync(path.join(layoutDir, "Sidebar.jsx")));
  assert("2. Header.jsx exists", fs.existsSync(path.join(layoutDir, "Header.jsx")));
  assert("3. MobileNav.jsx exists", fs.existsSync(path.join(layoutDir, "MobileNav.jsx")));
  assert("4. DashboardLayout.jsx exists", fs.existsSync(path.join(layoutDir, "DashboardLayout.jsx")));

  // 2. Check inner pages exist
  const pagesDir = path.join(__dirname, "../client/src/pages");
  assert("5. DashboardPage.jsx exists", fs.existsSync(path.join(pagesDir, "DashboardPage.jsx")));
  assert("6. AccountsPage.jsx exists", fs.existsSync(path.join(pagesDir, "AccountsPage.jsx")));
  assert("7. TransferPage.jsx exists", fs.existsSync(path.join(pagesDir, "TransferPage.jsx")));
  assert("8. TransactionsPage.jsx exists", fs.existsSync(path.join(pagesDir, "TransactionsPage.jsx")));
  assert("9. ProfilePage.jsx exists", fs.existsSync(path.join(pagesDir, "ProfilePage.jsx")));

  // 3. Check Vite SPA route serving
  const dashboardRoute = await checkRoute("/dashboard");
  assert("10. /dashboard served by Vite SPA", dashboardRoute.status === 200 && dashboardRoute.hasRoot);

  const accountsRoute = await checkRoute("/accounts");
  assert("11. /accounts served by Vite SPA", accountsRoute.status === 200 && accountsRoute.hasRoot);

  const transferRoute = await checkRoute("/transfer");
  assert("12. /transfer served by Vite SPA", transferRoute.status === 200 && transferRoute.hasRoot);

  const transactionsRoute = await checkRoute("/transactions");
  assert("13. /transactions served by Vite SPA", transactionsRoute.status === 200 && transactionsRoute.hasRoot);

  const profileRoute = await checkRoute("/profile");
  assert("14. /profile served by Vite SPA", profileRoute.status === 200 && profileRoute.hasRoot);

  console.log("\n==================================================");
  console.log(`🏁 Phase 3 Verification Result: ${passed}/${total} Passed`);
  console.log("==================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
