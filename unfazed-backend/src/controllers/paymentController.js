
const crypto = require("crypto");
const path = require("path");

const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Therapist = require("../models/Therapist");
const razorpay = require("../config/razorpay");
const generateInvoice = require("../utils/invoiceGenerator");

// ==========================================
// HELPER: SAFE SIGNATURE COMPARISON
// ==========================================

const safeCompare = (expected, received) => {
  if (!expected || !received) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
};

// ==========================================
// DEMO PAYMENT
// ==========================================

const demoPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId, amount } = req.body;

    if (!appointmentId || !amount) {
      return res.status(400).json({
        message: "Appointment ID and amount are required",
      });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      user: userId,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled appointment cannot be paid",
      });
    }

    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Appointment is already paid",
      });
    }

    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      return res.status(400).json({
        message: "Invalid payment amount",
      });
    }

    appointment.paymentStatus = "paid";
    appointment.paymentAmount = paymentAmount;

    await appointment.save();

    const platformFee = 0;
    const netAmount = paymentAmount;

    const payment = await Payment.create({
      user: appointment.user,
      therapist: appointment.therapist,
      appointment: appointment._id,
      amount: paymentAmount,
      currency: "INR",
      gatewayTransactionId: `DEMO_${Date.now()}`,
      platformFee,
      netAmount,
      status: "captured",
    });

    const user = await User.findById(
      appointment.user
    ).select("name email");

    const therapist = await Therapist.findById(
      appointment.therapist
    ).select("name");

    let invoice = null;

    try {
      invoice = await generateInvoice(
        payment,
        user,
        therapist
      );

      if (invoice) {
        payment.invoiceNumber =
          invoice.invoiceNumber;

        payment.invoiceFileName =
          invoice.fileName;

        await payment.save();
      }

      console.log(
        "Invoice generated:",
        invoice?.filePath
      );
    } catch (invoiceError) {
      console.error(
        "Invoice generation error:",
        invoiceError
      );
    }

    return res.status(201).json({
      message:
        "Payment successful and invoice generated",
      payment,
      invoice,
    });
  } catch (error) {
    console.error(
      "Demo payment error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================

const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        message: "Appointment ID is required",
      });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      user: userId,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled appointment cannot be paid",
      });
    }

    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Appointment is already paid",
      });
    }

    // ==========================================
    // SESSION AMOUNT
    // ==========================================

    // UNFAZED currently uses ₹500
    // for a normal therapy session.

    const paymentAmount = 500;

    // Razorpay expects amount in paise.
    const amountInPaise =
      Math.round(paymentAmount * 100);

    // ==========================================
    // CREATE RAZORPAY ORDER
    // ==========================================

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `appointment_${appointment._id}`,
    });

    // ==========================================
    // CREATE PAYMENT RECORD
    // ==========================================

    const payment = await Payment.create({
      user: appointment.user,
      therapist: appointment.therapist,
      appointment: appointment._id,
      amount: paymentAmount,
      currency: "INR",
      gatewayTransactionId: null,
      razorpayOrderId: order.id,
      platformFee: 0,
      netAmount: paymentAmount,
      status: "created",
    });

    return res.status(201).json({
      message: "Razorpay order created successfully",

      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },

      paymentId: payment._id,

      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(
      "Create Razorpay order error:",
      error
    );

    return res.status(500).json({
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
};

// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================

const verifyRazorpayPayment = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // ==========================================
    // VALIDATE REQUEST
    // ==========================================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay payment details are required",
      });
    }

    // ==========================================
    // FIND PAYMENT
    // ==========================================

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: userId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // ==========================================
    // IDEMPOTENCY CHECK
    // ==========================================

    if (payment.status === "captured") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        payment,
      });
    }

    // ==========================================
    // CREATE SIGNATURE
    // ==========================================

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error(
        "RAZORPAY_KEY_SECRET is not configured"
      );

      return res.status(500).json({
        success: false,
        message:
          "Razorpay key secret is not configured",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    // ==========================================
    // COMPARE SIGNATURES SAFELY
    // ==========================================

    const isSignatureValid = safeCompare(
      generatedSignature,
      razorpay_signature
    );

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Razorpay payment signature",
      });
    }

    // ==========================================
    // FIND APPOINTMENT
    // ==========================================

    const appointment = await Appointment.findOne({
      _id: payment.appointment,
      user: userId,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled appointment cannot be paid",
      });
    }

    // ==========================================
    // SAVE RAZORPAY PAYMENT DETAILS
    // ==========================================

    payment.razorpayPaymentId =
      razorpay_payment_id;

    payment.razorpaySignature =
      razorpay_signature;

    payment.gatewayTransactionId =
      razorpay_payment_id;

    payment.status = "captured";

    await payment.save();

    // ==========================================
    // UPDATE APPOINTMENT
    // ==========================================

    appointment.paymentStatus = "paid";
    appointment.paymentAmount = payment.amount;

    await appointment.save();

    // ==========================================
    // GET CLIENT + THERAPIST
    // ==========================================

    const user = await User.findById(
      appointment.user
    ).select("name email");

    const therapist = await Therapist.findById(
      appointment.therapist
    ).select("name");

    // ==========================================
    // GENERATE INVOICE
    // ==========================================

    let invoice = null;

    if (!payment.invoiceFileName) {
      try {
        invoice = await generateInvoice(
          payment,
          user,
          therapist
        );

        if (invoice) {
          payment.invoiceNumber =
            invoice.invoiceNumber;

          payment.invoiceFileName =
            invoice.fileName;

          await payment.save();
        }

        console.log(
          "Razorpay invoice generated:",
          invoice?.filePath
        );
      } catch (invoiceError) {
        console.error(
          "Razorpay invoice generation error:",
          invoiceError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Payment verified successfully and appointment marked as paid",
      payment,
      invoice,
    });
  } catch (error) {
    console.error(
      "Verify Razorpay payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to verify Razorpay payment",
      error: error.message,
    });
  }
};

