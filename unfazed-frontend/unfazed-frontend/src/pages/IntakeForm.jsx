
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function IntakeForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    age: "",
    phone: "",
    occupation: "",
    reasonForSeekingHelp: "",
    currentConcerns: "",
    previousTherapy: false,
    previousTherapyDetails: "",
    currentMedications: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // HANDLE FORM CHANGES
  // =========================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // NAME FIELDS
    // Allows letters, spaces, apostrophes, dots and hyphens
    if (
      name === "fullName" ||
      name === "emergencyContactName"
    ) {
      const textOnly = value.replace(/[^a-zA-Z\s.'-]/g, "");

      setForm((prev) => ({
        ...prev,
        [name]: textOnly,
      }));

      return;
    }

    // PHONE FIELDS
    // Allows only digits and maximum 10 digits
    if (
      name === "phone" ||
      name === "emergencyContactPhone"
    ) {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

      setForm((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =========================
  // INDIAN MOBILE VALIDATION
  // =========================
 const isValidIndianMobile = (number) => {
  const digits = String(number).replace(/\D/g, "");

  return (
    digits.length === 10 &&
    /^[6-9]/.test(digits)
  );
};
  // =========================
  // SUBMIT FORM
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");
      const therapistId = localStorage.getItem("intakeTherapistId");

      if (!token) {
        throw new Error("Please login first.");
      }

      if (!therapistId) {
        throw new Error(
          "No therapist found for this intake form. Please book a session first."
        );
      }

      // FULL NAME VALIDATION
      if (!form.fullName.trim()) {
        throw new Error("Please enter your full name.");
      }

     // PHONE VALIDATION
const phoneDigits = form.phone.replace(/\D/g, "");

if (
  phoneDigits &&
  !isValidIndianMobile(phoneDigits)
) {
  throw new Error(
    "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
  );
}

// EMERGENCY PHONE VALIDATION
const emergencyPhoneDigits =
  form.emergencyContactPhone.replace(/\D/g, "");

if (
  emergencyPhoneDigits &&
  !isValidIndianMobile(emergencyPhoneDigits)
) {
  throw new Error(
    "Please enter a valid 10-digit emergency contact number starting with 6, 7, 8, or 9."
  );
}

      const response = await fetch(
        "http://localhost:5000/api/intake",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
  therapistId,

  ...form,

  age: form.age
    ? Number(form.age)
    : undefined,

  phone: phoneDigits
    ? `+91${phoneDigits}`
    : "",

  emergencyContactPhone:
    emergencyPhoneDigits
      ? `+91${emergencyPhoneDigits}`
      : "",
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to submit intake form"
        );
      }

      setMessage(
        "Intake form submitted successfully."
      );

      setTimeout(() => {
        navigate("/user-dashboard");
      }, 1200);
    } catch (err) {
      console.error(
        "Submit intake form error:",
        err
      );

      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="intake-page">
      <div className="intake-container">

        {/* PAGE HEADER */}
        <div className="intake-header">
          <div>
            <p className="intake-eyebrow">
              UNFAZED · CLIENT INTAKE
            </p>

            <h1>Patient Intake Form</h1>

            <p className="intake-description">
              A few details will help your therapist
              understand your needs and prepare for
              your session.
            </p>
          </div>

          <div className="intake-progress">
            <span>
              PRIVATE & CONFIDENTIAL
            </span>
          </div>
        </div>

        <form
          className="intake-form"
          onSubmit={handleSubmit}
        >

          {/* =========================
              BASIC INFORMATION
          ========================= */}
          <section className="intake-section">
            <div className="intake-section-header">
              <div className="section-number">
                01
              </div>

              <div>
                <h2>Basic Information</h2>
                <p>
                  Your personal and contact details.
                </p>
              </div>
            </div>

            <div className="intake-grid">

              {/* FULL NAME */}
              <div className="intake-field field-wide">
                <label htmlFor="fullName">
                  Full Name <span>*</span>
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              </div>

              {/* AGE */}
              <div className="intake-field">
                <label htmlFor="age">
                  Age
                </label>

                <input
                  id="age"
                  name="age"
                  type="number"
                  min="1"
                  max="120"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Age"
                />
              </div>

              {/* PHONE */}
              <div className="intake-field">
                <label htmlFor="phone">
                  Phone
                </label>

                <div className="phone-input-wrapper">
                  <span className="phone-code">
                    +91
                  </span>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    autoComplete="tel"
                  />
                </div>

                <small className="phone-help">
                  Enter a valid 10-digit Indian mobile
                  number.
                </small>
              </div>

              {/* OCCUPATION */}
              <div className="intake-field">
                <label htmlFor="occupation">
                  Occupation
                </label>

                <input
                  id="occupation"
                  name="occupation"
                  type="text"
                  value={form.occupation}
                  onChange={handleChange}
                  placeholder="e.g. Student, Engineer"
                />
              </div>
            </div>
          </section>

          {/* =========================
              REASON
          ========================= */}
          <section className="intake-section">
            <div className="intake-section-header">
              <div className="section-number">
                02
              </div>

              <div>
                <h2>
                  Reason for Seeking Support
                </h2>

                <p>
                  Tell your therapist what brought
                  you here.
                </p>
              </div>
            </div>

            <div className="intake-field">
              <label htmlFor="reasonForSeekingHelp">
                Reason for Seeking Help
              </label>

              <textarea
                id="reasonForSeekingHelp"
                name="reasonForSeekingHelp"
                value={
                  form.reasonForSeekingHelp
                }
                onChange={handleChange}
                rows="4"
                placeholder="What would you like support with?"
              />
            </div>

            <div className="intake-field">
              <label htmlFor="currentConcerns">
                Current Concerns
              </label>

              <textarea
                id="currentConcerns"
                name="currentConcerns"
                value={form.currentConcerns}
                onChange={handleChange}
                rows="4"
                placeholder="Describe any concerns, difficulties, or changes you are currently experiencing."
              />
            </div>
          </section>

          {/* =========================
              PREVIOUS TREATMENT
          ========================= */}
          <section className="intake-section">
            <div className="intake-section-header">
              <div className="section-number">
                03
              </div>

              <div>
                <h2>Previous Treatment</h2>

                <p>
                  Information about previous therapy
                  or treatment.
                </p>
              </div>
            </div>

            <label className="therapy-checkbox">
              <input
                id="previousTherapy"
                name="previousTherapy"
                type="checkbox"
                checked={
                  form.previousTherapy
                }
                onChange={handleChange}
              />

              <span>
                I have attended therapy or
                counselling before.
              </span>
            </label>

            {form.previousTherapy && (
              <div className="intake-field conditional-field">
                <label htmlFor="previousTherapyDetails">
                  Previous Therapy Details
                </label>

                <textarea
                  id="previousTherapyDetails"
                  name="previousTherapyDetails"
                  value={
                    form.previousTherapyDetails
                  }
                  onChange={handleChange}
                  rows="4"
                  placeholder="Briefly describe your previous therapy experience."
                />
              </div>
            )}

            <div className="intake-field medication-field">
              <label htmlFor="currentMedications">
                Current Medications
              </label>

              <textarea
                id="currentMedications"
                name="currentMedications"
                value={
                  form.currentMedications
                }
                onChange={handleChange}
                rows="3"
                placeholder="List any current medications, or write 'None'."
              />
            </div>
          </section>

          {/* =========================
              EMERGENCY CONTACT
          ========================= */}
          <section className="intake-section">
            <div className="intake-section-header">
              <div className="section-number">
                04
              </div>

              <div>
                <h2>Emergency Contact</h2>

                <p>
                  Someone your therapist can contact
                  if necessary.
                </p>
              </div>
            </div>

            <div className="intake-grid">

              {/* EMERGENCY NAME */}
              <div className="intake-field">
                <label htmlFor="emergencyContactName">
                  Contact Name
                </label>

                <input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  type="text"
                  value={
                    form.emergencyContactName
                  }
                  onChange={handleChange}
                  placeholder="Full name"
                  autoComplete="name"
                />
              </div>

              {/* EMERGENCY PHONE */}
              <div className="intake-field">
                <label htmlFor="emergencyContactPhone">
                  Contact Phone
                </label>

                <div className="phone-input-wrapper">
                  <span className="phone-code">
                    +91
                  </span>

                  <input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    type="tel"
                    inputMode="numeric"
                    value={
                      form.emergencyContactPhone
                    }
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    autoComplete="tel"
                  />
                </div>

                <small className="phone-help">
                  Enter a valid 10-digit Indian mobile
                  number.
                </small>
              </div>
            </div>

            <div className="privacy-note">
              <strong>Privacy note</strong>

              <span>
                Your information is shared securely
                with your therapist and is intended
                only to support your care.
              </span>
            </div>
          </section>

          {/* =========================
              MESSAGES
          ========================= */}
          {error && (
            <div className="intake-message intake-error">
              {error}
            </div>
          )}

          {message && (
            <div className="intake-message intake-success">
              {message}
            </div>
          )}

          {/* =========================
              SUBMIT
          ========================= */}
          <div className="intake-submit-area">
            <div>
              <p className="required-note">
                <span>*</span> Required field
              </p>

              <p className="submit-note">
                Please review your information before
                submitting.
              </p>
            </div>

            <button
              type="submit"
              className="intake-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : "Submit Intake Form"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default IntakeForm;

