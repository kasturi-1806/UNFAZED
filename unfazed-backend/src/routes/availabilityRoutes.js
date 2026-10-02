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

router.get(
  "/",
  authMiddleware,
  requireRole("therapist"),
  getAvailability
);

router.put(
  "/",
  authMiddleware,
  requireRole("therapist"),
  updateAvailability
);

router.get(
  "/slots",
  authMiddleware,
  requireRole("therapist"),
  getAvailableSlots
);

router.get(
  "/public/:slug/calendar",
  getPublicCalendarAvailability
);

router.get(
  "/public/:slug/slots",
  getPublicAvailableSlots
);

module.exports = router;
