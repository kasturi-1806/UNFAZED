const crypto = require("crypto");
const path = require("path");
const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Therapist = require("../models/Therapist");
const razorpay = require("../config/razorpay");
const generateInvoice = require("../utils/invoiceGenerator");

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

    const paymentAmount = 500;

    const amountInPaise =
      Math.round(paymentAmount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `appointment_${appointment._id}`,
    });

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

const verifyRazorpayPayment = async (req, res) => {
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
        message:
          "Razorpay payment details are required",
      });
    }

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

    if (payment.status === "captured") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        payment,
      });
    }

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

    payment.razorpayPaymentId =
      razorpay_payment_id;

    payment.razorpaySignature =
      razorpay_signature;

    payment.gatewayTransactionId =
      razorpay_payment_id;

    payment.status = "captured";

    await payment.save();

    appointment.paymentStatus = "paid";
    appointment.paymentAmount = payment.amount;

    await appointment.save();

    const user = await User.findById(
      appointment.user
    ).select("name email");

    const therapist = await Therapist.findById(
      appointment.therapist
    ).select("name");

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

const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

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

    const receivedSignature =
      req.headers["x-razorpay-signature"];

    if (!receivedSignature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature missing",
      });
    }

    if (!req.rawBody) {
      console.error(
        "Raw webhook body is missing"
      );

      return res.status(400).json({
        success: false,
        message: "Raw webhook body is missing",
      });
    }

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

      const payment = await Payment.findOne({
        razorpayOrderId:
          paymentEntity.order_id,
      });

      if (!payment) {
        console.log(
          "Payment not found for Razorpay order:",
          paymentEntity.order_id
        );

        return res.status(200).json({
          success: true,
          message: "Webhook received",
        });
      }

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

      return res.status(200).json({
        success: true,
        message:
          "Refund creation event received",
      });
    }

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

module.exports = {
  demoPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  getMyPayments,
  downloadInvoice,
};
