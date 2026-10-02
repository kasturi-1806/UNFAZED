const express = require("express");
const {
  demoPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  getMyPayments,
  downloadInvoice,
} = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
router.post(
  "/demo",
  authMiddleware,
  demoPayment
);

router.post(
  "/razorpay/order",
  authMiddleware,
  createRazorpayOrder
);

router.post(
  "/razorpay/verify",
  authMiddleware,
  verifyRazorpayPayment
);

router.post(
  "/razorpay/webhook",
  razorpayWebhook
);

router.get(
  "/my",
  authMiddleware,
  getMyPayments
);
router.get(
  "/invoice/:fileName",
  authMiddleware,
  downloadInvoice
);

module.exports = router;
