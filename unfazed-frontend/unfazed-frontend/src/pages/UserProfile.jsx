
import { useState } from "react";
import { Link } from "react-router-dom";

function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "Alex User",
    email: "alex@example.com",
    phone: "+91 98765 43210",
    memberSince: "September 2026",
  });

  const [editProfile, setEditProfile] = useState(profile);

  const handleEdit = () => {
    setEditProfile(profile);
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setEditProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = () => {
    setProfile(editProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setIsEditing(false);
  };

  const avatarLetter =
    profile.name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="user-profile-page">

      {/* ================= HEADER ================= */}
      <div className="user-profile-header">

        <div>
          <p className="user-profile-eyebrow">UNFAZED</p>

          <h1>My Profile</h1>

          <p>
            Manage your personal information and account details.
          </p>
        </div>

        <Link to="/user-dashboard" className="user-profile-back">
          ← Dashboard
        </Link>

      </div>


      {/* ================= PROFILE CARD ================= */}
      <section className="user-profile-main-card">

        <div className="user-profile-top">

          <div className="user-profile-avatar">
            {avatarLetter}
          </div>

          <div className="user-profile-heading">

            <span className="user-profile-status">
              ACTIVE ACCOUNT
            </span>

            <h2>{profile.name}</h2>

            <p>{profile.email}</p>

          </div>

        </div>


        <div className="user-profile-line" />


        {/* ================= PERSONAL INFORMATION ================= */}
        <div className="user-profile-section">

          <div className="user-profile-section-heading">

            <div>
              <span className="user-profile-label">
                PERSONAL INFORMATION
              </span>

              <h2>Your details</h2>
            </div>


            {!isEditing ? (
              <button
                type="button"
                className="user-profile-edit-btn"
                onClick={handleEdit}
              >
                Edit Profile
              </button>
            ) : (
              <div className="user-profile-edit-actions">

                <button
                  type="button"
                  className="user-profile-cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="user-profile-save-btn"
                  onClick={handleSave}
                >
                  Save Changes
                </button>

              </div>
            )}

          </div>


          <div className="user-profile-information">

            {/* NAME */}
            <div className="user-profile-info-item">

              <span>Name</span>

              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editProfile.name}
                  onChange={handleChange}
                  className="user-profile-input"
                />
              ) : (
                <strong>{profile.name}</strong>
              )}

            </div>


            {/* EMAIL */}
            <div className="user-profile-info-item">

              <span>Email</span>

              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editProfile.email}
                  onChange={handleChange}
                  className="user-profile-input"
                />
              ) : (
                <strong>{profile.email}</strong>
              )}

            </div>


            {/* PHONE */}
            <div className="user-profile-info-item">

              <span>Phone</span>

              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={editProfile.phone}
                  onChange={handleChange}
                  className="user-profile-input"
                />
              ) : (
                <strong>{profile.phone}</strong>
              )}

            </div>


            {/* MEMBER SINCE */}
            <div className="user-profile-info-item">

              <span>Member since</span>

              <strong>{profile.memberSince}</strong>

            </div>

          </div>

        </div>

      </section>


      {/* ================= ACTIVITY ================= */}
      <section className="user-profile-activity">

        <div className="user-profile-section-heading">

          <div>
            <span className="user-profile-label">
              YOUR ACTIVITY
            </span>

            <h2>Your journey with UNFAZED</h2>
          </div>

        </div>


        <div className="user-profile-stat-grid">

          <div className="user-profile-stat-card">

            <div className="user-profile-stat-icon">
              📅
            </div>

            <div>
              <strong>0</strong>
              <span>Sessions completed</span>
            </div>

          </div>


          <div className="user-profile-stat-card">

            <div className="user-profile-stat-icon">
              ⭐
            </div>

            <div>
              <strong>0</strong>
              <span>Reviews given</span>
            </div>

          </div>


          <div className="user-profile-stat-card">

            <div className="user-profile-stat-icon">
              ♡
            </div>

            <div>
              <strong>0</strong>
              <span>Therapists explored</span>
            </div>

          </div>

        </div>

      </section>


      {/* ================= QUICK ACTIONS ================= */}
      <section className="user-profile-actions">

        <div className="user-profile-section-heading">

          <div>
            <span className="user-profile-label">
              QUICK ACCESS
            </span>

            <h2>Manage your account</h2>
          </div>

        </div>


        <div className="user-profile-action-grid">

          <Link
            to="/sessions"
            className="user-profile-action-card"
          >
            <div className="user-profile-action-icon">
              📅
            </div>

            <div>
              <h3>My Sessions</h3>

              <p>
                View your upcoming and previous appointments.
              </p>
            </div>

            <span>→</span>
          </Link>


          <Link
            to="/therapists"
            className="user-profile-action-card"
          >
            <div className="user-profile-action-icon">
              ♡
            </div>

            <div>
              <h3>Find a Therapist</h3>

              <p>
                Explore therapists and find the right support.
              </p>
            </div>

            <span>→</span>
          </Link>


          <Link
            to="/user-dashboard"
            className="user-profile-action-card"
          >
            <div className="user-profile-action-icon">
              🏠
            </div>

            <div>
              <h3>Dashboard</h3>

              <p>
                Return to your personal UNFAZED dashboard.
              </p>
            </div>

            <span>→</span>
          </Link>

        </div>

      </section>


      {/* ================= WELLBEING ================= */}
      <section className="user-profile-wellbeing">

        <div className="user-profile-wellbeing-icon">
          ♡
        </div>

        <div>

          <span className="user-profile-label">
            YOUR WELLBEING
          </span>

          <h2>Taking care of yourself matters.</h2>

          <p>
            Your mental wellbeing is a journey. Whenever you
            need support, UNFAZED is here to help you take
            the next step.
          </p>

        </div>

      </section>

    </div>
  );
}

export default UserProfile;

