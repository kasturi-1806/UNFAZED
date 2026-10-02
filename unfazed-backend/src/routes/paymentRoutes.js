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

// ==========================================
// DEMO PAYMENT
// ==========================================

router.post(
  "/demo",
  authMiddleware,
  demoPayment
);

// ==========================================
// RAZORPAY ORDER
// ==========================================

router.post(
  "/razorpay/order",
  authMiddleware,
  createRazorpayOrder
);

// ==========================================
// RAZORPAY PAYMENT VERIFICATION
// ==========================================

router.post(
  "/razorpay/verify",
  authMiddleware,
  verifyRazorpayPayment
);

// ==========================================
// RAZORPAY WEBHOOK
// IMPORTANT: No authMiddleware here
// Razorpay calls this endpoint directly
// ==========================================

router.post(
  "/razorpay/webhook",
  razorpayWebhook
);

// ==========================================
// PAYMENT HISTORY
// ==========================================

router.get(
  "/my",
  authMiddleware,
  getMyPayments
);

// ==========================================
// DOWNLOAD INVOICE
// ==========================================

router.get(
  "/invoice/:fileName",
  authMiddleware,
  downloadInvoice
);

module.exports = router;