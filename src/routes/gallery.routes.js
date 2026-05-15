const express = require("express");
const ctrl = require("../controllers/galleryController");
const { requireAuth } = require("../middleware/auth");
const { uploadImage, uploadVideo } = require("../middleware/upload");

const router = express.Router();

// Public
router.get("/public", ctrl.list);

// Admin
router.get("/", requireAuth, ctrl.adminList);
router.post("/youtube", requireAuth, ctrl.createYoutube);
router.post("/upload-image", requireAuth, uploadImage.single("file"), ctrl.uploadImage);
router.post("/upload-video", requireAuth, uploadVideo.single("file"), ctrl.uploadVideo);
router.put("/:id", requireAuth, ctrl.update);
router.delete("/:id", requireAuth, ctrl.remove);

module.exports = router;
