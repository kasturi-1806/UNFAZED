const mongoose = require("mongoose");

const intakeFormSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      min: 1,
      max: 120,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    occupation: {
      type: String,
      trim: true,
      default: "",
    },

    reasonForSeekingHelp: {
      type: String,
      trim: true,
      default: "",
    },

    currentConcerns: {
      type: String,
      trim: true,
      default: "",
    },

    previousTherapy: {
      type: Boolean,
      default: false,
    },

    previousTherapyDetails: {
      type: String,
      trim: true,
      default: "",
    },

    currentMedications: {
      type: String,
      trim: true,
      default: "",
    },

    emergencyContactName: {
      type: String,
      trim: true,
      default: "",
    },

    emergencyContactPhone: {
      type: String,
      trim: true,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

intakeFormSchema.index(
  { therapist: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model("IntakeForm", intakeFormSchema);