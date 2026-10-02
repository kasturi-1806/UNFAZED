import { useState } from "react";
import { useNavigate } from "react-router-dom";
const AdminLogin = () => {
const navigate = useNavigate();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Admin login failed"
        );
      }
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem(
        "adminData",
        JSON.stringify(data.admin)
      );
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Admin login error:", error);
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f8f5",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 10px 35px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              margin: 0,
              color: "#203d35",
              fontSize: "30px",
            }}
          >
            UNFAZED
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#315f51",
              fontSize: "15px",
            }}
          >
            Admin Portal
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#203d35",
                fontWeight: "600",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
              style={{
                width: "100%",
                padding: "13px",
                border: "1px solid #dfeae3",
                borderRadius: "10px",
                fontSize: "15px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#203d35",
                fontWeight: "600",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              style={{
                width: "100%",
                padding: "13px",
                border: "1px solid #dfeae3",
                borderRadius: "10px",
                fontSize: "15px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                borderRadius: "10px",
                background: "#fde8e8",
                color: "#b42318",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "#315f51",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Logging in..." : "Admin Login"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default AdminLogin;
