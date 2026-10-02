const express = require("express");

const {
  getTherapistAnalytics,
} = require("../controllers/analyticsController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  authMiddleware,
  getTherapistAnalytics
);

module.exports = router;