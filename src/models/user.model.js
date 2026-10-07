const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const ROLES = require("../constants/roles");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address"
      ],
      index: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false // Never returned in standard queries for security
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    // Transaction PIN (TPIN) Security Controls
    tpin: {
      type: String,
      select: false, // Excluded from standard queries for security
      default: null
    },
    isTpinSet: {
      type: Boolean,
      default: false
    },
    tpinFailedAttempts: {
      type: Number,
      default: 0
    },
    tpinLockedUntil: {
      type: Date,
      default: null
    },
    // Outbound Transfer Velocity Limits (in cents)
    transferLimits: {
      daily: {
        type: Number,
        default: 500000 // $5,000.00
      },
      weekly: {
        type: Number,
        default: 2500000 // $25,000.00
      },
      yearly: {
        type: Number,
        default: 10000000 // $100,000.00
      }
    },
    // Inbound Receiving Velocity Limits (in cents)
    receivingLimits: {
      daily: {
        type: Number,
        default: 1000000 // $10,000.00
      },
      weekly: {
        type: Number,
        default: 5000000 // $50,000.00
      },
      yearly: {
        type: Number,
        default: 20000000 // $200,000.00
      }
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: hasTpin indicator
userSchema.virtual("hasTpin").get(function () {
  if (this.tpin !== undefined && this.tpin !== null) {
    return Boolean(this.tpin);
  }
  return Boolean(this.isTpinSet);
});

// Pre-save hook: Hash password and TPIN with bcrypt (10 rounds) before persisting
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isModified("tpin")) {
    this.isTpinSet = Boolean(this.tpin);
    if (this.tpin && !/^\$2[aby]\$\d{2}\$/.test(this.tpin)) {
      const salt = await bcrypt.genSalt(10);
      this.tpin = await bcrypt.hash(this.tpin, salt);
    }
  }
});

// Instance method: Constant-time comparison of candidate password against bcrypt hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Constant-time comparison of candidate TPIN against bcrypt hash
userSchema.methods.compareTpin = async function (candidateTpin) {
  if (!this.tpin || !candidateTpin) {
    return false;
  }
  return bcrypt.compare(String(candidateTpin), this.tpin);
};

// Instance method: Check whether TPIN is currently locked due to brute-force protection
userSchema.methods.isTpinLocked = function () {
  return Boolean(this.tpinLockedUntil && new Date(this.tpinLockedUntil) > new Date());
};

const User = mongoose.model("User", userSchema);

module.exports = User;