const mongoose = require("mongoose");

const therapistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password_hash: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    therapistCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // =========================================
    // SUBSCRIPTION TIER
    // =========================================
    subscriptionTier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionTierConfig",
      default: null,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    specializations: {
      type: [String],
      default: [],
    },

    languages: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Therapist",
  therapistSchema
);