const nodemailer = require("nodemailer");

/**
 * Email Transporter Configuration
 * 
 * Supports production SMTP credentials from environment variables.
 * In development / test mode without credentials, falls back to a safe mock transporter
 * that logs email delivery to the console without throwing errors or blocking operations.
 */
let transporter = null;

if (
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  // Development / Test Mock Transporter
  transporter = {
    sendMail: async (mailOptions) => {
      if (process.env.NODE_ENV !== "test") {
        console.log("📧 [MOCK EMAIL DISPATCHED]");
        console.log(`- To: ${mailOptions.to}`);
        console.log(`- Subject: ${mailOptions.subject}`);
        console.log(`- Text: ${mailOptions.text || "(HTML content)"}`);
      }
      return {
        messageId: `mock-email-${Date.now()}`,
        accepted: [mailOptions.to],
        response: "250 Mock Email Accepted"
      };
    }
  };
}

module.exports = transporter;
