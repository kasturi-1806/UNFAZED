const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const requireRole = require("../middleware/roleMiddleware");

const {
  getAvailability,
  updateAvailability,
  getAvailableSlots,
  getPublicAvailableSlots,
  getPublicCalendarAvailability,
} = require("../controllers/availabilityController");

// Therapist gets their availability
router.get(
  "/",
  authMiddleware,
  requireRole("therapist"),
  getAvailability
);

// Therapist updates their availability
router.put(
  "/",
  authMiddleware,
  requireRole("therapist"),
  updateAvailability
);

// Therapist gets their available slots
router.get(
  "/slots",
  authMiddleware,
  requireRole("therapist"),
  getAvailableSlots
);

// Public calendar availability
router.get(
  "/public/:slug/calendar",
  getPublicCalendarAvailability
);

// Public available slots
router.get(
  "/public/:slug/slots",
  getPublicAvailableSlots
);

module.exports = router;