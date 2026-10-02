import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [error, setError] = useState("");
  const [notesError, setNotesError] = useState("");
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "https://unfazed-692q.onrender.com/api/appointments/user",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load sessions");
        }

        setSessions(data.appointments || []);
      } catch (error) {
        console.error("Sessions error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    const fetchSharedNotes = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "https://unfazed-692q.onrender.com/api/session-notes/client/shared",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load shared notes"
          );
        }

        setNotes(data.notes || []);
      } catch (error) {
        console.error("Shared notes error:", error);
        setNotesError(error.message);
      } finally {
        setNotesLoading(false);
      }
    };

    fetchSharedNotes();
  }, []);

  const today = new Date();
  const upcomingSessions = sessions.filter(
    (session) => new Date(session.date) >= today
  );

  const pastSessions = sessions.filter(
    (session) => new Date(session.date) < today
  );

  return (
    <div className="my-sessions-page">
      <div className="my-sessions-header">
        <div>
          <span className="my-sessions-label">UNFAZED</span>
          <h1>My Sessions</h1>
          <p>
            Your appointments and shared session notes, all in one place.
          </p>
        </div>

        <Link to="/user-dashboard" className="my-sessions-back-btn">
          ← Dashboard
        </Link>
      </div>
      {loading && (
        <div className="my-sessions-message">
          <div className="my-sessions-loading"></div>
          <p>Loading your sessions...</p>
        </div>
      )}
      {!loading && error && (
        <div className="my-sessions-message my-sessions-error">
          <h3>Unable to load sessions</h3>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && (
        <section className="my-sessions-section">
          <div className="my-sessions-section-heading">
            <div>
              <h2>Upcoming Sessions</h2>
              <p>Your scheduled appointments</p>
            </div>
            <span className="my-sessions-count">
              {upcomingSessions.length}
            </span>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="my-sessions-empty">
              <div className="my-sessions-empty-icon">📅</div>
              <h3>No upcoming sessions</h3>
              <p>
                You don't have any scheduled sessions yet.
              </p>

              <Link
                to="/therapists"
                className="my-sessions-primary-btn"
              >
                Find a Therapist
              </Link>
            </div>
          ) : (
            <div className="my-sessions-list">
              {upcomingSessions.map((session) => (
                <div
                  className="my-session-card"
                  key={session._id}
                >
                  <div className="my-session-date">
                    <span>
                      {new Date(session.date).toLocaleDateString(
                        "en-US",
                        { month: "short" }
                      )}
                    </span>

                    <strong>
                      {new Date(session.date).getDate()}
                    </strong>
                  </div>

                  <div className="my-session-info">
                    <h3>
                      {session.therapist?.name || "Therapist"}
                    </h3>

                    <p>
                      {new Date(session.date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>

                    <span className="my-session-time">
                      {session.time || "Time not available"}
                    </span>
                  </div>

                  <span
                    className={`my-session-status ${session.status}`}
                  >
                    {session.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {!loading &&
        !error &&
        pastSessions.length > 0 && (
          <section className="my-sessions-section">

            <div className="my-sessions-section-heading">
              <div>
                <h2>Past Sessions</h2>
                <p>Your previous appointments</p>
              </div>

              <span className="my-sessions-count">
                {pastSessions.length}
              </span>
            </div>

            <div className="my-sessions-list">
              {pastSessions.map((session) => (
                <div
                  className="my-session-card past"
                  key={session._id}
                >
                  <div className="my-session-date">
                    <span>
                      {new Date(session.date).toLocaleDateString(
                        "en-US",
                        { month: "short" }
                      )}
                    </span>

                    <strong>
                      {new Date(session.date).getDate()}
                    </strong>
                  </div>

                  <div className="my-session-info">
                    <h3>
                      {session.therapist?.name || "Therapist"}
                    </h3>

                    <p>
                      {new Date(session.date).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>

                    <span className="my-session-time">
                      {session.time || "Time not available"}
                    </span>
                  </div>

                  <span
                    className={`my-session-status ${session.status}`}
                  >
                    {session.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      <section className="my-sessions-notes">

        <div className="my-sessions-section-heading">
          <div>
            <h2>Shared Session Notes</h2>
            <p>Notes your therapist has shared with you</p>
          </div>
          <span className="my-sessions-count">
            {notes.length}
          </span>
        </div>
        {notesLoading && (
          <div className="my-sessions-notes-message">
            Loading shared notes...
          </div>
        )}
        {!notesLoading && notesError && (
          <div className="my-sessions-notes-message">
            {notesError}
          </div>
        )}

        {!notesLoading &&
          !notesError &&
          notes.length === 0 && (
            <div className="my-sessions-notes-empty">
              <span>📝</span>

              <div>
                <h3>No shared notes yet</h3>

                <p>
                  Your therapist has not shared any session
                  notes with you yet.
                </p>
              </div>
            </div>
          )}

        {!notesLoading &&
          !notesError &&
          notes.length > 0 && (
            <div className="my-session-notes-list">
              {notes.map((note) => (
                <div
                  className="my-session-note"
                  key={note._id}
                >
                  <div className="my-session-note-top">
                    <div>
                      <h3>
                        {note.title || "Session Note"}
                      </h3>

                      <p>
                        {new Date(
                          note.sessionDate
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <span>
                      {note.therapist?.name || "Therapist"}
                    </span>
                  </div>

                  <div className="my-session-note-content"
                    className="my-session-note-content"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  ></div>
                </div>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}
export default Sessions;
