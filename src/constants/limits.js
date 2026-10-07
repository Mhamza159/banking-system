/**
 * System-wide Limits and Security Constraints
 * All monetary amounts are defined in integer minor units (cents).
 */
const SYSTEM_LIMITS = Object.freeze({
  TRANSFER: Object.freeze({
    MIN: 100, // $1.00 minimum
    MAX_DAILY: 50000000, // $500,000.00 maximum daily ceiling
    MAX_WEEKLY: 250000000, // $2,500,000.00 maximum weekly ceiling
    MAX_YEARLY: 1000000000, // $10,000,000.00 maximum yearly ceiling
    DEFAULT_DAILY: 500000, // $5,000.00 default daily limit
    DEFAULT_WEEKLY: 2500000, // $25,000.00 default weekly limit
    DEFAULT_YEARLY: 10000000 // $100,000.00 default yearly limit
  }),
  RECEIVING: Object.freeze({
    MIN: 100, // $1.00 minimum
    MAX_DAILY: 50000000, // $500,000.00 maximum daily ceiling
    MAX_WEEKLY: 250000000, // $2,500,000.00 maximum weekly ceiling
    MAX_YEARLY: 1000000000, // $10,000,000.00 maximum yearly ceiling
    DEFAULT_DAILY: 1000000, // $10,000.00 default daily limit
    DEFAULT_WEEKLY: 5000000, // $50,000.00 default weekly limit
    DEFAULT_YEARLY: 20000000 // $200,000.00 default yearly limit
  }),
  TPIN: Object.freeze({
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_MINUTES: 15,
    REGEX: /^\d{4}$/
  })
});

module.exports = SYSTEM_LIMITS;
