const Notification = require("../models/Notification");

// ==========================================
// GET MY NOTIFICATIONS
// ==========================================
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const recipientModel =
      userRole === "therapist"
        ? "Therapist"
        : "User";

    // Use recipient ID as the main lookup.
    // ObjectIds are unique, so this reliably finds
    // notifications belonging to the logged-in account.
    const notifications =
      await Notification.find({
        recipient: userId,
      })
        .populate("appointment")
        .sort({ createdAt: -1 });

    console.log("=================================");
    console.log("GET MY NOTIFICATIONS");
    console.log("User ID:", userId);
    console.log("User Role:", userRole);
    console.log("Recipient Model:", recipientModel);
    console.log(
      "NOTIFICATIONS FOUND:",
      notifications.length
    );
    console.log("=================================");

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET UNREAD COUNT
// ==========================================
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count =
      await Notification.countDocuments({
        recipient: userId,
        isRead: false,
      });

    console.log(
      "UNREAD NOTIFICATION COUNT:",
      count
    );

    return res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(
      "Get unread notification count error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// MARK ONE AS READ
// ==========================================
const markNotificationAsRead = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipient: userId,
        },
        {
          $set: {
            isRead: true,
          },
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// MARK ALL AS READ
// ==========================================
const markAllNotificationsAsRead =
  async (req, res) => {
    try {
      const userId = req.user.id;

      await Notification.updateMany(
        {
          recipient: userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
          },
        }
      );

      return res.json({
        success: true,
        message:
          "All notifications marked as read",
      });
    } catch (error) {
      console.error(
        "Mark all notifications as read error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

// ==========================================
// CREATE NOTIFICATION
// ==========================================
const createNotification = async ({
  recipient,
  recipientModel,
  type,
  title,
  message,
  appointment = null,
  sender = null,
  senderModel = null,
}) => {
  try {
    if (
      !recipient ||
      !recipientModel ||
      !type ||
      !title ||
      !message
    ) {
      console.error(
        "CREATE NOTIFICATION: Missing required fields"
      );

      return null;
    }

    const notification =
      await Notification.create({
        recipient,
        recipientModel,
        type,
        title,
        message,
        appointment,
        sender,
        senderModel,
      });

    console.log(
      "NOTIFICATION CREATED:",
      notification._id
    );

    console.log(
      "Notification recipient:",
      notification.recipient
    );

    console.log(
      "Notification recipient model:",
      notification.recipientModel
    );

    console.log(
      "Notification type:",
      notification.type
    );

    return notification;
  } catch (error) {
    console.error(
      "Create notification error:",
      error
    );

    return null;
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
};