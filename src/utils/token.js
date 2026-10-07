const jwt = require("jsonwebtoken");
const ApiResponse = require("./apiResponse");

/**
 * Signs a JWT token containing standard claims.
 * @param {Object} payload - Data to embed in token ({ id, role })
 * @returns {string} - Signed JWT string
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h"
  });
};

/**
 * Sets secure HTTP-only cookie and sends standardized JSON response.
 * @param {Object} user - User document or sanitized user object
 * @param {number} statusCode - HTTP status code (e.g. 200, 201)
 * @param {Object} res - Express response object
 * @param {string} message - Response message
 * @param {Object} [extraData={}] - Optional additional data
 */
const sendTokenResponse = (user, statusCode, res, message, extraData = {}) => {
  const token = generateToken({
    id: user._id,
    role: user.role
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  };

  res.cookie("token", token, cookieOptions);

  const sanitizedUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  return ApiResponse.success(
    res,
    {
      token,
      user: sanitizedUser,
      ...extraData
    },
    message,
    statusCode
  );
};

module.exports = {
  generateToken,
  sendTokenResponse
};
