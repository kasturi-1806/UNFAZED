const Therapist = require("../models/Therapist");

const canAccess = async (
  therapistId,
  featureKey,
  requestedValue = null
) => {
  const therapist = await Therapist.findById(
    therapistId
  ).populate("subscriptionTier");

  if (!therapist) {
    return {
      allowed: false,
      reason: "Therapist not found.",
    };
  }

  const tier = therapist.subscriptionTier;

  if (!tier || !tier.isActive) {
    return {
      allowed: false,
      reason: "No active subscription tier assigned.",
    };
  }

  switch (featureKey) {
    // =========================================
    // ACTIVE CLIENT LIMIT
    // =========================================
    case "active-client-cap": {
      if (
        requestedValue === null ||
        requestedValue === undefined
      ) {
        return {
          allowed: true,
          limit: tier.activeClientLimit,
        };
      }

      const allowed =
        requestedValue <=
        tier.activeClientLimit;

      return {
        allowed,
        limit: tier.activeClientLimit,
        reason: allowed
          ? null
          : `Your ${tier.name} plan allows a maximum of ${tier.activeClientLimit} active clients.`,
      };
    }

    // =========================================
    // SESSION NOTE TEMPLATE
    // =========================================
    case "note-template": {
      const templateAccess = {
        basic: ["basic"],
        "basic-soap": [
          "basic",
          "soap",
        ],
        "basic-soap-dap": [
          "basic",
          "soap",
          "dap",
        ],
      };

      const allowedTemplates =
        templateAccess[
          tier.noteTemplateType
        ] || [];

      const allowed =
        !requestedValue ||
        allowedTemplates.includes(
          requestedValue
        );

      return {
        allowed,
        allowedTemplates,
        reason: allowed
          ? null
          : `${requestedValue?.toUpperCase()} note template is not available on your ${tier.name} plan.`,
      };
    }

    // =========================================
    // ANALYTICS DEPTH
    // =========================================
    case "analytics-depth": {
      const depthOrder = {
        basic: 1,
        standard: 2,
        advanced: 3,
      };

      const currentLevel =
        depthOrder[
          tier.analyticsDepth
        ] || 0;

      const requestedLevel =
        depthOrder[
          requestedValue
        ] || 0;

      const allowed =
        currentLevel >= requestedLevel;

      return {
        allowed,
        currentDepth:
          tier.analyticsDepth,
        reason: allowed
          ? null
          : `Advanced analytics are not available on your ${tier.name} plan.`,
      };
    }

    // =========================================
    // FEATURE FLAGS
    // =========================================
    case "chat":
      return {
        allowed:
          tier.features?.chat === true,
        reason:
          tier.features?.chat === true
            ? null
            : "Chat is not available on your current plan.",
      };

    case "packages":
      return {
        allowed:
          tier.features?.packages === true,
        reason:
          tier.features?.packages === true
            ? null
            : "Packages are not available on your current plan.",
      };

    case "analytics":
      return {
        allowed:
          tier.features?.analytics === true,
        reason:
          tier.features?.analytics === true
            ? null
            : "Analytics are not available on your current plan.",
      };

    case "advanced-analytics":
      return {
        allowed:
          tier.features?.advancedAnalytics === true,
        reason:
          tier.features?.advancedAnalytics === true
            ? null
            : "Advanced analytics require a higher subscription tier.",
      };

    default:
      return {
        allowed: false,
        reason: `Unknown feature: ${featureKey}`,
      };
  }
};

module.exports = {
  canAccess,
};