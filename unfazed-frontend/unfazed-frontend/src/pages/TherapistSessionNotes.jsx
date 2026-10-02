import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
function TherapistSessionNotes() {
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState("");
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [noteType, setNoteType] = useState("private");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [appointmentsResponse, notesResponse] =
          await Promise.all([
            fetch(
              "https://unfazed-692q.onrender.com/api/appointments/therapist",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            ),

            fetch(
              "https://unfazed-692q.onrender.com/api/session-notes/therapist",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            ),
          ]);

        const appointmentsData =
          await appointmentsResponse.json();
        const notesData = await notesResponse.json();
        if (!appointmentsResponse.ok) {
          throw new Error(
            appointmentsData.message ||
              "Failed to load appointments"
          );
        }

        if (!notesResponse.ok) {
          throw new Error(
            notesData.message ||
              "Failed to load session notes"
          );
        }
        setAppointments(
          appointmentsData.appointments || []
        );

        setNotes(notesData.notes || []);
      } catch (error) {
        console.error(
          "Session notes loading error:",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAppointmentChange = (e) => {
    const appointmentId = e.target.value;
    setSelectedAppointment(appointmentId);
    setMessage("");
    setError("");
    const appointment = appointments.find(
      (item) => item._id === appointmentId
    );
    if (appointment) {
      const appointmentDate = new Date(
        appointment.date
      );
      const year =
        appointmentDate.getFullYear();
      const month = String(
        appointmentDate.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
        appointmentDate.getDate()
      ).padStart(2, "0");

      setSessionDate(
        `${year}-${month}-${day}`
      );
    }
  };

  const resetForm = () => {
    setSelectedAppointment("");
    setTitle("");
    setSessionDate("");
    setNoteType("private");
    setEditingNoteId(null);

    if (editor) {
      editor.commands.setContent("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!editor) {
      return;
    }

    const content = editor.getHTML();

    if (!selectedAppointment) {
      setError("Please select an appointment.");
      return;
    }
    if (!sessionDate) {
      setError("Please select a session date.");
      return;
    }
    if (editor.isEmpty) {
      setError("Please write the session note.");
      return;
    }

    const appointment = appointments.find(
      (item) => item._id === selectedAppointment
    );

    if (!appointment?.user?._id) {
      setError("Unable to identify the client.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const payload = {
        user: appointment.user._id,
        appointment: selectedAppointment,
        sessionDate,
        title: title.trim() || "Session Note",
        content,
        type: noteType,
      };

      const url = editingNoteId
        ? `https://unfazed-692q.onrender.com/api/session-notes/${editingNoteId}`
        : "https://unfazed-692q.onrender.com/api/session-notes";

      const response = await fetch(url, {
        method: editingNoteId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save session note"
        );
      }

      if (editingNoteId) {
        setNotes((previousNotes) =>
          previousNotes.map((note) =>
            note._id === editingNoteId
              ? data.note
              : note
          )
        );

        setMessage(
          "Session note updated successfully."
        );
      } else {
        setNotes((previousNotes) => [
          data.note,
          ...previousNotes,
        ]);

        setMessage(
          "Session note created successfully."
        );
      }

      resetForm();
    } catch (error) {
      console.error(
        "Save session note error:",
        error
      );

      setError(error.message);
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = (note) => {
    setEditingNoteId(note._id);

    setSelectedAppointment(
      note.appointment?._id || ""
    );

    setTitle(note.title || "");

    if (note.sessionDate) {
      const date = new Date(note.sessionDate);

      const year = date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
        date.getDate()
      ).padStart(2, "0");

      setSessionDate(
        `${year}-${month}-${day}`
      );
    }

    setNoteType(note.type || "private");

    if (editor) {
      editor.commands.setContent(
        note.content || ""
      );
    }

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (noteId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this session note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `https://unfazed-692q.onrender.com/api/session-notes/${noteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete session note"
        );
      }

      setNotes((previousNotes) =>
        previousNotes.filter(
          (note) => note._id !== noteId
        )
      );

      if (editingNoteId === noteId) {
        resetForm();
      }

      setMessage(
        "Session note deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete session note error:",
        error
      );

      setError(error.message);
    }
  };
  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };
  const getPreviewText = (html) => {
    const temporaryElement =
      document.createElement("div");

    temporaryElement.innerHTML = html || "";

    return (
      temporaryElement.textContent ||
      temporaryElement.innerText ||
      ""
    );
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-info">
          <h2>Loading session notes...</h2>
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
          <h1>Session Notes</h1>
          <p>
            Create and manage clinical session
            documentation.
          </p>
        </div>

        <Link
          to="/therapist-dashboard"
          className="dashboard-btn"
        >
          Back to Dashboard
        </Link>
      </div>
      {message && (
        <div className="session-note-message success">
          {message}
        </div>
      )}

      {error && (
        <div className="session-note-message error">
          {error}
        </div>
      )}
      <div className="session-note-editor-card">
        <div className="session-note-editor-header">
          <div>
            <p className="section-label">
              {editingNoteId
                ? "EDIT NOTE"
                : "NEW NOTE"}
            </p>

            <h2>
              {editingNoteId
                ? "Edit Session Note"
                : "Write Session Note"}
            </h2>
          </div>

          {editingNoteId && (
            <button
              type="button"
              className="session-note-cancel"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="session-note-form-grid">
            <div className="session-note-field">
              <label>
                Appointment
              </label>

              <select
                value={selectedAppointment}
                onChange={handleAppointmentChange}
              >
                <option value="">
                  Select appointment
                </option>

                {appointments.map(
                  (appointment) => (
                    <option
                      key={appointment._id}
                      value={appointment._id}
                    >
                      {appointment.user?.name ||
                        "Patient"}{" "}
                      —{" "}
                      {formatDate(
                        appointment.date
                      )}{" "}
                      —{" "}
                      {appointment.time || ""}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="session-note-field">
              <label>
                Session Date
              </label>

              <input
                type="date"
                value={sessionDate}
                onChange={(e) =>
                  setSessionDate(
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="session-note-form-grid">
            <div className="session-note-field">
              <label>
                Note Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="Session Note"
              />
            </div>

            <div className="session-note-field">
              <label>
                Visibility
              </label>

              <select
                value={noteType}
                onChange={(e) =>
                  setNoteType(e.target.value)
                }
              >
                <option value="private">
                  Private — Therapist only
                </option>

                <option value="shared">
                  Shared — Client can view
                </option>
              </select>
            </div>
          </div>

          <div className="session-note-field">
            <label>
              Session Note
            </label>

            <div className="tiptap-wrapper">
              {editor && (
                <div className="tiptap-toolbar">
                  <button
                    type="button"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .toggleBold()
                        .run()
                    }
                    className={
                      editor.isActive("bold")
                        ? "active"
                        : ""
                    }
                  >
                    B
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .toggleItalic()
                        .run()
                    }
                    className={
                      editor.isActive("italic")
                        ? "active"
                        : ""
                    }
                  >
                    I
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .toggleBulletList()
                        .run()
                    }
                    className={
                      editor.isActive(
                        "bulletList"
                      )
                        ? "active"
                        : ""
                    }
                  >
                    • List
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .toggleOrderedList()
                        .run()
                    }
                    className={
                      editor.isActive(
                        "orderedList"
                      )
                        ? "active"
                        : ""
                    }
                  >
                    1. List
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .toggleHeading({
                          level: 2,
                        })
                        .run()
                    }
                    className={
                      editor.isActive("heading", {
                        level: 2,
                      })
                        ? "active"
                        : ""
                    }
                  >
                    H2
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .undo()
                        .run()
                    }
                  >
                    ↶
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .redo()
                        .run()
                    }
                  >
                    ↷
                  </button>
                </div>
              )}

              <EditorContent editor={editor} />
            </div>
          </div>

          <div className="session-note-actions">
            <button
              type="submit"
              className="dashboard-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingNoteId
                ? "Update Note"
                : "Save Session Note"}
            </button>

            {editingNoteId && (
              <button
                type="button"
                className="session-note-secondary"
                onClick={resetForm}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="session-notes-section">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">
              DOCUMENTATION
            </p>

            <h2>
              Your Session Notes
            </h2>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="dashboard-info">
            <h2>No session notes yet</h2>

            <p>
              Your saved session notes will
              appear here.
            </p>
          </div>
        ) : (
          <div className="session-notes-list">
            {notes.map((note) => (
              <div
                className="session-note-card"
                key={note._id}
              >
                <div className="session-note-header">
                  <div>
                    <h3>
                      {note.title ||
                        "Session Note"}
                    </h3>

                    <p>
                      {formatDate(
                        note.sessionDate
                      )}{" "}
                      ·{" "}
                      {note.type === "shared"
                        ? "Shared with client"
                        : "Private"}
                    </p>
                  </div>

                  <div className="session-note-actions-small">
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(note)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(note._id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="session-note-content">
                  <p>
                    {getPreviewText(
                      note.content
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default TherapistSessionNotes;
