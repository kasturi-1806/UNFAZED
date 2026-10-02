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
router.post(
  "/",
  authMiddleware,
  createPackage
);

router.get(
  "/my",
  authMiddleware,
  getMyPackages
);

router.put(
  "/:packageId",
  authMiddleware,
  updatePackage
);
router.delete(
  "/:packageId",
  authMiddleware,
  deletePackage
);
router.get(
  "/therapist/:therapistId",
  getTherapistPackages
);

module.exports = router;
