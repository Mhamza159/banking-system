const { fork } = require("child_process");
const path = require("path");

const testScripts = [
  { name: "Phase 2: User Model, Authentication & JWT Cookie Session", file: "verify-phase2.js" },
  { name: "Phase 3: Bank Account Management & Faucet Deposit", file: "verify-phase3.js" },
  { name: "Phase 4: Double-Entry Ledger & Balance Aggregation Engine", file: "verify-phase4.js" },
  { name: "Phase 5: ACID Transaction Transfers & Idempotency Engine", file: "verify-phase5.js" },
  { name: "Phase 6: Token Blacklisting, Email Alerts & Production Hardening", file: "verify-phase6.js" }
];

function runScript(script) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  RUNNING: ${script.name} (${script.file})...`);
    console.log("--------------------------------------------------");

    const scriptPath = path.join(__dirname, script.file);
    const proc = fork(scriptPath, [], {
      stdio: "inherit"
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ ${script.name} PASSED!\n`);
        resolve();
      } else {
        reject(new Error(`❌ ${script.name} FAILED with exit code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

async function runAllTests() {
  console.log("==========================================================");
  console.log("   MASTER SYSTEM TEST RUNNER — ALL PHASES (1 TO 6)        ");
  console.log("   Banking Backend API — Comprehensive Automated Suite    ");
  console.log("==========================================================");

  const startTime = Date.now();

  for (const script of testScripts) {
    await runScript(script);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("==========================================================");
  console.log(`🎉 ALL ${testScripts.length} TEST SUITES PASSED IN ${durationSec}s!`);
  console.log("   Entire Banking Backend API is 100% Operational!        ");
  console.log("==========================================================");
}

runAllTests().catch((err) => {
  console.error("\n💥 MASTER TEST RUNNER FAILED:", err.message);
  process.exit(1);
});
