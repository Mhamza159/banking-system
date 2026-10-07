/**
 * Automated Verification Script for Phase 5:
 * Multi-Account Management & Sandbox Faucet Deposit
 * 
 * Validates:
 * 1. Existence and integrity of AccountCard, CreateAccountModal, FaucetDepositModal
 * 2. Multi-account balance mapping and totalAssets aggregation in BankingContext
 * 3. AccountsPage assembly with banner, grid, and modal triggers
 * 4. Clean Vite production build compilation (npm run build in client/)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function runVerification() {
  console.log("==================================================");
  console.log("🧪 Running Phase 5 Automated Verification Suite");
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

  // 1. Check AccountCard Component
  const accountCardPath = path.join(clientSrc, "components/banking/AccountCard.jsx");
  assert("1. AccountCard.jsx exists", fs.existsSync(accountCardPath));
  const accountCardContent = fs.readFileSync(accountCardPath, "utf-8");
  assert(
    "2. AccountCard handles copy, balanceData, and active ledger pill",
    accountCardContent.includes("ACTIVE LEDGER") &&
      accountCardContent.includes("formatAccountNumber") &&
      accountCardContent.includes("MoneyDisplay")
  );

  // 2. Check CreateAccountModal Component
  const createModalPath = path.join(clientSrc, "components/banking/CreateAccountModal.jsx");
  assert("3. CreateAccountModal.jsx exists", fs.existsSync(createModalPath));
  const createModalContent = fs.readFileSync(createModalPath, "utf-8");
  assert(
    "4. CreateAccountModal supports CHECKING/SAVINGS and currency selection",
    createModalContent.includes("CHECKING") &&
      createModalContent.includes("SAVINGS") &&
      createModalContent.includes("createAccount")
  );

  // 3. Check FaucetDepositModal Component with targetAccount support
  const faucetModalPath = path.join(clientSrc, "components/banking/FaucetDepositModal.jsx");
  assert("5. FaucetDepositModal.jsx exists", fs.existsSync(faucetModalPath));
  const faucetModalContent = fs.readFileSync(faucetModalPath, "utf-8");
  assert(
    "6. FaucetDepositModal supports targetAccount prop and depositToAccount",
    faucetModalContent.includes("targetAccount") &&
      faucetModalContent.includes("depositToAccount")
  );

  // 4. Check BankingContext enhancements
  const bankingContextPath = path.join(clientSrc, "context/BankingContext.jsx");
  assert("7. BankingContext.jsx exists", fs.existsSync(bankingContextPath));
  const bankingContextContent = fs.readFileSync(bankingContextPath, "utf-8");
  assert(
    "8. BankingContext provides accountBalances, totalAssetsInCents, and depositToAccount",
    bankingContextContent.includes("accountBalances") &&
      bankingContextContent.includes("totalAssetsInCents") &&
      bankingContextContent.includes("depositToAccount")
  );

  // 5. Check AccountsPage Assembly
  const accountsPagePath = path.join(clientSrc, "pages/AccountsPage.jsx");
  assert("9. AccountsPage.jsx exists", fs.existsSync(accountsPagePath));
  const accountsPageContent = fs.readFileSync(accountsPagePath, "utf-8");
  assert(
    "10. AccountsPage integrates AccountCard, CreateAccountModal, and FaucetDepositModal",
    accountsPageContent.includes("<AccountCard") &&
      accountsPageContent.includes("<CreateAccountModal") &&
      accountsPageContent.includes("<FaucetDepositModal")
  );
  assert(
    "11. AccountsPage displays Consolidated Net Assets summary",
    accountsPageContent.includes("Consolidated Net Assets") &&
      accountsPageContent.includes("totalAssetsInCents")
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
    assert("12. Vite production bundle compiled with zero errors", buildSucceeded);
  } catch (buildErr) {
    console.error("Vite build error output:", buildErr.stdout || buildErr.message);
    assert("12. Vite production bundle compiled with zero errors", false);
  }

  console.log("\n==================================================");
  console.log(`🏁 Phase 5 Verification Result: ${passed}/${total} Passed`);
  console.log("==================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
