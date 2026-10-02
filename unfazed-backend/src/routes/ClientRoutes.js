
const express = require("express");

const authMiddleware = require("../middleware/AuthMiddleware");

const {
  getClients,
  getClientById,
} = require("../controllers/ClientController");

const router = express.Router();

// Get all clients for logged-in therapist
router.get("/", authMiddleware, getClients);

// Get single client
router.get("/:clientId", authMiddleware, getClientById);

module.exports = router;