// ==========================================
// RAZORPAY WEBHOOK
// ==========================================

const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    // ==========================================
    // VALIDATE WEBHOOK SECRET
    // ==========================================

    if (!webhookSecret) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is not configured"
      );

      return res.status(500).json({
        success: false,
        message:
          "Webhook secret is not configured",
      });
    }

    // ==========================================
    // GET SIGNATURE
    // ==========================================

    const receivedSignature =
      req.headers["x-razorpay-signature"];

    if (!receivedSignature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature missing",
      });
    }

    // ==========================================
    // RAW BODY REQUIRED
    // ==========================================

    if (!req.rawBody) {
      console.error(
        "Raw webhook body is missing"
      );

      return res.status(400).json({
        success: false,
        message: "Raw webhook body is missing",
      });
    }

    // ==========================================
    // VERIFY WEBHOOK SIGNATURE
    // ==========================================

    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.rawBody)
      .digest("hex");

    const isSignatureValid = safeCompare(
      generatedSignature,
      receivedSignature
    );

    if (!isSignatureValid) {
      console.error(
        "Invalid Razorpay webhook signature"
      );

      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    // ==========================================
    // GET EVENT
    // ==========================================

    const event = req.body?.event;

    const webhookEventId =
      req.headers["x-razorpay-event-id"];

    console.log(
      "Razorpay webhook received:",
      event,
      webhookEventId
        ? `(event: ${webhookEventId})`
        : ""
    );

    if (!event) {
      return res.status(400).json({
        success: false,
        message: "Webhook event is missing",
      });
    }

    // ==========================================
    // PAYMENT CAPTURED
    // ==========================================

    if (event === "payment.captured") {
      const paymentEntity =
        req.body.payload?.payment?.entity;

      if (!paymentEntity) {
        return res.status(400).json({
          success: false,
          message: "Payment data missing",
        });
      }

      if (
        !paymentEntity.id ||
        !paymentEntity.order_id
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Razorpay payment ID or order ID missing",
        });
      }

      // ==========================================
      // FIND LOCAL PAYMENT
      // ==========================================

      const payment = await Payment.findOne({
        razorpayOrderId:
          paymentEntity.order_id,
      });

      if (!payment) {
        console.log(
          "Payment not found for Razorpay order:",
          paymentEntity.order_id
        );

        // Razorpay should receive 200 so it does
        // not continuously retry an event that
        // does not belong to this application.

        return res.status(200).json({
          success: true,
          message: "Webhook received",
        });
      }

      // ==========================================
      // VALIDATE AMOUNT
      // ==========================================

      const expectedAmountInPaise =
        Math.round(Number(payment.amount) * 100);

      const receivedAmountInPaise =
        Number(paymentEntity.amount);

      if (
        !Number.isFinite(receivedAmountInPaise) ||
        receivedAmountInPaise !==
          expectedAmountInPaise
      ) {
        console.error(
          "Razorpay payment amount mismatch",
          {
            orderId:
              paymentEntity.order_id,
            expected:
              expectedAmountInPaise,
            received:
              receivedAmountInPaise,
          }
        );

        return res.status(400).json({
          success: false,
          message:
            "Payment amount does not match the order",
        });
      }

      // ==========================================
      // VALIDATE CURRENCY
      // ==========================================

      const paymentCurrency =
        paymentEntity.currency || "INR";

      if (
        paymentCurrency !== payment.currency
      ) {
        console.error(
          "Razorpay payment currency mismatch",
          {
            orderId:
              paymentEntity.order_id,
            expected:
              payment.currency,
            received:
              paymentCurrency,
          }
        );

        return res.status(400).json({
          success: false,
          message:
            "Payment currency does not match",
        });
      }

      // ==========================================
      // IDEMPOTENT PAYMENT UPDATE
      // ==========================================

      if (payment.status !== "captured") {
        payment.status = "captured";

        payment.razorpayPaymentId =
          paymentEntity.id;

        payment.gatewayTransactionId =
          paymentEntity.id;

        await payment.save();

        console.log(
          "Payment marked as captured:",
          paymentEntity.id
        );
      } else {
        // Keep Razorpay IDs synchronized even if
        // this is a duplicate webhook.

        let changed = false;

        if (
          !payment.razorpayPaymentId
        ) {
          payment.razorpayPaymentId =
            paymentEntity.id;
          changed = true;
        }

        if (
          !payment.gatewayTransactionId
        ) {
          payment.gatewayTransactionId =
            paymentEntity.id;
          changed = true;
        }

        if (changed) {
          await payment.save();
        }

        console.log(
          "Duplicate payment.captured webhook ignored:",
          paymentEntity.id
        );
      }

      // ==========================================
      // NORMAL SESSION PAYMENT
      // ==========================================

      if (payment.appointment) {
        const appointment =
          await Appointment.findById(
            payment.appointment
          );

        if (appointment) {
          if (
            appointment.paymentStatus !==
              "paid" ||
            appointment.paymentAmount !==
              payment.amount
          ) {
            appointment.paymentStatus =
              "paid";

            appointment.paymentAmount =
              payment.amount;

            await appointment.save();
          }

          // ========================================
          // GENERATE INVOICE IF NOT ALREADY CREATED
          // ========================================

          if (!payment.invoiceFileName) {
            try {
              const user =
                await User.findById(
                  payment.user
                ).select("name email");

              const therapist =
                await Therapist.findById(
                  payment.therapist
                ).select("name");

              const invoice =
                await generateInvoice(
                  payment,
                  user,
                  therapist
                );

              if (invoice) {
                payment.invoiceNumber =
                  invoice.invoiceNumber;

                payment.invoiceFileName =
                  invoice.fileName;

                await payment.save();
              }

              console.log(
                "Webhook invoice generated:",
                invoice?.filePath
              );
            } catch (invoiceError) {
              console.error(
                "Webhook invoice generation error:",
                invoiceError
              );
            }
          }
        }
      }

      // ==========================================
      // PACKAGE PAYMENT
      // ==========================================

      if (payment.clientPackage) {
        const ClientPackage =
          require("../models/ClientPackage");

        const clientPackage =
          await ClientPackage.findById(
            payment.clientPackage
          );

        if (clientPackage) {
          let packageChanged = false;

          if (
            clientPackage.paymentStatus !==
            "paid"
          ) {
            clientPackage.paymentStatus =
              "paid";
            packageChanged = true;
          }

          if (
            String(clientPackage.paymentId) !==
            String(payment._id)
          ) {
            clientPackage.paymentId =
              payment._id;
            packageChanged = true;
          }

          if (
            clientPackage.status !==
            "active"
          ) {
            clientPackage.status = "active";
            packageChanged = true;
          }

          if (packageChanged) {
            await clientPackage.save();
          }

          // ========================================
          // PACKAGE INVOICE
          // ========================================

          if (!payment.invoiceFileName) {
            try {
              const user =
                await User.findById(
                  payment.user
                ).select("name email");

              const therapist =
                await Therapist.findById(
                  payment.therapist
                ).select("name");

              const invoice =
                await generateInvoice(
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
                "Package webhook invoice generated:",
                invoice?.filePath
              );
            } catch (invoiceError) {
              console.error(
                "Package webhook invoice error:",
                invoiceError
              );
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        message:
          "Payment captured successfully",
      });
    }

    // ==========================================
    // PAYMENT FAILED
    // ==========================================

    if (event === "payment.failed") {
      const paymentEntity =
        req.body.payload?.payment?.entity;

      if (!paymentEntity) {
        return res.status(400).json({
          success: false,
          message: "Payment data missing",
        });
      }

      if (!paymentEntity.order_id) {
        return res.status(400).json({
          success: false,
          message:
            "Razorpay order ID missing",
        });
      }

      const payment = await Payment.findOne({
        razorpayOrderId:
          paymentEntity.order_id,
      });

      if (!payment) {
        console.log(
          "Payment not found for failed Razorpay order:",
          paymentEntity.order_id
        );

        return res.status(200).json({
          success: true,
          message: "Webhook received",
        });
      }

      // ==========================================
      // IMPORTANT:
      // NEVER CHANGE A CAPTURED PAYMENT TO FAILED
      // ==========================================

      if (payment.status === "captured") {
        console.log(
          "Ignoring payment.failed because payment is already captured:",
          paymentEntity.id
        );

        return res.status(200).json({
          success: true,
          message:
            "Payment already captured; failure event ignored",
        });
      }

      // Do not change an already refunded payment.
      if (payment.status === "refunded") {
        return res.status(200).json({
          success: true,
          message:
            "Payment already refunded; failure event ignored",
        });
      }

      payment.status = "failed";

      if (paymentEntity.id) {
        payment.razorpayPaymentId =
          paymentEntity.id;

        payment.gatewayTransactionId =
          paymentEntity.id;
      }

      await payment.save();

      console.log(
        "Payment failure recorded:",
        paymentEntity.id
      );

      return res.status(200).json({
        success: true,
        message:
          "Payment failure recorded",
      });
    }

    // ==========================================
    // REFUND CREATED
    // ==========================================

    if (event === "refund.created") {
      const refundEntity =
        req.body.payload?.refund?.entity;

      if (!refundEntity) {
        return res.status(400).json({
          success: false,
          message: "Refund data missing",
        });
      }

      console.log(
        "Razorpay refund created:",
        refundEntity.id
      );

      // IMPORTANT:
      // refund.created means the refund request
      // has been created, not necessarily completed.
      //
      // Therefore we DO NOT mark the local payment
      // as refunded here.
      //
      // The actual local refund state is updated
      // when refund.processed is received.

      return res.status(200).json({
        success: true,
        message:
          "Refund creation event received",
      });
    }

    // ==========================================
    // REFUND PROCESSED
    // ==========================================

    if (event === "refund.processed") {
      const refundEntity =
        req.body.payload?.refund?.entity;

      if (!refundEntity) {
        return res.status(400).json({
          success: false,
          message: "Refund data missing",
        });
      }

      if (!refundEntity.payment_id) {
        return res.status(400).json({
          success: false,
          message:
            "Refund payment ID missing",
        });
      }

      const payment = await Payment.findOne({
        razorpayPaymentId:
          refundEntity.payment_id,
      });

      if (!payment) {
        console.log(
          "Payment not found for refund:",
          refundEntity.payment_id
        );

        return res.status(200).json({
          success: true,
          message: "Refund webhook received",
        });
      }

      // ==========================================
      // IDEMPOTENT REFUND UPDATE
      // ==========================================

      if (payment.status !== "refunded") {
        payment.status = "refunded";

        await payment.save();

        console.log(
          "Payment marked as refunded:",
          refundEntity.id
        );
      } else {
        console.log(
          "Duplicate refund.processed webhook ignored:",
          refundEntity.id
        );
      }

      // ==========================================
      // NORMAL APPOINTMENT REFUND
      // ==========================================

      if (payment.appointment) {
        const appointment =
          await Appointment.findById(
            payment.appointment
          );

        if (appointment) {
          if (
            appointment.paymentStatus !==
            "pending"
          ) {
            appointment.paymentStatus =
              "pending";

            await appointment.save();
          }
        }
      }

      // ==========================================
      // PACKAGE REFUND
      // ==========================================

      if (payment.clientPackage) {
        const ClientPackage =
          require("../models/ClientPackage");

        const clientPackage =
          await ClientPackage.findById(
            payment.clientPackage
          );

        if (clientPackage) {
          let packageChanged = false;

          if (
            clientPackage.paymentStatus !==
            "refunded"
          ) {
            clientPackage.paymentStatus =
              "refunded";

            packageChanged = true;
          }

          if (
            clientPackage.status !==
            "cancelled"
          ) {
            clientPackage.status =
              "cancelled";

            packageChanged = true;
          }

          if (packageChanged) {
            await clientPackage.save();
          }
        }
      }

      return res.status(200).json({
        success: true,
        message:
          "Refund processed successfully",
      });
    }

    // ==========================================
    // OTHER EVENTS
    // ==========================================

    console.log(
      "Unhandled Razorpay webhook event:",
      event
    );

    return res.status(200).json({
      success: true,
      message: "Webhook received",
    });
  } catch (error) {
    console.error(
      "Razorpay webhook error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

// ==========================================
// GET MY PAYMENT HISTORY
// ==========================================

const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;

    const payments = await Payment.find({
      user: userId,
    })
      .populate({
        path: "appointment",
        select: "date time duration status",
        populate: {
          path: "therapist",
          select: "name slug",
        },
      })
      .populate({
        path: "clientPackage",
        select:
          "sessionsPurchased sessionsRemaining purchaseDate expiryDate paymentStatus",
        populate: {
          path: "package",
          select:
            "name sessions pricePerSession totalPrice",
        },
      })
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      payments,
    });
  } catch (error) {
    console.error(
      "Get payment history error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// DOWNLOAD MY INVOICE
// ==========================================

const downloadInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        message: "Invoice file name is required",
      });
    }

    const payment = await Payment.findOne({
      user: userId,
      invoiceFileName: fileName,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const invoicePath = path.join(
      __dirname,
      "../../invoices",
      fileName
    );

    return res.download(
      invoicePath,
      fileName,
      (error) => {
        if (error) {
          console.error(
            "Invoice download error:",
            error
          );

          if (!res.headersSent) {
            return res.status(404).json({
              message:
                "Invoice file could not be found",
            });
          }
        }
      }
    );
  } catch (error) {
    console.error(
      "Download invoice error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  demoPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  getMyPayments,
  downloadInvoice,
};

