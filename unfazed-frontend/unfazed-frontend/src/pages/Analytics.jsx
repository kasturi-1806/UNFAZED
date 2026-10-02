import React, { useEffect, useState } from "react";
const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestedDepth, setRequestedDepth] =
    useState("basic");
  const token = localStorage.getItem("token");
  const fetchAnalytics = async (depth = "basic") => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `http://localhost:5000/api/analytics/dashboard?depth=${depth}`,
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
        entitlementError.status = response.status;
        entitlementError.feature = data.feature;
        entitlementError.currentDepth =  data.currentDepth;
        throw entitlementError;
      }
      setAnalytics(data.analytics);
    } catch (error) {
      console.error(
        "ANALYTICS ERROR:",
        error
      );

      setError(error.message);
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
              : "Advanced analytics are not available on your current plan."}
          </p>
          <button
            style={styles.upgradeButton}
            onClick={() =>
              alert("Subscription upgrade flow can be connected here.")
            }
          >
            View Upgrade Options
          </button>
        </div>
      </div>
    );
  }
  const revenueTrend =
    analytics?.revenueTrend || [];
  const maxRevenue = Math.max(
    ...revenueTrend.map(
      (item) => item.revenue || 0
    ),
    1
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
            handleDepthChange(e.target.value)
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
        {revenueTrend.length === 0 ? (
          <div style={styles.empty}>
            No captured payment data available.
          </div>
        ) : (
          <div style={styles.chart}>
            {revenueTrend.map((item) => {
              const height =
                Math.max(
                  (item.revenue /
                    maxRevenue) *
                    220,
                  8
                );
              return (
                <div
                  key={`${item.year}-${item.month}`}
                  style={styles.chartColumn}
                >
                  <span style={styles.revenueValue}>
                    ₹
                    {Number(
                      item.revenue || 0
                    ).toLocaleString("en-IN")}
                  </span>
                  <div
                    style={{
                      ...styles.bar,
                      height,
                    }}
                  />
                  <span style={styles.monthLabel}>
                    {item.month}/
                    {String(
                      item.year
                    ).slice(-2)}
                  </span>
                </div>
              );
            })}
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
  chart: {
    minHeight: "280px",
    display: "flex",
    alignItems: "flex-end",
    gap: "20px",
    overflowX: "auto",
    paddingTop: "30px",
  },
  chartColumn: {
    minWidth: "70px",
    height: "260px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "8px",
  },
  revenueValue: {
    fontSize: "11px",
    color: "#315f51",
    whiteSpace: "nowrap",
  },
  bar: {
    width: "42px",
    background: "#315f51",
    borderRadius: "8px 8px 3px 3px",
    minHeight: "8px",
  },
  monthLabel: {
    fontSize: "11px",
    color: "#7a8b85",
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
    maxWidth: "600px",
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
};
export default Analytics;
