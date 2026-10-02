
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Availability() {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const defaultSchedule = {
    monday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    tuesday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    wednesday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    thursday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    friday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    saturday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    sunday: { enabled: false, startTime: "09:00", endTime: "17:00" },
  };

  const [schedule, setSchedule] = useState(defaultSchedule);
  const [sessionDuration, setSessionDuration] = useState(50);
  const [bufferMinutes, setBufferMinutes] = useState(10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login as a therapist first.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/availability",
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
            data.message || "Failed to load availability"
          );
        }

        if (data.availability?.schedule) {
          setSchedule(data.availability.schedule);
        }

        if (data.availability?.sessionDuration !== undefined) {
          setSessionDuration(data.availability.sessionDuration);
        }

        if (data.availability?.bufferMinutes !== undefined) {
          setBufferMinutes(data.availability.bufferMinutes);
        }
      } catch (err) {
        console.error("Load availability error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  const getTimeParts = (time) => {
    const [hours, minutes] = time.split(":");
    let hour = Number(hours);

    const period = hour >= 12 ? "PM" : "AM";

    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }

    return {
      hour: String(hour).padStart(2, "0"),
      minutes,
      period,
    };
  };

  const convertTo24Hour = (hour, minutes, period) => {
    let convertedHour = Number(hour);

    if (period === "AM" && convertedHour === 12) {
      convertedHour = 0;
    }

    if (period === "PM" && convertedHour !== 12) {
      convertedHour += 12;
    }

    return `${String(convertedHour).padStart(2, "0")}:${minutes}`;
  };

  const formatTime = (time) => {
    if (!time) return "";

    const parts = getTimeParts(time);

    return `${parts.hour}:${parts.minutes} ${parts.period}`;
  };

  const updateDay = (day, field, value) => {
    setSchedule((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        [field]: value,
      },
    }));

    setMessage("");
    setError("");
  };

  const updateTime = (day, field, type, value) => {
    const currentTime = getTimeParts(schedule[day][field]);

    const updatedTime = {
      ...currentTime,
      [type]: value,
    };

    const newTime = convertTo24Hour(
      updatedTime.hour,
      updatedTime.minutes,
      updatedTime.period
    );

    updateDay(day, field, newTime);
  };

  const saveAvailability = async () => {
    setMessage("");
    setError("");

    for (const day of days) {
      const currentDay = schedule[day];

      if (currentDay.enabled) {
        if (currentDay.startTime >= currentDay.endTime) {
          setError(
            `${day.charAt(0).toUpperCase() + day.slice(1)}: End time must be after start time.`
          );
          return;
        }
      }
    }

    if (sessionDuration < 15) {
      setError("Session duration must be at least 15 minutes.");
      return;
    }

    if (bufferMinutes < 0) {
      setError("Buffer time cannot be negative.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login as a therapist first.");
        return;
      }

      setSaving(true);

      const response = await fetch(
        "http://localhost:5000/api/availability",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            schedule,
            sessionDuration: Number(sessionDuration),
            bufferMinutes: Number(bufferMinutes),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save availability"
        );
      }

      setSchedule(data.availability.schedule);
      setSessionDuration(data.availability.sessionDuration);
      setBufferMinutes(data.availability.bufferMinutes);

      setMessage("Availability saved successfully.");
    } catch (err) {
      console.error("Save availability error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <p className="section-label">UNFAZED</p>
            <h1>Update Availability</h1>
            <p>Loading your availability...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="section-label">UNFAZED</p>
          <h1>Update Availability</h1>
          <p>
            Set your working hours and session preferences.
          </p>
        </div>

        <Link
          to="/therapist-dashboard"
          className="dashboard-logout"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* SESSION SETTINGS */}
      <div className="dashboard-card availability-card">
        <div className="availability-section-header">
          <div>
            <h2>Session Settings</h2>
            <p>
              Configure the duration of each session and the
              break between sessions.
            </p>
          </div>
        </div>

        <div className="session-settings-grid">
          <div className="setting-box">
            <label>Session Duration</label>

            <select
              value={sessionDuration}
              onChange={(e) => {
                setSessionDuration(Number(e.target.value));
                setMessage("");
                setError("");
              }}
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={50}>50 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div className="setting-box">
            <label>Break / Buffer</label>

            <select
              value={bufferMinutes}
              onChange={(e) => {
                setBufferMinutes(Number(e.target.value));
                setMessage("");
                setError("");
              }}
            >
              <option value={0}>No break</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* WEEKLY SCHEDULE */}
      <div className="dashboard-card availability-card">
        <div className="availability-section-header">
          <div>
            <h2>Weekly Schedule</h2>
            <p>
              Choose when patients can book sessions with you.
            </p>
          </div>
        </div>

        <div className="schedule-table">
          <div className="schedule-table-header">
            <div>DAY</div>
            <div>AVAILABILITY</div>
            <div>START TIME</div>
            <div>END TIME</div>
          </div>

          {days.map((day) => {
            const start = getTimeParts(schedule[day].startTime);
            const end = getTimeParts(schedule[day].endTime);

            return (
              <div
                key={day}
                className={`schedule-row ${
                  !schedule[day].enabled
                    ? "schedule-row-disabled"
                    : ""
                }`}
              >
                <div className="schedule-day">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </div>

                <div className="schedule-availability">
                  <label className="availability-toggle">
                    <input
                      type="checkbox"
                      checked={schedule[day].enabled}
                      onChange={(e) =>
                        updateDay(
                          day,
                          "enabled",
                          e.target.checked
                        )
                      }
                    />

                    <span className="toggle-slider"></span>

                    <span>
                      {schedule[day].enabled
                        ? "Available"
                        : "Unavailable"}
                    </span>
                  </label>
                </div>

                <div className="schedule-time">
                  <select
                    value={start.hour}
                    disabled={!schedule[day].enabled}
                    onChange={(e) =>
                      updateTime(
                        day,
                        "startTime",
                        "hour",
                        e.target.value
                      )
                    }
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const hour = String(i + 1).padStart(2, "0");

                      return (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      );
                    })}
                  </select>

                  <span>:</span>

                  <select
                    value={start.minutes}
                    disabled={!schedule[day].enabled}
                    onChange={(e) =>
                      updateTime(
                        day,
                        "startTime",
                        "minutes",
                        e.target.value
                      )
                    }
                  >
                    {Array.from({ length: 60 }, (_, i) => {
                      const minute = String(i).padStart(2, "0");

                      return (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      );
                    })}
                  </select>

                  <select
                    value={start.period}
                    disabled={!schedule[day].enabled}
                    onChange={(e) =>
                      updateTime(
                        day,
                        "startTime",
                        "period",
                        e.target.value
                      )
                    }
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>

                <div className="schedule-time">
                  <select
                    value={end.hour}
                    disabled={!schedule[day].enabled}
                    onChange={(e) =>
                      updateTime(
                        day,
                        "endTime",
                        "hour",
                        e.target.value
                      )
                    }
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const hour = String(i + 1).padStart(2, "0");

                      return (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      );
                    })}
                  </select>

                  <span>:</span>

                  <select
                    value={end.minutes}
                    disabled={!schedule[day].enabled}
                    onChange={(e) =>
                      updateTime(
                        day,
                        "endTime",
                        "minutes",
                        e.target.value
                      )
                    }
                  >
                    {Array.from({ length: 60 }, (_, i) => {
                      const minute = String(i).padStart(2, "0");

                      return (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      );
                    })}
                  </select>

                  <select
                    value={end.period}
                    disabled={!schedule[day].enabled}
                    onChange={(e) =>
                      updateTime(
                        day,
                        "endTime",
                        "period",
                        e.target.value
                      )
                    }
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="dashboard-btn"
          onClick={saveAvailability}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Availability"}
        </button>

        {message && (
          <p className="success-message">
            {message}
          </p>
        )}

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
      </div>

      {/* INFO */}
      <div className="dashboard-info">
        <h2>How availability works</h2>

        <p>
          Patients will only see booking times that fall
          within your available working hours.
        </p>

        <p>
          Your session duration and buffer time will be used
          to generate individual booking slots.
        </p>

        <p>
          For example, a 50-minute session with a 10-minute
          buffer creates a new slot every 60 minutes.
        </p>
      </div>
    </div>
  );
}

export default Availability;
