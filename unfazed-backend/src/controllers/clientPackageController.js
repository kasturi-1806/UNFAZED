const crypto = require("crypto");

const Package = require("../models/Package");
const ClientPackage = require("../models/ClientPackage");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Therapist = require("../models/Therapist");

const razorpay = require("../config/razorpay");
const generateInvoice = require("../utils/invoiceGenerator");

const purchasePackage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: "Package ID is required",
      });
    }

    const selectedPackage = await Package.findOne({
      _id: packageId,
      isActive: true,
    });

    if (!selectedPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found or inactive",
      });
    }

    const expiryDate = new Date();

    expiryDate.setDate(
      expiryDate.getDate() + selectedPackage.expiryDays
    );

    const clientPackage = await ClientPackage.create({
      user: userId,
      therapist: selectedPackage.therapist,
      package: selectedPackage._id,
      sessionsPurchased: selectedPackage.sessions,
      sessionsRemaining: selectedPackage.sessions,
      expiryDate,
      paymentStatus: "pending",
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Package created successfully",
      clientPackage,
    });
  } catch (error) {
    console.error("Purchase package error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to purchase package",
    });
  }
};

const demoPackagePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clientPackageId } = req.body;

    if (!clientPackageId) {
      return res.status(400).json({
        message: "Client package ID is required",
      });
    }

    const clientPackage = await ClientPackage.findOne({
      _id: clientPackageId,
      user: userId,
    }).populate("package");

    if (!clientPackage) {
      return res.status(404).json({
        message: "Client package not found",
      });
    }

    if (clientPackage.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Package is already paid",
      });
    }

    if (
      clientPackage.status === "expired" ||
      clientPackage.status === "cancelled"
    ) {
      return res.status(400).json({
        message: "This package cannot be paid for",
      });
    }

    if (
      clientPackage.expiryDate &&
      new Date(clientPackage.expiryDate) < new Date()
    ) {
      clientPackage.status = "expired";

      await clientPackage.save();

      return res.status(400).json({
        message: "This package has expired",
      });
    }

    const paymentAmount = Number(
      clientPackage.package?.totalPrice
    );

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      return res.status(400).json({
        message: "Invalid package payment amount",
      });
    }

    const platformFee = 0;
    const netAmount = paymentAmount;

    const payment = await Payment.create({
      user: clientPackage.user,
      therapist: clientPackage.therapist,
      clientPackage: clientPackage._id,
      amount: paymentAmount,
      currency: "INR",
      gatewayTransactionId: `DEMO_PACKAGE_${Date.now()}`,
      platformFee,
      netAmount,
      status: "captured",
    });

    clientPackage.paymentStatus = "paid";
    clientPackage.paymentId = payment._id;
    clientPackage.status = "active";

    await clientPackage.save();

    const user = await User.findById(
      clientPackage.user
    ).select("name email");

    const therapist = await Therapist.findById(
      clientPackage.therapist
    ).select("name");

    let invoice = null;

    try {
      invoice = await generateInvoice(
        payment,
        user,
        therapist,
        clientPackage
      );

      if (invoice) {
        payment.invoiceNumber =
          invoice.invoiceNumber;

        payment.invoiceFileName =
          invoice.fileName;

        await payment.save();
      }

      console.log(
        "Package invoice generated:",
        invoice?.filePath
      );
    } catch (invoiceError) {
      console.error(
        "Package invoice generation error:",
        invoiceError
      );
    }

    return res.status(201).json({
      message:
        "Package payment successful and invoice generated",
      clientPackage,
      payment,
      invoice,
    });
  } catch (error) {
    console.error(
      "Demo package payment error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const createRazorpayPackageOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clientPackageId } = req.body;

    if (!clientPackageId) {
      return res.status(400).json({
        success: false,
        message: "Client package ID is required",
      });
    }

    const clientPackage = await ClientPackage.findOne({
      _id: clientPackageId,
      user: userId,
    }).populate("package");

    if (!clientPackage) {
      return res.status(404).json({
        success: false,
        message: "Client package not found",
      });
    }

    if (clientPackage.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Package is already paid",
      });
    }

    if (
      clientPackage.status === "expired" ||
      clientPackage.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "This package cannot be paid for",
      });
    }

    if (
      clientPackage.expiryDate &&
      new Date(clientPackage.expiryDate) < new Date()
    ) {
      clientPackage.status = "expired";

      await clientPackage.save();

      return res.status(400).json({
        success: false,
        message: "This package has expired",
      });
    }

    const amount = Number(
      clientPackage.package?.totalPrice
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid package payment amount",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `package_${clientPackage._id}`,
    });

    const platformFee = 0;
    const netAmount = amount;

    const payment = await Payment.create({
      user: clientPackage.user,
      therapist: clientPackage.therapist,
      clientPackage: clientPackage._id,
      amount,
      currency: "INR",
      razorpayOrderId: razorpayOrder.id,
      platformFee,
      netAmount,
      status: "created",
    });

    return res.status(201).json({
      success: true,
      message: "Razorpay package order created",
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      paymentId: payment._id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(
      "Create Razorpay package order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay package order",
    });
  }
};

