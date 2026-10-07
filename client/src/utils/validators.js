/**
 * Client-Side Validation Helpers
 * Formally mirrors the validation constraints of the backend models.
 */

// Mirrors RFC 5322 Regex in src/models/user.model.js
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates an email address against RFC 5322 regex.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates minimum password length of 8 characters.
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  if (!password || typeof password !== "string") return false;
  return password.length >= 8;
}

/**
 * Evaluates password strength for interactive feedback.
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 */
export function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "Too short", color: "bg-slate-700" };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
  if (score <= 3) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (score === 4) return { score: 3, label: "Good", color: "bg-blue-500" };
  return { score: 4, label: "Strong", color: "bg-emerald-500" };
}

/**
 * Validates whether string is a 10-digit account number.
 * @param {string} num
 * @returns {boolean}
 */
export function isValidAccountNumber(num) {
  if (!num || typeof num !== "string") return false;
  return /^\d{10}$/.test(num.trim());
}
