/**
 * Verification Script for Standard Banking Slip & Ledger Counterparty Enrichment (Phase 10)
 * 
 * Validates:
 * 1. POST /transactions/transfer returns structured `sender` and `receiver` DTOs with accountHolderName
 * 2. Idempotency replay returns cached 200 with structured `sender` and `receiver` DTOs
 * 3. GET /transactions/history returns deeply populated `senderAccount.user.name` and `receiverAccount.user.name`
 * 4. GET /transactions/:id returns deeply populated `senderAccount.user.name` and `receiverAccount.user.name`
 */

const BASE_URL = "http://localhost:3000/api/v1";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 Running Phase 10 Enriched Transactions Test Suite");
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
  const testEmail1 = `remitter_${timestamp}@aurabank.io`;
  const testEmail2 = `beneficiary_${timestamp}@aurabank.io`;
  const password = "TestPassword123!";

  // 1. Register Remitter User
  const reg1Res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Alexander Wright",
      email: testEmail1,
      password
    })
  });
  const reg1Data = await reg1Res.json();
  const token1 = reg1Data.data?.token;
  const cookie1 = reg1Res.headers.get("set-cookie") || "";
  const auth1Headers = {
    "Content-Type": "application/json",
    Cookie: cookie1,
    Authorization: `Bearer ${token1}`
  };
  assert("1. Register remitter user", reg1Res.status === 201 && token1);

  // 2. Register Beneficiary User
  const reg2Res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Muhammad Ali",
      email: testEmail2,
      password
    })
  });
  const reg2Data = await reg2Res.json();
  const beneficiaryAccount = reg2Data.data?.account;
  assert("2. Register beneficiary user", reg2Res.status === 201 && beneficiaryAccount?.accountNumber);

  // 3. Get Remitter Account
  const me1Res = await fetch(`${BASE_URL}/accounts/me`, { headers: auth1Headers });
  const me1Data = await me1Res.json();
  const remitterAccount = me1Data.data?.accounts?.[0];
  assert("3. Fetch remitter accounts", remitterAccount?._id && remitterAccount?.accountNumber);

  // 4. Deposit funds via faucet into remitter account
  const depositRes = await fetch(`${BASE_URL}/accounts/${remitterAccount._id}/deposit`, {
    method: "POST",
    headers: auth1Headers,
    body: JSON.stringify({ amountInCents: 50000 })
  });
  const depositData = await depositRes.json();
  assert("4. Deposit faucet funds into remitter account", depositRes.status === 200);

  // 5. Execute Transfer with unique Idempotency-Key
  const idempotencyKey = `idemp-enrichment-${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
  const transferRes = await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: {
      ...auth1Headers,
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({
      senderAccountId: remitterAccount._id,
      receiverAccountId: beneficiaryAccount.accountNumber,
      amountInCents: 15000,
      description: "Settlement for Project Invoicing"
    })
  });
  const transferData = await transferRes.json();
  assert("5. Transfer API call returned 201 Created", transferRes.status === 201);

  const tx = transferData.data?.transaction;
  assert(
    "6. Transfer response includes structured `sender` DTO with accountHolderName",
    tx?.sender &&
      tx.sender.accountNumber === remitterAccount.accountNumber &&
      tx.sender.accountHolderName === "Alexander Wright" &&
      tx.sender.accountType === "SAVINGS",
    JSON.stringify(tx?.sender)
  );

  assert(
    "7. Transfer response includes structured `receiver` DTO with accountHolderName",
    tx?.receiver &&
      tx.receiver.accountNumber === beneficiaryAccount.accountNumber &&
      tx.receiver.accountHolderName === "Muhammad Ali" &&
      tx.receiver.accountType === "SAVINGS",
    JSON.stringify(tx?.receiver)
  );

  // 6. Test Idempotency Replay
  const replayRes = await fetch(`${BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: {
      ...auth1Headers,
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({
      senderAccountId: remitterAccount._id,
      receiverAccountId: beneficiaryAccount.accountNumber,
      amountInCents: 15000
    })
  });
  const replayData = await replayRes.json();
  assert("8. Idempotency replay returned 200 OK", replayRes.status === 200 && replayData.data?.cached === true);
  const replayTx = replayData.data?.transaction;
  assert(
    "9. Cached replay includes enriched `sender` and `receiver` with legal holder names",
    replayTx?.sender?.accountHolderName === "Alexander Wright" &&
      replayTx?.receiver?.accountHolderName === "Muhammad Ali",
    `Sender: ${replayTx?.sender?.accountHolderName}, Receiver: ${replayTx?.receiver?.accountHolderName}`
  );

  // 7. Test GET /transactions/history with deep population
  const historyRes = await fetch(`${BASE_URL}/transactions/history`, { headers: auth1Headers });
  const historyData = await historyRes.json();
  const historyList = historyData.data?.transactions || [];
  const foundTx = historyList.find((t) => (t._id || t.id) === tx.id);
  assert("10. Created transaction found in transaction history", !!foundTx);
  assert(
    "11. History transaction deeply populates senderAccount.user.name",
    foundTx?.senderAccount?.user?.name === "Alexander Wright",
    `Found sender name: ${foundTx?.senderAccount?.user?.name}`
  );
  assert(
    "12. History transaction deeply populates receiverAccount.user.name",
    foundTx?.receiverAccount?.user?.name === "Muhammad Ali",
    `Found receiver name: ${foundTx?.receiverAccount?.user?.name}`
  );

  // 8. Test GET /transactions/:id with deep population
  const singleRes = await fetch(`${BASE_URL}/transactions/${tx.id}`, { headers: auth1Headers });
  const singleData = await singleRes.json();
  const singleTx = singleData.data?.transaction;
  assert(
    "13. Single transaction detail deeply populates senderAccount.user.name",
    singleTx?.senderAccount?.user?.name === "Alexander Wright",
    `Found sender name: ${singleTx?.senderAccount?.user?.name}`
  );
  assert(
    "14. Single transaction detail deeply populates receiverAccount.user.name",
    singleTx?.receiverAccount?.user?.name === "Muhammad Ali",
    `Found receiver name: ${singleTx?.receiverAccount?.user?.name}`
  );

  console.log("\n--------------------------------------------------");
  console.log(`Results: ${passed}/${total} assertions passed`);
  console.log("--------------------------------------------------");

  if (passed === total) {
    console.log("🏆 Phase 10 Backend Data Pipeline Verification 100% SUCCESSFUL!\n");
    process.exit(0);
  } else {
    console.error("❌ Some assertions failed.\n");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
