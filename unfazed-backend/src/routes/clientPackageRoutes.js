const express = require("express");

const {
  purchasePackage,
  demoPackagePayment,
  createRazorpayPackageOrder,
  verifyRazorpayPackagePayment,
  getMyPackages,
  getClientPackage,
} = require("../controllers/clientPackageController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Purchase a package
router.post(
  "/purchase",
  authMiddleware,
  purchasePackage
);

// Razorpay package payment - create order
router.post(
  "/razorpay/order",
  authMiddleware,
  createRazorpayPackageOrder
);

// Razorpay package payment - verify payment
router.post(
  "/razorpay/verify",
  authMiddleware,
  verifyRazorpayPackagePayment
);

// Old demo payment route - kept temporarily
router.post(
  "/demo-payment",
  authMiddleware,
  demoPackagePayment
);

// Get all packages purchased by logged-in client
router.get(
  "/my",
  authMiddleware,
  getMyPackages
);

// Get one purchased package
router.get(
  "/:clientPackageId",
  authMiddleware,
  getClientPackage
);

module.exports = router;