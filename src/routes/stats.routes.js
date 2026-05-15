const express = require("express");
const ctrl = require("../controllers/statsController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", requireAuth, ctrl.dashboard);

module.exports = router;
