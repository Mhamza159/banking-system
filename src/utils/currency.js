/**
 * Financial Currency Utilities
 * Storing all monetary values as integer minor units (e.g. cents/paise)
 * eliminates floating point inaccuracies (e.g., 0.1 + 0.2 !== 0.3).
 */

function toCents(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    throw new Error("Invalid monetary amount provided");
  }

  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;

  if (numeric < 0) {
    throw new Error("Monetary amount cannot be negative");
  }

  // Multiply by 100 and round to nearest integer to avoid IEEE-754 precision loss
  return Math.round(numeric * 100);
}

function toDollars(cents) {
  if (!Number.isInteger(cents)) {
    throw new Error("Cents amount must be an integer");
  }

  return (cents / 100).toFixed(2);
}

function formatCurrency(cents, currency = "USD") {
  if (!Number.isInteger(cents)) {
    throw new Error("Cents amount must be an integer");
  }

  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(dollars);
}

module.exports = {
  toCents,
  toDollars,
  formatCurrency
};
