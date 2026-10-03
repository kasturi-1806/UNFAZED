import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://unfazed-692q.onrender.com";

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestedDepth, setRequestedDepth] =
    useState("basic");
  const [showUpgradeOptions, setShowUpgradeOptions] =
    useState(false);

  const token = localStorage.getItem("token");

  const fetchAnalytics = async (depth = "basic") => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/analytics/dashboard?depth=${depth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const entitlementError = new Error(
          data.message || "Unable to load analytics."
        );

        entitlementError.status =
          response.status;

        entitlementError.feature =
          data.feature;

        entitlementError.currentDepth =
          data.currentDepth;

        throw entitlementError;
      }

      setAnalytics(data.analytics);
    } catch (error) {
      console.error(
        "ANALYTICS ERROR:",
        error
      );

      setError(
        error.message ||
          "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Please log in again.");
      setLoading(false);
      return;
    }

    fetchAnalytics("basic");
  }, []);

  const handleDepthChange = (depth) => {
    setRequestedDepth(depth);
    fetchAnalytics(depth);
  };

  const closeUpgradeOptions = () => {
    setShowUpgradeOptions(false);
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    const isUpgradeRequired =
      error.toLowerCase().includes("plan") ||
      error.toLowerCase().includes("available") ||
      error.toLowerCase().includes("analytics");

    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Analytics
            </h1>

            <p style={styles.subtitle}>
              Track your practice performance.
            </p>
          </div>
        </div>

        <div style={styles.upgradeCard}>
          <div style={styles.upgradeIcon}>
            ↑
          </div>

          <h2 style={styles.upgradeTitle}>
            Upgrade required
          </h2>

          <p style={styles.upgradeText}>
            {isUpgradeRequired
              ? error
              : "This analytics level is not available on your current plan."}
          </p>

          {!showUpgradeOptions ? (
            <button
              type="button"
              style={styles.upgradeButton}
              onClick={() =>
                setShowUpgradeOptions(true)
              }
            >
              View Upgrade Options
            </button>
          ) : (
            <div style={styles.upgradeOptions}>
              <div
                style={styles.upgradeOption}
              >
                <div>
                  <strong style={styles.optionTitle}>
                    Professional
                  </strong>

                  <p style={styles.optionDescription}>
                    Standard analytics and higher
                    client capacity.
                  </p>
                </div>

                <button
                  type="button"
                  style={styles.optionButton}
                  onClick={() =>
                    alert(
                      "Professional upgrade flow can be connected here."
                    )
                  }
                >
                  Choose
                </button>
              </div>

              <div
                style={styles.upgradeOption}
              >
                <div>
                  <strong style={styles.optionTitle}>
                    Premium
                  </strong>

                  <p style={styles.optionDescription}>
                    Advanced analytics and the highest
                    client capacity.
                  </p>
                </div>

                <button
                  type="button"
                  style={styles.optionButton}
                  onClick={() =>
                    alert(
                      "Premium upgrade flow can be connected here."
                    )
                  }
                >
                  Choose
                </button>
              </div>

              <button
                type="button"
                style={styles.closeUpgradeButton}
                onClick={closeUpgradeOptions}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const revenueTrend =
    analytics?.revenueTrend || [];

  const chartData = revenueTrend.map(
    (item) => ({
      month: `${item.month}/${String(
        item.year
      ).slice(-2)}`,
      revenue: Number(item.revenue || 0),
      transactions: Number(
        item.transactions || 0
      ),
    })
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Analytics
          </h1>

          <p style={styles.subtitle}>
            Understand your practice performance
            and client activity.
          </p>
        </div>

        <select
          value={requestedDepth}
          onChange={(e) =>
            handleDepthChange(
              e.target.value
            )
          }
          style={styles.select}
        >
          <option value="basic">
            Basic Analytics
          </option>

          <option value="standard">
            Standard Analytics
          </option>

          <option value="advanced">
            Advanced Analytics
          </option>
        </select>
      </div>

      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <span style={styles.cardLabel}>
            Active Clients
          </span>

          <strong style={styles.cardValue}>
            {analytics?.activeClients || 0}
          </strong>

          <span style={styles.cardDescription}>
            Current client records
          </span>
        </div>

        <div style={styles.card}>
          <span style={styles.cardLabel}>
            No-Show Rate
          </span>

          <strong style={styles.cardValue}>
            {analytics?.noShowRate || 0}%
          </strong>

          <span style={styles.cardDescription}>
            During selected period
          </span>
        </div>

        <div style={styles.card}>
          <span style={styles.cardLabel}>
            Sessions
          </span>

          <strong style={styles.cardValue}>
            {analytics?.sessionStats
              ?.totalSessions || 0}
          </strong>

          <span style={styles.cardDescription}>
            Completed + no-show
          </span>
        </div>

        <div style={styles.card}>
          <span style={styles.cardLabel}>
            Period
          </span>

          <strong style={styles.cardValue}>
            {analytics?.periodMonths || 0}
          </strong>

          <span style={styles.cardDescription}>
            Months analysed
          </span>
        </div>
      </div>

      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Revenue Trend
            </h2>

            <p style={styles.sectionSubtitle}>
              Captured payments during the selected
              period.
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div style={styles.empty}>
            No captured payment data available.
          </div>
        ) : (
          <div style={styles.chartWrapper}>
            <ResponsiveContainer
              width="100%"
              height={320}
            >
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 12,
                  }}
                  tickFormatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString(
                      "en-IN"
                    )}`
                  }
                />

                <Tooltip
                  formatter={(value) => [
                    `₹${Number(
                      value
                    ).toLocaleString(
                      "en-IN"
                    )}`,
                    "Revenue",
                  ]}
                  labelFormatter={(label) =>
                    `Month: ${label}`
                  }
                />

                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={styles.sectionCard}>
        <h2 style={styles.sectionTitle}>
          Session Summary
        </h2>

        <div style={styles.sessionRow}>
          <div>
            <span style={styles.sessionLabel}>
              Total Sessions
            </span>

            <strong style={styles.sessionValue}>
              {analytics?.sessionStats
                ?.totalSessions || 0}
            </strong>
          </div>

          <div>
            <span style={styles.sessionLabel}>
              No-Shows
            </span>

            <strong style={styles.sessionValue}>
              {analytics?.sessionStats
                ?.noShows || 0}
            </strong>
          </div>

          <div>
            <span style={styles.sessionLabel}>
              No-Show Rate
            </span>

            <strong style={styles.sessionValue}>
              {analytics?.noShowRate || 0}%
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f8f5",
    padding: "32px",
    color: "#203d35",
  },

  loading: {
    textAlign: "center",
    paddingTop: "100px",
    fontSize: "18px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
  },

  subtitle: {
    marginTop: "8px",
    color: "#687b74",
    fontSize: "15px",
  },

  select: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #c9d8d2",
    background: "#ffffff",
    color: "#203d35",
    fontSize: "14px",
    cursor: "pointer",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "22px",
    border: "1px solid #dfeae3",
  },

  cardLabel: {
    display: "block",
    color: "#687b74",
    fontSize: "14px",
    marginBottom: "10px",
  },

  cardValue: {
    display: "block",
    fontSize: "28px",
    color: "#315f51",
    marginBottom: "6px",
  },

  cardDescription: {
    color: "#84948e",
    fontSize: "12px",
  },

  sectionCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #dfeae3",
    marginBottom: "24px",
  },

  sectionHeader: {
    marginBottom: "24px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#203d35",
  },

  sectionSubtitle: {
    marginTop: "6px",
    color: "#7a8b85",
    fontSize: "13px",
  },

  chartWrapper: {
    width: "100%",
    minHeight: "320px",
  },

  sessionRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  sessionLabel: {
    display: "block",
    color: "#7a8b85",
    fontSize: "13px",
    marginBottom: "6px",
  },

  sessionValue: {
    fontSize: "24px",
    color: "#315f51",
  },

  empty: {
    padding: "50px 20px",
    textAlign: "center",
    color: "#7a8b85",
  },

  upgradeCard: {
    maxWidth: "650px",
    margin: "50px auto",
    background: "#ffffff",
    border: "1px solid #dfeae3",
    borderRadius: "20px",
    padding: "40px",
    textAlign: "center",
  },

  upgradeIcon: {
    width: "52px",
    height: "52px",
    margin: "0 auto 18px",
    borderRadius: "50%",
    background: "#dfeae3",
    color: "#315f51",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: 700,
  },

  upgradeTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#203d35",
  },

  upgradeText: {
    color: "#687b74",
    lineHeight: 1.6,
    margin: "14px 0 24px",
  },

  upgradeButton: {
    border: "none",
    borderRadius: "10px",
    padding: "12px 22px",
    background: "#315f51",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
  },

  upgradeOptions: {
    marginTop: "20px",
    textAlign: "left",
  },

  upgradeOption: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    border: "1px solid #dfeae3",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "12px",
  },

  optionTitle: {
    display: "block",
    fontSize: "16px",
    color: "#203d35",
  },

  optionDescription: {
    margin: "6px 0 0",
    color: "#71807a",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  optionButton: {
    border: "none",
    borderRadius: "8px",
    padding: "9px 14px",
    background: "#315f51",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  closeUpgradeButton: {
    width: "100%",
    marginTop: "8px",
    padding: "10px",
    border: "1px solid #d5e1db",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#315f51",
    cursor: "pointer",
    fontWeight: 600,
  },
};

export default Analytics;

