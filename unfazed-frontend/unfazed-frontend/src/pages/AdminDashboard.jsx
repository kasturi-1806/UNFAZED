import { useEffect, useState } from "react";
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    therapists: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const adminData = JSON.parse(
    localStorage.getItem("adminData") || "{}"
  );
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          window.location.href = "/admin/login";
          return;
        }
        const response = await fetch(
          "http://localhost:5000/api/admin/dashboard",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load dashboard"
          );
        }
        setStats(data.stats);
      } catch (error) {
        console.error("Admin dashboard error:", error);

        if (
          error.message.includes("token") ||
          error.message.includes("Authentication")
        ) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminData");
          window.location.href = "/admin/login";
          return;
        }
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");

    window.location.href = "/admin/login";
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f8f5",
        color: "#203d35",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #dfeae3",
          padding: "18px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              color: "#203d35",
            }}
          >
            UNFAZED
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              color: "#315f51",
              fontSize: "14px",
            }}
          >
            Admin Dashboard
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {adminData.name || "Admin"}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#315f51",
              }}
            >
              {adminData.email || ""}
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              border: "none",
              background: "#315f51",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px 30px",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "28px",
            }}
          >
            Welcome, Admin
          </h2>

          <p
            style={{
              color: "#315f51",
              marginTop: "8px",
            }}
          >
            Manage and monitor the UNFAZED platform.
          </p>
        </div>
        {error && (
          <div
            style={{
              background: "#fde8e8",
              color: "#b42318",
              padding: "14px",
              borderRadius: "10px",
              marginBottom: "25px",
            }}
          >
            {error}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dfeae3",
              borderRadius: "16px",
              padding: "25px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#315f51",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Total Therapists
            </p>
            <h3
              style={{
                margin: "12px 0 0",
                fontSize: "36px",
                color: "#203d35",
              }}
            >
              {loading ? "..." : stats.therapists}
            </h3>
          </div>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dfeae3",
              borderRadius: "16px",
              padding: "25px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#315f51",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Total Users
            </p>
            <h3
              style={{
                margin: "12px 0 0",
                fontSize: "36px",
                color: "#203d35",
              }}
            >
              {loading ? "..." : stats.users}
            </h3>
          </div>
        </div>
        <div
          style={{
            marginTop: "35px",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "#dfeae3",
              borderRadius: "16px",
              padding: "25px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Therapist Management
            </h3>
            <p
              style={{
                color: "#315f51",
                lineHeight: "1.6",
              }}
            >
              View and manage therapists registered on
              the UNFAZED platform.
            </p>
            <button
              onClick={() => {
                window.location.href = "/admin/therapists";
              }}
              style={{
                marginTop: "10px",
                padding: "11px 18px",
                border: "none",
                borderRadius: "9px",
                background: "#315f51",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              View Therapists
            </button>
          </div>
          <div
            style={{
              background: "#dfeae3",
              borderRadius: "16px",
              padding: "25px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              User Management
            </h3>

            <p
              style={{
                color: "#315f51",
                lineHeight: "1.6",
              }}
            >
              View registered users and monitor platform
              activity.
            </p>
            <button
              onClick={() => {
                window.location.href = "/admin/users";
              }}
              style={{
                marginTop: "10px",
                padding: "11px 18px",
                border: "none",
                borderRadius: "9px",
                background: "#315f51",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              View Users
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
export default AdminDashboard;
