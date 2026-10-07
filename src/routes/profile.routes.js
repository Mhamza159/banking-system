const express = require("express");
const {
  getProfile,
  updateProfile,
  changePassword,
  setTpin,
  changeTpin,
  getLimits,
  updateLimits
} = require("../controllers/profile.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// All profile & security routes require authentication
router.use(authMiddleware);

// 1. Profile retrieval & mass-assignment safe update
router.get("/", getProfile);
router.patch("/", updateProfile);

// 2. In-session password rotation
router.patch("/password", changePassword);

// 3. TPIN configuration & rotation
router.post("/tpin", setTpin);
router.patch("/tpin", changeTpin);

// 4. Velocity limit inspection & modification
router.get("/limits", getLimits);
router.patch("/limits", updateLimits);

module.exports = router;
