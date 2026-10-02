const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Appointment = require("../models/Appointment");
const Client = require("../models/Client");
const { canAccess } = require("../services/entitlementService");
const getTherapistAnalytics = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const analyticsAccess = await canAccess(
      therapistId,
      "analytics"
    );

    if (!analyticsAccess.allowed) {
      return res.status(403).json({
        success: false,
        message: analyticsAccess.reason,
        feature: "analytics",
      });
    }
    const requestedDepth =
      req.query.depth || "basic";

    if (
      !["basic", "standard", "advanced"].includes(
        requestedDepth
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Analytics depth must be basic, standard or advanced.",
      });
    }
    const depthAccess = await canAccess(
      therapistId,
      "analytics-depth",
      requestedDepth
    );

    if (!depthAccess.allowed) {
      return res.status(403).json({
        success: false,
        message: depthAccess.reason,
        feature: "analytics-depth",
        currentDepth:
          depthAccess.currentDepth,
        requestedDepth,
      });
    }

    const monthsByDepth = {
      basic: 3,
      standard: 6,
      advanced: 12,
    };

    const months =
      monthsByDepth[requestedDepth];

    const startDate = new Date();

    startDate.setMonth(
      startDate.getMonth() - months
    );

    const therapistObjectId =
      new mongoose.Types.ObjectId(therapistId);

    const revenueTrend =
      await Payment.aggregate([
        {
          $match: {
            therapist: therapistObjectId,
            status: "captured",
            createdAt: {
              $gte: startDate,
            },
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year: "$createdAt",
              },
              month: {
                $month: "$createdAt",
              },
            },

            revenue: {
              $sum: "$amount",
            },

            transactions: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },

        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            revenue: 1,
            transactions: 1,
          },
        },
      ]);

    const activeClientResult =
      await Client.aggregate([
        {
          $match: {
            therapist: therapistObjectId,
          },
        },

        {
          $group: {
            _id: null,
            activeClients: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,
            activeClients: 1,
          },
        },
      ]);

    const activeClients =
      activeClientResult[0]?.activeClients || 0;
    const noShowResult =
      await Appointment.aggregate([
        {
          $match: {
            therapist: therapistObjectId,
            status: {
              $in: [
                "completed",
                "no-show",
              ],
            },
            date: {
              $gte: startDate,
            },
          },
        },

        {
          $group: {
            _id: null,

            totalSessions: {
              $sum: 1,
            },

            noShows: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "no-show",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },

        {
          $project: {
            _id: 0,
            totalSessions: 1,
            noShows: 1,
          },
        },
      ]);

    const totalSessions =
      noShowResult[0]?.totalSessions || 0;

    const noShows =
      noShowResult[0]?.noShows || 0;

    const noShowRate =
      totalSessions > 0
        ? Number(
            (
              (noShows / totalSessions) *
              100
            ).toFixed(2)
          )
        : 0;
    return res.json({
      success: true,
      analytics: {
        depth: requestedDepth,
        periodMonths: months,
        revenueTrend,
        activeClients,
        noShowRate,
        sessionStats: {
          totalSessions,
          noShows,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get therapist analytics error:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};

module.exports = {
  getTherapistAnalytics,
};
