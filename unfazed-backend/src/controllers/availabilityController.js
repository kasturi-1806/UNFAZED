const Availability = require("../models/Availability");

const getAvailability = async (req, res) => {
  try {
    const therapistId = req.user.id;

    let availability = await Availability.findOne({
      therapist: therapistId,
    });

    if (!availability) {
      availability = await Availability.create({
        therapist: therapistId,
      });
    }

    res.json({
      success: true,
      availability,
    });
  } catch (error) {
    console.error("Get availability error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const therapistId = req.user.id;

    const {
      schedule,
      sessionDuration,
      bufferMinutes,
    } = req.body;

    if (!schedule) {
      return res.status(400).json({
        success: false,
        message: "Schedule is required",
      });
    }

    if (
      sessionDuration !== undefined &&
      (!Number.isInteger(sessionDuration) ||
        sessionDuration < 15)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Session duration must be at least 15 minutes",
      });
    }

    if (
      bufferMinutes !== undefined &&
      (!Number.isInteger(bufferMinutes) ||
        bufferMinutes < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Buffer time cannot be negative",
      });
    }

    const availability =
      await Availability.findOneAndUpdate(
        {
          therapist: therapistId,
        },
        {
          schedule,
          ...(sessionDuration !== undefined && {
            sessionDuration,
          }),
          ...(bufferMinutes !== undefined && {
            bufferMinutes,
          }),
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    res.json({
      success: true,
      message:
        "Availability updated successfully",
      availability,
    });
  } catch (error) {
    console.error(
      "Update availability error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const availability =
      await Availability.findOne({
        therapist: therapistId,
      });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    const selectedDate = new Date(
      `${date}T00:00:00`
    );

    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const dayName =
      dayNames[selectedDate.getDay()];

    const daySchedule =
      availability.schedule[dayName];

    if (
      !daySchedule ||
      !daySchedule.enabled
    ) {
      return res.json({
        success: true,
        date,
        day: dayName,
        slots: [],
      });
    }

    const generateSlots = require("../utils/slotGenerator");

    const slots = generateSlots({
      startTime: daySchedule.startTime,
      endTime: daySchedule.endTime,
      sessionDuration:
        availability.sessionDuration,
      bufferMinutes:
        availability.bufferMinutes,
    });

    res.json({
      success: true,
      date,
      day: dayName,
      sessionDuration:
        availability.sessionDuration,
      bufferMinutes:
        availability.bufferMinutes,
      slots,
    });
  } catch (error) {
    console.error(
      "Get available slots error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getPublicAvailableSlots = async (
  req,
  res
) => {
  try {
    const { slug } = req.params;
    const { date } = req.query;

    if (!slug || !date) {
      return res.status(400).json({
        success: false,
        message:
          "Therapist and date are required",
      });
    }

    const Therapist = require("../models/Therapist");

    const therapist =
      await Therapist.findOne({
        slug: slug.toLowerCase(),
      });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    const availability =
      await Availability.findOne({
        therapist: therapist._id,
      });

    if (!availability) {
      return res.json({
        success: true,
        date,
        slots: [],
      });
    }

    const selectedDate = new Date(
      `${date}T00:00:00`
    );

    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const dayName =
      dayNames[selectedDate.getDay()];

    const daySchedule =
      availability.schedule[dayName];

    if (
      !daySchedule ||
      !daySchedule.enabled
    ) {
      return res.json({
        success: true,
        date,
        day: dayName,
        slots: [],
      });
    }

    const generateSlots = require("../utils/slotGenerator");

    const slots = generateSlots({
      startTime: daySchedule.startTime,
      endTime: daySchedule.endTime,
      sessionDuration:
        availability.sessionDuration,
      bufferMinutes:
        availability.bufferMinutes,
    });

    res.json({
      success: true,
      date,
      day: dayName,
      sessionDuration:
        availability.sessionDuration,
      bufferMinutes:
        availability.bufferMinutes,
      slots,
    });
  } catch (error) {
    console.error(
      "Get public available slots error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==========================================
   PUBLIC CALENDAR AVAILABILITY
========================================== */

const getPublicCalendarAvailability = async (
  req,
  res
) => {
  try {
    const { slug } = req.params;
    const { month } = req.query;

    if (!slug || !month) {
      return res.status(400).json({
        success: false,
        message:
          "Therapist and month are required",
      });
    }

    const Therapist = require("../models/Therapist");
    const Appointment = require("../models/Appointment");

    const therapist =
      await Therapist.findOne({
        slug: slug.toLowerCase(),
      });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    const availability =
      await Availability.findOne({
        therapist: therapist._id,
      });

    if (!availability) {
      return res.json({
        success: true,
        dates: {},
      });
    }

    const [year, monthNumber] =
      month.split("-").map(Number);

    if (
      !year ||
      !monthNumber ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month",
      });
    }

    const daysInMonth = new Date(
      year,
      monthNumber,
      0
    ).getDate();

    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const generateSlots = require("../utils/slotGenerator");

    const startDate = new Date(
      `${year}-${String(monthNumber).padStart(
        2,
        "0"
      )}-01T00:00:00`
    );

    const endDate = new Date(
      `${year}-${String(monthNumber).padStart(
        2,
        "0"
      )}-${String(daysInMonth).padStart(
        2,
        "0"
      )}T23:59:59`
    );

    const appointments =
      await Appointment.find({
        therapist: therapist._id,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
        status: {
          $ne: "cancelled",
        },
      }).select("date time duration status");

    const dates = {};

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      const dateString =
        `${year}-${String(monthNumber).padStart(
          2,
          "0"
        )}-${String(day).padStart(2, "0")}`;

      const selectedDate = new Date(
        `${dateString}T00:00:00`
      );

      const dayName =
        dayNames[selectedDate.getDay()];

      const daySchedule =
        availability.schedule[dayName];

      // Therapist does not work on this day
      if (
        !daySchedule ||
        !daySchedule.enabled
      ) {
        dates[dateString] = {
          available: false,
        };

        continue;
      }

      const generatedSlots =
        generateSlots({
          startTime:
            daySchedule.startTime,
          endTime:
            daySchedule.endTime,
          sessionDuration:
            availability.sessionDuration,
          bufferMinutes:
            availability.bufferMinutes,
        });

      const bookedTimes =
        appointments
          .filter((appointment) => {
            const appointmentDate =
              new Date(appointment.date);

            const appointmentDateString =
              `${appointmentDate.getFullYear()}-${String(
                appointmentDate.getMonth() + 1
              ).padStart(2, "0")}-${String(
                appointmentDate.getDate()
              ).padStart(2, "0")}`;

            return (
              appointmentDateString ===
              dateString
            );
          })
          .map(
            (appointment) =>
              appointment.time
          );

      const availableSlots =
        generatedSlots.filter(
          (slot) =>
            !bookedTimes.includes(
              slot.startTime
            )
        );

      dates[dateString] = {
        available:
          availableSlots.length > 0,
        totalSlots:
          generatedSlots.length,
        availableSlots:
          availableSlots.length,
      };
    }

    res.json({
      success: true,
      month,
      dates,
    });
  } catch (error) {
    console.error(
      "Get public calendar availability error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAvailability,
  updateAvailability,
  getAvailableSlots,
  getPublicAvailableSlots,
  getPublicCalendarAvailability,
};