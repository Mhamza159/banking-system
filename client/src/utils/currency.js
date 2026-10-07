/**
 * Financial Currency Utilities
 * Ensures zero floating-point drift by handling all internal math in integer minor units (cents).
 */

/**
 * Converts a dollar amount (number or string) into integer minor units (cents).
 * e.g. 10.50 -> 1050, "99.99" -> 9999
 * @param {number|string} dollars
 * @returns {number} integer cents
 */
export function toCents(dollars) {
  const numeric = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  if (isNaN(numeric) || numeric < 0) return 0;
  return Math.round(numeric * 100);
}

/**
 * Converts integer cents into a formatted currency string.
 * e.g. 1050 -> "$10.50", 50000 -> "$500.00"
 * @param {number} cents
 * @param {string} currency - Default "USD"
 * @returns {string} Formatted string
 */
export function formatCurrency(cents, currency = "USD") {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return "$0.00";
  }

  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(dollars);
}

/**
 * Splits cents into components { symbol, whole, decimal }
 * Useful for high-end FinTech display typography where decimals are visually subordinated.
 * @param {number} cents
 * @param {string} currency
 * @returns {{ symbol: string, whole: string, decimal: string }}
 */
export function formatCentsParts(cents, currency = "USD") {
  const formatted = formatCurrency(cents, currency);
  // Match symbol ($), whole digits with commas, and decimal cents (.00)
  const match = formatted.match(/^([^\d\s]*)\s?([\d,]+)\.(\d{2})$/);
  if (match) {
    return {
      symbol: match[1] || "$",
      whole: match[2] || "0",
      decimal: match[3] || "00"
    };
  }
  return { symbol: "$", whole: "0", decimal: "00" };
}

/**
 * Validates and parses raw text inputs into positive integer cents.
 * @param {string} text
 * @returns {{ isValid: boolean, cents: number, error: string | null }}
 */
export function parseCents(text) {
  if (!text || text.trim() === "") {
    return { isValid: false, cents: 0, error: "Amount is required" };
  }

  const cleaned = text.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    return { isValid: false, cents: 0, error: "Invalid decimal format" };
  }

  if (parts[1] && parts[1].length > 2) {
    return { isValid: false, cents: 0, error: "Cannot have more than 2 decimal places" };
  }

  const numeric = parseFloat(cleaned);
  if (isNaN(numeric) || numeric <= 0) {
    return { isValid: false, cents: 0, error: "Amount must be greater than $0.00" };
  }

  const cents = Math.round(numeric * 100);
  return { isValid: true, cents, error: null };
}
