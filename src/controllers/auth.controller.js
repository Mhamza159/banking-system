const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Account = require("../models/account.model");
const Blacklist = require("../models/blacklist.model");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const { sendTokenResponse } = require("../utils/token");
const { generateAccountNumber } = require("../utils/generator");
const ACCOUNT_STATUS = require("../constants/accountStatus");
const emailService = require("../services/email.service");

/**
 * 1. Register a new customer
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw ApiError.badRequest("Name, email, and password are required");
    }

    // Check if email already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.conflict("Email is already registered");
    }

    // Create user (password automatically hashed by pre-save hook)
    const user = await User.create({
      name,
      email: normalizedEmail,
      password
    });

    // Auto-provision default Savings Account for new customer
    const account = await Account.create({
      user: user._id,
      accountNumber: generateAccountNumber(),
      accountType: "SAVINGS",
      currency: "USD",
      status: ACCOUNT_STATUS.ACTIVE
    });

    // Fire-and-forget non-blocking welcome email
    emailService.sendWelcomeEmail(user).catch((err) => {
      console.error("Non-blocking welcome email delivery failed:", err.message);
    });

    return sendTokenResponse(user, 201, res, "User registered successfully", {
      account: {
        id: account._id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        currency: account.currency,
        status: account.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Authenticate customer & issue JWT session cookie
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest("Email and password are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user and explicitly select password hash
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Verify password constant-time
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    return sendTokenResponse(user, 200, res, "Login successful");
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get profile of currently authenticated user
 * GET /api/v1/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    const userProfile = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isEmailVerified: req.user.isEmailVerified,
      createdAt: req.user.createdAt,
      hasTpin: req.user.isTpinSet,
      isTpinLocked: typeof req.user.isTpinLocked === "function" ? req.user.isTpinLocked() : false,
      tpinLockedUntil: req.user.tpinLockedUntil || null
    };

    return ApiResponse.success(
      res,
      { user: userProfile },
      "User profile retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Revoke session & blacklist JWT
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const token = req.token;

    if (token) {
      // Decode exp timestamp to set accurate TTL
      const decoded = jwt.decode(token);
      const expiresAt =
        decoded && decoded.exp
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + 24 * 60 * 60 * 1000);

      await Blacklist.findOneAndUpdate(
        { token },
        { token, expiresAt },
        { upsert: true, returnDocument: "after" }
      );
    }

    // Clear auth cookie
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 5 * 1000),
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    });

    return ApiResponse.success(res, null, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout
};
