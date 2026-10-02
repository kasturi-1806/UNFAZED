const express = require("express");

const {
  createSessionNote,
  getTherapistNotes,
  getClientNotesForTherapist,
  getSharedNotesForClient,
  updateSessionNote,
  deleteSessionNote,
} = require("../controllers/sessionNoteController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// THERAPIST SESSION NOTE ROUTES
// ==========================================

// Create a session note
router.post(
  "/",
  authMiddleware,
  roleMiddleware("therapist"),
  createSessionNote
);

// Get all notes belonging to logged-in therapist
router.get(
  "/therapist",
  authMiddleware,
  roleMiddleware("therapist"),
  getTherapistNotes
);

// Get notes for a specific client
router.get(
  "/therapist/client/:userId",
  authMiddleware,
  roleMiddleware("therapist"),
  getClientNotesForTherapist
);

// Update a session note
router.put(
  "/:noteId",
  authMiddleware,
  roleMiddleware("therapist"),
  updateSessionNote
);

// Delete a session note
router.delete(
  "/:noteId",
  authMiddleware,
  roleMiddleware("therapist"),
  deleteSessionNote
);

// ==========================================
// CLIENT SESSION NOTE ROUTE
// ==========================================

// Client can ONLY receive shared notes
router.get(
  "/client/shared",
  authMiddleware,
  roleMiddleware("user"),
  getSharedNotesForClient
);

module.exports = router;