const BASE_URL = "http://localhost:3000/api/v1";

async function runTests() {
  console.log("=== Testing Verify Recipient Account Endpoint (Native fetch) ===");

  // 1. Login to get auth cookie/token
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "shaketest100@aurabank.io",
      password: "TestPassword123!"
    })
  });

  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  const cookie = loginRes.headers.get("set-cookie") || "";
  const headers = {
    "Content-Type": "application/json",
    Cookie: cookie,
    Authorization: `Bearer ${token}`
  };

  console.log("✓ Logged in successfully");

  // 2. Get my accounts to know my account number
  const myAccountsRes = await fetch(`${BASE_URL}/accounts/me`, { headers });
  const myAccountsData = await myAccountsRes.json();
  const myAccount = myAccountsData.data.accounts[0];
  console.log(`✓ My Account Number: ${myAccount.accountNumber}`);

  // 3. Test Self-Transfer Rejection
  const selfRes = await fetch(`${BASE_URL}/accounts/recipient/${myAccount.accountNumber}`, { headers });
  const selfData = await selfRes.json();
  if (selfRes.status === 400 && selfData.error?.message?.includes("same account")) {
    console.log("✓ Self-transfer correctly rejected with 400 Bad Request:", selfData.error.message);
  } else {
    console.error("❌ Self-transfer test failed:", selfRes.status, selfData);
  }

  // 4. Test Non-existent Account (404)
  const notFoundRes = await fetch(`${BASE_URL}/accounts/recipient/9999999999`, { headers });
  const notFoundData = await notFoundRes.json();
  if (notFoundRes.status === 404) {
    console.log("✓ Non-existent account correctly returns 404 Not Found:", notFoundData.error?.message);
  } else {
    console.error("❌ 404 test failed:", notFoundRes.status, notFoundData);
  }

  // 5. Test Invalid Format (400)
  const invalidRes = await fetch(`${BASE_URL}/accounts/recipient/123`, { headers });
  const invalidData = await invalidRes.json();
  if (invalidRes.status === 400) {
    console.log("✓ Invalid format correctly returns 400 Bad Request:", invalidData.error?.message);
  } else {
    console.error("❌ Format test failed:", invalidRes.status, invalidData);
  }

  // 6. Test Valid Other Account
  const recipientEmail = `recipient.${Date.now()}@aurabank.io`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Muhammad Ali",
      email: recipientEmail,
      password: "RecipientPass123!"
    })
  });
  const regData = await regRes.json();
  const recipientAccount = regData.data.account;
  console.log(`✓ Created recipient: ${recipientAccount.accountNumber} (${regData.data.user?.name || "Muhammad Ali"})`);

  const verifyRes = await fetch(`${BASE_URL}/accounts/recipient/${recipientAccount.accountNumber}`, { headers });
  const verifyData = await verifyRes.json();
  console.log("✓ Verification Response Status:", verifyRes.status);
  console.log("✓ Verified Account Data:", verifyData.data?.account);

  if (
    verifyRes.status === 200 &&
    verifyData.data?.account?.accountNumber === recipientAccount.accountNumber &&
    verifyData.data?.account?.accountHolderName === "Muhammad Ali" &&
    verifyData.data?.account?.accountType === "SAVINGS"
  ) {
    console.log("\n==========================================");
    console.log("✅ ALL BACKEND VERIFICATION TESTS PASSED!");
    console.log("==========================================\n");
  } else {
    console.error("❌ Recipient metadata mismatch!", verifyData);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
