const express = require("express");

const {
  createPackage,
  getMyPackages,
  getTherapistPackages,
  updatePackage,
  deletePackage,
} = require("../controllers/packageController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// THERAPIST PACKAGE ROUTES
// ==========================================

// Create package
router.post(
  "/",
  authMiddleware,
  createPackage
);

// Get my packages
router.get(
  "/my",
  authMiddleware,
  getMyPackages
);

// Update package
router.put(
  "/:packageId",
  authMiddleware,
  updatePackage
);

// Delete package
router.delete(
  "/:packageId",
  authMiddleware,
  deletePackage
);

// ==========================================
// PUBLIC PACKAGE ROUTE
// ==========================================

// Get active packages of a therapist
router.get(
  "/therapist/:therapistId",
  getTherapistPackages
);

module.exports = router;