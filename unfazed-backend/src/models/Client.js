
const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
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

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    tags: {
      type: [String],
      default: [],
    },

    presentingConcern: {
      type: String,
      default: "",
      trim: true,
    },

    lastSessionAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A user should have only one client record for the same therapist.
clientSchema.index(
  { therapist: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model("Client", clientSchema);

