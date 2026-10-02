import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import NotificationBell from "../pages/NotificationBell";

function UserDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [myPackages, setMyPackages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  const [loadingMessages, setLoadingMessages] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPackages, setLoadingPackages] =
    useState(false);
  const [loadingMyPackages, setLoadingMyPackages] =
    useState(false);
  const [loadingPayments, setLoadingPayments] =
    useState(false);

  const [error, setError] = useState("");
  const [packageMessage, setPackageMessage] =
    useState("");
  const [packageError, setPackageError] =
    useState("");
  const [purchasingPackage, setPurchasingPackage] =
    useState(null);

  // =========================================
  // GET TOKEN
  // =========================================
  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt")
    );
  };

  // =========================================
  // FETCH APPOINTMENTS
  // =========================================
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = getToken();

        if (!token) {
          setError("Please log in again.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/appointments/user",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log(
          "USER APPOINTMENTS API RESPONSE:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch appointments"
          );
        }

        const appointmentList =
          data.appointments ||
          data.data ||
          (Array.isArray(data) ? data : []);

        console.log(
          "FIRST APPOINTMENT OBJECT:",
          JSON.stringify(
            appointmentList[0],
            null,
            2
          )
        );

        setAppointments(appointmentList);
      } catch (err) {
        console.error(
          "USER APPOINTMENTS ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load appointments."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // =========================================
  // FETCH MY PACKAGES
  // =========================================
  const fetchMyPackages = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      setLoadingMyPackages(true);

      const response = await fetch(
        "http://localhost:5000/api/client-packages/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load your packages"
        );
      }

      const now = new Date();

      const activePackages =
        (data.packages || []).filter(
          (item) =>
            item.paymentStatus === "paid" &&
            item.status === "active" &&
            Number(item.sessionsRemaining) > 0 &&
            item.expiryDate &&
            new Date(item.expiryDate) >= now
        );

      setMyPackages(activePackages);
    } catch (err) {
      console.error(
        "MY PACKAGES ERROR:",
        err
      );
    } finally {
      setLoadingMyPackages(false);
    }
  };

  useEffect(() => {
    fetchMyPackages();
  }, []);

  // =========================================
  // FETCH PAYMENT HISTORY
  // =========================================
  useEffect(() => {
    const fetchPayments = async () => {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        setLoadingPayments(true);

        const response = await fetch(
          "http://localhost:5000/api/payments/my",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load payment history"
          );
        }

        setPayments(
          Array.isArray(data.payments)
            ? data.payments
            : []
        );
      } catch (err) {
        console.error(
          "PAYMENT HISTORY ERROR:",
          err
        );
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, []);

  // =========================================
  // APPOINTMENT DATE/TIME
  // =========================================
  const getAppointmentDateTime = (
    appointment
  ) => {
    if (!appointment?.date) {
      return new Date(0);
    }

    const date = new Date(
      appointment.date
    );

    if (appointment.time) {
      const timeMatch =
        appointment.time.match(
          /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i
        );

      if (timeMatch) {
        let hour = Number(
          timeMatch[1]
        );

        const minute = Number(
          timeMatch[2]
        );

        const period =
          timeMatch[3]?.toUpperCase();

        if (
          period === "PM" &&
          hour !== 12
        ) {
          hour += 12;
        }

        if (
          period === "AM" &&
          hour === 12
        ) {
          hour = 0;
        }

        date.setHours(
          hour,
          minute,
          0,
          0
        );
      }
    }

    return date;
  };

  // =========================================
  // UPCOMING APPOINTMENT
  // =========================================
  const upcomingAppointments =
    appointments
      .filter((appointment) => {
        const status =
          appointment.status?.toLowerCase();

        return (
          getAppointmentDateTime(
            appointment
          ) >= new Date() &&
          ![
            "cancelled",
            "completed",
            "no-show",
          ].includes(status)
        );
      })
      .sort(
        (a, b) =>
          getAppointmentDateTime(a) -
          getAppointmentDateTime(b)
      );

  const upcomingAppointment =
    upcomingAppointments[0];

  // =========================================
  // RECENT SESSION
  // =========================================
  const completedAppointments =
    appointments
      .filter(
        (appointment) =>
          appointment.status?.toLowerCase() ===
          "completed"
      )
      .sort(
        (a, b) =>
          getAppointmentDateTime(b) -
          getAppointmentDateTime(a)
      );

  const recentAppointment =
    completedAppointments[0];

  // =========================================
  // FETCH THERAPIST PACKAGES
  // =========================================
  useEffect(() => {
    const fetchPackages = async () => {
      if (!upcomingAppointment) {
        setPackages([]);
        return;
      }

      const therapist =
        upcomingAppointment.therapist;

      const therapistId =
        therapist?._id ||
        therapist?.id ||
        upcomingAppointment.therapistId;

      if (!therapistId) {
        console.log(
          "No therapist ID found for upcoming appointment."
        );

        setPackages([]);
        return;
      }

      try {
        setLoadingPackages(true);
        setPackageError("");

        const response = await fetch(
          `http://localhost:5000/api/packages/therapist/${therapistId}`
        );

        const contentType =
          response.headers.get(
            "content-type"
          );

        if (
          !contentType ||
          !contentType.includes(
            "application/json"
          )
        ) {
          throw new Error(
            "Unable to load session packages. Please make sure the backend is running on port 5000."
          );
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load packages"
          );
        }

        setPackages(
          Array.isArray(data.packages)
            ? data.packages
            : []
        );
      } catch (err) {
        console.error(
          "USER PACKAGES ERROR:",
          err
        );

        setPackageError(
          err.message ||
            "Unable to load packages."
        );
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, [upcomingAppointment]);

  // =========================================
  // CHECK PURCHASED PACKAGE
  // =========================================
  const getPurchasedPackage = (
    packageId
  ) => {
    return myPackages.find(
      (clientPackage) => {
        const purchasedPackageId =
          clientPackage.package?._id ||
          clientPackage.package;

        return (
          String(purchasedPackageId) ===
          String(packageId)
        );
      }
    );
  };

  const isPackagePurchased = (
    packageId
  ) => {
    return Boolean(
      getPurchasedPackage(packageId)
    );
  };
// =========================================
// PURCHASE PACKAGE WITH RAZORPAY
// =========================================
const handlePurchasePackage = async (
  packageId
) => {
  if (isPackagePurchased(packageId)) {
    setPackageMessage(
      "You already have this package active."
    );
    return;
  }

  try {
    const token = getToken();

    if (!token) {
      setPackageError(
        "Please log in again."
      );
      return;
    }

    setPurchasingPackage(packageId);
    setPackageMessage("");
    setPackageError("");

    // =========================================
    // STEP 1: CREATE CLIENT PACKAGE
    // =========================================
    const purchaseResponse =
      await fetch(
        "http://localhost:5000/api/client-packages/purchase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            packageId,
          }),
        }
      );

    const purchaseData =
      await purchaseResponse.json();

    if (!purchaseResponse.ok) {
      throw new Error(
        purchaseData.message ||
          "Unable to purchase package"
      );
    }

    const clientPackage =
      purchaseData.clientPackage;

    if (!clientPackage?._id) {
      throw new Error(
        "Package was created but Client Package ID was not returned."
      );
    }

    // =========================================
    // STEP 2: LOAD RAZORPAY CHECKOUT
    // =========================================
    if (!window.Razorpay) {
      await new Promise((resolve, reject) => {
        const script =
          document.createElement("script");

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = resolve;

        script.onerror = () =>
          reject(
            new Error(
              "Unable to load Razorpay checkout."
            )
          );

        document.body.appendChild(script);
      });
    }

    // =========================================
    // STEP 3: CREATE RAZORPAY PACKAGE ORDER
    // =========================================
    const orderResponse =
      await fetch(
        "http://localhost:5000/api/client-packages/razorpay/order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            clientPackageId:
              clientPackage._id,
          }),
        }
      );

    const orderData =
      await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error(
        orderData.message ||
          "Unable to create Razorpay order."
      );
    }

    if (
      !orderData.success ||
      !orderData.order?.id ||
      !orderData.keyId
    ) {
      throw new Error(
        "Invalid Razorpay order response."
      );
    }

    // =========================================
    // STEP 4: OPEN RAZORPAY CHECKOUT
    // =========================================
    const options = {
      key: orderData.keyId,

      amount: orderData.order.amount,

      currency:
        orderData.order.currency || "INR",

      name: "UNFAZED",

      description:
        "Therapy Session Package",

      order_id:
        orderData.order.id,

      handler: async function (response) {
        try {
          setPackageMessage(
            "Payment received. Verifying your payment..."
          );

          setPackageError("");

          // =========================================
          // STEP 5: VERIFY PAYMENT
          // =========================================
          const verifyResponse =
            await fetch(
              "http://localhost:5000/api/client-packages/razorpay/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,
                }),
              }
            );

          const verifyData =
            await verifyResponse.json();

          if (!verifyResponse.ok) {
            throw new Error(
              verifyData.message ||
                "Package payment verification failed."
            );
          }

          if (!verifyData.success) {
            throw new Error(
              verifyData.message ||
                "Package payment verification failed."
            );
          }

          // =========================================
          // STEP 6: SUCCESS
          // =========================================
          setPackageMessage(
            verifyData.invoice
              ? "Package purchased successfully! Payment verified and invoice generated."
              : "Package purchased successfully! Payment verified."
          );

          // =========================================
          // STEP 7: REFRESH ACTIVE PACKAGES
          // =========================================
          await fetchMyPackages();

          // =========================================
          // STEP 8: REFRESH PAYMENT HISTORY
          // =========================================
          await refreshPayments();
        } catch (error) {
          console.error(
            "PACKAGE PAYMENT VERIFICATION ERROR:",
            error
          );

          setPackageError(
            error.message ||
              "Payment verification failed. Please contact support if money was deducted."
          );

          setPackageMessage("");
        } finally {
          setPurchasingPackage(null);
        }
      },

      modal: {
        ondismiss: function () {
          setPackageMessage(
            "Payment was cancelled."
          );

          setPurchasingPackage(null);
        },
      },

      theme: {
        color: "#315f51",
      },
    };

    const razorpay =
      new window.Razorpay(options);

    // =========================================
    // PAYMENT FAILED
    // =========================================
    razorpay.on(
      "payment.failed",
      function (response) {
        console.error(
          "RAZORPAY PACKAGE PAYMENT FAILED:",
          response
        );

        setPackageError(
          response.error?.description ||
            "Package payment failed."
        );

        setPackageMessage("");

        setPurchasingPackage(null);
      }
    );

    razorpay.open();
  } catch (err) {
    console.error(
      "PACKAGE PURCHASE ERROR:",
      err
    );

    setPackageError(
      err.message ||
        "Unable to purchase package."
    );

    setPackageMessage("");

    setPurchasingPackage(null);
  }
};
  // =========================================
  // REFRESH PAYMENT HISTORY
  // =========================================
  const refreshPayments = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/payments/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to refresh payments"
        );
      }

      setPayments(
        Array.isArray(data.payments)
          ? data.payments
          : []
      );
    } catch (err) {
      console.error(
        "REFRESH PAYMENTS ERROR:",
        err
      );
    }
  };

  // =========================================
  // DOWNLOAD INVOICE
  // =========================================
  const handleDownloadInvoice = async (
    fileName
  ) => {
    try {
      const token = getToken();

      if (!token) {
        alert("Please log in again.");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/payments/invoice/${encodeURIComponent(
          fileName
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let message =
          "Unable to download invoice.";

        try {
          const data =
            await response.json();

          message =
            data.message || message;
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "INVOICE DOWNLOAD ERROR:",
        err
      );

      alert(
        err.message ||
          "Unable to download invoice."
      );
    }
  };

  // =========================================
  // DATE FORMAT
  // =========================================
  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatShortDate = (
    date
  ) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================
  // THERAPIST NAME
  // =========================================
  const getTherapistName = (
    appointment
  ) => {
    return (
      appointment?.therapist?.name ||
      appointment?.therapistName ||
      "Therapist"
    );
  };

  // =========================================
  // THERAPIST ID
  // =========================================
  const getTherapistId = (
    appointment
  ) => {
    return (
      appointment?.therapist?._id ||
      appointment?.therapist?.id ||
      appointment?.therapistId ||
      null
    );
  };

  // =========================================
  // CHAT APPOINTMENT
  // =========================================
  const chatAppointment =
    upcomingAppointment ||
    recentAppointment ||
    appointments.find(
      (appointment) =>
        appointment?.therapist?._id ||
        appointment?.therapist?.id ||
        appointment?.therapistId
    );

  const chatTherapistId =
    getTherapistId(chatAppointment);

  // =========================================
  // FETCH CHAT MESSAGES
  // =========================================
  useEffect(() => {
    if (!appointments.length) {
      setChatMessages([]);
      return;
    }

    const therapistId =
      chatTherapistId;

    console.log(
      "CHAT THERAPIST ID:",
      therapistId
    );

    console.log(
      "CHAT APPOINTMENT:",
      chatAppointment
    );

    console.log(
      "UPCOMING APPOINTMENT:",
      upcomingAppointment
    );

    console.log(
      "RECENT APPOINTMENT:",
      recentAppointment
    );

    if (!therapistId) {
      console.log(
        "CHAT: No therapist ID found."
      );

      setChatMessages([]);
      return;
    }

    const token = getToken();

    const storedUser =
      JSON.parse(
        localStorage.getItem("user")
      ) || {};

    const currentUserId =
      storedUser.id ||
      storedUser._id;

    console.log(
      "CHAT CURRENT USER ID:",
      currentUserId
    );

    if (!token || !currentUserId) {
      console.log(
        "CHAT: Token or current user ID missing."
      );
      return;
    }

    // =========================================
    // FETCH EXISTING MESSAGES
    // =========================================
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);

        const response = await fetch(
          `http://localhost:5000/api/messages/therapist/${therapistId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        console.log(
          "CHAT API STATUS:",
          response.status
        );

        console.log(
          "CHAT API RESPONSE:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load messages"
          );
        }

        setChatMessages(
          data.messages || []
        );
      } catch (err) {
        console.error(
          "FETCH CHAT MESSAGES ERROR:",
          err
        );
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // =========================================
    // SOCKET.IO
    // =========================================
    const socket = io(
      "http://localhost:5000",
      {
        transports: ["websocket"],
      }
    );

    socket.on("connect", () => {
      console.log(
        "USER CHAT SOCKET CONNECTED:",
        socket.id
      );

      socket.emit("joinRoom", {
        userId: currentUserId,
        role: "user",
      });
    });

    socket.on(
      "newMessage",
      (newMessage) => {
        console.log(
          "NEW CHAT MESSAGE RECEIVED:",
          newMessage
        );

        if (
          String(newMessage.senderId) ===
            String(therapistId) &&
          newMessage.senderRole ===
            "therapist"
        ) {
          setChatMessages(
            (previousMessages) => [
              ...previousMessages,
              newMessage,
            ]
          );
        }
      }
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "USER CHAT SOCKET DISCONNECTED"
        );
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [
    appointments,
    chatTherapistId,
  ]);

  // =========================================
  // SPECIALIZATION
  // =========================================
  const getSpecialization = (
    appointment
  ) => {
    if (
      Array.isArray(
        appointment?.therapist
          ?.specializations
      )
    ) {
      return appointment.therapist.specializations.join(
        ", "
      );
    }

    return (
      appointment?.therapist
        ?.specialization ||
      "Therapist"
    );
  };

  // =========================================
  // STATUS
  // =========================================
  const getStatus = (
    appointment
  ) => {
    if (!appointment?.status) {
      return "PENDING";
    }

    return appointment.status.toUpperCase();
  };

  return (
    <div className="user-dashboard">

      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <h1>UNFAZED</h1>

          <h2>
            Welcome back 👋
          </h2>

          <p>
            Your mental wellness journey,
            all in one place.
          </p>
        </div>

        <div className="user-header-actions">
          <NotificationBell />

          <Link
            to="/login"
            className="logout-link"
          >
            Logout
          </Link>
        </div>
      </header>

      {/* UPCOMING SESSION */}
      <section className="upcoming-session-section">

        <div className="section-heading">
          <h2>
            Upcoming Session
          </h2>
        </div>

        {loading ? (
          <div className="session-card">
            <p>
              Loading your upcoming session...
            </p>
          </div>
        ) : error ? (
          <div className="session-card">
            <p>{error}</p>
          </div>
        ) : upcomingAppointment ? (
          <div className="session-card">

            <div className="session-info">

              <div className="therapist-info">

                <div className="therapist-avatar">
                  {getTherapistName(
                    upcomingAppointment
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h3>
                    {getTherapistName(
                      upcomingAppointment
                    )}
                  </h3>

                  <p>
                    {getSpecialization(
                      upcomingAppointment
                    )}
                  </p>
                </div>

              </div>

              <div className="session-status">
                <span>
                  {getStatus(
                    upcomingAppointment
                  )}
                </span>
              </div>

            </div>

            <div className="session-details">

              <div>
                <strong>
                  Date
                </strong>

                <p>
                  {formatDate(
                    upcomingAppointment.date
                  )}
                </p>
              </div>

              <div>
                <strong>
                  Time
                </strong>

                <p>
                  {upcomingAppointment.time ||
                    "Time unavailable"}
                </p>
              </div>

              <div>
                <strong>
                  Duration
                </strong>

                <p>
                  {upcomingAppointment.duration ||
                    50}{" "}
                  minutes
                </p>
              </div>

            </div>

          </div>
        ) : (
          <div className="session-card">

            <p>
              No upcoming sessions.
            </p>

            <Link to="/therapists">
              Find a Therapist
            </Link>

          </div>
        )}

      </section>

      {/* MESSAGES */}
      <section className="messages-section">

        <div className="section-heading">
          <div>
            <h2>
              Messages
            </h2>

            <p>
              Stay connected with your therapist.
            </p>
          </div>
        </div>

        {loadingMessages ? (
          <div className="session-card">
            <p>
              Loading messages...
            </p>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="session-card">
            <p>
              No messages yet.
            </p>

            {chatTherapistId && (
              <Link
                to={`/chat/therapist/${chatTherapistId}`}
              >
                Start a conversation
              </Link>
            )}
          </div>
        ) : (
          <div className="session-card">

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "20px",
              }}
            >

              <div>
                <h3>
                  {getTherapistName(
                    chatAppointment
                  )}
                </h3>

                <p>
                  {
                    chatMessages[
                      chatMessages.length - 1
                    ]?.message
                  }
                </p>
              </div>

              {chatTherapistId && (
                <Link
                  to={`/chat/therapist/${chatTherapistId}`}
                  className="quick-action"
                  style={{
                    textDecoration:
                      "none",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  Open Chat
                </Link>
              )}

            </div>

            <small>
              {chatMessages[
                chatMessages.length - 1
              ]?.createdAt
                ? new Date(
                    chatMessages[
                      chatMessages.length - 1
                    ].createdAt
                  ).toLocaleString()
                : ""}
            </small>

          </div>
        )}

      </section>

      {/* MY ACTIVE PACKAGES */}
      {myPackages.length > 0 && (
        <section className="packages-section">

          <div className="section-heading">
            <div>
              <h2>
                My Active Packages
              </h2>

              <p>
                Your available session packages.
              </p>
            </div>
          </div>

          <div className="packages-grid">

            {myPackages.map(
              (clientPackage) => {

                const packageData =
                  clientPackage.package || {};

                return (
                  <div
                    className="user-package-card"
                    key={
                      clientPackage._id
                    }
                  >

                    <div className="package-card-header">

                      <div>
                        <span className="package-label">
                          ACTIVE PACKAGE
                        </span>

                        <h3>
                          {packageData.name ||
                            "Session Package"}
                        </h3>
                      </div>

                      <div className="package-session-count">
                        {
                          clientPackage.sessionsRemaining
                        }
                      </div>

                    </div>

                    <div className="package-main-price">

                      <strong>
                        {
                          clientPackage.sessionsRemaining
                        }
                      </strong>

                      <span>
                        sessions remaining
                      </span>

                    </div>

                    <div className="package-details">

                      <div>
                        <span>
                          Purchased
                        </span>

                        <strong>
                          {formatShortDate(
                            clientPackage.purchaseDate
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Expires
                        </span>

                        <strong>
                          {formatShortDate(
                            clientPackage.expiryDate
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Status
                        </span>

                        <strong>
                          ACTIVE
                        </strong>
                      </div>

                    </div>

                    <Link
                      to={
                        upcomingAppointment
                          ?.therapist?.slug
                          ? `/therapists/${upcomingAppointment.therapist.slug}`
                          : "/therapists"
                      }
                      className="package-buy-button"
                      style={{
                        textDecoration:
                          "none",
                        textAlign:
                          "center",
                      }}
                    >
                      Book a Session
                    </Link>

                  </div>
                );
              }
            )}

          </div>
        </section>
      )}

      {/* PAYMENT HISTORY */}
      <section className="payment-history-section">

        <div className="section-heading">
          <div>
            <h2>
              Payment History
            </h2>

            <p>
              View your session and package payments.
            </p>
          </div>
        </div>

        {loadingPayments ? (
          <div className="session-card">
            <p>
              Loading payment history...
            </p>
          </div>
        ) : payments.length === 0 ? (
          <div className="session-card">
            <p>
              No payments yet.
            </p>
          </div>
        ) : (
          <div className="payment-history-list">

            {payments.map((payment) => {

              const isPackage =
                Boolean(
                  payment.clientPackage
                );

              const packageData =
                payment.clientPackage?.package;

              const appointment =
                payment.appointment;

              const paymentDescription =
                isPackage
                  ? packageData?.name ||
                    "Session Package"
                  : "Therapy Session";

              return (
                <div
                  className="payment-history-card"
                  key={payment._id}
                >

                  <div className="payment-history-main">

                    <div>
                      <span className="payment-label">
                        {isPackage
                          ? "PACKAGE PAYMENT"
                          : "SESSION PAYMENT"}
                      </span>

                      <h3>
                        {paymentDescription}
                      </h3>

                      {isPackage ? (
                        <p>
                          {payment.clientPackage
                            ?.sessionsPurchased ||
                            0}{" "}
                          sessions purchased
                        </p>
                      ) : (
                        <p>
                          {appointment?.date
                            ? formatShortDate(
                                appointment.date
                              )
                            : "Session payment"}
                        </p>
                      )}
                    </div>

                    <div className="payment-amount">
                      ₹
                      {Number(
                        payment.amount || 0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </div>

                  </div>

                  <div className="payment-history-details">

                    <div>
                      <span>
                        Date
                      </span>

                      <strong>
                        {formatShortDate(
                          payment.createdAt
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Status
                      </span>

                      <strong
                        className={
                          payment.status ===
                          "captured"
                            ? "payment-status-success"
                            : ""
                        }
                      >
                        {(
                          payment.status ||
                          "unknown"
                        ).toUpperCase()}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Payment ID
                      </span>

                      <strong>
                        {payment.gatewayTransactionId ||
                          "N/A"}
                      </strong>
                    </div>

                  </div>

                  {payment.invoiceFileName && (
                    <button
                      type="button"
                      className="payment-invoice-button"
                      onClick={() =>
                        handleDownloadInvoice(
                          payment.invoiceFileName
                        )
                      }
                    >
                      Download Invoice
                    </button>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* AVAILABLE SESSION PACKAGES */}
      <section className="packages-section">

        <div className="section-heading">
          <div>
            <h2>
              Session Packages
            </h2>

            <p>
              Save with a package of
              sessions from your therapist.
            </p>
          </div>
        </div>

        {packageMessage && (
          <div className="package-success">
            {packageMessage}
          </div>
        )}

        {packageError && (
          <div className="package-error">
            {packageError}
          </div>
        )}

        {loadingPackages ? (

          <div className="packages-container">
            <div className="package-empty">
              <p>
                Loading available packages...
              </p>
            </div>
          </div>

        ) : packages.length === 0 ? (

          <div className="packages-container">
            <div className="package-empty">

              <div className="package-empty-icon">
                ▤
              </div>

              <h3>
                No packages available
              </h3>

              <p>
                Your therapist hasn't added
                any session packages yet.
              </p>

            </div>
          </div>

        ) : (

          <div className="packages-grid">

            {packages.map((pkg) => {

              const purchased =
                isPackagePurchased(
                  pkg._id
                );

              return (
                <div
                  className="user-package-card"
                  key={pkg._id}
                >

                  <div className="package-card-header">

                    <div>

                      <span className="package-label">
                        SESSION PACKAGE
                      </span>

                      <h3>
                        {pkg.name}
                      </h3>

                    </div>

                    <div className="package-session-count">
                      {pkg.sessions}
                    </div>

                  </div>

                  <div className="package-main-price">

                    <strong>
                      ₹
                      {Number(
                        pkg.pricePerSession || 0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                    <span>
                      / session
                    </span>

                  </div>

                  <div className="package-details">

                    <div>
                      <span>
                        Sessions
                      </span>

                      <strong>
                        {pkg.sessions}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total
                      </span>

                      <strong>
                        ₹
                        {Number(
                          pkg.totalPrice || 0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Valid for
                      </span>

                      <strong>
                        {pkg.expiryDays} days
                      </strong>
                    </div>

                  </div>

                  <button
                    className="package-buy-button"
                    onClick={() =>
                      handlePurchasePackage(
                        pkg._id
                      )
                    }
                    disabled={
                      purchased ||
                      purchasingPackage ===
                        pkg._id
                    }
                  >
                    {purchasingPackage ===
                    pkg._id
                      ? "Processing..."
                      : purchased
                      ? "✓ Package Active"
                      : "Buy Package"}
                  </button>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* QUICK ACTIONS */}
      <section className="quick-actions-section">

        <div className="section-heading">
          <h2>
            Quick Actions
          </h2>
        </div>

        <div className="quick-actions">

          <Link
            to="/therapists"
            className="quick-action"
          >
            Find a Therapist
          </Link>

          <Link
            to="/sessions"
            className="quick-action"
          >
            My Sessions
          </Link>

          <Link
            to="/intake-form"
            className="quick-action"
          >
            Intake Form
          </Link>

          <Link
            to="/user-profile"
            className="quick-action"
          >
            My Profile
          </Link>

        </div>

      </section>

      {/* RECENT SESSION */}
      <section className="recent-session-section">

        <div className="section-heading">
          <h2>
            Recent Session
          </h2>
        </div>

        {loading ? (

          <div className="recent-session-card">
            <p>
              Loading...
            </p>
          </div>

        ) : recentAppointment ? (

          <div className="recent-session-card">

            <div>
              <h3>
                {getTherapistName(
                  recentAppointment
                )}
              </h3>

              <p>
                {getSpecialization(
                  recentAppointment
                )}
              </p>
            </div>

            <div>
              <strong>
                {formatShortDate(
                  recentAppointment.date
                )}
              </strong>

              <p>
                {recentAppointment.time ||
                  "Time unavailable"}
              </p>
            </div>

            <span className="completed-status">
              COMPLETED
            </span>

          </div>

        ) : (

          <div className="recent-session-card">
            <p>
              No completed sessions yet.
            </p>
          </div>

        )}

      </section>

      {/* SUPPORT */}
      <section className="support-section">

        <div className="support-content">

          <div>
            <h2>
              Need support?
            </h2>

            <p>
              Connect with a therapist
              who understands what
              you're going through.
            </p>
          </div>

          <Link to="/therapists">
            Find a Therapist
          </Link>

        </div>

      </section>

    </div>
  );
}

export default UserDashboard;