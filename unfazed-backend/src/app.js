const express = require("express");
const authRoutes = require("./routes/authRoutes");
const therapistRoutes = require("./routes/therapistRoutes");
const cors = require("cors");
const appointmentRoutes = require("./routes/appointmentRoutes");
const intakeRoutes = require("./routes/intakeRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const clientRoutes = require("./routes/ClientRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const app = express();
const paymentRoutes = require("./routes/paymentRoutes");
// ==========================================
// MIDDLEWARE
// ==========================================

// Keep raw request body for Razorpay webhook
// so the webhook signature can be verified.
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (
        req.originalUrl ===
        "/api/payments/razorpay/webhook"
      ) {
        req.rawBody = buf;
      }
    },
  })
);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ==========================================
// MESSAGE ROUTES
// ==========================================

app.use("/api/messages", messageRoutes);

// ==========================================
// SIMPLE TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "THIS IS MY NEW BACKEND",
  });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

// ==========================================
// EXISTING ROUTES
// ==========================================

app.use("/api/therapists", therapistRoutes);

app.use("/api/appointments", appointmentRoutes);

app.use("/api/intake", intakeRoutes);

app.use("/api/availability", availabilityRoutes);

app.use("/api/clients", clientRoutes);

app.use("/api/notifications", notificationRoutes);

// ==========================================
// ADMIN ROUTES
// ==========================================

app.use("/api/admin", adminRoutes);
app.use(
  "/api/analytics",
  analyticsRoutes
);
// ==========================================
// AVAILABILITY TEST
// ==========================================

app.get("/api/availability-test", (req, res) => {
  res.json({
    success: true,
    message: "Availability routes are loaded",
  });
});
// ==========================================
// PAYMENT ROUTES
// ==========================================

app.use("/api/payments", paymentRoutes);
// ==========================================
// ROUTE DEBUG
// ==========================================

console.log(
  "ROUTE DETAILS:",
  app.router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: layer.route.methods,
    }))
);

module.exports = app;