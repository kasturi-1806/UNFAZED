const Appointment = require("../models/Appointment");
const Therapist = require("../models/Therapist");
const Client = require("../models/Client");
const ClientPackage = require("../models/ClientPackage");
const Notification = require("../models/Notification");
const { canAccess } = require("../services/entitlementService");
// =========================
// CREATE APPOINTMENT
// =========================
const createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      therapistId,
      date,
      time,
      duration,
      notes,
      clientPackageId,
    } = req.body;

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (!therapistId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Therapist, date and time are required",
      });
    }

    // ==========================================
    // FIND THERAPIST
    // ==========================================

    const therapist = await Therapist.findById(
      therapistId
    );

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }
// ==========================================
// CHECK ACTIVE CLIENT SUBSCRIPTION LIMIT
// ==========================================

const existingClient = await Client.findOne({
  therapist: therapistId,
  user: userId,
});

if (!existingClient) {
  const currentClientCount =
    await Client.countDocuments({
      therapist: therapistId,
    });

  const entitlement = await canAccess(
    therapistId,
    "active-client-cap",
    currentClientCount + 1
  );

  if (!entitlement.allowed) {
    return res.status(403).json({
      success: false,
      message: entitlement.reason,
      feature: "active-client-cap",
      limit: entitlement.limit,
    });
  }
}
    // ==========================================
    // FIND AND VALIDATE CLIENT PACKAGE
    // ==========================================

    let clientPackage = null;

    if (clientPackageId) {
      clientPackage = await ClientPackage.findOne({
        _id: clientPackageId,
        user: userId,
        therapist: therapistId,
        paymentStatus: "paid",
        status: "active",
      });

      // Package not found
      if (!clientPackage) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or inactive package. Please select a valid paid package.",
        });
      }

      // ==========================================
      // CHECK PACKAGE EXPIRY
      // ==========================================

      if (
        clientPackage.expiryDate &&
        new Date(clientPackage.expiryDate) < new Date()
      ) {
        clientPackage.status = "expired";

        await clientPackage.save();

        return res.status(400).json({
          success: false,
          message:
            "This package has expired. Please purchase a new package.",
        });
      }

      // ==========================================
      // CHECK REMAINING SESSIONS
      // ==========================================

      if (clientPackage.sessionsRemaining <= 0) {
        clientPackage.status = "completed";

        await clientPackage.save();

        return res.status(400).json({
          success: false,
          message:
            "No sessions remaining in this package.",
        });
      }
    }

    // ==========================================
    // CREATE APPOINTMENT
    // ==========================================

    const appointment = await Appointment.create({
      user: userId,
      therapist: therapistId,

      // Save package used for this appointment
      clientPackage: clientPackage
        ? clientPackage._id
        : null,

      date,
      time,
      duration: duration || 50,
      notes: notes || "",
      status: "pending",
    });

    // ==========================================
    // DEDUCT ONE PACKAGE SESSION
    // ==========================================

    if (clientPackage) {
      clientPackage.sessionsRemaining -= 1;

      // If no sessions are left,
      // mark package as completed
      if (clientPackage.sessionsRemaining === 0) {
        clientPackage.status = "completed";
      }

      await clientPackage.save();
    }

    // ==========================================
    // CREATE CLIENT
    // ==========================================

    await Client.findOneAndUpdate(
      {
        therapist: therapistId,
        user: userId,
      },
      {
        $setOnInsert: {
          therapist: therapistId,
          user: userId,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    // ==========================================
    // NOTIFY THERAPIST
    // ==========================================

    await Notification.create({
      recipient: therapistId,
      type: "appointment-booked",
      title: "New Appointment",
      message: `New appointment booked for ${date} at ${time}.`,
      appointment: appointment._id,
    });

    // ==========================================
    // GET POPULATED APPOINTMENT
    // ==========================================

    const populatedAppointment =
      await Appointment.findById(
        appointment._id
      )
        .populate("user", "name email")
        .populate(
          "therapist",
          "name email slug specializations languages"
        )
        .populate("clientPackage");

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,

      message: clientPackage
        ? "Appointment booked using package session"
        : "Appointment booked successfully",

      appointment: populatedAppointment,

      packageUsed: !!clientPackage,

      sessionsRemaining: clientPackage
        ? clientPackage.sessionsRemaining
        : null,
    });
  } catch (error) {
    console.error(
      "Create appointment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GET USER APPOINTMENTS
// =========================
const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    const appointments = await Appointment.find({
      user: userId,
    })
      .populate(
        "therapist",
        "name email slug specializations languages"
      )
      .populate("clientPackage")
      .sort({ date: 1 });

    return res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error(
      "Get user appointments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GET THERAPIST APPOINTMENTS
// =========================
const getTherapistAppointments = async (req, res) => {
  try {
    const therapistId = req.user.id;

    const appointments = await Appointment.find({
      therapist: therapistId,
    })
      .populate("user", "name email")
      .populate("clientPackage")
      .sort({ date: 1 });

    return res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error(
      "Get therapist appointments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GET APPOINTMENTS FOR ONE PATIENT
// =========================
const getPatientAppointments = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { clientId } = req.params;

    // Make sure this client belongs
    // to the logged-in therapist
    const client = await Client.findOne({
      _id: clientId,
      therapist: therapistId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Get appointments between
    // this therapist and patient
    const appointments = await Appointment.find({
      therapist: therapistId,
      user: client.user,
    })
      .populate("user", "name email")
      .populate("clientPackage")
      .sort({ date: -1 });

    return res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error(
      "Get patient appointments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// UPDATE APPOINTMENT STATUS
// =========================
const updateAppointmentStatus = async (
  req,
  res
) => {
  try {
    const therapistId = req.user.id;
    const { appointmentId } = req.params;
    const { status } = req.body;

    const appointment =
      await Appointment.findOne({
        _id: appointmentId,
        therapist: therapistId,
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // ---------------------------------
    // CONFIRM APPOINTMENT
    // ---------------------------------

    if (status === "confirmed") {
      if (appointment.status !== "pending") {
        return res.status(400).json({
          success: false,
          message:
            "Only pending appointments can be confirmed",
        });
      }

      appointment.status = "confirmed";

      await appointment.save();

      // Notify patient
      await Notification.create({
        recipient: appointment.user,
        type: "appointment-confirmed",
        title: "Appointment Confirmed",
        message: `Your appointment on ${appointment.date} at ${appointment.time} has been confirmed.`,
        appointment: appointment._id,
      });

      return res.json({
        success: true,
        message:
          "Appointment confirmed successfully",
        appointment,
      });
    }

    // ---------------------------------
    // CANCEL APPOINTMENT
    // ---------------------------------

    if (status === "cancelled") {
      if (
        appointment.status === "completed" ||
        appointment.status === "in-session"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This appointment cannot be cancelled",
        });
      }

      appointment.status = "cancelled";

      await appointment.save();

      // Notify patient
      await Notification.create({
        recipient: appointment.user,
        type: "appointment-cancelled",
        title: "Appointment Cancelled",
        message: `Your appointment on ${appointment.date} at ${appointment.time} has been cancelled.`,
        appointment: appointment._id,
      });

      return res.json({
        success: true,
        message:
          "Appointment cancelled successfully",
        appointment,
      });
    }

    // ---------------------------------
    // START SESSION
    // ---------------------------------

    if (status === "in-session") {
      if (appointment.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message:
            "Only confirmed appointments can start a session",
        });
      }

      // Prevent overwriting original start time
      if (!appointment.sessionStartedAt) {
        appointment.sessionStartedAt =
          new Date();
      }

      appointment.status = "in-session";

      await appointment.save();

      // Notify patient
      await Notification.create({
        recipient: appointment.user,
        type: "session-started",
        title: "Session Started",
        message:
          "Your therapy session has started.",
        appointment: appointment._id,
      });

      return res.json({
        success: true,
        message:
          "Session started successfully",
        appointment,
      });
    }

    // ---------------------------------
    // COMPLETE SESSION
    // ---------------------------------

    if (status === "completed") {
      if (appointment.status !== "in-session") {
        return res.status(400).json({
          success: false,
          message:
            "Session must be started before it can be completed",
        });
      }

      // Make sure start time exists
      if (!appointment.sessionStartedAt) {
        appointment.sessionStartedAt =
          new Date();
      }

      appointment.status = "completed";
      appointment.completedAt = new Date();

      await appointment.save();

      // Update client last session
      await Client.findOneAndUpdate(
        {
          therapist: therapistId,
          user: appointment.user,
        },
        {
          $set: {
            lastSessionAt:
              appointment.completedAt,
          },
        }
      );

      // Notify patient
      await Notification.create({
        recipient: appointment.user,
        type: "session-completed",
        title: "Session Completed",
        message:
          "Your therapy session has been completed.",
        appointment: appointment._id,
      });

      return res.json({
        success: true,
        message:
          "Session completed successfully",
        appointment,
      });
    }

    // ---------------------------------
    // NO-SHOW
    // ---------------------------------

    if (status === "no-show") {
      if (appointment.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message:
            "Only confirmed appointments can be marked as no-show",
        });
      }

      appointment.status = "no-show";

      await appointment.save();

      return res.json({
        success: true,
        message:
          "Appointment marked as no-show",
        appointment,
      });
    }

    // ---------------------------------
    // INVALID STATUS
    // ---------------------------------

    return res.status(400).json({
      success: false,
      message:
        "Invalid appointment status",
    });
  } catch (error) {
    console.error(
      "Update appointment status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// CANCEL APPOINTMENT - USER
// =========================
const cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId } = req.params;

    const appointment =
      await Appointment.findOne({
        _id: appointmentId,
        user: userId,
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (
      appointment.status === "completed" ||
      appointment.status === "in-session"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This appointment cannot be cancelled",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Appointment is already cancelled",
      });
    }

    appointment.status = "cancelled";

    await appointment.save();

    return res.json({
      success: true,
      message:
        "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error(
      "Cancel appointment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// EXPORTS
// =========================
module.exports = {
  createAppointment,
  getUserAppointments,
  getTherapistAppointments,
  getPatientAppointments,
  updateAppointmentStatus,
  cancelAppointment,
};