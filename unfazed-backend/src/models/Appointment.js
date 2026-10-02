const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },

    // ==========================================
    // CLIENT PACKAGE USED FOR THIS APPOINTMENT
    // ==========================================
    clientPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientPackage",
      default: null,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      default: 50,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "cancelled",
        "in-session",
        "completed",
        "no-show",
      ],
      default: "pending",
    },

    sessionStartedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
    },

    // =========================
    // PAYMENT DETAILS
    // =========================

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "created",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

    paymentAmount: {
      type: Number,
      default: 0,
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Appointment",
  appointmentSchema
);