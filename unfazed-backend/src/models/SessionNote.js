
const mongoose = require("mongoose");

const sessionNoteSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["private", "shared"],
      default: "private",
      required: true,
    },
    templateType: {
    type: String,
    enum: ["basic", "soap", "dap"],
    default: "basic",
    required: true,
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    sessionDate: {
      type: Date,
      required: true,
    },

    title: {
      type: String,
      trim: true,
      default: "Session Note",
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SessionNote",
  sessionNoteSchema
);

