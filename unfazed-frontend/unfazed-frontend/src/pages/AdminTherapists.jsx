import { useEffect, useState } from "react";
const AdminTherapists = () => {
const [therapists, setTherapists] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          window.location.href = "/admin/login";
          return;
        }
        const response = await fetch(
          "http://localhost:5000/api/admin/therapists",
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
                `http://localhost:5000/api/therapists/${therapist.slug}`
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
  const assignTherapistCode = async (therapistId) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        window.location.href = "/admin/login";
        return;
      }
      const response = await fetch(
        `http://localhost:5000/api/admin/therapists/${therapistId}/code`,
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
              View all therapists registered on UNFAZED.
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
                  borderBottom: "1px solid #dfeae3",
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
                          {therapist.specializations?.length
                            ? therapist.specializations.join(", ")
                            : "—"}
                        </td>
                        <td style={cellStyle}>
                          {therapist.languages?.length
                            ? therapist.languages.join(", ")
                            : "—"}
                        </td>
                        <td style={cellStyle}>
                          {therapist.slug || "—"}
                        </td>
                        <td style={cellStyle}>
                          {therapist.therapistCode ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "6px 10px",
                                background: "#dfeae3",
                                borderRadius: "6px",
                                fontWeight: "700",
                                color: "#203d35",
                                letterSpacing: "0.5px",
                              }}
                            >
                              {therapist.therapistCode}
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
                                background: "#315f51",
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
