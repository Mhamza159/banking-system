/**
 * Automated Verification Script for Phase 4:
 * Executive Financial Dashboard & Live Balance Aggregation
 * 
 * Validates:
 * 1. Existence and integrity of accountService and transactionService
 * 2. BankingContext provider export & wiring in App.jsx
 * 3. Banking UI components: BalanceCard, LedgerSummaryCard, TransactionRow, FaucetDepositModal
 * 4. Assembled DashboardPage cockpit integration
 * 5. Clean production build compilation (npm run build in client/)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function runVerification() {
  console.log("==================================================");
  console.log("🧪 Running Phase 4 Automated Verification Suite");
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

  const clientSrc = path.join(__dirname, "../client/src");

  // 1. Check API Services
  assert(
    "1. accountService.js exists",
    fs.existsSync(path.join(clientSrc, "services/accountService.js"))
  );
  const accountServiceContent = fs.readFileSync(
    path.join(clientSrc, "services/accountService.js"),
    "utf-8"
  );
  assert(
    "2. accountService exports getMyAccounts, createAccount, depositFaucet, getBalance",
    accountServiceContent.includes("getMyAccounts") &&
      accountServiceContent.includes("createAccount") &&
      accountServiceContent.includes("depositFaucet") &&
      accountServiceContent.includes("getBalance")
  );

  assert(
    "3. transactionService.js exists",
    fs.existsSync(path.join(clientSrc, "services/transactionService.js"))
  );
  const transactionServiceContent = fs.readFileSync(
    path.join(clientSrc, "services/transactionService.js"),
    "utf-8"
  );
  assert(
    "4. transactionService exports transfer, getHistory, getTransactionById",
    transactionServiceContent.includes("transfer") &&
      transactionServiceContent.includes("getHistory") &&
      transactionServiceContent.includes("getTransactionById")
  );

  // 2. Check BankingContext & Provider Wiring
  assert(
    "5. BankingContext.jsx exists",
    fs.existsSync(path.join(clientSrc, "context/BankingContext.jsx"))
  );
  const bankingContextContent = fs.readFileSync(
    path.join(clientSrc, "context/BankingContext.jsx"),
    "utf-8"
  );
  assert(
    "6. BankingContext exports BankingProvider and useBanking",
    bankingContextContent.includes("export function BankingProvider") &&
      bankingContextContent.includes("export function useBanking")
  );

  const appContent = fs.readFileSync(path.join(clientSrc, "App.jsx"), "utf-8");
  assert(
    "7. BankingProvider is mounted inside App.jsx",
    appContent.includes("<BankingProvider>") && appContent.includes("</BankingProvider>")
  );

  // 3. Check Banking Components
  assert(
    "8. BalanceCard.jsx exists",
    fs.existsSync(path.join(clientSrc, "components/banking/BalanceCard.jsx"))
  );
  assert(
    "9. LedgerSummaryCard.jsx exists",
    fs.existsSync(path.join(clientSrc, "components/banking/LedgerSummaryCard.jsx"))
  );
  assert(
    "10. TransactionRow.jsx exists",
    fs.existsSync(path.join(clientSrc, "components/banking/TransactionRow.jsx"))
  );
  assert(
    "11. FaucetDepositModal.jsx exists",
    fs.existsSync(path.join(clientSrc, "components/banking/FaucetDepositModal.jsx"))
  );

  // 4. Check Header active account integration
  const headerContent = fs.readFileSync(
    path.join(clientSrc, "components/layout/Header.jsx"),
    "utf-8"
  );
  assert(
    "12. Header.jsx integrates useBanking for active account switching",
    headerContent.includes("useBanking") && headerContent.includes("activeAccount")
  );

  // 5. Check DashboardPage Assembly
  const dashboardContent = fs.readFileSync(
    path.join(clientSrc, "pages/DashboardPage.jsx"),
    "utf-8"
  );
  assert(
    "13. DashboardPage integrates BalanceCard and LedgerSummaryCard",
    dashboardContent.includes("<BalanceCard") &&
      dashboardContent.includes("<LedgerSummaryCard")
  );
  assert(
    "14. DashboardPage integrates TransactionRow and FaucetDepositModal",
    dashboardContent.includes("<TransactionRow") &&
      dashboardContent.includes("<FaucetDepositModal")
  );

  // 6. Test Vite Production Build Compilation
  console.log("\n📦 Testing Vite Production Build (`npm run build` in client/)...");
  try {
    const buildOutput = execSync("npm run build", {
      cwd: path.join(__dirname, "../client"),
      encoding: "utf-8",
      stdio: "pipe"
    });
    const buildSucceeded = buildOutput.includes("built in") || buildOutput.includes("dist");
    assert("15. Vite production bundle compiled with zero errors", buildSucceeded);
  } catch (buildErr) {
    console.error("Vite build error output:", buildErr.stdout || buildErr.message);
    assert("15. Vite production bundle compiled with zero errors", false);
  }

  console.log("\n==================================================");
  console.log(`🏁 Phase 4 Verification Result: ${passed}/${total} Passed`);
  console.log("==================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
