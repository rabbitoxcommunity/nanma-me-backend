const express = require("express");
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { error: "Too many login attempts. Please try again later." },
});

router.post("/login", loginLimiter, ctrl.login);
router.get("/me", requireAuth, ctrl.me);
router.post("/change-password", requireAuth, ctrl.changePassword);

module.exports = router;
