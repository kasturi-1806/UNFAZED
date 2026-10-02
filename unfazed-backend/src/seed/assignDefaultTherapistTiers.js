const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Therapist = require("../models/Therapist");
const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");

dotenv.config();

const assignDefaultTier = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const basicTier =
      await SubscriptionTierConfig.findOne({
        name: "Basic",
        isActive: true,
      });

    if (!basicTier) {
      throw new Error(
        "Basic subscription tier not found. Run the tier seed first."
      );
    }

    const result = await Therapist.updateMany(
      {
        $or: [
          { subscriptionTier: null },
          { subscriptionTier: { $exists: false } },
        ],
      },
      {
        $set: {
          subscriptionTier: basicTier._id,
        },
      }
    );

    console.log(
      `Therapists assigned to Basic tier: ${result.modifiedCount}`
    );

    await mongoose.disconnect();

    console.log(
      "Default therapist tier assignment completed."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Default tier assignment failed:",
      error.message
    );

    await mongoose.disconnect();
    process.exit(1);
  }
};

assignDefaultTier();