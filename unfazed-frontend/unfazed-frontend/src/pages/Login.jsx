import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [therapistCode, setTherapistCode] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {e.preventDefault();
    setError("");
    try {
      const endpoint =
        role === "therapist"
          ? "http://localhost:5000/api/auth/therapist/login"
          : "http://localhost:5000/api/auth/user/login";

      console.log("Calling endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
          ...(role === "therapist" && {
            therapistCode: therapistCode.trim().toUpperCase(),
          }),
        }),
      });
      const data = await response.json();
      console.log("Login response:", data);
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", role);
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...data.user,
            role,
          })
        );
        localStorage.setItem(
          "userName",
          data.user.name || ""
        );
      } else if (data.therapist) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...data.therapist,
            role: "therapist",
          })
        );
        localStorage.setItem(
          "userName",
          data.therapist.name || ""
        );
      } else 
        localStorage.removeItem("user");
        localStorage.removeItem("userName");
      }
      if (role === "therapist") {
        navigate("/therapist-dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">
          Sign in to continue your Unfazed journey.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Login as</label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setError("");
                setTherapistCode("");
              }}
            >
              <option value="user">User</option>
              <option value="therapist">Therapist</option>
            </select>
          </div>
          {role === "therapist" && (
            <div className="form-group">
              <label>Therapist Code</label>
              <input
                type="text"
                placeholder="Enter your therapist code"
                value={therapistCode}
                onChange={(e) =>
                  setTherapistCode(
                    e.target.value.toUpperCase()
                  )
                }
                required
              />
              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                  color: "#315f51",
                  fontSize: "12px",
                }}
              >
                Enter the code assigned to you by the admin.
              </small>
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-btn">
            Login
          </button>
        </form>
        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

