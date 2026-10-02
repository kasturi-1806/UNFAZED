const express = require("express");

const {
  loginAdmin,
  getAdminDashboard,
  getAllTherapists,
  getAllUsers,
  assignTherapistCode,
  createTherapist,
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/login", loginAdmin);

router.get(
  "/dashboard",
  authMiddleware,
  requireRole("admin"),
  getAdminDashboard
);

router.get(
  "/therapists",
  authMiddleware,
  requireRole("admin"),
  getAllTherapists
);

router.post(
  "/therapists",
  authMiddleware,
  requireRole("admin"),
  createTherapist
);

router.get(
  "/users",
  authMiddleware,
  requireRole("admin"),
  getAllUsers
);

router.post(
  "/therapists/:therapistId/code",
  authMiddleware,
  requireRole("admin"),
  assignTherapistCode
);

module.exports = router;