const verifyRazorpayPackagePayment = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment details are required",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: userId,
      clientPackage: { $ne: null },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Package payment record not found",
      });
    }

    if (payment.status === "captured") {
      return res.status(200).json({
        success: true,
        message: "Package payment already verified",
        payment,
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay secret is not configured",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    const signatureBuffer = Buffer.from(
      razorpay_signature
    );

    const generatedBuffer = Buffer.from(
      generatedSignature
    );

    if (
      signatureBuffer.length !==
        generatedBuffer.length ||
      !crypto.timingSafeEqual(
        signatureBuffer,
        generatedBuffer
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature",
      });
    }

    const clientPackage =
      await ClientPackage.findOne({
        _id: payment.clientPackage,
        user: userId,
      }).populate("package");

    if (!clientPackage) {
      return res.status(404).json({
        success: false,
        message: "Client package not found",
      });
    }

    if (
      clientPackage.status === "expired" ||
      clientPackage.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "This package cannot be paid for",
      });
    }

    payment.razorpayPaymentId =
      razorpay_payment_id;

    payment.razorpaySignature =
      razorpay_signature;

    payment.gatewayTransactionId =
      razorpay_payment_id;

    payment.status = "captured";

    await payment.save();

    clientPackage.paymentStatus = "paid";
    clientPackage.paymentId = payment._id;
    clientPackage.status = "active";

    await clientPackage.save();

    const user = await User.findById(
      clientPackage.user
    ).select("name email");

    const therapist = await Therapist.findById(
      clientPackage.therapist
    ).select("name");

    let invoice = null;

    try {
      invoice = await generateInvoice(
        payment,
        user,
        therapist,
        clientPackage
      );

      if (invoice) {
        payment.invoiceNumber =
          invoice.invoiceNumber;

        payment.invoiceFileName =
          invoice.fileName;

        await payment.save();
      }

      console.log(
        "Razorpay package invoice generated:",
        invoice?.filePath
      );
    } catch (invoiceError) {
      console.error(
        "Razorpay package invoice generation error:",
        invoiceError
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Package payment successful and invoice generated",
      clientPackage,
      payment,
      invoice,
    });
  } catch (error) {
    console.error(
      "Verify Razorpay package payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to verify package payment",
    });
  }
};

const getMyPackages = async (req, res) => {
  try {
    const userId = req.user.id;

    const clientPackages = await ClientPackage.find({
      user: userId,
    })
      .populate("package")
      .populate("therapist")
      .sort({
        createdAt: -1,
      });

    const now = new Date();

    for (const clientPackage of clientPackages) {
      if (
        clientPackage.status === "active" &&
        clientPackage.expiryDate &&
        new Date(clientPackage.expiryDate) < now
      ) {
        clientPackage.status = "expired";

        await clientPackage.save();
      }
    }

    return res.status(200).json({
      success: true,
      clientPackages,
    });
  } catch (error) {
    console.error(
      "Get my packages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
    });
  }
};

const getClientPackage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clientPackageId } = req.params;

    const clientPackage = await ClientPackage.findOne({
      _id: clientPackageId,
      user: userId,
    })
      .populate("package")
      .populate("therapist");

    if (!clientPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    if (
      clientPackage.status === "active" &&
      clientPackage.expiryDate < new Date()
    ) {
      clientPackage.status = "expired";

      await clientPackage.save();
    }

    return res.json({
      success: true,
      clientPackage,
    });
  } catch (error) {
    console.error(
      "Get client package error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch package",
    });
  }
};

module.exports = {
  purchasePackage,
  demoPackagePayment,
  createRazorpayPackageOrder,
  verifyRazorpayPackagePayment,
  getMyPackages,
  getClientPackage,
};
