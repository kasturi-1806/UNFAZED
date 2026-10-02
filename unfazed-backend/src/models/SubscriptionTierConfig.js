const mongoose = require("mongoose");

const subscriptionTierConfigSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },

      activeClientLimit: {
        type: Number,
        required: true,
        min: 1,
      },

      noteTemplateType: {
        type: String,
        required: true,
        enum: [
          "basic",
          "basic-soap",
          "basic-soap-dap",
        ],
      },

      analyticsDepth: {
        type: String,
        required: true,
        enum: [
          "basic",
          "standard",
          "advanced",
        ],
      },

      features: {
        chat: {
          type: Boolean,
          default: true,
        },

        packages: {
          type: Boolean,
          default: true,
        },

        analytics: {
          type: Boolean,
          default: true,
        },

        advancedAnalytics: {
          type: Boolean,
          default: false,
        },
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "SubscriptionTierConfig",
  subscriptionTierConfigSchema
);