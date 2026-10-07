const User = require("../models/user.model");
const Account = require("../models/account.model");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const SYSTEM_LIMITS = require("../constants/limits");
const velocityService = require("../services/velocity.service");
const { formatCurrency } = require("../utils/currency");

/**
 * Profile & Transaction Security Settings Controller
 * Handles customer profile retrieval, mass-assignment protected updates,
 * in-session password rotation, TPIN configuration/change with anti-brute-force lockout,
 * and velocity limit adjustments bounded by institutional ceilings.
 */

/**
 * 1. Get current authenticated user profile and security state
 * GET /api/v1/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Fetch user's accounts to calculate live velocity usage
    const accounts = await Account.find({ user: user._id });
    const accountIds = accounts.map((acc) => acc._id);

    const transferUsage = await velocityService.getTransferUsage(accountIds);
    const receivingUsage = await velocityService.getReceivingUsage(accountIds);

    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      hasTpin: user.hasTpin,
      isTpinLocked: user.isTpinLocked(),
      tpinLockedUntil: user.tpinLockedUntil,
      transferLimits: user.transferLimits,
      receivingLimits: user.receivingLimits,
      usage: {
        transfer: transferUsage,
        receiving: receivingUsage
      },
      systemCeilings: SYSTEM_LIMITS,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return ApiResponse.success(res, profile, "Profile fetched successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Update basic customer profile (Legal Display Name)
 * Whitelist filter protects against mass-assignment privilege escalation.
 * PATCH /api/v1/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      throw ApiError.badRequest("Full name is required");
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      throw ApiError.badRequest("Full name must be between 2 and 100 characters");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Mass-Assignment Defense: Strictly update ONLY the whitelisted field
    user.name = trimmedName;
    await user.save();

    const sanitizedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      hasTpin: user.hasTpin,
      isTpinLocked: user.isTpinLocked(),
      transferLimits: user.transferLimits,
      receivingLimits: user.receivingLimits,
      updatedAt: user.updatedAt
    };

    return ApiResponse.success(res, sanitizedUser, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Secure in-session password change
 * Verifies current password before updating to new credential.
 * PATCH /api/v1/profile/password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw ApiError.badRequest("Current password, new password, and confirmation are required");
    }

    if (newPassword !== confirmPassword) {
      throw ApiError.badRequest("New password and confirmation do not match");
    }

    if (newPassword.length < 8) {
      throw ApiError.badRequest("New password must be at least 8 characters");
    }

    if (currentPassword === newPassword) {
      throw ApiError.badRequest("New password must be different from current password");
    }

    // Load user with +password to verify current credentials
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.unauthorized("Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    return ApiResponse.success(res, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Initial Transaction PIN (TPIN) configuration
 * POST /api/v1/profile/tpin
 */
