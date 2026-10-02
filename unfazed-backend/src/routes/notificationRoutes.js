const express = require("express");

const router = express.Router();

const {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

// Get all notifications
router.get(
  "/",
  authMiddleware,
  getMyNotifications
);

// Get unread notification count
router.get(
  "/unread-count",
  authMiddleware,
  getUnreadCount
);

// Mark one notification as read
router.put(
  "/:notificationId/read",
  authMiddleware,
  markNotificationAsRead
);

// Mark all notifications as read
router.put(
  "/read-all",
  authMiddleware,
  markAllNotificationsAsRead
);

module.exports = router;