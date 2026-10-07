const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Blacklist = require("../models/blacklist.model");
const ApiError = require("../utils/apiError");

/**
 * Authentication middleware guard:
 * Verifies JWT from HTTP-only cookie or Authorization Bearer header.
 * Enforces token revocation by checking against MongoDB Blacklist collection.
 * Populates req.user and req.token.
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // 1. Extract token from HTTP-only cookie first, then fall back to Bearer header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw ApiError.unauthorized("Authentication token required");
    }

    // 2. Check Blacklist: Verify token has not been revoked upon logout
    const isRevoked = await Blacklist.findOne({ token });
    if (isRevoked) {
      throw ApiError.unauthorized("Token has been revoked. Please log in again.");
    }

    // 3. Verify token signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw ApiError.unauthorized("Invalid or expired authentication token");
    }

    // 4. Confirm user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized("User belonging to this token no longer exists");
    }

    // 5. Attach user and current token to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
