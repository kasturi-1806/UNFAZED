const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Therapist = require("../models/Therapist");

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

    const isMatch = await bcrypt.compare(password, admin.password);

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
      {
        expiresIn: "7d",
      }
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
    const therapistCount = await Therapist.countDocuments();
    const userCount = await User.countDocuments();

    return res.json({
      success: true,
      stats: {
        therapists: therapistCount,
        users: userCount,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
};

const getAllTherapists = async (req, res) => {
   try {
    const therapists = await Therapist.find({}).lean();
    console.log("ADMIN THERAPIST DATA:",therapists.map((t) => ({
    id: t._id,
    name: t.name,
    specializations: t.specializations,
    languages: t.languages,
  }))
);
    const formattedTherapists = therapists.map((therapist) => ({
      _id: therapist._id,
      name: therapist.name || "",
      email: therapist.email || "",
      slug: therapist.slug || "",
      therapistCode: therapist.therapistCode || "",
      bio: therapist.bio || "",
      specializations: Array.isArray(therapist.specializations)
        ? therapist.specializations
        : [],
      languages: Array.isArray(therapist.languages)
        ? therapist.languages
        : [],
      createdAt: therapist.createdAt,
    }));

    return res.json({
      success: true,
      therapists: formattedTherapists,
    });
  } catch (error) {
    console.error("Get therapists error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch therapists",
    });
  }
}

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
    console.error("Get users error:", error);

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

    const therapist = await Therapist.findById(therapistId);

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

      existingCode = await Therapist.findOne({
        therapistCode,
      });
    } while (existingCode);

    therapist.therapistCode = therapistCode;

    await therapist.save();

    return res.json({
      success: true,
      message: "Therapist code assigned successfully",
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        therapistCode: therapist.therapistCode,
      },
    });
  } catch (error) {
    console.error(
      "Assign therapist code error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to assign therapist code",
    });
  }
};

module.exports = {
  loginAdmin,
  getAdminDashboard,
  getAllTherapists,
  getAllUsers,
  assignTherapistCode,
};
