const Package = require("../models/Package");
const { canAccess } = require("../services/entitlementService");

const checkPackagesAccess = async (therapistId) => {
  return await canAccess(therapistId, "packages");
};

const createPackage = async (req, res) => {
  try {
    const therapistId = req.user.id;

    const entitlement = await checkPackagesAccess(
      therapistId
    );

    if (!entitlement.allowed) {
      return res.status(403).json({
        success: false,
        message: entitlement.reason,
      });
    }

    const {
      name,
      sessions,
      pricePerSession,
      expiryDays,
    } = req.body;

    if (
      !name ||
      !sessions ||
      pricePerSession === undefined ||
      !expiryDays
    ) {
      return res.status(400).json({
        success: false,
        message: "All package details are required",
      });
    }

    if (![3, 6, 12].includes(Number(sessions))) {
      return res.status(400).json({
        success: false,
        message: "Sessions must be 3, 6, or 12",
      });
    }

    const price = Number(pricePerSession);

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price per session",
      });
    }

    const expiry = Number(expiryDays);

    if (!Number.isFinite(expiry) || expiry <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid expiry period",
      });
    }

    const totalPrice =
      price * Number(sessions);

    const newPackage = await Package.create({
      therapist: therapistId,
      name,
      sessions: Number(sessions),
      pricePerSession: price,
      totalPrice,
      expiryDays: expiry,
    });

    return res.status(201).json({
      success: true,
      message: "Package created successfully",
      package: newPackage,
    });
  } catch (error) {
    console.error(
      "Create package error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create package",
    });
  }
};

const getMyPackages = async (req, res) => {
  try {
    const therapistId = req.user.id;

    const entitlement = await checkPackagesAccess(
      therapistId
    );

    if (!entitlement.allowed) {
      return res.status(403).json({
        success: false,
        message: entitlement.reason,
      });
    }

    const packages = await Package.find({
      therapist: therapistId,
    }).sort({
      sessions: 1,
    });

    return res.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error(
      "Get packages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
    });
  }
};

const getTherapistPackages = async (req, res) => {
  try {
    const { therapistId } = req.params;

    const entitlement = await checkPackagesAccess(
      therapistId
    );

    if (!entitlement.allowed) {
      return res.status(403).json({
        success: false,
        message: entitlement.reason,
      });
    }

    const packages = await Package.find({
      therapist: therapistId,
      isActive: true,
    }).sort({
      sessions: 1,
    });

    return res.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error(
      "Get therapist packages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch therapist packages",
    });
  }
};

const updatePackage = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { packageId } = req.params;

    const entitlement = await checkPackagesAccess(
      therapistId
    );

    if (!entitlement.allowed) {
      return res.status(403).json({
        success: false,
        message: entitlement.reason,
      });
    }

    const packageItem = await Package.findOne({
      _id: packageId,
      therapist: therapistId,
    });

    if (!packageItem) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    const {
      name,
      sessions,
      pricePerSession,
      expiryDays,
      isActive,
    } = req.body;

    if (name !== undefined) {
      packageItem.name = name;
    }

    if (sessions !== undefined) {
      if (
        ![3, 6, 12].includes(Number(sessions))
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Sessions must be 3, 6, or 12",
        });
      }

      packageItem.sessions = Number(sessions);
    }

    if (pricePerSession !== undefined) {
      const price = Number(pricePerSession);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid price per session",
        });
      }

      packageItem.pricePerSession = price;
    }

    if (expiryDays !== undefined) {
      const expiry = Number(expiryDays);

      if (
        !Number.isFinite(expiry) ||
        expiry <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid expiry period",
        });
      }

      packageItem.expiryDays = expiry;
    }

    if (isActive !== undefined) {
      packageItem.isActive =
        Boolean(isActive);
    }

    packageItem.totalPrice =
      packageItem.sessions *
      packageItem.pricePerSession;

    await packageItem.save();

    return res.json({
      success: true,
      message: "Package updated successfully",
      package: packageItem,
    });
  } catch (error) {
    console.error(
      "Update package error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update package",
    });
  }
};

const deletePackage = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { packageId } = req.params;

    const entitlement = await checkPackagesAccess(
      therapistId
    );

    if (!entitlement.allowed) {
      return res.status(403).json({
        success: false,
        message: entitlement.reason,
      });
    }

    const packageItem =
      await Package.findOneAndDelete({
        _id: packageId,
        therapist: therapistId,
      });

    if (!packageItem) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    return res.json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete package error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete package",
    });
  }
};

module.exports = {
  createPackage,
  getMyPackages,
  getTherapistPackages,
  updatePackage,
  deletePackage,
};

