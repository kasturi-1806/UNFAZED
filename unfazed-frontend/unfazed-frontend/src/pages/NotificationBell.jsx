import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt")
    );
  };

  // =========================================
  // FETCH NOTIFICATIONS
  // =========================================
  const fetchNotifications = async () => {
    try {
      const token = getToken();

      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Notification fetch failed:",
          data.message
        );
        return;
      }

      setNotifications(data.notifications || []);
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );
    }
  };

  // =========================================
  // FETCH UNREAD COUNT
  // =========================================
  const fetchUnreadCount = async () => {
    try {
      const token = getToken();

      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/notifications/unread-count",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error(
        "Failed to load unread notification count:",
        error
      );
    }
  };

  // =========================================
  // INITIAL LOAD + AUTO REFRESH
  // =========================================
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // =========================================
  // OPEN NOTIFICATION PANEL
  // =========================================
  const handleToggle = async () => {
    const nextState = !open;

    setOpen(nextState);

    if (nextState) {
      setLoading(true);

      await fetchNotifications();
      await fetchUnreadCount();

      setLoading(false);
    }
  };

  // =========================================
  // OPEN CHAT FROM NOTIFICATION
  // =========================================
  const openChatFromNotification = (
    notification
  ) => {
    if (
      notification?.type !== "new-message" ||
      !notification?.sender ||
      !notification?.senderModel
    ) {
      return;
    }

    const senderRole =
      notification.senderModel === "Therapist"
        ? "therapist"
        : "user";

    setOpen(false);

    navigate(
      `/chat/${senderRole}/${notification.sender}`
    );
  };

  // =========================================
  // MARK ONE AS READ
  // =========================================
  const markAsRead = async (
    notificationId,
    notification = null
  ) => {
    try {
      const token = getToken();

      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to mark notification as read"
        );
        return;
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notificationId
            ? {
                ...item,
                isRead: true,
              }
            : item
        )
      );

      setUnreadCount((previous) =>
        Math.max(0, previous - 1)
      );

      // Open chat after marking notification as read
      if (notification) {
        openChatFromNotification(notification);
      }
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  };

  // =========================================
  // HANDLE NOTIFICATION CLICK
  // =========================================
  const handleNotificationClick = (
    notification
  ) => {
    // New message notification
    if (
      notification.type === "new-message" &&
      notification.sender &&
      notification.senderModel
    ) {
      if (!notification.isRead) {
        markAsRead(
          notification._id,
          notification
        );
      } else {
        openChatFromNotification(
          notification
        );
      }

      return;
    }

    // Other notifications
    if (!notification.isRead) {
      markAsRead(
        notification._id,
        null
      );
    }
  };

  // =========================================
  // MARK ALL AS READ
  // =========================================
  const markAllAsRead = async () => {
    try {
      const token = getToken();

      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/notifications/read-all",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );
    }
  };

  // =========================================
  // FORMAT TIME
  // =========================================
  const formatNotificationTime = (date) => {
    if (!date) return "";

    const notificationDate = new Date(date);
    const now = new Date();

    const difference =
      now.getTime() -
      notificationDate.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days}d ago`;
    }

    return notificationDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
      }
    );
  };

  // =========================================
  // NOTIFICATION ICON
  // =========================================
  const getNotificationIcon = (
    type
  ) => {
    switch (type) {
      case "appointment-booked":
        return "📅";

      case "appointment-confirmed":
        return "✓";

      case "appointment-cancelled":
        return "×";

      case "session-started":
        return "▶";

      case "session-completed":
        return "✓";

      case "new-message":
        return "💬";

      default:
        return "🔔";
    }
  };

  return (
    <div className="notification-wrapper">
      {/* BELL */}
      <button
        type="button"
        className="notification-button"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <span className="notification-bell">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div>
              <h3>Notifications</h3>

              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-button"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">
                <p>
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  🔔
                </div>

                <h4>No notifications</h4>

                <p>
                  New messages and appointment
                  updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map(
                (notification) => (
                  <button
                    type="button"
                    key={notification._id}
                    className={`notification-item ${
                      !notification.isRead
                        ? "unread"
                        : ""
                    }`}
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(
                        notification.type
                      )}
                    </div>

                    <div className="notification-content">
                      <div className="notification-title-row">
                        <h4>
                          {notification.type ===
                          "new-message"
                            ? notification.senderModel ===
                              "Therapist"
                              ? "New message from Therapist"
                              : "New message from Client"
                            : notification.title}
                        </h4>

                        {!notification.isRead && (
                          <span className="notification-dot"></span>
                        )}
                      </div>

                      <p>
                        {notification.type ===
                        "new-message"
                          ? notification.senderModel ===
                            "Therapist"
                            ? "You have a new message from your therapist."
                            : "You have a new message from your client."
                          : notification.message}
                      </p>

                      <span className="notification-time">
                        {formatNotificationTime(
                          notification.createdAt
                        )}
                      </span>
                    </div>
                  </button>
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;