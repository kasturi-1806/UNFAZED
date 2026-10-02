const express = require("express");
const requireRole = require("../middleware/roleMiddleware");
const {
  createAppointment,
  getUserAppointments,
  getTherapistAppointments,
  getPatientAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} = require("../controllers/appointmentController");

const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireRole("user"),
  createAppointment
);

router.get(
  "/user",
  authMiddleware,
  requireRole("user"),
  getUserAppointments
);

router.get(
  "/therapist",
  authMiddleware,
  requireRole("therapist"),
  getTherapistAppointments
);

router.get(
  "/patient/:clientId",
  authMiddleware,
  requireRole("therapist"),
  getPatientAppointments
);
router.put(
  "/:appointmentId/status",
  authMiddleware,
  requireRole("therapist"),
  updateAppointmentStatus
);
router.put(
  "/:appointmentId/cancel",
  authMiddleware,
  requireRole("user"),
  cancelAppointment
);

module.exports = router;
