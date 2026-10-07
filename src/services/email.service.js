const transporter = require("../config/email");
const { formatCurrency } = require("../utils/currency");

/**
 * Asynchronous Email Notification Service
 * Delivers non-blocking customer transaction and account alerts.
 */
class EmailService {
  constructor() {
    this.sender = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"AtoZ Banking" <no-reply@banking.local>';
  }

  /**
   * 1. Send Welcome Email upon successful customer registration
   * @param {Object} user - User document { name, email }
   */
  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: this.sender,
      to: user.email,
      subject: "Welcome to AtoZ Digital Banking!",
      text: `Hello ${user.name},\n\nWelcome to AtoZ Banking! Your digital bank account is now active and ready for secure transactions.\n\nBest regards,\nThe AtoZ Banking Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Welcome to AtoZ Digital Banking!</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Thank you for opening an account with us. Your account has been provisioned and is ready for secure transactions.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666;">If you did not create this account, please contact security immediately.</p>
        </div>
      `
    };

    return transporter.sendMail(mailOptions);
  }

  /**
   * 2. Send Debit Alert when funds are transferred out of customer account
   */
  async sendDebitAlert(senderUser, amountInCents, receiverAccountNumber, newBalanceInCents) {
    const formattedAmount = formatCurrency(amountInCents, "USD");
    const formattedBalance = formatCurrency(newBalanceInCents, "USD");

    const mailOptions = {
      from: this.sender,
      to: senderUser.email,
      subject: `Debit Alert: ${formattedAmount} sent`,
      text: `Hello ${senderUser.name},\n\nYour account has been debited by ${formattedAmount} for a transfer to account ${receiverAccountNumber}.\nYour new available balance is ${formattedBalance}.\n\nBest regards,\nAtoZ Banking Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #dc2626;">Transaction Alert: DEBIT</h2>
          <p>Hello <strong>${senderUser.name}</strong>,</p>
          <p>Your account was debited for the following transfer:</p>
          <ul>
            <li><strong>Amount Sent:</strong> ${formattedAmount}</li>
            <li><strong>Recipient Account:</strong> ${receiverAccountNumber}</li>
            <li><strong>Remaining Balance:</strong> ${formattedBalance}</li>
            <li><strong>Date & Time:</strong> ${new Date().toUTCString()}</li>
          </ul>
        </div>
      `
    };

    return transporter.sendMail(mailOptions);
  }

  /**
   * 3. Send Credit Alert when customer receives funds
   */
  async sendCreditAlert(receiverUser, amountInCents, senderAccountNumber, newBalanceInCents) {
    const formattedAmount = formatCurrency(amountInCents, "USD");
    const formattedBalance = formatCurrency(newBalanceInCents, "USD");

    const mailOptions = {
      from: this.sender,
      to: receiverUser.email,
      subject: `Credit Alert: ${formattedAmount} received`,
      text: `Hello ${receiverUser.name},\n\nYour account has been credited with ${formattedAmount} from account ${senderAccountNumber}.\nYour new available balance is ${formattedBalance}.\n\nBest regards,\nAtoZ Banking Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #16a34a;">Transaction Alert: CREDIT</h2>
          <p>Hello <strong>${receiverUser.name}</strong>,</p>
          <p>Your account was credited with incoming funds:</p>
          <ul>
            <li><strong>Amount Received:</strong> ${formattedAmount}</li>
            <li><strong>Sender Account:</strong> ${senderAccountNumber}</li>
            <li><strong>Updated Balance:</strong> ${formattedBalance}</li>
            <li><strong>Date & Time:</strong> ${new Date().toUTCString()}</li>
          </ul>
        </div>
      `
    };

    return transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
