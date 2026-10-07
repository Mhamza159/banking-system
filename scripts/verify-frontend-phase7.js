/**
 * Automated Verification Script for Phase 7:
 * Transaction Journal, Filtering & Deep Inspection
 * 
 * Validates:
 * 1. Backend transaction.controller.js supports status & account filtering
 * 2. transactionService.js serializes status and accountId parameters
 * 3. TransactionFilters component renders status tabs, search, and account scoping
 * 4. TransactionTable component renders auditable tabular journal with directional icons & skeletons
 * 5. TransactionDetailModal component reveals cryptographic ID, idempotency key, and receipt printing
 * 6. TransactionsPage coordinates summary cards, real-time search, table, and pagination controls
 * 7. Clean Vite production build compilation (npm run build in client/)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function runVerification() {
  console.log("==================================================");
  console.log("🧪 Running Phase 7 Automated Verification Suite");
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
  const backendSrc = path.join(rootDir, "src");

  // 1. Check Backend Controller Status & Account Scoping
  const txControllerPath = path.join(backendSrc, "controllers/transaction.controller.js");
  assert("1. transaction.controller.js exists", fs.existsSync(txControllerPath));
  const txControllerContent = fs.readFileSync(txControllerPath, "utf-8");
  assert(
    "2. transaction.controller.js supports status & accountId query filtering",
    txControllerContent.includes("req.query.status") &&
      txControllerContent.includes("filter.status") &&
      txControllerContent.includes("req.query.accountId")
  );

  // 2. Check transactionService History Param Serialization
  const txServicePath = path.join(clientSrc, "services/transactionService.js");
  assert("3. transactionService.js exists", fs.existsSync(txServicePath));
  const txServiceContent = fs.readFileSync(txServicePath, "utf-8");
  assert(
    "4. transactionService.js serializes status and accountId parameters",
    txServiceContent.includes("query.set(\"status\", status)") &&
      txServiceContent.includes("query.set(\"accountId\", accountId)")
  );

  // 3. Check TransactionFilters Component
  const filtersPath = path.join(clientSrc, "components/banking/TransactionFilters.jsx");
  assert("5. TransactionFilters.jsx exists", fs.existsSync(filtersPath));
  const filtersContent = fs.readFileSync(filtersPath, "utf-8");
  assert(
    "6. TransactionFilters provides status tabs, search, and account selector",
    filtersContent.includes("statusTabs") &&
      filtersContent.includes("COMPLETED") &&
      filtersContent.includes("PENDING") &&
      filtersContent.includes("FAILED") &&
      filtersContent.includes("onSearchChange") &&
      filtersContent.includes("onAccountChange")
  );

  // 4. Check TransactionTable Component (T047)
  const tablePath = path.join(clientSrc, "components/banking/TransactionTable.jsx");
  assert("7. TransactionTable.jsx exists", fs.existsSync(tablePath));
  const tableContent = fs.readFileSync(tablePath, "utf-8");
  assert(
    "8. TransactionTable renders tabular layout with directional indicators and skeletons",
    tableContent.includes("ArrowDownLeft") &&
      tableContent.includes("ArrowUpRight") &&
      tableContent.includes("Skeleton") &&
      tableContent.includes("onSelectTransaction")
  );

  // 5. Check TransactionDetailModal Component (T049)
  const modalPath = path.join(clientSrc, "components/banking/TransactionDetailModal.jsx");
  assert("9. TransactionDetailModal.jsx exists", fs.existsSync(modalPath));
  const modalContent = fs.readFileSync(modalPath, "utf-8");
  assert(
    "10. TransactionDetailModal renders Idempotency Key, Transaction ID, and print action",
    modalContent.includes("idempotencyKey") &&
      modalContent.includes("Transaction ID") &&
      modalContent.includes("window.print")
  );

  // 6. Check TransactionsPage Assembly (T048)
  const pagePath = path.join(clientSrc, "pages/TransactionsPage.jsx");
  assert("11. TransactionsPage.jsx exists", fs.existsSync(pagePath));
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  assert(
    "12. TransactionsPage integrates metrics, filters, table, pagination, and detail modal",
    pageContent.includes("TransactionFilters") &&
      pageContent.includes("TransactionTable") &&
      pageContent.includes("TransactionDetailModal") &&
      pageContent.includes("pagination.total") &&
      pageContent.includes("summaryMetrics")
  );

  // 7. Verify Client Production Build
  console.log("\n📦 Running Client Production Build (npm run build)...");
  try {
    const buildOutput = execSync("npm run build", {
      cwd: path.join(rootDir, "client"),
      stdio: "pipe",
      encoding: "utf-8"
    });
    const distHtmlExists = fs.existsSync(path.join(rootDir, "client/dist/index.html"));
    assert("13. Client production build compiles cleanly (exit 0)", distHtmlExists);
  } catch (err) {
    console.error("Build failed:", err.stdout || err.message);
    assert("13. Client production build compiles cleanly (exit 0)", false);
  }

  // Summary
  console.log("\n==================================================");
  console.log(`📊 Result: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed === total) {
    console.log("\n🎉 Phase 7 (Transaction Journal & Inspection) VERIFICATION SUCCEEDED!");
    process.exit(0);
  } else {
    console.error("\n❌ Phase 7 VERIFICATION FAILED!");
    process.exit(1);
  }
}

runVerification();
