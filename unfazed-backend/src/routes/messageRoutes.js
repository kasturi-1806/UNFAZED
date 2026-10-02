const express = require("express");
const {
  sendMessage,
  getConversation,
  markMessageAsRead,
} = require("../controllers/messageController");

const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.post(
  "/",
  authMiddleware,
  sendMessage
);

router.get(
  "/:otherUserRole/:otherUserId",
  authMiddleware,
  getConversation
);

router.patch(
  "/:messageId/read",
  authMiddleware,
  markMessageAsRead
);

module.exports = router;
