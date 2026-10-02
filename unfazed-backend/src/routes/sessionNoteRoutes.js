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
router.post(
  "/",
  authMiddleware,
  roleMiddleware("therapist"),
  createSessionNote
);
router.get(
  "/therapist",
  authMiddleware,
  roleMiddleware("therapist"),
  getTherapistNotes
);
router.get(
  "/therapist/client/:userId",
  authMiddleware,
  roleMiddleware("therapist"),
  getClientNotesForTherapist
);
router.put(
  "/:noteId",
  authMiddleware,
  roleMiddleware("therapist"),
  updateSessionNote
);
router.delete(
  "/:noteId",
  authMiddleware,
  roleMiddleware("therapist"),
  deleteSessionNote
);
router.get(
  "/client/shared",
  authMiddleware,
  roleMiddleware("user"),
  getSharedNotesForClient
);

module.exports = router;
