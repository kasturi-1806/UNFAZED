const Message = require("../models/Message");
const User = require("../models/User");
const Therapist = require("../models/Therapist");
const {
  createNotification,
} = require("./notificationController");

const sendMessage = async (req, res) => {
  try {
    const {
      receiverId,
      receiverRole,
      message,
    } = req.body || {};

    const senderId = req.user?.id;
    const senderRole = req.user?.role;

    if (!senderId || !senderRole) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      !receiverId ||
      !receiverRole ||
      !message?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Receiver and message are required",
      });
    }

    if (
      !["user", "therapist"].includes(
        senderRole
      ) ||
      !["user", "therapist"].includes(
        receiverRole
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    if (senderRole === receiverRole) {
      return res.status(400).json({
        success: false,
        message:
          "Messages can only be sent between users and therapists",
      });
    }

    const SenderModel =
      senderRole === "therapist"
        ? Therapist
        : User;

    const ReceiverModel =
      receiverRole === "therapist"
        ? Therapist
        : User;

    const sender =
      await SenderModel.findById(senderId);

    const receiver =
      await ReceiverModel.findById(
        receiverId
      );

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found",
      });
    }

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }
    const newMessage =
      await Message.create({
        sender: senderId,

        senderModel:
          senderRole === "therapist"
            ? "Therapist"
            : "User",

        receiver: receiverId,

        receiverModel:
          receiverRole === "therapist"
            ? "Therapist"
            : "User",

        message: message.trim(),
      });

    const notification =
      await createNotification({
        recipient: receiverId,

        recipientModel:
          receiverRole === "therapist"
            ? "Therapist"
            : "User",

        type: "new-message",

        title:
          senderRole === "therapist"
            ? "New message from Therapist"
            : "New message from Client",

        message:
          senderRole === "therapist"
            ? "You have a new message from your therapist."
            : "You have a new message from your client.",

        sender: senderId,

        senderModel:
          senderRole === "therapist"
            ? "Therapist"
            : "User",
      });

    console.log(
      "CHAT MESSAGE CREATED:",
      newMessage._id
    );

    console.log(
      "CHAT NOTIFICATION CREATED:",
      notification?._id || "FAILED"
    );

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};
const getConversation = async (
  req,
  res
) => {
  try {
    const currentUserId =
      req.user?.id;

    const currentUserRole =
      req.user?.role;

    const {
      otherUserId,
      otherUserRole,
    } = req.params;

    console.log(
      "GET CONVERSATION"
    );

    console.log(
      "Current User ID:",
      currentUserId
    );

    console.log(
      "Current User Role:",
      currentUserRole
    );

    console.log(
      "Other User ID:",
      otherUserId
    );

    console.log(
      "Other User Role:",
      otherUserRole
    );

    if (
      !currentUserId ||
      !currentUserRole
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    if (
      !otherUserId ||
      !["user", "therapist"].includes(
        otherUserRole
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid conversation details",
      });
    }

    const currentModel =
      currentUserRole === "therapist"
        ? "Therapist"
        : "User";

    const otherModel =
      otherUserRole === "therapist"
        ? "Therapist"
        : "User";

    const messages =
      await Message.find({
        $or: [
          {
            sender: currentUserId,
            senderModel: currentModel,
            receiver: otherUserId,
            receiverModel: otherModel,
          },
          {
            sender: otherUserId,
            senderModel: otherModel,
            receiver: currentUserId,
            receiverModel: currentModel,
          },
        ],
      }).sort({
        createdAt: 1,
      });

    console.log(
      "CONVERSATION MESSAGES FOUND:",
      messages.length
    );

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(
      "GET CONVERSATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load conversation",
      error: error.message,
    });
  }
};
const markMessageAsRead = async (
  req,
  res
) => {
  try {
    const currentUserId =
      req.user?.id;

    const { messageId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const message =
      await Message.findOne({
        _id: messageId,
        receiver: currentUserId,
      });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    message.isRead = true;

    await message.save();

    return res.json({
      success: true,
      message:
        "Message marked as read",
    });
  } catch (error) {
    console.error(
      "Mark message read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update message",
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  markMessageAsRead,
};
