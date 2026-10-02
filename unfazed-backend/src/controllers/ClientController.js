
const Client = require("../models/Client");
const User = require("../models/User");

// GET ALL CLIENTS FOR LOGGED-IN THERAPIST
const getClients = async (req, res) => {
  try {
    const therapistId = req.user.id || req.user._id;

    const clients = await Client.find({
      therapist: therapistId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error("Get clients error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
    });
  }
};

// GET SINGLE CLIENT
const getClientById = async (req, res) => {
  try {
    const therapistId = req.user.id || req.user._id;
    const { clientId } = req.params;

    const client = await Client.findOne({
      _id: clientId,
      therapist: therapistId,
    }).populate("user", "name email");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      client,
    });
  } catch (error) {
    console.error("Get client error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch client",
    });
  }
};

module.exports = {
  getClients,
  getClientById,
};

