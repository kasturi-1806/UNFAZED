const express = require("express");

const {
  sendMessage,
  getConversation,
  markMessageAsRead,
} = require("../controllers/messageController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Send a message
router.post(
  "/",
  authMiddleware,
  sendMessage
);

// Get conversation
router.get(
  "/:otherUserRole/:otherUserId",
  authMiddleware,
  getConversation
);

// Mark message as read
router.patch(
  "/:messageId/read",
  authMiddleware,
  markMessageAsRead
);

module.exports = router;