const mongoose = require("mongoose");
const dotenv = require("dotenv");

const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");

dotenv.config();

const tiers = [
  {
    name: "Basic",
    activeClientLimit: 10,
    noteTemplateType: "basic",
    analyticsDepth: "basic",
    features: {
      chat: true,
      packages: true,
      analytics: true,
      advancedAnalytics: false,
    },
    isActive: true,
  },
  {
    name: "Professional",
    activeClientLimit: 50,
    noteTemplateType: "basic-soap",
    analyticsDepth: "standard",
    features: {
      chat: true,
      packages: true,
      analytics: true,
      advancedAnalytics: false,
    },
    isActive: true,
  },
  {
    name: "Premium",
    activeClientLimit: 200,
    noteTemplateType: "basic-soap-dap",
    analyticsDepth: "advanced",
    features: {
      chat: true,
      packages: true,
      analytics: true,
      advancedAnalytics: true,
    },
    isActive: true,
  },
];

const seedSubscriptionTiers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    for (const tier of tiers) {
      await SubscriptionTierConfig.findOneAndUpdate(
        { name: tier.name },
        tier,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`Tier ready: ${tier.name}`);
    }

    console.log(
      "Subscription tiers seeded successfully."
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(
      "Subscription tier seed failed:",
      error.message
    );

    await mongoose.disconnect();
    process.exit(1);
  }
};

seedSubscriptionTiers();