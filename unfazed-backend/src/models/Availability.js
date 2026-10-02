const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      unique: true,
    },
    sessionDuration: {
    type: Number,
    default: 50,
    min: 15,
    },

    bufferMinutes: {
    type: Number,
    default: 10, 
    min: 0,
    },
    schedule: {
      monday: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: "09:00" },
        endTime: { type: String, default: "17:00" },
      },

      tuesday: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: "09:00" },
        endTime: { type: String, default: "17:00" },
      },

      wednesday: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: "09:00" },
        endTime: { type: String, default: "17:00" },
      },

      thursday: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: "09:00" },
        endTime: { type: String, default: "17:00" },
      },

      friday: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: "09:00" },
        endTime: { type: String, default: "17:00" },
      },

      saturday: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: "09:00" },
        endTime: { type: String, default: "17:00" },
      },

      sunday: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: "09:00" },
        endTime: { type: String, default: "17:00" },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Availability", availabilitySchema);