
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import NotificationBell from "../pages/NotificationBell";

const getAppointmentDateTime = (appointment) => {
  const date = new Date(appointment.date);

  const time = appointment.time?.trim() || "";

  let hours = 0;
  let minutes = 0;

  // 24-hour format: 10:30
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    [hours, minutes] = time.split(":").map(Number);
  }

  // 12-hour format: 10:30 AM
  else if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(time)) {
    const match = time.match(
      /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i
    );

    hours = Number(match[1]);
    minutes = Number(match[2]);

    const period = match[3].toUpperCase();

    if (period === "PM" && hours !== 12) {
      hours += 12;
    }

    if (period === "AM" && hours === 12) {
      hours = 0;
    }
  }

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hours,
    minutes,
    0,
    0
  );
};


// =========================================
// CHECK WHETHER APPOINTMENT IS TODAY
// =========================================
const isToday = (appointment) => {
  const appointmentDate = getAppointmentDateTime(appointment);
  const today = new Date();

  return (
    appointmentDate.getDate() === today.getDate() &&
    appointmentDate.getMonth() === today.getMonth() &&
    appointmentDate.getFullYear() === today.getFullYear()
  );
};


// =========================================
// FORMAT TIME
// =========================================
const formatAppointmentTime = (appointment) => {
  const date = getAppointmentDateTime(appointment);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};


// =========================================
// FORMAT DATE
// =========================================
const formatAppointmentDate = (appointment) => {
  const date = getAppointmentDateTime(appointment);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};