const setTpin = async (req, res, next) => {
  try {
    const { tpin, confirmTpin } = req.body;

    if (!tpin || !confirmTpin) {
      throw ApiError.badRequest("Transaction PIN and confirmation PIN are required");
    }

    if (tpin !== confirmTpin) {
      throw ApiError.badRequest("PIN and confirmation PIN do not match");
    }

    const trimmedPin = String(tpin).trim();
    if (!SYSTEM_LIMITS.TPIN.REGEX.test(trimmedPin)) {
      throw ApiError.badRequest("Transaction PIN must be exactly 4 numeric digits");
    }

    // Load user with +tpin to check whether TPIN is already configured
    const user = await User.findById(req.user._id).select("+tpin");
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (user.tpin || user.isTpinSet) {
      throw ApiError.conflict("Transaction PIN is already configured. Use change PIN to update it.");
    }

    user.tpin = trimmedPin;
    user.isTpinSet = true;
    user.tpinFailedAttempts = 0;
    user.tpinLockedUntil = null;
    await user.save();

    return ApiResponse.created(res, { hasTpin: true }, "Transaction PIN configured successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Rotate/Change existing Transaction PIN with anti-brute-force lockout
 * PATCH /api/v1/profile/tpin
 */
const changeTpin = async (req, res, next) => {
  try {
    const { currentTpin, newTpin, confirmTpin } = req.body;

    if (!currentTpin || !newTpin || !confirmTpin) {
      throw ApiError.badRequest("Current PIN, new PIN, and confirmation PIN are required");
    }

    if (newTpin !== confirmTpin) {
      throw ApiError.badRequest("New PIN and confirmation PIN do not match");
    }

    const trimmedNewPin = String(newTpin).trim();
    if (!SYSTEM_LIMITS.TPIN.REGEX.test(trimmedNewPin)) {
      throw ApiError.badRequest("New Transaction PIN must be exactly 4 numeric digits");
    }

    const user = await User.findById(req.user._id).select("+tpin");
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (!user.tpin && !user.isTpinSet) {
      throw ApiError.badRequest("No Transaction PIN configured yet. Please set your PIN first.");
    }

    // Check brute-force lockout status
    if (user.isTpinLocked()) {
      const remainingMin = Math.ceil((user.tpinLockedUntil - Date.now()) / 60000);
      throw ApiError.forbidden(
        `Transaction PIN is temporarily locked due to repeated failed attempts. Please try again in ${remainingMin} minute(s).`
      );
    }

    // Verify current PIN
    const isMatch = await user.compareTpin(String(currentTpin).trim());
    if (!isMatch) {
      user.tpinFailedAttempts += 1;
      if (user.tpinFailedAttempts >= SYSTEM_LIMITS.TPIN.MAX_FAILED_ATTEMPTS) {
        user.tpinLockedUntil = new Date(Date.now() + SYSTEM_LIMITS.TPIN.LOCKOUT_MINUTES * 60 * 1000);
        await user.save();
        throw ApiError.forbidden(
          `Too many failed attempts. Transaction PIN locked for ${SYSTEM_LIMITS.TPIN.LOCKOUT_MINUTES} minutes.`
        );
      }
      await user.save();
      const remaining = SYSTEM_LIMITS.TPIN.MAX_FAILED_ATTEMPTS - user.tpinFailedAttempts;
      throw ApiError.unauthorized(
        `Invalid current Transaction PIN. ${remaining} attempt(s) remaining before lockout.`
      );
    }

    if (String(currentTpin).trim() === trimmedNewPin) {
      throw ApiError.badRequest("New Transaction PIN must be different from current PIN");
    }

    // Success: Update PIN, reset failed attempts counter and lockout timestamp
    user.tpin = trimmedNewPin;
    user.isTpinSet = true;
    user.tpinFailedAttempts = 0;
    user.tpinLockedUntil = null;
    await user.save();

    return ApiResponse.success(res, { hasTpin: true }, "Transaction PIN changed successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Get velocity limits and live usage
 * GET /api/v1/profile/limits
 */
const getLimits = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const accounts = await Account.find({ user: user._id });
    const accountIds = accounts.map((acc) => acc._id);

    const transferUsage = await velocityService.getTransferUsage(accountIds);
    const receivingUsage = await velocityService.getReceivingUsage(accountIds);

    const data = {
      transferLimits: user.transferLimits,
      receivingLimits: user.receivingLimits,
      usage: {
        transfer: transferUsage,
        receiving: receivingUsage
      },
      systemCeilings: SYSTEM_LIMITS
    };

    return ApiResponse.success(res, data, "Limits fetched successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Update transfer and receiving velocity limits
 * Enforces institutional ceilings and daily <= weekly <= yearly invariants.
 * PATCH /api/v1/profile/limits
 */
const updateLimits = async (req, res, next) => {
  try {
    const { transferLimits, receivingLimits } = req.body;

    if (!transferLimits && !receivingLimits) {
      throw ApiError.badRequest("Provide transferLimits or receivingLimits to update");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Helper: Validates integer cents, institutional ceilings, and relational invariants
    const validatePeriodLimits = (provided, current, ceilings, label) => {
      const merged = {
        daily: provided.daily !== undefined ? provided.daily : current.daily,
        weekly: provided.weekly !== undefined ? provided.weekly : current.weekly,
        yearly: provided.yearly !== undefined ? provided.yearly : current.yearly
      };

      for (const [period, val] of Object.entries(merged)) {
        if (!Number.isInteger(val) || val < 0) {
          throw ApiError.badRequest(`${label} ${period} limit must be a non-negative integer in cents`);
        }
      }

      if (merged.daily > ceilings.MAX_DAILY) {
        throw ApiError.badRequest(
          `${label} daily limit exceeds maximum system ceiling of ${formatCurrency(ceilings.MAX_DAILY)}`
        );
      }
      if (merged.weekly > ceilings.MAX_WEEKLY) {
        throw ApiError.badRequest(
          `${label} weekly limit exceeds maximum system ceiling of ${formatCurrency(ceilings.MAX_WEEKLY)}`
        );
      }
      if (merged.yearly > ceilings.MAX_YEARLY) {
        throw ApiError.badRequest(
          `${label} yearly limit exceeds maximum system ceiling of ${formatCurrency(ceilings.MAX_YEARLY)}`
        );
      }

      // Relational sanity check: daily <= weekly <= yearly
      if (merged.daily > merged.weekly) {
        throw ApiError.badRequest(`${label} daily limit cannot exceed weekly limit`);
      }
      if (merged.weekly > merged.yearly) {
        throw ApiError.badRequest(`${label} weekly limit cannot exceed yearly limit`);
      }

      return merged;
    };

    if (transferLimits) {
      user.transferLimits = validatePeriodLimits(
        transferLimits,
        user.transferLimits,
        SYSTEM_LIMITS.TRANSFER,
        "Transfer"
      );
    }

    if (receivingLimits) {
      user.receivingLimits = validatePeriodLimits(
        receivingLimits,
        user.receivingLimits,
        SYSTEM_LIMITS.RECEIVING,
        "Receiving"
      );
    }

    await user.save();

    return ApiResponse.success(
      res,
      {
        transferLimits: user.transferLimits,
        receivingLimits: user.receivingLimits
      },
      "Velocity limits updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  setTpin,
  changeTpin,
  getLimits,
  updateLimits
};
