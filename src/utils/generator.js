const crypto = require("crypto");

/**
 * Generates a cryptographically random, 10-digit account number.
 * Range: 1000000000 to 9999999999 (always exactly 10 numeric digits, no leading zero issues)
 */
function generateAccountNumber() {
  const min = 1000000000;
  const max = 10000000000;
  return crypto.randomInt(min, max).toString();
}

module.exports = {
  generateAccountNumber
};
