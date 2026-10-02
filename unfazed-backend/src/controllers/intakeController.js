
const IntakeForm = require("../models/IntakeForm");
const Client = require("../models/Client");

// =========================
// CREATE / UPDATE INTAKE FORM
// =========================
const saveIntakeForm = async (req, res) => {
  try {
    // IMPORTANT:
    // User ID comes from the verified JWT.
    // We do NOT trust userId from frontend.
    const userId = req.user.id || req.user._id;

    const {
      therapistId,
      fullName,
      age,
      phone,
      occupation,
      reasonForSeekingHelp,
      currentConcerns,
      previousTherapy,
      previousTherapyDetails,
      currentMedications,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    // =========================
    // REQUIRED FIELDS
    // =========================
    if (!therapistId || !fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Therapist ID and full name are required",
      });
    }

    // =========================
    // NAME VALIDATION
    // =========================
    const nameRegex = /^[A-Za-z\s.'-]+$/;

    if (!nameRegex.test(fullName.trim())) {
      return res.status(400).json({
        success: false,
        message:
          "Full name can contain only letters, spaces, apostrophes, dots, and hyphens.",
      });
    }

    if (
      emergencyContactName &&
      !nameRegex.test(emergencyContactName.trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Emergency contact name can contain only letters, spaces, apostrophes, dots, and hyphens.",
      });
    }

    // =========================
    // PHONE VALIDATION
    // =========================
    const indianMobileRegex =
      /^\+91[6-9]\d{9}$/;

    if (phone && !indianMobileRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid Indian mobile number with +91 and 10 digits.",
      });
    }

    if (
      emergencyContactPhone &&
      !indianMobileRegex.test(
        emergencyContactPhone
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid emergency contact number with +91 and 10 digits.",
      });
    }

    // =========================
    // CHECK PATIENT CONNECTION
    // =========================
    const client = await Client.findOne({
      therapist: therapistId,
      user: userId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message:
          "Patient is not connected with this therapist",
      });
    }

    // =========================
    // CREATE / UPDATE INTAKE
    // =========================
    const intakeForm =
      await IntakeForm.findOneAndUpdate(
        {
          therapist: therapistId,
          user: userId,
        },
        {
          therapist: therapistId,
          user: userId,
          fullName: fullName.trim(),
          age,
          phone: phone || "",
          occupation,
          reasonForSeekingHelp,
          currentConcerns,
          previousTherapy,
          previousTherapyDetails,
          currentMedications,
          emergencyContactName,
          emergencyContactPhone,
          submittedAt: new Date(),
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Intake form saved successfully",
      intakeForm,
    });
  } catch (error) {
    console.error(
      "Save intake form error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save intake form",
    });
  }
};

// =========================
// GET INTAKE FORM FOR PATIENT
// =========================
const getPatientIntakeForm = async (
  req,
  res
) => {
  try {
    // Therapist ID comes from JWT
    const therapistId =
      req.user.id || req.user._id;

    const { userId } = req.params;

    // =========================
    // CHECK PATIENT CONNECTION
    // =========================
    const client = await Client.findOne({
      therapist: therapistId,
      user: userId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message:
          "Patient is not connected with this therapist",
      });
    }

    // =========================
    // FIND INTAKE FORM
    // =========================
    const intakeForm =
      await IntakeForm.findOne({
        therapist: therapistId,
        user: userId,
      });

    if (!intakeForm) {
      return res.status(404).json({
        success: false,
        message: "Intake form not found",
      });
    }

    return res.status(200).json({
      success: true,
      intakeForm,
    });
  } catch (error) {
    console.error(
      "Get patient intake form error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch intake form",
    });
  }
};

module.exports = {
  saveIntakeForm,
  getPatientIntakeForm,
};

