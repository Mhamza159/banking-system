require("dotenv").config();
const transporter = require("../src/config/email");

async function testGmailConnection() {
  console.log("Testing Gmail SMTP Connection...");
  console.log(`- SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`- SMTP User: ${process.env.SMTP_USER}`);

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER,
      subject: "🎉 AtoZ Banking System: Email Connection Verified!",
      text: "Hello Hamza! Your Nodemailer setup with Gmail SMTP is working 100% successfully! Real emails are now active in your banking system.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
          <h2 style="color: #2563eb;">🎉 AtoZ Banking Email Verified!</h2>
          <p>Hello <strong>Hamza</strong>,</p>
          <p>Mubarak ho! Aap ka Gmail SMTP configuration 100% successfully connect ho chuka hai.</p>
          <p>Ab har user registration aur transaction par real emails aap ke inbox mein receive hon gi!</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">AtoZ Modern Banking System • Automated Notification Test</p>
        </div>
      `
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY!");
    console.log(`- Message ID: ${info.messageId}`);
    console.log(`- Response: ${info.response}`);
  } catch (error) {
    console.error("❌ EMAIL SENDING FAILED:", error);
    process.exit(1);
  }
}

testGmailConnection();
