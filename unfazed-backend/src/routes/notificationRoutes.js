const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

router.get(
  "/",
  authMiddleware,
  getMyNotifications
);

router.get(
  "/unread-count",
  authMiddleware,
  getUnreadCount
);

router.put(
  "/:notificationId/read",
  authMiddleware,
  markNotificationAsRead
);

router.put(
  "/read-all",
  authMiddleware,
  markAllNotificationsAsRead
);

module.exports = router;
