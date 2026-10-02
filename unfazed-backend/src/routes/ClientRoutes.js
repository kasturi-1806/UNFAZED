const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getClients,
  getClientById,
} = require("../controllers/ClientController");
const router = express.Router();
router.get("/", authMiddleware, getClients);
router.get("/:clientId", authMiddleware, getClientById);
module.exports = router;

