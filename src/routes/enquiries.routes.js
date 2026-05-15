const express = require("express");
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/enquiryController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions. Please try again later." },
});

// Public submit
router.post("/", submitLimiter, ctrl.submit);

// Admin
router.get("/", requireAuth, ctrl.adminList);
router.get("/:id", requireAuth, ctrl.adminGet);
router.put("/:id", requireAuth, ctrl.update);
router.delete("/:id", requireAuth, ctrl.remove);

module.exports = router;
