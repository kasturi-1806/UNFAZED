import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    bio: "",
    specializations: "",
    languages: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => { e.preventDefault();
    setMessage("");
    setError("");

    try {
      const endpoint =
        formData.role === "therapist"
          ? "https://unfazed-692q.onrender.com/api/auth/therapist/register"
          : "https://unfazed-692q.onrender.com/api/auth/user/register";

      const slug = formData.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const body = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        slug,
      };

      if (formData.role === "therapist") {
        body.bio = formData.bio;
        body.specializations = formData.specializations
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "");
        body.languages = formData.languages
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed"
        );
      }
      setMessage(
        "Registration successful! You can now login."
      );
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setError(error.message);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Your Account</h1>
        <p className="auth-subtitle">
          Join Unfazed and start your journey.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              placeholder="Enter your name"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              placeholder="Enter your email"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              placeholder="Create a password"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Register as</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange} >
              <option value="user">User</option>
              <option value="therapist">Therapist</option>
            </select>
          </div>
          {formData.role === "therapist" && (
            <>
              <div className="form-group">
                <label>Professional Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  placeholder="Tell patients about your professional experience..."
                  onChange={handleChange}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Specializations</label>
                <input
                  type="text"
                  name="specializations"
                  value={formData.specializations}
                  placeholder="e.g. Anxiety, Depression, Stress"
                  onChange={handleChange}
                />
                <small>
                  Separate multiple specializations with commas.
                </small>
              </div>
              <div className="form-group">
                <label>Languages</label>

                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  placeholder="e.g. English, Hindi, Marathi"
                  onChange={handleChange}
                />

                <small>
                  Separate multiple languages with commas.
                </small>
              </div>
            </>
          )}
          <button
            type="submit"
            className="auth-btn"> Create Account </button>
        </form>
        {message && (
          <p className="success-message">{message}</p>)}
        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
export default Register;
