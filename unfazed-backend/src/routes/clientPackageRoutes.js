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
router.post(
  "/purchase",
  authMiddleware,
  purchasePackage
);

router.post(
  "/razorpay/order",
  authMiddleware,
  createRazorpayPackageOrder
);

router.post(
  "/razorpay/verify",
  authMiddleware,
  verifyRazorpayPackagePayment
);

router.post(
  "/demo-payment",
  authMiddleware,
  demoPackagePayment
);

router.get(
  "/my",
  authMiddleware,
  getMyPackages
);

router.get(
  "/:clientPackageId",
  authMiddleware,
  getClientPackage
);

module.exports = router;
