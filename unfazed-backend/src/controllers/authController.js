const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Therapist = require("../models/Therapist");

// =========================
// USER REGISTER
// =========================
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: passwordHash,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("User registration error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// USER LOGIN
// =========================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: "user",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("User login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// THERAPIST REGISTER
// =========================
const registerTherapist = async (req, res) => {
  try {
    console.log("REQUEST BODY:", req.body);

    const {
      name,
      email,
      password,
      slug,
      bio,
      specializations,
      languages,
    } = req.body || {};

    if (!name || !email || !password || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and slug are required",
      });
    }

    const existingTherapist = await Therapist.findOne({ email });

    if (existingTherapist) {
      return res.status(409).json({
        success: false,
        message: "Therapist already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const therapist = await Therapist.create({
      name,
      email,
      password_hash: passwordHash,
      slug,
      bio,
      specializations,
      languages,
    });

    res.status(201).json({
      success: true,
      message: "Therapist registered successfully",
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        bio: therapist.bio,
        specializations: therapist.specializations,
        languages: therapist.languages,
      },
    });
  } catch (error) {
    console.error("Therapist registration error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const loginTherapist = async (req, res) => {
  console.log("LOGIN BODY:", req.body);

  try {
    const {
      therapistCode,
      email,
      password,
    } = req.body || {};

    // Therapist code is required
    if (!therapistCode || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Therapist code, email and password are required",
      });
    }

    // Find therapist using email
    const therapist = await Therapist.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!therapist) {
      return res.status(401).json({
        success: false,
        message: "Invalid therapist code, email or password",
      });
    }

    // Verify therapist code
    const enteredCode = therapistCode
      .trim()
      .toUpperCase();

    const assignedCode = therapist.therapistCode
      ? therapist.therapistCode.trim().toUpperCase()
      : "";

    if (!assignedCode || enteredCode !== assignedCode) {
      return res.status(401).json({
        success: false,
        message: "Invalid therapist code",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(
      password,
      therapist.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid therapist code, email or password",
      });
    }

    // Create therapist JWT
    const token = jwt.sign(
      {
        id: therapist._id,
        role: "therapist",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      message: "Therapist login successful",
      token,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        therapistCode: therapist.therapistCode,
        specializations:
          therapist.specializations,
        languages: therapist.languages,
      },
    });
  } catch (error) {
    console.error(
      "Therapist login error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  registerTherapist,
  loginTherapist,
};