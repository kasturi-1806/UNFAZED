import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/appointments/therapist",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setAppointments(data.appointments || []);
      } else {
        console.error(
          data.message || "Failed to fetch appointments"
        );
      }
    } catch (error) {
      console.error(
        "Error fetching appointments:",
        error
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAppointments();
  }, []);
  const formatDate = (date) => {
    if (!date) {
      return "Date not available";
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
      return "Time not available";
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
  const updateStatus = async (
    appointmentId,
    status
  ) => {
    try {
      const token = localStorage.getItem("token");
      setUpdatingId(appointmentId);
      const response = await fetch(
        `http://localhost:5000/api/appointments/${appointmentId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(
          data.message ||
            "Failed to update appointment"
        );

        return;
      }
      setAppointments(
        (previousAppointments) =>
          previousAppointments.map(
            (appointment) =>
              appointment._id === appointmentId
                ? {
                    ...appointment,
                    status:
                      data.appointment?.status ||
                      status,
                  }
                : appointment
          )
      );
    } catch (error) {
      console.error(
        "Update appointment error:",
        error
      );
      alert(
        "Unable to update appointment"
      );
    } finally {
      setUpdatingId(null);
    }
  };
  const handleConfirm = (appointmentId) => {
    updateStatus(
      appointmentId,
      "confirmed"
    );
  };
  const handleCancel = (appointmentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );
    if (!confirmed) {
      return;
    }
    updateStatus(
      appointmentId,
      "cancelled"
    );
  };
  const handleStartSession = (
    appointmentId
  ) => {
    updateStatus(
      appointmentId,
      "in-session"
    );
  };
  const handleComplete = (
    appointmentId
  ) => {
    updateStatus(
      appointmentId,
      "completed"
    );
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAppointments =
    appointments.filter(
      (appointment) => {
        const appointmentDate =
          new Date(
            appointment.date
          );
        appointmentDate.setHours(
          0,
          0,
          0,
          0
        );
        return appointmentDate >= today;
      }
    );
  const pastAppointments =
    appointments.filter(
      (appointment) => {
        const appointmentDate =
          new Date(
            appointment.date
          );
        appointmentDate.setHours(
          0,
          0,
          0,
          0
        );
        return appointmentDate < today;
      }
    );
  const getStatusLabel = (status) => {
    if (!status) {
      return "Unknown";
    }
    return status
      .split("-")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  };
  const getStatusClass = (status) => {
    switch (status) {
      case "confirmed":
        return "appointment-status confirmed";
      case "cancelled":
        return "appointment-status cancelled";
      case "completed":
        return "appointment-status completed";
      case "in-session":
        return "appointment-status in-session";
      case "pending":
      default:
        return "appointment-status pending";
    }
  };
  const renderAppointment = (
    appointment
  ) => {
    const isUpdating =
      updatingId === appointment._id;
    return (
      <div
        className="appointment-card"
        key={appointment._id}>
        <div className="appointment-card-header">
          <div>
            <p className="appointment-label">
              Patient
            </p>
            <h2>
              {appointment.user?.name ||
                "Client"}
            </h2>
            {appointment.user?.email && (
              <p className="appointment-email">
                {appointment.user.email}
              </p>
            )}
          </div>
          <span
            className={getStatusClass(
              appointment.status
            )}
          >
            {getStatusLabel(
              appointment.status
            )}
          </span>

        </div>
        <div className="appointment-details">
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
            <p>Duration</p>
            <strong>
              {appointment.duration
                ? `${appointment.duration} min`
                : "50 min"}
            </strong>
          </div>
        </div>
        <div className="appointment-actions">
          {appointment.status ===
            "pending" && (
            <>
              <button
                type="button"
                className="dashboard-btn"
                disabled={isUpdating}
                onClick={() =>
                  handleConfirm(
                    appointment._id
                  )
                }
              >
                {isUpdating
                  ? "Updating..."
                  : "Confirm"}
              </button>

              <button
                type="button"
                className="dashboard-outline-btn"
                disabled={isUpdating}
                onClick={() =>
                  handleCancel(
                    appointment._id
                  )
                }
              >
                Cancel
              </button>
            </>
          )}
          {appointment.status ===
            "confirmed" && (
            <>
              <button
                type="button"
                className="dashboard-btn"
                disabled={isUpdating}
                onClick={() =>
                  handleStartSession(
                    appointment._id
                  )
                }
              >
                {isUpdating
                  ? "Updating..."
                  : "Start Session"}
              </button>
              <button
                type="button"
                className="dashboard-outline-btn"
                disabled={isUpdating}
                onClick={() =>
                  handleCancel(
                    appointment._id
                  )
                }
              >
                Cancel
              </button>
            </>
          )}
          {appointment.status ===
            "in-session" && (
            <>
              <button
                type="button"
                className="dashboard-btn"
                disabled={isUpdating}
                onClick={() =>
                  handleComplete(
                    appointment._id
                  )
                }
              >
                {isUpdating
                  ? "Updating..."
                  : "Mark Completed"}
              </button>
              <p className="appointment-message">
                Session is currently in progress.
              </p>
            </>
          )}
          {appointment.status ===
            "completed" && (
            <p className="appointment-message">
              ✓ This session has been completed.
            </p>
          )}
          {appointment.status ===
            "cancelled" && (
            <p className="appointment-message cancelled-message">
              This appointment was cancelled.
            </p>
          )}
        </div>
      </div>
    );
  };
  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <p className="section-label">
              UNFAZED
            </p>
            <h1>
              Appointments
            </h1>
            <p>
              Loading your appointments...
            </p>
          </div>
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
            Appointments
          </h1>
          <p>
            Manage your upcoming therapy
            appointments.
          </p>
        </div>
        <Link
          to="/therapist-dashboard"
          className="dashboard-logout">
          Back to Dashboard
        </Link>
      </div>
      {appointments.length === 0 ? (
        <div className="dashboard-info">
          <h2>
            No Appointments
          </h2>
          <p>
            Your scheduled appointments
            will appear here.
          </p>
        </div>
      ) : (
        <>
          {upcomingAppointments.length >
            0 && (
            <div className="dashboard-card">
              <div className="availability-section-header">
                <div>
                  <h2>
                    Upcoming Appointments
                  </h2>
                  <p>
                    Manage your upcoming
                    therapy sessions.
                  </p>
                </div>
              </div>
              <div className="appointments-list">
                {upcomingAppointments.map(
                  (appointment) =>
                    renderAppointment(
                      appointment
                    )
                )}
              </div>
            </div>
          )}
          {pastAppointments.length >
            0 && (
            <div className="dashboard-card">
              <div className="availability-section-header">
                <div>
                  <h2>
                    Previous Appointments
                  </h2>
                  <p>
                    Your completed and past
                    appointments.
                  </p>
                </div>
              </div>
              <div className="appointments-list">
                {pastAppointments.map(
                  (appointment) =>
                    renderAppointment(
                      appointment
                    )
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default Appointments;
