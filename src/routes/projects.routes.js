const express = require("express");
const ctrl = require("../controllers/projectController");
const { requireAuth } = require("../middleware/auth");
const { uploadImage, uploadVideo } = require("../middleware/upload");

const router = express.Router();

// ─── Public routes (read-only) ────────────────────────
router.get("/public", ctrl.list);
router.get("/public/:slug", ctrl.getBySlug);

// ─── Admin routes (protected) ─────────────────────────
router.get("/", requireAuth, ctrl.adminList);
router.get("/:id", requireAuth, ctrl.adminGet);
router.post("/", requireAuth, ctrl.create);
router.put("/:id", requireAuth, ctrl.update);
router.delete("/:id", requireAuth, ctrl.remove);

// Media uploads
router.post(
  "/:id/featured-image",
  requireAuth,
  uploadImage.single("file"),
  ctrl.setFeaturedImage
);
router.post(
  "/:id/gallery",
  requireAuth,
  uploadImage.array("files", 12),
  ctrl.addGalleryImages
);
router.delete("/:id/gallery/:publicId", requireAuth, ctrl.removeGalleryImage);
router.post("/:id/videos", requireAuth, uploadVideo.array("files", 10), ctrl.addProjectVideos);
router.delete("/:id/videos/:publicId", requireAuth, ctrl.removeProjectVideo);

module.exports = router;
