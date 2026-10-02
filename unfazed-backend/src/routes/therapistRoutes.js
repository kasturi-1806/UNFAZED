const express = require("express");

const {
  getAllTherapists,
  getTherapistBySlug,
  updateTherapistProfile,
} = require("../controllers/therapistController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get all therapists
router.get("/", getAllTherapists);

// Update logged-in therapist profile
router.put("/profile", authMiddleware, updateTherapistProfile);

// Get therapist by slug
router.get("/:slug", getTherapistBySlug);

module.exports = router;