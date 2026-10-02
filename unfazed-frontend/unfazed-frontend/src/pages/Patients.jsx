import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login as a therapist first.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/clients",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch patients"
          );
        }

        setPatients(data.clients || []);
      } catch (err) {
        console.error("Fetch patients error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="section-label">UNFAZED</p>

          <h1>Patients</h1>

          <p>
            Manage your patients and view their session details.
          </p>
        </div>

        <Link
          to="/therapist-dashboard"
          className="dashboard-logout"
        >
          Back to Dashboard
        </Link>
      </div>

      {loading && (
        <div className="dashboard-info">
          <h2>Loading Patients...</h2>
          <p>Please wait while we load your patient list.</p>
        </div>
      )}

      {!loading && error && (
        <div className="dashboard-info">
          <h2>Unable to Load Patients</h2>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && patients.length === 0 && (
        <div className="dashboard-info">
          <h2>No Patients Yet</h2>

          <p>
            Patients who connect with you will appear here.
          </p>
        </div>
      )}

      {!loading && !error && patients.length > 0 && (
        <div className="dashboard-card">
          <div className="availability-section-header">
            <div>
              <h2>Your Patients</h2>

              <p>
                {patients.length}{" "}
                {patients.length === 1
                  ? "patient"
                  : "patients"}{" "}
                connected with you.
              </p>
            </div>
          </div>

          <div className="patients-list">
            {patients.map((patient) => {
              const patientId = patient.user?._id;

              return (
                <div
                  key={patient._id}
                  className="patient-card"
                >
                  <div>
                    <h3>
                      {patient.user?.name || "Unnamed Patient"}
                    </h3>

                    <p>
                      {patient.user?.email ||
                        "No email available"}
                    </p>
                  </div>

                  <div>
                    <span>
                      {patient.status === "active"
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <div>
                    <p>
                      Last Session
                    </p>

                    <strong>
                      {patient.lastSessionAt
                        ? new Date(
                            patient.lastSessionAt
                          ).toLocaleDateString()
                        : "No sessions yet"}
                    </strong>
                  </div>

                  <div>
                    <Link
                      to={`/patients/${patient._id}`}
                      className="dashboard-btn"
                    >
                      View Patient
                    </Link>

                    {patientId && (
                      <Link
                        to={`/chat/user/${patientId}`}
                        className="dashboard-btn"
                        style={{
                          marginLeft: "10px",
                        }}
                      >
                        Chat
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;