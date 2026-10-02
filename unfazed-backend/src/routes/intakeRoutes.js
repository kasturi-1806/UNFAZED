const express = require("express");

const authMiddleware = require("../middleware/AuthMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  saveIntakeForm,
  getPatientIntakeForm,
} = require("../controllers/intakeController");

const router = express.Router();

// Save / update intake form
router.post(
  "/",
  authMiddleware,
  requireRole("user"),
  saveIntakeForm
);

// Therapist gets intake form for one patient
router.get(
  "/patient/:userId",
  authMiddleware,
  getPatientIntakeForm
);

module.exports = router;