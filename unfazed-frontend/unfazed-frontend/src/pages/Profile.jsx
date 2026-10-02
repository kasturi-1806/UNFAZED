import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    slug: "",
    bio: "",
    specializations: [],
    languages: [],
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [specializationInput, setSpecializationInput] =
    useState("");

  const [languageInput, setLanguageInput] =
    useState("");
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }
        const storedUser = localStorage.getItem("user");
        let currentUser = null;

        if (storedUser) {
          try {
            currentUser = JSON.parse(storedUser);
          } catch (error) {
            console.error("User data parse error:", error);
          }
        }

        if (currentUser?.slug) {
          setProfile((prev) => ({
            ...prev,
            slug: currentUser.slug,
          }));
        }

        const response = await fetch(
          "https://unfazed-692q.onrender.com/api/therapists",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load therapist profile"
          );
        }

        const currentTherapist = data.therapists?.find(
          (therapist) =>
            therapist._id === currentUser?.id ||
            therapist._id === currentUser?._id ||
            therapist.email === currentUser?.email
        );

        if (currentTherapist) {
          setProfile({
            name: currentTherapist.name || "",
            email: currentTherapist.email || "",
            slug: currentTherapist.slug || "",
            bio: currentTherapist.bio || "",
            specializations:
              currentTherapist.specializations || [],
            languages:
              currentTherapist.languages || [],
          });
        }
      } catch (error) {
        console.error(
          "Load therapist profile error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const addSpecialization = () => {
    const value = specializationInput.trim();

    if (!value) return;

    const exists = profile.specializations.some(
      (item) =>
        item.toLowerCase() === value.toLowerCase()
    );

    if (exists) {
      setSpecializationInput("");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      specializations: [
        ...prev.specializations,
        value,
      ],
    }));

    setSpecializationInput("");
  };

  const removeSpecialization = (index) => {
    setProfile((prev) => ({
      ...prev,
      specializations:
        prev.specializations.filter(
          (_, i) => i !== index
        ),
    }));
  };

  const addLanguage = () => {
    const value = languageInput.trim();
    if (!value) return;
    const exists = profile.languages.some(
      (item) =>
        item.toLowerCase() === value.toLowerCase()
    );
    if (exists) {
      setLanguageInput("");
      return;
    }
    setProfile((prev) => ({
      ...prev,
      languages: [
        ...prev.languages,
        value,
      ],
    }));

    setLanguageInput("");
  };

  const removeLanguage = (index) => {
    setProfile((prev) => ({
      ...prev,
      languages: prev.languages.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const completion = useMemo(() => {
    let completed = 0;
    if (profile.name.trim()) completed++;
    if (profile.bio.trim()) completed++;
    if (profile.specializations.length > 0)
      completed++;
    if (profile.languages.length > 0)
      completed++;
    if (profile.slug.trim()) completed++;

    return Math.round((completed / 5) * 100);
  }, [profile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!profile.name.trim()) {
        alert("Your name is required before saving.");
        setSaving(false);
        return;
      }
      const response = await fetch(
        "https://unfazed-692q.onrender.com/api/therapists/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: profile.name.trim(),
            bio: profile.bio.trim(),
            specializations: [
              ...profile.specializations,
            ],
            languages: [
              ...profile.languages,
            ],
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      setProfile((prev) => ({
        ...prev,
        ...data.therapist,
      }));

      const storedUser =
        localStorage.getItem("user");

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...user,
              name: data.therapist.name,
              email: data.therapist.email,
              slug: data.therapist.slug,
            })
          );
        } catch (error) {
          console.error(
            "Local user update error:",
            error
          );
        }
      }

      setEditing(false);

      alert("Profile updated successfully");
    } catch (error) {
      console.error(
        "Update therapist profile error:",
        error
      );

      alert(
        error.message ||
          "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="therapist-profile-page">
      <header className="profile-header">
        <div className="profile-header-text">
          <span className="profile-eyebrow">
            THERAPIST WORKSPACE
          </span>
          <h1>My Profile</h1>
          <p>
            Manage the professional information
            patients see when they visit your
            profile.
          </p>
        </div>
        <Link
          to="/therapist-dashboard"
          className="back-dashboard-btn" > ← Dashboard</Link>
      </header>
      <section className="profile-hero">
        <div className="profile-identity">
          <div className="profile-avatar-large">
            {profile.name
              ? profile.name
                  .charAt(0)
                  .toUpperCase()
              : "T"}
          </div>

          <div className="profile-hero-info">
            {editing ? (
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="profile-name-input"
                placeholder="Enter your full name"
              />
            ) : (
              <h2>
                {profile.name || "Therapist"}
              </h2>
            )}

            <p className="profile-role">
              Therapist
            </p>

            <div className="profile-public-link">

              <span>
                Public profile
              </span>

              <strong>
                /therapists/
                {profile.slug ||
                  "your-profile"}
              </strong>

            </div>

          </div>

        </div>


        <div className="profile-hero-actions">

          {!editing ? (
            <button
              type="button"
              className="edit-profile-btn"
              onClick={() =>
                setEditing(true)
              }
            >
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">

              <button
                type="button"
                className="cancel-profile-btn"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-profile-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>
          )}

        </div>

      </section>
      <main className="profile-content">
        <div className="profile-top-grid">
          <section className="profile-card professional-card">
            <div className="profile-card-heading">
              <div>
                <span className="card-eyebrow">
                  PROFESSIONAL
                </span>
                <h2>
                  Professional Information
                </h2>
                <p>
                  Information patients use to
                  understand your professional
                  background.
                </p>
              </div>
            </div>

            <div className="profile-fields">
              <div className="profile-field">
                <label>
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                  />
                ) : (
                  <div className="profile-value">
                    {profile.name ||
                      "Not added"}
                  </div>
                )}

              </div>
              <div className="profile-field">

                <label>
                  Email Address
                </label>

                <div className="profile-value email-value">
                  {profile.email ||
                    "Not available"}
                </div>
                <small>
                  Linked to your therapist account
                </small>
              </div>
              <div className="profile-field profile-field-full">

                <label>
                  Professional Bio
                </label>
                {editing ? (
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Tell patients about your professional approach, experience and the support you provide..."
                  />
                ) : (
                  <div className="profile-bio">
                    {profile.bio ||
                      "No professional bio added yet."}
                  </div>
                )}

              </div>
            </div>
          </section>

          <aside className="profile-card profile-status-card">
            <div className="status-card-top">
              <div>
                <span className="card-eyebrow">
                  PROFILE STATUS
                </span>

                <h2>
                  Profile completion
                </h2>

              </div>
              <div className="completion-number">
                {completion}%
              </div>
            </div>
            <div className="completion-track">
              <div
                className="completion-progress"
                style={{
                  width: `${completion}%`,
                }}
              ></div>

            </div>


            <p className="completion-description">
              A complete profile helps patients
              understand your expertise before
              booking a session.
            </p>


            <div className="completion-checklist">

              <div
                className={
                  profile.name
                    ? "complete"
                    : ""
                }
              >
                <span>
                  {profile.name
                    ? "✓"
                    : "○"}
                </span>

                Professional name
              </div>
              <div
                className={
                  profile.bio
                    ? "complete"
                    : ""
                }
              >
                <span>
                  {profile.bio
                    ? "✓"
                    : "○"}
                </span>
                Professional bio
              </div>
              <div
                className={
                  profile.specializations.length
                    ? "complete"
                    : ""
                }
              >
                <span>
                  {profile.specializations.length
                    ? "✓"
                    : "○"}
                </span>

                Specializations
              </div>


              <div
                className={
                  profile.languages.length
                    ? "complete"
                    : ""
                }
              >
                <span>
                  {profile.languages.length
                    ? "✓"
                    : "○"}
                </span>

                Languages
              </div>
            </div>
          </aside>
        </div>
        <div className="profile-two-card-grid">
          <section className="profile-card">
            <div className="profile-card-heading">
              <div>
                <span className="card-eyebrow">
                  EXPERTISE
                </span>
                <h2>
                  Specializations
                </h2>
                <p>
                  Areas of practice patients can
                  book you for.
                </p>
              </div>

              <span className="section-count">
                {profile.specializations.length}
              </span>
            </div>
            <div className="tag-list">
              {profile.specializations.length > 0 ? (
                profile.specializations.map(
                  (item, index) => (
                    <div
                      className="profile-tag"
                      key={`${item}-${index}`} >
                      <span> {item} </span>
                      {editing && (
                        <button
                          type="button"
                          onClick={() =>
                            removeSpecialization(
                              index
                            )
                          }
                          aria-label={`Remove ${item}`}
                        >
                          ×
                        </button>
                      )}

                    </div>
                  )
                )
              ) : (
                <p className="empty-profile-text">No specializations added yet.</p>
              )}
            </div>
            {editing && (
              <div className="add-tag-row">
                <input type="text"value={specializationInput}
                  onChange={(e) =>
                    setSpecializationInput(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialization();
                    }
                  }}
                  placeholder="e.g. Anxiety"
                />
                <button
                  type="button"
                  onClick={addSpecialization}>+ Add</button>
              </div>
            )}
          </section>
          
          <section className="profile-card">
            <div className="profile-card-heading">
              <div>
                <span className="card-eyebrow">
                  COMMUNICATION
                </span>
                <h2>
                  Languages
                </h2>
                <p>
                  Languages you can use during
                  appointments.
                </p>
              </div>
              <span className="section-count">
                {profile.languages.length}
              </span>
            </div>

            <div className="tag-list">
              {profile.languages.length > 0 ? (
                profile.languages.map(
                  (item, index) => (
                    <div
                      className="profile-tag"
                      key={`${item}-${index}`} >
                      <span> {item}  </span>
                      {editing && (
                        <button
                          type="button"
                          onClick={() =>
                            removeLanguage(index)
                          }
                          aria-label={`Remove ${item}`}
                        >
                          ×
                        </button>
                      )}

                    </div>
                  )
                )
              ) : (
                <p className="empty-profile-text">
                  No languages added yet.
                </p>
              )}
            </div>

            {editing && (
              <div className="add-tag-row">
                <input type="text"value={languageInput}
                  onChange={(e) =>
                    setLanguageInput(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLanguage();
                    }
                  }}
                  placeholder="e.g. English"
                />

                <button
                  type="button"
                  onClick={addLanguage}
                >
                  + Add
                </button>
              </div>
            )}
          </section>
        </div>
        <section className="profile-card practice-card">

          <div className="profile-card-heading">
            <div>
              <span className="card-eyebrow">PRACTICE MANAGEMENT  </span>
              <h2>Manage Your Practice </h2>
              <p>
                Quickly access the tools you use
                to manage your practice.
              </p>
            </div>
          </div>

          <div className="practice-settings">
            <Link
              to="/availability"
              className="practice-setting">
              <div className="practice-setting-icon">◷ </div>
              <div className="practice-setting-content">

                <h3>
                  Availability
                </h3>

                <p>
                  Set working days, hours and
                  available appointment slots.
                </p>

              </div>
              <span className="practice-setting-arrow"> →</span>
            </Link>

            <Link
              to="/appointments"
              className="practice-setting">

              <div className="practice-setting-icon"> ▣ </div>
              <div className="practice-setting-content">
                <h3> Appointments</h3>
                <p>
                  Review booking requests and
                  manage patient appointments.
                </p>
              </div>
              <span className="practice-setting-arrow">→ </span>

            </Link>

          </div>
        </section>
        <section className="profile-card public-profile-card">
          <div className="public-profile-info">
            <span className="card-eyebrow">
              PATIENT VIEW
            </span>
            <h2>
              Your Public Profile
            </h2>
            <p>
              See exactly what patients can view
              before they book an appointment
              with you.
            </p>
          </div>

          <Link
            to={
              profile.slug
                ? `/therapists/${profile.slug}`
                : "/therapists"
            }
            className="public-profile-btn"
          >
            View Public Profile
            <span>→</span>
          </Link>
        </section>
      </main>
    </div>
  );
}
export default Profile;
