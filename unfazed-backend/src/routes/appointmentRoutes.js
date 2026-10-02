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

// User books an appointment
router.post(
  "/",
  authMiddleware,
  requireRole("user"),
  createAppointment
);

// User gets their appointments
router.get(
  "/user",
  authMiddleware,
  requireRole("user"),
  getUserAppointments
);

// Therapist gets their appointments
router.get(
  "/therapist",
  authMiddleware,
  requireRole("therapist"),
  getTherapistAppointments
);
// Therapist gets appointments for one patient
router.get(
  "/patient/:clientId",
  authMiddleware,
  requireRole("therapist"),
  getPatientAppointments
);

// Therapist updates appointment status
router.put(
  "/:appointmentId/status",
  authMiddleware,
  requireRole("therapist"),
  updateAppointmentStatus
);

// User cancels appointment
router.put(
  "/:appointmentId/cancel",
  authMiddleware,
  requireRole("user"),
  cancelAppointment
);

module.exports = router;