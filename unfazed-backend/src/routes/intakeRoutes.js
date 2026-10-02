const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  saveIntakeForm,
  getPatientIntakeForm,
} = require("../controllers/intakeController");

const router = express.Router();
router.post(
  "/",
  authMiddleware,
  requireRole("user"),
  saveIntakeForm
);

router.get(
  "/patient/:userId",
  authMiddleware,
  getPatientIntakeForm
);

module.exports = router;
