const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Therapist = require("../models/Therapist");
const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const therapistCount =
      await Therapist.countDocuments();

    const userCount = await User.countDocuments();

    return res.json({
      success: true,
      stats: {
        therapists: therapistCount,
        users: userCount,
      },
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
};
const getAllTherapists = async (req, res) => {
  try {
    const therapists = await Therapist.find({})
      .populate("subscriptionTier", "name")
      .lean();

    console.log(
      "ADMIN THERAPIST DATA:",
      therapists.map((t) => ({
        id: t._id,
        name: t.name,
        subscriptionTier: t.subscriptionTier,
        specializations: t.specializations,
        languages: t.languages,
      }))
    );

    const formattedTherapists = therapists.map(
      (therapist) => ({
        _id: therapist._id,
        name: therapist.name || "",
        email: therapist.email || "",
        slug: therapist.slug || "",
        therapistCode:
          therapist.therapistCode || "",
        bio: therapist.bio || "",
        specializations:
          Array.isArray(
            therapist.specializations
          )
            ? therapist.specializations
            : [],
        languages:
          Array.isArray(therapist.languages)
            ? therapist.languages
            : [],
        subscriptionTier:
          therapist.subscriptionTier
            ? {
                _id: therapist.subscriptionTier._id,
                name:
                  therapist.subscriptionTier.name,
              }
            : null,
        createdAt: therapist.createdAt,
      })
    );

    return res.json({
      success: true,
      therapists: formattedTherapists,
    });
  } catch (error) {
    console.error(
      "Get therapists error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch therapists",
    });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "Get users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

const assignTherapistCode = async (req, res) => {
  try {
    const { therapistId } = req.params;

    if (!therapistId) {
      return res.status(400).json({
        success: false,
        message: "Therapist ID is required",
      });
    }

    const therapist =
      await Therapist.findById(
        therapistId
      );

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    let therapistCode;
    let existingCode;

    do {
      const randomPart = crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase();

      therapistCode = `TH-${randomPart}`;

      existingCode =
        await Therapist.findOne({
          therapistCode,
        });
    } while (existingCode);

    therapist.therapistCode =
      therapistCode;

    await therapist.save();

    return res.json({
      success: true,
      message:
        "Therapist code assigned successfully",
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        therapistCode:
          therapist.therapistCode,
      },
    });
  } catch (error) {
    console.error(
      "Assign therapist code error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to assign therapist code",
    });
  }
};

const createTherapist = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      slug,
      bio,
      specializations,
      languages,
    } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const existingTherapist =
      await Therapist.findOne({
        email: normalizedEmail,
      });

    if (existingTherapist) {
      return res.status(409).json({
        success: false,
        message:
          "Therapist with this email already exists",
      });
    }

    const basicTier =
      await SubscriptionTierConfig.findOne({
        name: "Basic",
        isActive: true,
      });

    if (!basicTier) {
      return res.status(500).json({
        success: false,
        message:
          "Basic subscription tier is not configured",
      });
    }

    const makeSlug = (value) => {
      return value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    };

    const toArray = (value) => {
      if (Array.isArray(value)) {
        return value
          .map((item) =>
            item.toString().trim()
          )
          .filter(Boolean);
      }

      if (typeof value === "string") {
        return value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return [];
    };

    const baseSlug = makeSlug(
      slug || name
    );

    if (!baseSlug) {
      return res.status(400).json({
        success: false,
        message:
          "A valid therapist name or slug is required",
      });
    }

    let therapistSlug = baseSlug;

    let slugExists =
      await Therapist.findOne({
        slug: therapistSlug,
      });

    let counter = 2;

    while (slugExists) {
      therapistSlug =
        `${baseSlug}-${counter}`;

      slugExists =
        await Therapist.findOne({
          slug: therapistSlug,
        });

      counter++;
    }

    const passwordHash =
      await bcrypt.hash(password, 10);

    const therapist =
      await Therapist.create({
        name: name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        slug: therapistSlug,
        subscriptionTier:
          basicTier._id,
        bio: bio ? bio.trim() : "",
        specializations:
          toArray(specializations),
        languages:
          toArray(languages),
      });

    return res.status(201).json({
      success: true,
      message:
        "Therapist created successfully",
      therapist: {
        _id: therapist._id,
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        therapistCode:
          therapist.therapistCode || "",
        bio: therapist.bio,
        specializations:
          therapist.specializations,
        languages:
          therapist.languages,
      },
    });
  } catch (error) {
    console.error(
      "Create therapist error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create therapist",
    });
  }
};

module.exports = {
  loginAdmin,
  getAdminDashboard,
  getAllTherapists,
  getAllUsers,
  assignTherapistCode,
  createTherapist,
};

