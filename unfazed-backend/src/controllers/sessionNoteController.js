const SessionNote = require("../models/SessionNote");
const Appointment = require("../models/Appointment");
const { canAccess } = require("../services/entitlementService");
// ==========================================
// CREATE SESSION NOTE
// ==========================================

const createSessionNote = async (req, res) => {
  try {
    const therapistId = req.user.id;

    const {
      user,
      appointment,
      sessionDate,
      title,
      content,
      type,
      templateType,
    } = req.body;

    if (!user || !sessionDate || !content) {
      return res.status(400).json({
        success: false,
        message:
          "Client, session date and note content are required",
      });
    }

    const noteType =
      type === "shared" ? "shared" : "private";
    // ==========================================
// CHECK NOTE TEMPLATE ACCESS
// ==========================================

const selectedTemplate =
  templateType || "basic";

const templateAccess = await canAccess(
  therapistId,
  "note-template",
  selectedTemplate
);

if (!templateAccess.allowed) {
  return res.status(403).json({
    success: false,
    message: templateAccess.reason,
    feature: "note-template",
    allowedTemplates:
      templateAccess.allowedTemplates,
  });
}
    // If appointment is provided, verify that it belongs
    // to this therapist and client.
    if (appointment) {
      const existingAppointment =
        await Appointment.findOne({
          _id: appointment,
          therapist: therapistId,
          user,
        });

      if (!existingAppointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }
    }

    const note = await SessionNote.create({
      therapist: therapistId,
      user,
      appointment: appointment || null,
      sessionDate,
      title: title || "Session Note",
      content,
      type: noteType,
      templateType: selectedTemplate,
    });

    return res.status(201).json({
      success: true,
      message: "Session note created successfully",
      note,
    });
  } catch (error) {
    console.error(
      "Create session note error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create session note",
    });
  }
};

// ==========================================
// GET THERAPIST SESSION NOTES
// ==========================================

const getTherapistNotes = async (req, res) => {
  try {
    const therapistId = req.user.id;

    const notes = await SessionNote.find({
      therapist: therapistId,
    })
      .populate("user", "name email")
      .populate("appointment")
      .sort({
        sessionDate: -1,
        createdAt: -1,
      });

    return res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error(
      "Get therapist notes error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch session notes",
    });
  }
};

// ==========================================
// GET NOTES FOR ONE CLIENT — THERAPIST
// ==========================================

const getClientNotesForTherapist = async (
  req,
  res
) => {
  try {
    const therapistId = req.user.id;
    const { userId } = req.params;

    const notes = await SessionNote.find({
      therapist: therapistId,
      user: userId,
    })
      .populate("appointment")
      .sort({
        sessionDate: -1,
        createdAt: -1,
      });

    return res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error(
      "Get client notes error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch client notes",
    });
  }
};

// ==========================================
// GET SHARED NOTES — CLIENT
// ==========================================

const getSharedNotesForClient = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    // IMPORTANT:
    // Only shared notes are queried.
    // Private notes can NEVER be returned from this route.
    const notes = await SessionNote.find({
      user: userId,
      type: "shared",
    })
      .populate("therapist", "name slug")
      .populate("appointment")
      .sort({
        sessionDate: -1,
        createdAt: -1,
      });

    return res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error(
      "Get shared client notes error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shared notes",
    });
  }
};

// ==========================================
// UPDATE SESSION NOTE
// ==========================================

const updateSessionNote = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { noteId } = req.params;

    const {
      sessionDate,
      title,
      content,
      type,
    } = req.body;

    const note = await SessionNote.findOne({
      _id: noteId,
      therapist: therapistId,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Session note not found",
      });
    }

    if (sessionDate !== undefined) {
      note.sessionDate = sessionDate;
    }

    if (title !== undefined) {
      note.title = title;
    }

    if (content !== undefined) {
      note.content = content;
    }

    if (type !== undefined) {
      if (!["private", "shared"].includes(type)) {
        return res.status(400).json({
          success: false,
          message:
            "Note type must be private or shared",
        });
      }

      note.type = type;
    }

    await note.save();

    return res.json({
      success: true,
      message: "Session note updated successfully",
      note,
    });
  } catch (error) {
    console.error(
      "Update session note error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update session note",
    });
  }
};

// ==========================================
// DELETE SESSION NOTE
// ==========================================

const deleteSessionNote = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { noteId } = req.params;

    const note =
      await SessionNote.findOneAndDelete({
        _id: noteId,
        therapist: therapistId,
      });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Session note not found",
      });
    }

    return res.json({
      success: true,
      message: "Session note deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete session note error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete session note",
    });
  }
};

module.exports = {
  createSessionNote,
  getTherapistNotes,
  getClientNotesForTherapist,
  getSharedNotesForClient,
  updateSessionNote,
  deleteSessionNote,
};