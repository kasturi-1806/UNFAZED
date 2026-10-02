const Therapist = require("../models/Therapist");

// GET ALL THERAPISTS
const getAllTherapists = async (req, res) => {
  try {
    const therapists = await Therapist.find(
      {},
      {
        password_hash: 0,
      }
    );

    res.json({
      success: true,
      count: therapists.length,
      therapists,
    });
  } catch (error) {
    console.error("Get therapists error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET THERAPIST BY SLUG
const getTherapistBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const therapist = await Therapist.findOne(
      { slug },
      {
        password_hash: 0,
      }
    );

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    res.json({
      success: true,
      therapist,
    });
  } catch (error) {
    console.error("Get therapist error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// UPDATE THERAPIST PROFILE
const updateTherapistProfile = async (req, res) => {
  try {
    const therapistId = req.user.id;

    if (!therapistId) {
      return res.status(401).json({
        success: false,
        message: "Therapist authentication required",
      });
    }

    const {
      name,
      bio,
      specializations,
      languages,
    } = req.body || {};

    console.log("PROFILE UPDATE ID:", therapistId);
    console.log("PROFILE UPDATE BODY:", req.body);

    // Find the existing therapist first
    const therapist = await Therapist.findById(therapistId);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    // Only update name when a valid name is provided.
    // This prevents an empty frontend value from
    // violating the required name field.
    if (name !== undefined && name.trim()) {
      therapist.name = name.trim();
    }

    if (bio !== undefined) {
      therapist.bio = bio.trim();
    }

    if (specializations !== undefined) {
      therapist.specializations = Array.isArray(
        specializations
      )
        ? specializations
        : [];
    }

    if (languages !== undefined) {
      therapist.languages = Array.isArray(languages)
        ? languages
        : [];
    }

    await therapist.save();

    console.log("PROFILE SAVED:", {
      id: therapist._id,
      name: therapist.name,
      specializations: therapist.specializations,
      languages: therapist.languages,
    });

    return res.json({
      success: true,
      message: "Therapist profile updated successfully",
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        bio: therapist.bio,
        specializations:
          therapist.specializations || [],
        languages:
          therapist.languages || [],
      },
    });
  } catch (error) {
    console.error(
      "Update therapist profile error:",
      error.name,
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
module.exports = {
  getAllTherapists,
  getTherapistBySlug,
  updateTherapistProfile,
};