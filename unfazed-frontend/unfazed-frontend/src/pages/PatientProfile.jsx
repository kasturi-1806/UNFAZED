import React, { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";
function PatientProfile() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [intakeForm, setIntakeForm] = useState(null);
  const [sessionNotes, setSessionNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [intakeLoading, setIntakeLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState("");
  const [intakeError, setIntakeError] = useState("");
  const [notesError, setNotesError] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({
    sessionDate: new Date().toISOString().split("T")[0],
    title: "",
    content: "",
  });

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login as a therapist first.");
          setLoading(false);
          setIntakeLoading(false);
          setNotesLoading(false);
          return;
        }

        const response = await fetch(
          `https://unfazed-692q.onrender.com/api/clients/${patientId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const patientData = await response.json();

        console.log(
          "PATIENT API:",
          response.status,
          patientData
        );

        if (!response.ok) {
          throw new Error(
            patientData.message ||
              "Failed to fetch patient"
          );
        }

        const client = patientData.client;

        if (!client) {
          throw new Error("Patient data not found");
        }

        setPatient(client);

        const userId =
          client.user?._id ||
          client.user?.id ||
          client.user;

        console.log("CLIENT:", client);
        console.log("USER ID:", userId);

        if (!userId) {
          setIntakeError(
            "Patient user ID is not available."
          );
          setIntakeLoading(false);
        } else {
          try {
            const intakeResponse = await fetch(
              `https://unfazed-692q.onrender.com/api/intake/patient/${userId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const intakeData =
              await intakeResponse.json();

            console.log(
              "INTAKE API:",
              intakeResponse.status,
              intakeData
            );

            if (!intakeResponse.ok) {
              throw new Error(
                intakeData.message ||
                  "Failed to fetch intake form"
              );
            }

            setIntakeForm(
              intakeData.intakeForm || null
            );
          } catch (intakeErr) {
            console.error(
              "Fetch intake form error:",
              intakeErr
            );

            setIntakeError(intakeErr.message);
          } finally {
            setIntakeLoading(false);
          }
        }

        try {
          const appointmentsResponse =
            await fetch(
              `https://unfazed-692q.onrender.com/api/appointments/patient/${patientId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          const appointmentsData =
            await appointmentsResponse.json();

          console.log(
            "APPOINTMENTS API:",
            appointmentsResponse.status,
            appointmentsData
          );

          if (!appointmentsResponse.ok) {
            throw new Error(
              appointmentsData.message ||
                "Failed to fetch patient appointments"
            );
          }

          setAppointments(
            appointmentsData.appointments || []
          );
        } catch (appointmentErr) {
          console.error(
            "Fetch appointments error:",
            appointmentErr
          );

          setAppointments([]);
        }

        if (!userId) {
          setNotesError(
            "Patient user ID is not available."
          );

          setNotesLoading(false);
        } else {
          try {
            const notesResponse = await fetch(
              `https://unfazed-692q.onrender.com/api/session-notes/patient/${userId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const notesData =
              await notesResponse.json();

            console.log(
              "SESSION NOTES API:",
              notesResponse.status,
              notesData
            );

            if (!notesResponse.ok) {
              throw new Error(
                notesData.message ||
                  "Failed to fetch session notes"
              );
            }

            setSessionNotes(
              notesData.sessionNotes || []
            );
          } catch (notesErr) {
            console.error(
              "Fetch session notes error:",
              notesErr
            );

            setNotesError(notesErr.message);
          } finally {
            setNotesLoading(false);
          }
        }
      } catch (err) {
        console.error(
          "Fetch patient error:",
          err
        );

        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  const handleNoteChange = (e) => {
    const { name, value } = e.target;

    setNoteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setNotesError(
        "Please login as a therapist first."
      );
      return;
    }

    if (!noteForm.sessionDate) {
      setNotesError("Please select a session date.");
      return;
    }

    if (!noteForm.content.trim()) {
      setNotesError("Please enter the session note.");
      return;
    }

    try {
      setSavingNote(true);
      setNotesError("");

      const userId =
        patient.user?._id ||
        patient.user?.id ||
        patient.user;

      if (!userId) {
        throw new Error(
          "Patient user ID is not available."
        );
      }

      const response = await fetch(
        "https://unfazed-692q.onrender.com/api/session-notes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            sessionDate: noteForm.sessionDate,
            title:
              noteForm.title.trim() ||
              "Session Note",
            content: noteForm.content.trim(),
          }),
        }
      );

      const data = await response.json();

      console.log(
        "CREATE SESSION NOTE API:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create session note"
        );
      }

      setSessionNotes((prev) => [
        data.sessionNote,
        ...prev,
      ]);

      setNoteForm({
        sessionDate:
          new Date().toISOString().split("T")[0],
        title: "",
        content: "",
      });

      setShowNoteForm(false);
    } catch (err) {
      console.error(
        "Save session note error:",
        err
      );

      setNotesError(err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (time) => {
    if (!time) {
      return "Not available";
    }

    const [hours, minutes] = time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments =
    appointments.filter((appointment) => {
      const appointmentDate = new Date(
        appointment.date
      );

      appointmentDate.setHours(0, 0, 0, 0);

      return appointmentDate >= today;
    });

  const previousAppointments =
    appointments.filter((appointment) => {
      const appointmentDate = new Date(
        appointment.date
      );

      appointmentDate.setHours(0, 0, 0, 0);

      return appointmentDate < today;
    });

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-info">
          <h2>Loading Patient...</h2>

          <p>
            Please wait while we load the patient
            information.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-info">
          <h2>Unable to Load Patient</h2>

          <p>{error}</p>

          <Link
            to="/patients"
            className="dashboard-btn"
          >
            Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-info">
          <h2>Patient Not Found</h2>

          <Link
            to="/patients"
            className="dashboard-btn"
          >
            Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="section-label">
            UNFAZED
          </p>

          <h1>
            {patient.user?.name ||
              "Unnamed Patient"}
          </h1>

          <p>
            View patient information, intake details,
            and session history.
          </p>
        </div>

        <Link
          to="/patients"
          className="dashboard-logout"
        >
          Back to Patients
        </Link>
      </div>

      <div className="dashboard-card">
        <div className="availability-section-header">
          <div>
            <h2>Patient Information</h2>

            <p>
              Basic information about this patient.
            </p>
          </div>
        </div>

        <div className="patient-profile-grid">
          <div>
            <p>Name</p>

            <strong>
              {patient.user?.name ||
                "Not available"}
            </strong>
          </div>

          <div>
            <p>Email</p>

            <strong>
              {patient.user?.email ||
                "Not available"}
            </strong>
          </div>

          <div>
            <p>Status</p>

            <strong>
              {patient.status === "active"
                ? "Active"
                : "Inactive"}
            </strong>
          </div>

          <div>
            <p>Last Session</p>

            <strong>
              {patient.lastSessionAt
                ? formatDate(
                    patient.lastSessionAt
                  )
                : "No sessions yet"}
            </strong>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="availability-section-header">
          <div>
            <h2>Intake Form</h2>

            <p>
              Information submitted by the patient
              during intake.
            </p>
          </div>
        </div>

        {intakeLoading && (
          <div className="dashboard-info">
            <h3>Loading Intake Form...</h3>

            <p>
              Please wait while we load the
              patient's intake information.
            </p>
          </div>
        )}

        {!intakeLoading && intakeError && (
          <div className="dashboard-info">
            <h3>Unable to Load Intake Form</h3>

            <p>{intakeError}</p>
          </div>
        )}

        {!intakeLoading &&
          !intakeError &&
          !intakeForm && (
            <div className="dashboard-info">
              <h3>No Intake Form</h3>

              <p>
                This patient has not submitted an
                intake form yet.
              </p>
            </div>
          )}

        {!intakeLoading &&
          !intakeError &&
          intakeForm && (
            <div className="patient-profile-grid">
              <div>
                <p>Full Name</p>

                <strong>
                  {intakeForm.fullName ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <p>Age</p>

                <strong>
                  {intakeForm.age ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <p>Phone</p>

                <strong>
                  {intakeForm.phone ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <p>Occupation</p>

                <strong>
                  {intakeForm.occupation ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <p>Reason for Seeking Help</p>

                <strong>
                  {intakeForm.reasonForSeekingHelp ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <p>Previous Therapy</p>

                <strong>
                  {intakeForm.previousTherapy
                    ? "Yes"
                    : "No"}
                </strong>
              </div>

              {intakeForm.previousTherapy && (
                <div>
                  <p>Previous Therapy Details</p>

                  <strong>
                    {intakeForm.previousTherapyDetails ||
                      "Not provided"}
                  </strong>
                </div>
              )}

              <div>
                <p>Current Medications</p>

                <strong>
                  {intakeForm.currentMedications ||
                    "None provided"}
                </strong>
              </div>

              <div>
                <p>Emergency Contact</p>

                <strong>
                  {intakeForm.emergencyContactName ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <p>Emergency Contact Phone</p>

                <strong>
                  {intakeForm.emergencyContactPhone ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <p>Submitted On</p>

                <strong>
                  {intakeForm.submittedAt
                    ? formatDate(
                        intakeForm.submittedAt
                      )
                    : "Not available"}
                </strong>
              </div>

              <div className="patient-profile-wide">
                <p>Current Concerns</p>

                <strong>
                  {intakeForm.currentConcerns ||
                    "Not provided"}
                </strong>
              </div>
            </div>
          )}
      </div>

      <div className="dashboard-card">
        <div className="availability-section-header">
          <div>
            <h2>Presenting Concern</h2>

            <p>
              Main concern associated with this
              patient.
            </p>
          </div>
        </div>

        <div className="patient-concern">
          <p>
            {patient.presentingConcern ||
              intakeForm?.currentConcerns ||
              "No presenting concern recorded."}
          </p>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="availability-section-header">
          <div>
            <h2>Patient Tags</h2>

            <p>
              Tags associated with this patient.
            </p>
          </div>
        </div>

        <div className="patient-tags">
          {patient.tags &&
          patient.tags.length > 0 ? (
            patient.tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="patient-tag"
              >
                {tag}
              </span>
            ))
          ) : (
            <p>No tags added yet.</p>
          )}
        </div>
      </div>

      <div className="dashboard-card">
        <div className="availability-section-header">
          <div>
            <h2>Session Notes</h2>

            <p>
              Private notes recorded by you for this
              patient's sessions.
            </p>
          </div>

          {!showNoteForm && (
            <button
              type="button"
              className="dashboard-btn"
              onClick={() => {
                setShowNoteForm(true);
                setNotesError("");
              }}
            >
              + Add Session Note
            </button>
          )}
        </div>

        {showNoteForm && (
          <form
            onSubmit={handleSaveNote}
            className="session-note-form"
          >
            <div className="session-note-form-grid">
              <div>
                <label htmlFor="sessionDate">
                  Session Date
                </label>

                <input
                  id="sessionDate"
                  name="sessionDate"
                  type="date"
                  value={noteForm.sessionDate}
                  onChange={handleNoteChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="title">
                  Note Title
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  value={noteForm.title}
                  onChange={handleNoteChange}
                  placeholder="e.g. Initial Session"
                  maxLength="100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="content">
                Session Note
              </label>

              <textarea
                id="content"
                name="content"
                value={noteForm.content}
                onChange={handleNoteChange}
                placeholder="Write your private session notes here..."
                rows="7"
                required
              />
            </div>

            {notesError && (
              <p className="form-error">
                {notesError}
              </p>
            )}

            <div className="session-note-actions">
              <button
                type="button"
                className="dashboard-logout"
                onClick={() => {
                  setShowNoteForm(false);

                  setNoteForm({
                    sessionDate:
                      new Date()
                        .toISOString()
                        .split("T")[0],
                    title: "",
                    content: "",
                  });

                  setNotesError("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="dashboard-btn"
                disabled={savingNote}
              >
                {savingNote
                  ? "Saving..."
                  : "Save Session Note"}
              </button>
            </div>
          </form>
        )}

        {!showNoteForm &&
          notesError && (
            <div className="dashboard-info">
              <h3>
                Unable to Load Session Notes
              </h3>

              <p>{notesError}</p>
            </div>
          )}

        {notesLoading && (
          <div className="dashboard-info">
            <h3>Loading Session Notes...</h3>

            <p>
              Please wait while we load the patient's
              session notes.
            </p>
          </div>
        )}

        {!notesLoading &&
          !notesError &&
          sessionNotes.length === 0 &&
          !showNoteForm && (
            <div className="dashboard-info">
              <h3>No Session Notes Yet</h3>

              <p>
                Add your first private session note for
                this patient.
              </p>
            </div>
          )}

        {!notesLoading &&
          sessionNotes.length > 0 && (
            <div className="session-notes-list">
              {sessionNotes.map((note) => (
                <div
                  key={note._id}
                  className="session-note-card"
                >
                  <div className="session-note-header">
                    <div>
                      <h3>
                        {note.title ||
                          "Session Note"}
                      </h3>

                      <p>
                        {note.sessionDate
                          ? formatDate(
                              note.sessionDate
                            )
                          : "Date not available"}
                      </p>
                    </div>
                  </div>

                  <div className="session-note-content">
                    <p>
                      {note.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <div className="dashboard-card">
        <div className="availability-section-header">
          <div>
            <h2>Session History</h2>

            <p>
              Previous and upcoming sessions
              with this patient.
            </p>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="dashboard-info">
            <h3>No Sessions Yet</h3>

            <p>
              There are no appointments recorded
              for this patient.
            </p>
          </div>
        ) : (
          <div className="session-history">
            {upcomingAppointments.length > 0 && (
              <div className="session-history-section">
                <h3 className="session-history-title">
                  Upcoming Sessions
                </h3>

                <div className="patients-list">
                  {upcomingAppointments.map(
                    (appointment) => (
                      <div
                        key={appointment._id}
                        className="patient-card"
                      >
                        <div>
                          <p>Date</p>

                          <strong>
                            {formatDate(
                              appointment.date
                            )}
                          </strong>
                        </div>

                        <div>
                          <p>Time</p>

                          <strong>
                            {formatTime(
                              appointment.time
                            )}
                          </strong>
                        </div>

                        <div>
                          <p>Status</p>

                          <strong className="appointment-status">
                            {appointment.status
                              ? appointment.status
                                  .charAt(0)
                                  .toUpperCase() +
                                appointment.status.slice(
                                  1
                                )
                              : "Unknown"}
                          </strong>
                        </div>

                        <div>
                          <p>Duration</p>

                          <strong>
                            {appointment.duration
                              ? `${appointment.duration} min`
                              : "Not available"}
                          </strong>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {previousAppointments.length > 0 && (
              <div className="session-history-section">
                <h3 className="session-history-title">
                  Previous Sessions
                </h3>

                <div className="patients-list">
                  {previousAppointments.map(
                    (appointment) => (
                      <div
                        key={appointment._id}
                        className="patient-card"
                      >
                        <div>
                          <p>Date</p>

                          <strong>
                            {formatDate(
                              appointment.date
                            )}
                          </strong>
                        </div>

                        <div>
                          <p>Time</p>

                          <strong>
                            {formatTime(
                              appointment.time
                            )}
                          </strong>
                        </div>

                        <div>
                          <p>Status</p>

                          <strong className="appointment-status">
                            {appointment.status
                              ? appointment.status
                                  .charAt(0)
                                  .toUpperCase() +
                                appointment.status.slice(
                                  1
                                )
                              : "Unknown"}
                          </strong>
                        </div>

                        <div>
                          <p>Duration</p>

                          <strong>
                            {appointment.duration
                              ? `${appointment.duration} min`
                              : "Not available"}
                          </strong>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientProfile;

