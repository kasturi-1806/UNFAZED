import { useEffect, useState } from "react";
const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://unfazed-692q.onrender.com";

const AdminTherapists = () => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingTherapist, setCreatingTherapist] = useState(false);
  const [createError, setCreateError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    slug: "",
    bio: "",
    specializations: "",
    languages: "",
  });

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const token = localStorage.getItem("adminToken");

        if (!token) {
          window.location.href = "/admin/login";
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/admin/therapists`,
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
            data.message || "Failed to fetch therapists"
          );
        }

        const therapistsWithProfileData = await Promise.all(
          (data.therapists || []).map(async (therapist) => {
            try {
              if (!therapist.slug) {
                return therapist;
              }

              const profileResponse = await fetch(
                `${API_BASE_URL}/api/therapists/${therapist.slug}`
              );

              const profileData =
                await profileResponse.json();

              if (
                profileResponse.ok &&
                profileData.success &&
                profileData.therapist
              ) {
                return {
                  ...therapist,
                  specializations:
                    profileData.therapist.specializations ||
                    [],
                  languages:
                    profileData.therapist.languages || [],
                };
              }

              return therapist;
            } catch (profileError) {
              console.error(
                "Failed to fetch therapist profile:",
                profileError
              );

              return therapist;
            }
          })
        );

        setTherapists(therapistsWithProfileData);
      } catch (error) {
        console.error(
          "Admin therapists error:",
          error
        );

        setError(
          error.message || "Failed to load therapists"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createTherapist = async (event) => {
    event.preventDefault();

    setCreateError("");

    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      setCreatingTherapist(true);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/therapists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create therapist"
        );
      }
const newTherapist = {
  ...data.therapist,
  _id: data.therapist._id || data.therapist.id,
};

setTherapists((prev) => [
  newTherapist,
  ...prev,
]);
      setFormData({
        name: "",
        email: "",
        password: "",
        slug: "",
        bio: "",
        specializations: "",
        languages: "",
      });

      setShowCreateForm(false);

      alert(
        "Therapist created successfully. Assign the therapist code from the table."
      );
    } catch (error) {
      console.error(
        "Create therapist error:",
        error
      );

      setCreateError(
        error.message || "Failed to create therapist"
      );
    } finally {
      setCreatingTherapist(false);
    }
  };

  const assignTherapistCode = async (therapistId) => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/therapists/${therapistId}/code`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to assign therapist code"
        );
      }

      setTherapists((prev) =>
        prev.map((therapist) =>
          therapist._id === therapistId
            ? {
                ...therapist,
                therapistCode:
                  data.therapist.therapistCode,
              }
            : therapist
        )
      );

      alert(
        `Therapist code assigned: ${data.therapist.therapistCode}`
      );
    } catch (error) {
      console.error(
        "Assign therapist code error:",
        error
      );

      alert(
        error.message ||
          "Failed to assign therapist code"
      );
    }
  };

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
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
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
              Therapist Management
            </h1>

            <p
              style={{
                marginTop: "8px",
                color: "#315f51",
              }}
            >
              View and manage all therapists registered
              on UNFAZED.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => {
                setShowCreateForm((prev) => !prev);
                setCreateError("");
              }}
              style={{
                padding: "11px 18px",
                border: "none",
                borderRadius: "9px",
                background: "#203d35",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              {showCreateForm
                ? "Cancel"
                : "+ Create Therapist"}
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/admin/dashboard";
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
        </div>

        {showCreateForm && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dfeae3",
              borderRadius: "16px",
              padding: "25px",
              marginBottom: "25px",
            }}
          >
            <h2
              style={{
                margin: "0 0 6px",
                fontSize: "22px",
              }}
            >
              Create New Therapist
            </h2>

            <p
              style={{
                margin: "0 0 20px",
                color: "#315f51",
                fontSize: "14px",
              }}
            >
              Create the therapist account first. After
              creation, assign the therapist code from
              the therapist list.
            </p>

            {createError && (
              <div
                style={{
                  background: "#fde8e8",
                  color: "#b42318",
                  padding: "12px",
                  borderRadius: "10px",
                  marginBottom: "18px",
                }}
              >
                {createError}
              </div>
            )}

            <form onSubmit={createTherapist}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "18px",
                }}
              >
                <div>
                  <label style={labelStyle}>
                    Therapist Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Dr. Rahul Sharma"
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="therapist@example.com"
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Password *
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder="Enter password"
                    required
                    minLength={6}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Slug
                  </label>

                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleFormChange}
                    placeholder="Leave empty to generate from name"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Specializations
                  </label>

                  <input
                    type="text"
                    name="specializations"
                    value={formData.specializations}
                    onChange={handleFormChange}
                    placeholder="Anxiety, Depression, Stress"
                    style={inputStyle}
                  />

                  <small
                    style={{
                      display: "block",
                      marginTop: "6px",
                      color: "#6b7d76",
                    }}
                  >
                    Separate multiple items with commas.
                  </small>
                </div>

                <div>
                  <label style={labelStyle}>
                    Languages
                  </label>

                  <input
                    type="text"
                    name="languages"
                    value={formData.languages}
                    onChange={handleFormChange}
                    placeholder="English, Hindi, Marathi"
                    style={inputStyle}
                  />

                  <small
                    style={{
                      display: "block",
                      marginTop: "6px",
                      color: "#6b7d76",
                    }}
                  >
                    Separate multiple languages with commas.
                  </small>
                </div>
              </div>

              <div style={{ marginTop: "18px" }}>
                <label style={labelStyle}>
                  Bio
                </label>

                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleFormChange}
                  placeholder="Short professional bio"
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "22px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="submit"
                  disabled={creatingTherapist}
                  style={{
                    padding: "12px 22px",
                    border: "none",
                    borderRadius: "9px",
                    background: creatingTherapist
                      ? "#9bb5aa"
                      : "#315f51",
                    color: "#ffffff",
                    cursor: creatingTherapist
                      ? "not-allowed"
                      : "pointer",
                    fontWeight: "600",
                  }}
                >
                  {creatingTherapist
                    ? "Creating..."
                    : "Create Therapist"}
                </button>
              </div>
            </form>
          </div>
        )}

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
            Loading therapists...
          </div>
        )}

        {!loading &&
          !error &&
          therapists.length === 0 && (
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
              No therapists found.

              <div
                style={{
                  marginTop: "15px",
                  fontSize: "14px",
                  color: "#6b7d76",
                }}
              >
                Click "+ Create Therapist" above to add
                the first therapist.
              </div>
            </div>
          )}

        {!loading &&
          !error &&
          therapists.length > 0 && (
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
                  borderBottom:
                    "1px solid #dfeae3",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                  }}
                >
                  Registered Therapists
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#315f51",
                    fontSize: "14px",
                  }}
                >
                  Total: {therapists.length}
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
                    minWidth: "900px",
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
                      <th style={headerStyle}>Subscription Tier</th>
                      <th style={headerStyle}>
                        Specializations
                      </th>
                      <th style={headerStyle}>
                        Languages
                      </th>
                      <th style={headerStyle}>Slug</th>
                      <th style={headerStyle}>
                        Therapist Code
                      </th>
                      <th style={headerStyle}>Joined</th>
                    </tr>
                  </thead>

                  <tbody>
                    {therapists.map((therapist) => (
                      <tr key={therapist._id}>
                        <td style={cellStyle}>
                          {therapist.name || "—"}
                        </td>

                        <td style={cellStyle}>
                          {therapist.email || "—"}
                        </td>
                        <td style={cellStyle}>
                          {therapist.subscriptionTier?.name || "Not assigned"}
                        </td>
                        <td style={cellStyle}>
                          {therapist.specializations?.length
                            ? therapist.specializations.join(
                                ", "
                              )
                            : "—"}
                        </td>

                        <td style={cellStyle}>
                          {therapist.languages?.length
                            ? therapist.languages.join(
                                ", "
                              )
                            : "—"}
                        </td>

                        <td style={cellStyle}>
                          {therapist.slug || "—"}
                        </td>

                        <td style={cellStyle}>
                          {therapist.therapistCode ? (
                            <span
                              style={{
                                display:
                                  "inline-block",
                                padding: "6px 10px",
                                background:
                                  "#dfeae3",
                                borderRadius: "6px",
                                fontWeight: "700",
                                color: "#203d35",
                                letterSpacing:
                                  "0.5px",
                              }}
                            >
                              {
                                therapist.therapistCode
                              }
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                assignTherapistCode(
                                  therapist._id
                                )
                              }
                              style={{
                                padding: "8px 12px",
                                border: "none",
                                borderRadius: "7px",
                                background:
                                  "#315f51",
                                color: "#ffffff",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "13px",
                              }}
                            >
                              Assign Code
                            </button>
                          )}
                        </td>

                        <td style={cellStyle}>
                          {therapist.createdAt
                            ? new Date(
                                therapist.createdAt
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

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontSize: "14px",
  fontWeight: "600",
  color: "#203d35",
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #cbd9d2",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#203d35",
  background: "#ffffff",
  boxSizing: "border-box",
  outline: "none",
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
export default AdminTherapists;

