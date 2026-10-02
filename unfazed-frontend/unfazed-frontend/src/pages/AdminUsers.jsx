import { useEffect, useState } from "react";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("adminToken");

        if (!token) {
          window.location.href = "/admin/login";
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/admin/users",
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
            data.message || "Failed to fetch users"
          );
        }

        setUsers(data.users || []);
      } catch (error) {
        console.error("Admin users error:", error);

        setError(
          error.message || "Failed to load users"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f8f5",
        color: "#203d35",
        padding: "30px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
              }}
            >
              User Management
            </h1>

            <p
              style={{
                marginTop: "8px",
                color: "#315f51",
              }}
            >
              View all users registered on UNFAZED.
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = "/admin/dashboard";
            }}
            style={{
              padding: "11px 18px",
              border: "none",
              borderRadius: "9px",
              background: "#315f51",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Back to Dashboard
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fde8e8",
              color: "#b42318",
              padding: "14px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dfeae3",
              borderRadius: "14px",
              padding: "30px",
              textAlign: "center",
            }}
          >
            Loading users...
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          users.length === 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #dfeae3",
                borderRadius: "14px",
                padding: "40px",
                textAlign: "center",
                color: "#315f51",
              }}
            >
              No users found.
            </div>
          )}

        {/* Users table */}
        {!loading &&
          !error &&
          users.length > 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #dfeae3",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  borderBottom: "1px solid #dfeae3",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                  }}
                >
                  Registered Users
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#315f51",
                    fontSize: "14px",
                  }}
                >
                  Total: {users.length}
                </p>
              </div>

              <div
                style={{
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "600px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#dfeae3",
                      }}
                    >
                      <th style={headerStyle}>Name</th>
                      <th style={headerStyle}>Email</th>
                      <th style={headerStyle}>Joined</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td style={cellStyle}>
                          {user.name || "—"}
                        </td>

                        <td style={cellStyle}>
                          {user.email || "—"}
                        </td>

                        <td style={cellStyle}>
                          {user.createdAt
                            ? new Date(
                                user.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

const headerStyle = {
  textAlign: "left",
  padding: "15px",
  fontSize: "14px",
  fontWeight: "700",
  color: "#203d35",
  whiteSpace: "nowrap",
};

const cellStyle = {
  padding: "15px",
  borderTop: "1px solid #dfeae3",
  fontSize: "14px",
  color: "#315f51",
  verticalAlign: "top",
};

export default AdminUsers;