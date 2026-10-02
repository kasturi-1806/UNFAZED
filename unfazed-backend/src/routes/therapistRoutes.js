const express = require("express");
const {
  getAllTherapists,
  getTherapistBySlug,
  updateTherapistProfile,
} = require("../controllers/therapistController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", getAllTherapists);
router.put("/profile", authMiddleware, updateTherapistProfile);
router.get("/:slug", getTherapistBySlug);
module.exports = router;