// =========================================
// THERAPIST DASHBOARD
// =========================================
function TherapistDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const [therapistName, setTherapistName] =
    useState("Therapist");


  // =========================================
  // GET THERAPIST NAME
  // =========================================
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const user = JSON.parse(storedUser);

        if (user?.name) {
          setTherapistName(user.name);
        }
      }
    } catch (error) {
      console.error(
        "Unable to read user information:",
        error
      );
    }
  }, []);


  // =========================================
  // FETCH THERAPIST APPOINTMENTS
  // =========================================
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.error(
            "No authentication token found"
          );
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/appointments/therapist",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Appointment fetch failed:",
            data.message
          );
          return;
        }

        setAppointments(data.appointments || []);
      } catch (error) {
        console.error(
          "Failed to load therapist appointments:",
          error
        );
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, []);


  // =========================================
  // PENDING APPOINTMENTS
  // =========================================
  const pendingAppointments = useMemo(() => {
    return appointments.filter(
      (appointment) =>
        appointment.status === "pending"
    );
  }, [appointments]);


  // =========================================
  // COMPLETED APPOINTMENTS
  // =========================================
  const completedAppointments = useMemo(() => {
    return appointments.filter(
      (appointment) =>
        appointment.status === "completed"
    );
  }, [appointments]);


  // =========================================
  // UPCOMING APPOINTMENTS
  // =========================================
  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((appointment) => {
        if (appointment.status !== "confirmed") {
          return false;
        }

        const appointmentDate =
          getAppointmentDateTime(appointment);

        return appointmentDate >= now;
      })
      .sort(
        (a, b) =>
          getAppointmentDateTime(a) -
          getAppointmentDateTime(b)
      );
  }, [appointments]);


  // =========================================
  // TODAY'S APPOINTMENTS
  // =========================================
  const todayAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        if (
          appointment.status === "cancelled" ||
          appointment.status === "completed"
        ) {
          return false;
        }

        return isToday(appointment);
      })
      .sort(
        (a, b) =>
          getAppointmentDateTime(a) -
          getAppointmentDateTime(b)
      );
  }, [appointments]);


  // =========================================
  // TOTAL UNIQUE PATIENTS
  // =========================================
  const totalPatients = useMemo(() => {
    const uniquePatients = new Set();

    appointments.forEach((appointment) => {
      const patient = appointment.user;

      if (!patient) {
        return;
      }

      if (patient._id) {
        uniquePatients.add(String(patient._id));
        return;
      }

      if (patient.email) {
        uniquePatients.add(
          patient.email.toLowerCase()
        );
        return;
      }

      if (patient.name) {
        uniquePatients.add(
          patient.name.toLowerCase()
        );
      }
    });

    return uniquePatients.size;
  }, [appointments]);


  // =========================================
  // STATISTICS
  // =========================================
  const pendingCount = pendingAppointments.length;
  const upcomingCount = upcomingAppointments.length;
  const completedCount = completedAppointments.length;


  // =========================================
  // LOGOUT
  // =========================================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");

    window.location.href = "/";
  };


  return (
    <div className="therapist-dashboard">

      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside className="therapist-sidebar">

        <div className="sidebar-brand">
          <span>UNFAZED</span>
          <p>Therapist Workspace</p>
        </div>


        <nav className="sidebar-nav">

          <Link
            to="/therapist-dashboard"
            className="sidebar-link active"
          >
            <span>⌂</span>
            <strong>Dashboard</strong>
          </Link>


          <Link
            to="/appointments"
            className="sidebar-link"
          >
            <span>▣</span>
            <strong>Appointments</strong>
          </Link>


          <Link
            to="/patients"
            className="sidebar-link"
          >
            <span>♟</span>
            <strong>Patients</strong>
          </Link>
          <Link
            to="/session-notes"
            className="sidebar-link"
          >
          <span>✎</span>
          <strong>Session Notes</strong>
          </Link>


          <Link
            to="/availability"
            className="sidebar-link"
          >
            <span>◷</span>
            <strong>Availability</strong>
          </Link>


          {/* PACKAGES */}

          <Link
            to="/packages"
            className="sidebar-link"
          >
            <span>▤</span>
            <strong>Packages</strong>
          </Link>


          <Link
            to="/profile"
            className="sidebar-link"
          >
            <span>◉</span>
            <strong>My Profile</strong>
          </Link>

        </nav>


        <div className="sidebar-bottom">

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            <strong>Logout</strong>
          </button>

        </div>

      </aside>


      {/* =====================================
          MAIN CONTENT
      ====================================== */}

      <main className="therapist-main">

        {/* =====================================
            HEADER
        ====================================== */}

        <header className="dashboard-topbar">

          <div>

            <p className="dashboard-eyebrow">
              THERAPIST WORKSPACE
            </p>

            <h1>
              Good morning, {therapistName}
            </h1>

            <p className="dashboard-subtitle">
              Here's what's happening with your
              practice today.
            </p>

          </div>


          <div className="dashboard-header-actions">

            <NotificationBell />

            <div className="therapist-avatar">
              {therapistName
                ? therapistName.charAt(0).toUpperCase()
                : "T"}
            </div>

          </div>

        </header>


        {/* =====================================
            DASHBOARD STATISTICS
        ====================================== */}

        <section className="dashboard-stats">

          <div className="stat-card">

            <div className="stat-icon pending">
              ⌄
            </div>

            <div>
              <p>Pending Appointments</p>
              <strong>{pendingCount}</strong>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon patients">
              ♟
            </div>

            <div>
              <p>Total Patients</p>
              <strong>{totalPatients}</strong>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon today">
              ▣
            </div>

            <div>
              <p>Upcoming Appointments</p>
              <strong>{upcomingCount}</strong>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon completed">
              ✓
            </div>

            <div>
              <p>Completed Appointments</p>
              <strong>{completedCount}</strong>
            </div>

          </div>

        </section>


        {/* =====================================
            TODAY'S APPOINTMENTS
        ====================================== */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <p className="section-eyebrow">
                TODAY
              </p>

              <h2>
                Today's Appointments
              </h2>

            </div>


            <Link
              to="/appointments"
              className="view-all-link"
            >
              View all →
            </Link>

          </div>


          <div className="sessions-container">

            {loadingAppointments ? (

              <div className="empty-sessions">

                <div className="loading-spinner"></div>

                <h3>
                  Loading appointments...
                </h3>

              </div>

            ) : todayAppointments.length === 0 ? (

              <div className="empty-sessions">

                <div className="empty-icon">
                  ▣
                </div>

                <h3>
                  No appointments today
                </h3>

                <p>
                  Your scheduled appointments for today
                  will appear here.
                </p>

              </div>

            ) : (

              <div className="upcoming-session-list">

                {todayAppointments.map(
                  (appointment) => {

                    const isPending =
                      appointment.status ===
                      "pending";

                    return (
                      <div
                        className="upcoming-session"
                        key={appointment._id}
                      >

                        <div className="session-time">

                          <strong>
                            {formatAppointmentTime(
                              appointment
                            )}
                          </strong>

                          <span>
                            {appointment.duration ||
                              50} min
                          </span>

                        </div>


                        <div className="session-details">

                          <h3>
                            {appointment.user?.name ||
                              "Patient"}
                          </h3>

                          <p>
                            {isPending
                              ? "Awaiting confirmation"
                              : "Confirmed appointment"}
                          </p>

                        </div>


                        <div
                          className={`session-status ${
                            appointment.status
                          }`}
                        >
                          {isPending
                            ? "Pending"
                            : "Confirmed"}
                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </section>


        {/* =====================================
            UPCOMING APPOINTMENTS
        ====================================== */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <p className="section-eyebrow">
                SCHEDULE
              </p>

              <h2>
                Upcoming Appointments
              </h2>

            </div>


            <Link
              to="/appointments"
              className="view-all-link"
            >
              View all →
            </Link>

          </div>


          <div className="sessions-container">

            {loadingAppointments ? (

              <div className="empty-sessions">

                <div className="loading-spinner"></div>

                <h3>
                  Loading appointments...
                </h3>

              </div>

            ) : upcomingAppointments.length === 0 ? (

              <div className="empty-sessions">

                <div className="empty-icon">
                  ▣
                </div>

                <h3>
                  No upcoming appointments
                </h3>

                <p>
                  Your confirmed appointments will
                  appear here.
                </p>

              </div>

            ) : (

              <div className="upcoming-session-list">

                {upcomingAppointments
                  .slice(0, 4)
                  .map((appointment, index) => {

                    return (
                      <div
                        className="upcoming-session"
                        key={appointment._id}
                      >

                        <div className="session-date-box">

                          <strong>
                            {new Date(
                              getAppointmentDateTime(
                                appointment
                              )
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                              }
                            )}
                          </strong>

                          <span>
                            {new Date(
                              getAppointmentDateTime(
                                appointment
                              )
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                month: "short",
                              }
                            )}
                          </span>

                        </div>


                        <div className="session-time">

                          <strong>
                            {formatAppointmentTime(
                              appointment
                            )}
                          </strong>

                          <span>
                            {appointment.duration ||
                              50} min
                          </span>

                        </div>


                        <div className="session-details">

                          <h3>
                            {appointment.user?.name ||
                              "Patient"}
                          </h3>

                          <p>
                            {index === 0
                              ? "Next appointment"
                              : "Confirmed appointment"}
                          </p>

                        </div>


                        <div className="session-status confirmed">
                          Confirmed
                        </div>

                      </div>
                    );
                  })}

              </div>

            )}

          </div>

        </section>


        {/* =====================================
            QUICK ACCESS
        ====================================== */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <p className="section-eyebrow">
                QUICK ACCESS
              </p>

              <h2>
                Manage your practice
              </h2>

            </div>

          </div>


          <div className="quick-actions">

            <Link
              to="/appointments"
              className="quick-action"
            >

              <div className="quick-action-icon">
                ▣
              </div>

              <div>
                <h3>Appointments</h3>
                <p>
                  Manage bookings and appointments
                </p>
              </div>

              <span>→</span>

            </Link>


            <Link
              to="/patients"
              className="quick-action"
            >

              <div className="quick-action-icon">
                ♟
              </div>

              <div>
                <h3>Patients</h3>
                <p>
                  View your patient history
                </p>
              </div>

              <span>→</span>

            </Link>


            <Link
              to="/availability"
              className="quick-action"
            >

              <div className="quick-action-icon">
                ◷
              </div>

              <div>
                <h3>Availability</h3>
                <p>
                  Manage your available slots
                </p>
              </div>

              <span>→</span>

            </Link>


            {/* PACKAGES */}

            <Link
              to="/packages"
              className="quick-action"
            >

              <div className="quick-action-icon">
                ▤
              </div>

              <div>
                <h3>Packages</h3>
                <p>
                  Create and manage session packages
                </p>
              </div>

              <span>→</span>

            </Link>


            <Link
              to="/profile"
              className="quick-action"
            >

              <div className="quick-action-icon">
                ◉
              </div>

              <div>
                <h3>My Profile</h3>
                <p>
                  Update professional details
                </p>
              </div>

              <span>→</span>

            </Link>

          </div>

        </section>

      </main>

    </div>
  );
}

export default TherapistDashboard;
