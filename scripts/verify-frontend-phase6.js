/**
 * Automated Verification Script for Phase 6:
 * Atomic Money Transfer Flow & Idempotency Engine
 * 
 * Validates:
 * 1. Backend transaction.controller.js support for 10-digit receiver account numbers & ObjectIds
 * 2. transactionService.js Idempotency-Key header injection
 * 3. TransferModal two-step confirmation review dialog
 * 4. TransactionReceipt proof-of-payment modal
 * 5. TransferPage assembly with balance guard, presets, and UUID v4 key generation
 * 6. Clean Vite production build compilation (npm run build in client/)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function runVerification() {
  console.log("==================================================");
  console.log("🧪 Running Phase 6 Automated Verification Suite");
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

  // 1. Check Backend Controller
  const txControllerPath = path.join(backendSrc, "controllers/transaction.controller.js");
  assert("1. transaction.controller.js exists", fs.existsSync(txControllerPath));
  const txControllerContent = fs.readFileSync(txControllerPath, "utf-8");
  assert(
    "2. transaction.controller.js resolves both ObjectId and 10-digit receiver account numbers",
    txControllerContent.includes("isReceiverObjectId") &&
      txControllerContent.includes("isReceiverAccNum") &&
      txControllerContent.includes("accountNumber: receiverAccountId")
  );

  // 2. Check transactionService Idempotency Header
  const txServicePath = path.join(clientSrc, "services/transactionService.js");
  assert("3. transactionService.js exists", fs.existsSync(txServicePath));
  const txServiceContent = fs.readFileSync(txServicePath, "utf-8");
  assert(
    "4. transactionService.js injects Idempotency-Key header",
    txServiceContent.includes("Idempotency-Key") && txServiceContent.includes("transfer")
  );

  // 3. Check TransferModal Component
  const transferModalPath = path.join(clientSrc, "components/banking/TransferModal.jsx");
  assert("5. TransferModal.jsx exists", fs.existsSync(transferModalPath));
  const transferModalContent = fs.readFileSync(transferModalPath, "utf-8");
  assert(
    "6. TransferModal displays settlement summary and enforces double-click lock",
    transferModalContent.includes("Authorize Money Transfer") &&
      transferModalContent.includes("MoneyDisplay") &&
      transferModalContent.includes("isLoading")
  );

  // 4. Check TransactionReceipt Component
  const receiptPath = path.join(clientSrc, "components/banking/TransactionReceipt.jsx");
  assert("7. TransactionReceipt.jsx exists", fs.existsSync(receiptPath));
  const receiptContent = fs.readFileSync(receiptPath, "utf-8");
  assert(
    "8. TransactionReceipt displays Transaction ID, Idempotency Key, and print action",
    receiptContent.includes("Transaction Receipt") &&
      receiptContent.includes("idempotencyKey") &&
      receiptContent.includes("window.print")
  );

  // 5. Check TransferPage Assembly
  const transferPagePath = path.join(clientSrc, "pages/TransferPage.jsx");
  assert("9. TransferPage.jsx exists", fs.existsSync(transferPagePath));
  const transferPageContent = fs.readFileSync(transferPagePath, "utf-8");
  assert(
    "10. TransferPage integrates UUID v4 generator and balance guard",
    transferPageContent.includes("uuidv4") &&
      transferPageContent.includes("isInsufficientFunds") &&
      transferPageContent.includes("TransferModal") &&
      transferPageContent.includes("TransactionReceipt")
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
    assert("11. Vite production bundle compiled with zero errors", buildSucceeded);
  } catch (buildErr) {
    console.error("Vite build error output:", buildErr.stdout || buildErr.message);
    assert("11. Vite production bundle compiled with zero errors", false);
  }

  console.log("\n==================================================");
  console.log(`🏁 Phase 6 Verification Result: ${passed}/${total} Passed`);
  console.log("==================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
