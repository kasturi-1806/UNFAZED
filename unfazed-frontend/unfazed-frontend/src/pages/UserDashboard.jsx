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

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt")
    );
  };

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
          "https://unfazed-692q.onrender.com/api/appointments/user",
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
              "Failed to fetch appointments"
          );
        }

        const appointmentList =
          data.appointments ||
          data.data ||
          (Array.isArray(data) ? data : []);

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

  const fetchMyPackages = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      setLoadingMyPackages(true);

      const response = await fetch(
        "https://unfazed-692q.onrender.com/api/client-packages/my",
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

  useEffect(() => {
    const fetchPayments = async () => {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        setLoadingPayments(true);

        const response = await fetch(
          "https://unfazed-692q.onrender.com/api/payments/my",
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
        setPackages([]);
        return;
      }

      try {
        setLoadingPackages(true);
        setPackageError("");

        const response = await fetch(
          `https://unfazed-692q.onrender.com/api/packages/therapist/${therapistId}`
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
            "Unable to load session packages."
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

      const purchaseResponse =
        await fetch(
          "https://unfazed-692q.onrender.com/api/client-packages/purchase",
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

      if (!window.Razorpay) {
        await new Promise(
          (resolve, reject) => {
            const script =
              document.createElement(
                "script"
              );

            script.src =
              "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = resolve;

            script.onerror = () =>
              reject(
                new Error(
                  "Unable to load Razorpay checkout."
                )
              );

            document.body.appendChild(
              script
            );
          }
        );
      }

      const orderResponse =
        await fetch(
          "https://unfazed-692q.onrender.com/api/client-packages/razorpay/order",
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

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency:
          orderData.order.currency ||
          "INR",
        name: "UNFAZED",
        description:
          "Therapy Session Package",
        order_id:
          orderData.order.id,

        handler: async function (
          response
        ) {
          try {
            setPackageMessage(
              "Payment received. Verifying your payment..."
            );

            setPackageError("");

            const verifyResponse =
              await fetch(
                "https://unfazed-692q.onrender.com/api/client-packages/razorpay/verify",
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

            setPackageMessage(
              verifyData.invoice
                ? "Package purchased successfully! Payment verified and invoice generated."
                : "Package purchased successfully! Payment verified."
            );

            await fetchMyPackages();
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
            setPurchasingPackage(
              null
            );
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

  const refreshPayments = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        "https://unfazed-692q.onrender.com/api/payments/my",
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
        `https://unfazed-692q.onrender.com/api/payments/invoice/${encodeURIComponent(
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
          // Ignore non-JSON response
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

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(
      date
    ).toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatShortDate = (
    date
  ) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(
      date
    ).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTherapistName = (
    appointment
  ) => {
    return (
      appointment?.therapist?.name ||
      appointment?.therapistName ||
      "Therapist"
    );
  };

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

  const getStatus = (
    appointment
  ) => {
    if (!appointment?.status) {
      return "PENDING";
    }

    return appointment.status.toUpperCase();
  };

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

  useEffect(() => {
    if (!appointments.length) {
      setChatMessages([]);
      return;
    }

    const therapistId =
      chatTherapistId;

    if (!therapistId) {
      setChatMessages([]);
      return;
    }

    const token = getToken();

    const storedUser =
      JSON.parse(
        localStorage.getItem("user") || "{}"
      );

    const currentUserId =
      storedUser.id ||
      storedUser._id;

    if (!token || !currentUserId) {
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);

        const response = await fetch(
          `https://unfazed-692q.onrender.com/api/messages/therapist/${therapistId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

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

    const socket = io(
      "https://unfazed-692q.onrender.com",
      {
        transports: ["websocket"],
      }
    );

    socket.on("connect", () => {
      socket.emit("joinRoom", {
        userId: currentUserId,
        role: "user",
      });
    });

    socket.on(
      "newMessage",
      (newMessage) => {
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

    return () => {
      socket.disconnect();
    };
  }, [
    appointments,
    chatTherapistId,
  ]);

  const statUpcoming =
    upcomingAppointment
      ? formatShortDate(
          upcomingAppointment.date
        )
      : "—";

  const statCompleted =
    completedAppointments.length;

  const statPayments =
    payments.length;

  return (
    <div className="ud-page">
      <style>{`
        .ud-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top right,
              rgba(49, 95, 81, 0.08),
              transparent 28%
            ),
            #f7f8f5;
          color: #203d35;
          padding: 28px 24px 50px;
          box-sizing: border-box;
        }

        .ud-shell {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .ud-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 26px;
          padding: 28px;
          border-radius: 24px;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #eef5f1 100%
          );
          border: 1px solid #dfeae3;
          box-shadow: 0 10px 30px rgba(32, 61, 53, 0.06);
        }

        .ud-brand {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 12px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.6px;
          color: #315f51;
        }

        .ud-brand-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #315f51;
        }

        .ud-header h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.08;
          letter-spacing: -0.8px;
        }

        .ud-header p {
          margin: 10px 0 0;
          color: #71807a;
          font-size: 15px;
          line-height: 1.6;
          max-width: 560px;
        }

        .ud-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ud-logout {
          border: 1px solid #d5e1db;
          background: #ffffff;
          color: #315f51;
          text-decoration: none;
          padding: 10px 15px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
        }

        .ud-section {
          margin-top: 24px;
        }

        .ud-section-title {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 14px;
        }

        .ud-section-title h2 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.2px;
        }

        .ud-section-title p {
          margin: 5px 0 0;
          color: #7b8983;
          font-size: 13px;
        }

        .ud-stat-grid {
          display: grid;
          grid-template-columns: repeat(
            4,
            minmax(0, 1fr)
          );
          gap: 14px;
        }

        .ud-stat {
          background: #ffffff;
          border: 1px solid #dfeae3;
          border-radius: 18px;
          padding: 19px;
          box-shadow: 0 7px 22px rgba(32, 61, 53, 0.04);
        }

        .ud-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .ud-stat-label {
          color: #7a8b85;
          font-size: 12px;
          font-weight: 600;
        }

        .ud-stat-icon {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #eef5f1;
          color: #315f51;
          font-size: 15px;
        }

        .ud-stat-value {
          display: block;
          margin-top: 14px;
          font-size: 22px;
          font-weight: 800;
          color: #203d35;
        }

        .ud-card {
          background: #ffffff;
          border: 1px solid #dfeae3;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 7px 22px rgba(32, 61, 53, 0.04);
        }

        .ud-upcoming {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 18px;
        }

        .ud-session-main {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 240px;
        }

        .ud-kicker {
          display: inline-flex;
          width: fit-content;
          padding: 6px 10px;
          border-radius: 999px;
          background: #eef5f1;
          color: #315f51;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
        }

        .ud-therapist {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 18px;
        }

        .ud-avatar {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          background: #dfeae3;
          color: #315f51;
          font-size: 22px;
          font-weight: 800;
        }

        .ud-therapist h3 {
          margin: 0;
          font-size: 19px;
        }

        .ud-therapist p {
          margin: 5px 0 0;
          color: #788983;
          font-size: 13px;
        }

        .ud-session-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
          margin-top: 25px;
        }

        .ud-session-meta {
          display: grid;
          grid-template-columns: repeat(
            3,
            minmax(0, 1fr)
          );
          gap: 10px;
          flex: 1;
        }

        .ud-meta-item {
          padding: 12px;
          background: #f7faf8;
          border-radius: 12px;
        }

        .ud-meta-item span {
          display: block;
          color: #84938d;
          font-size: 11px;
          margin-bottom: 5px;
        }

        .ud-meta-item strong {
          display: block;
          font-size: 12px;
          color: #315f51;
          line-height: 1.4;
        }

        .ud-status {
          padding: 7px 10px;
          border-radius: 999px;
          background: #e5f3ea;
          color: #28704c;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.7px;
          white-space: nowrap;
        }

        .ud-side-panel {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 14px;
          background: #203d35;
          color: #ffffff;
          border-radius: 18px;
          padding: 22px;
        }

        .ud-side-panel span {
          font-size: 11px;
          color: #c4d6ce;
        }

        .ud-side-panel h3 {
          margin: 8px 0 0;
          font-size: 20px;
        }

        .ud-side-panel p {
          margin: 7px 0 0;
          color: #d4e0db;
          font-size: 13px;
          line-height: 1.5;
        }

        .ud-dark-link {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          width: fit-content;
          text-decoration: none;
          padding: 10px 14px;
          border-radius: 10px;
          background: #ffffff;
          color: #203d35;
          font-size: 12px;
          font-weight: 700;
        }

        .ud-empty {
          text-align: center;
          padding: 34px 18px;
        }

        .ud-empty-icon {
          width: 46px;
          height: 46px;
          margin: 0 auto 13px;
          border-radius: 14px;
          background: #eef5f1;
          color: #315f51;
          display: grid;
          place-items: center;
          font-size: 20px;
        }

        .ud-empty h3 {
          margin: 0;
          font-size: 17px;
        }

        .ud-empty p {
          margin: 7px 0 15px;
          color: #7b8983;
          font-size: 13px;
        }

        .ud-primary-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          background: #315f51;
          color: #ffffff;
          text-decoration: none;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .ud-message {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }

        .ud-message-main {
          min-width: 0;
        }

        .ud-message-main h3 {
          margin: 7px 0 5px;
          font-size: 17px;
        }

        .ud-message-main p {
          margin: 0;
          color: #71807a;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 650px;
        }

        .ud-message-time {
          margin-top: 9px;
          display: block;
          color: #9aa7a2;
          font-size: 11px;
        }

        .ud-action-link {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          padding: 10px 14px;
          border: 1px solid #d5e1db;
          color: #315f51;
          background: #ffffff;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .ud-package-grid {
          display: grid;
          grid-template-columns: repeat(
            3,
            minmax(0, 1fr)
          );
          gap: 15px;
        }

        .ud-package {
          padding: 19px;
          border-radius: 17px;
          background: #ffffff;
          border: 1px solid #dfeae3;
          box-shadow: 0 7px 22px rgba(32, 61, 53, 0.04);
        }

        .ud-package-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .ud-package-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #315f51;
        }

        .ud-package h3 {
          margin: 7px 0 0;
          font-size: 17px;
        }

        .ud-count {
          min-width: 40px;
          height: 40px;
          padding: 0 8px;
          border-radius: 12px;
          background: #eef5f1;
          color: #315f51;
          display: grid;
          place-items: center;
          font-size: 15px;
          font-weight: 800;
        }

        .ud-package-price {
          margin-top: 19px;
        }

        .ud-package-price strong {
          display: block;
          font-size: 27px;
          color: #203d35;
        }

        .ud-package-price span {
          color: #83928c;
          font-size: 11px;
        }

        .ud-package-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 17px;
          padding-top: 15px;
          border-top: 1px solid #edf2ef;
        }

        .ud-package-details span {
          display: block;
          color: #8a9792;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .ud-package-details strong {
          font-size: 11px;
        }

        .ud-buy {
          width: 100%;
          margin-top: 16px;
          border: none;
          padding: 11px;
          border-radius: 10px;
          background: #315f51;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .ud-buy:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .ud-success {
          margin-bottom: 14px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #e8f5ed;
          color: #28704c;
          font-size: 13px;
        }

        .ud-error {
          margin-bottom: 14px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #fdecec;
          color: #a34b4b;
          font-size: 13px;
        }

        .ud-payment-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ud-payment {
          padding: 17px;
          border: 1px solid #e3ebe6;
          border-radius: 14px;
          background: #fbfcfb;
        }

        .ud-payment-main {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
        }

        .ud-payment-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.9px;
          color: #315f51;
        }

        .ud-payment h3 {
          margin: 6px 0 4px;
          font-size: 15px;
        }

        .ud-payment p {
          margin: 0;
          color: #82918b;
          font-size: 12px;
        }

        .ud-payment-amount {
          font-size: 18px;
          font-weight: 800;
          white-space: nowrap;
        }

        .ud-payment-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 14px;
          padding-top: 13px;
          border-top: 1px solid #e9efeb;
        }

        .ud-payment-details span {
          display: block;
          color: #8a9792;
          font-size: 10px;
          margin-bottom: 4px;
        }

        .ud-payment-details strong {
          display: block;
          font-size: 11px;
          word-break: break-word;
        }

        .ud-payment-success {
          color: #28704c;
        }

        .ud-invoice {
          margin-top: 13px;
          border: 1px solid #d5e1db;
          background: #ffffff;
          color: #315f51;
          border-radius: 9px;
          padding: 9px 12px;
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
        }

        .ud-actions {
          display: grid;
          grid-template-columns: repeat(
            4,
            minmax(0, 1fr)
          );
          gap: 12px;
        }

        .ud-action-card {
          text-decoration: none;
          background: #ffffff;
          border: 1px solid #dfeae3;
          border-radius: 16px;
          padding: 18px;
          color: #203d35;
          transition:
            transform 0.18s ease,
            border-color 0.18s ease;
        }

        .ud-action-card:hover {
          transform: translateY(-2px);
          border-color: #b7cec3;
        }

        .ud-action-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #eef5f1;
          color: #315f51;
          margin-bottom: 12px;
          font-size: 17px;
        }

        .ud-action-card strong {
          display: block;
          font-size: 13px;
        }

        .ud-action-card span {
          display: block;
          margin-top: 4px;
          color: #83918c;
          font-size: 11px;
          line-height: 1.4;
        }

        .ud-recent {
          display: grid;
          grid-template-columns: 1.4fr 1fr auto;
          align-items: center;
          gap: 18px;
        }

        .ud-recent h3 {
          margin: 0;
          font-size: 16px;
        }

        .ud-recent p {
          margin: 5px 0 0;
          color: #82908b;
          font-size: 12px;
        }

        .ud-recent-date strong {
          font-size: 12px;
        }

        .ud-recent-date p {
          margin: 4px 0 0;
        }

        .ud-completed {
          padding: 7px 10px;
          border-radius: 999px;
          background: #e5f3ea;
          color: #28704c;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.8px;
          white-space: nowrap;
        }

        .ud-support {
          margin-top: 26px;
          padding: 24px;
          border-radius: 20px;
          background: #315f51;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }

        .ud-support h2 {
          margin: 0;
          font-size: 20px;
        }

        .ud-support p {
          margin: 6px 0 0;
          color: #d4e0db;
          font-size: 13px;
        }

        .ud-support a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 15px;
          border-radius: 10px;
          background: #ffffff;
          color: #315f51;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        @media (max-width: 1000px) {
          .ud-stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .ud-package-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .ud-actions {
            grid-template-columns: repeat(2, 1fr);
          }

          .ud-upcoming {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 680px) {
          .ud-page {
            padding: 16px 14px 35px;
          }

          .ud-header {
            padding: 21px;
            border-radius: 20px;
            flex-direction: column;
          }

          .ud-header-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .ud-stat-grid,
          .ud-package-grid,
          .ud-actions {
            grid-template-columns: 1fr;
          }

          .ud-session-bottom {
            flex-direction: column;
            align-items: stretch;
          }

          .ud-session-meta {
            grid-template-columns: 1fr;
          }

          .ud-message {
            flex-direction: column;
            align-items: stretch;
          }

          .ud-message-main p {
            max-width: 100%;
          }

          .ud-payment-main {
            flex-direction: column;
          }

          .ud-payment-details {
            grid-template-columns: 1fr;
          }

          .ud-recent {
            grid-template-columns: 1fr;
            align-items: flex-start;
          }

          .ud-support {
            flex-direction: column;
            align-items: flex-start;
          }

          .ud-support a {
            width: 100%;
          }
        }
      `}</style>

      <div className="ud-shell">
        {/* HEADER */}
        <header className="ud-header">
          <div>
            <div className="ud-brand">
              <span className="ud-brand-dot" />
              UNFAZED
            </div>

            <h1>Welcome back 👋</h1>

            <p>
              Your mental wellness journey,
              thoughtfully organized in one
              place.
            </p>
          </div>

          <div className="ud-header-actions">
            <NotificationBell />

            <Link
              to="/login"
              className="ud-logout"
            >
              Logout
            </Link>
          </div>
        </header>

        {/* SUMMARY */}
        <section className="ud-section">
          <div className="ud-stat-grid">
            <div className="ud-stat">
              <div className="ud-stat-top">
                <span className="ud-stat-label">
                  Next Session
                </span>

                <div className="ud-stat-icon">
                  📅
                </div>
              </div>

              <strong className="ud-stat-value">
                {statUpcoming}
              </strong>
            </div>

            <div className="ud-stat">
              <div className="ud-stat-top">
                <span className="ud-stat-label">
                  Active Packages
                </span>

                <div className="ud-stat-icon">
                  🎟
                </div>
              </div>

              <strong className="ud-stat-value">
                {loadingMyPackages
                  ? "..."
                  : myPackages.length}
              </strong>
            </div>

            <div className="ud-stat">
              <div className="ud-stat-top">
                <span className="ud-stat-label">
                  Completed Sessions
                </span>

                <div className="ud-stat-icon">
                  ✓
                </div>
              </div>

              <strong className="ud-stat-value">
                {statCompleted}
              </strong>
            </div>

            <div className="ud-stat">
              <div className="ud-stat-top">
                <span className="ud-stat-label">
                  Payments
                </span>

                <div className="ud-stat-icon">
                  ₹
                </div>
              </div>

              <strong className="ud-stat-value">
                {statPayments}
              </strong>
            </div>
          </div>
        </section>

        {/* UPCOMING SESSION */}
        <section className="ud-section">
          <div className="ud-section-title">
            <div>
              <h2>Upcoming Session</h2>
              <p>
                Your next scheduled therapy
                session.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="ud-card ud-empty">
              <p>Loading your upcoming session...</p>
            </div>
          ) : error ? (
            <div className="ud-card ud-empty">
              <p>{error}</p>
            </div>
          ) : upcomingAppointment ? (
            <div className="ud-upcoming">
              <div className="ud-card ud-session-main">
                <div>
                  <span className="ud-kicker">
                    UPCOMING APPOINTMENT
                  </span>

                  <div className="ud-therapist">
                    <div className="ud-avatar">
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
                </div>

                <div className="ud-session-bottom">
                  <div className="ud-session-meta">
                    <div className="ud-meta-item">
                      <span>Date</span>
                      <strong>
                        {formatDate(
                          upcomingAppointment.date
                        )}
                      </strong>
                    </div>

                    <div className="ud-meta-item">
                      <span>Time</span>
                      <strong>
                        {upcomingAppointment.time ||
                          "Time unavailable"}
                      </strong>
                    </div>

                    <div className="ud-meta-item">
                      <span>Duration</span>
                      <strong>
                        {upcomingAppointment.duration ||
                          50}{" "}
                        minutes
                      </strong>
                    </div>
                  </div>

                  <span className="ud-status">
                    {getStatus(
                      upcomingAppointment
                    )}
                  </span>
                </div>
              </div>

              <div className="ud-side-panel">
                <div>
                  <span>SESSION CARE</span>

                  <h3>
                    Stay connected with your
                    therapist.
                  </h3>

                  <p>
                    Send a message before your
                    next session or continue your
                    conversation.
                  </p>
                </div>

                {chatTherapistId && (
                  <Link
                    to={`/chat/therapist/${chatTherapistId}`}
                    className="ud-dark-link"
                  >
                    Open Chat
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="ud-card ud-empty">
              <div className="ud-empty-icon">
                📅
              </div>

              <h3>
                No upcoming sessions
              </h3>

              <p>
                Find a therapist and schedule
                your next session.
              </p>

              <Link
                to="/therapists"
                className="ud-primary-link"
              >
                Find a Therapist
              </Link>
            </div>
          )}
        </section>

        {/* MESSAGES */}
        <section className="ud-section">
          <div className="ud-section-title">
            <div>
              <h2>Messages</h2>
              <p>
                Stay connected with your therapist.
              </p>
            </div>
          </div>

          <div className="ud-card">
            {loadingMessages ? (
              <div className="ud-empty">
                <p>Loading messages...</p>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="ud-empty">
                <div className="ud-empty-icon">
                  💬
                </div>

                <h3>
                  No messages yet
                </h3>

                <p>
                  Start a conversation with your
                  therapist.
                </p>

                {chatTherapistId && (
                  <Link
                    to={`/chat/therapist/${chatTherapistId}`}
                    className="ud-primary-link"
                  >
                    Start a Conversation
                  </Link>
                )}
              </div>
            ) : (
              <div className="ud-message">
                <div className="ud-message-main">
                  <span className="ud-package-label">
                    LATEST MESSAGE
                  </span>

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

                  <small className="ud-message-time">
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

                {chatTherapistId && (
                  <Link
                    to={`/chat/therapist/${chatTherapistId}`}
                    className="ud-action-link"
                  >
                    Open Chat
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* MY ACTIVE PACKAGES */}
        {myPackages.length > 0 && (
          <section className="ud-section">
            <div className="ud-section-title">
              <div>
                <h2>
                  My Active Packages
                </h2>

                <p>
                  Your available session
                  packages.
                </p>
              </div>
            </div>

            <div className="ud-package-grid">
              {myPackages.map(
                (clientPackage) => {
                  const packageData =
                    clientPackage.package || {};

                  return (
                    <div
                      className="ud-package"
                      key={
                        clientPackage._id
                      }
                    >
                      <div className="ud-package-top">
                        <div>
                          <span className="ud-package-label">
                            ACTIVE PACKAGE
                          </span>

                          <h3>
                            {packageData.name ||
                              "Session Package"}
                          </h3>
                        </div>

                        <div className="ud-count">
                          {
                            clientPackage.sessionsRemaining
                          }
                        </div>
                      </div>

                      <div className="ud-package-price">
                        <strong>
                          {
                            clientPackage.sessionsRemaining
                          }
                        </strong>

                        <span>
                          sessions remaining
                        </span>
                      </div>

                      <div className="ud-package-details">
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
                        className="ud-buy"
                        style={{
                          textDecoration:
                            "none",
                          textAlign:
                            "center",
                          display:
                            "block",
                          boxSizing:
                            "border-box",
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
        <section className="ud-section">
          <div className="ud-section-title">
            <div>
              <h2>
                Payment History
              </h2>

              <p>
                View your session and package
                payments.
              </p>
            </div>
          </div>

          <div className="ud-card">
            {loadingPayments ? (
              <div className="ud-empty">
                <p>
                  Loading payment history...
                </p>
              </div>
            ) : payments.length === 0 ? (
              <div className="ud-empty">
                <div className="ud-empty-icon">
                  ₹
                </div>

                <h3>
                  No payments yet
                </h3>

                <p>
                  Your completed payments will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="ud-payment-list">
                {payments.map((payment) => {
                  const isPackage =
                    Boolean(
                      payment.clientPackage
                    );

                  const packageData =
                    payment.clientPackage
                      ?.package;

                  const appointment =
                    payment.appointment;

                  const paymentDescription =
                    isPackage
                      ? packageData?.name ||
                        "Session Package"
                      : "Therapy Session";

                  return (
                    <div
                      className="ud-payment"
                      key={payment._id}
                    >
                      <div className="ud-payment-main">
                        <div>
                          <span className="ud-payment-label">
                            {isPackage
                              ? "PACKAGE PAYMENT"
                              : "SESSION PAYMENT"}
                          </span>

                          <h3>
                            {
                              paymentDescription
                            }
                          </h3>

                          {isPackage ? (
                            <p>
                              {payment
                                .clientPackage
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

                        <div className="ud-payment-amount">
                          ₹
                          {Number(
                            payment.amount || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </div>
                      </div>

                      <div className="ud-payment-details">
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
                                ? "ud-payment-success"
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
                          className="ud-invoice"
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
          </div>
        </section>

        {/* AVAILABLE PACKAGES */}
        <section className="ud-section">
          <div className="ud-section-title">
            <div>
              <h2>
                Session Packages
              </h2>

              <p>
                Save with a package of sessions
                from your therapist.
              </p>
            </div>
          </div>

          {packageMessage && (
            <div className="ud-success">
              {packageMessage}
            </div>
          )}

          {packageError && (
            <div className="ud-error">
              {packageError}
            </div>
          )}

          {loadingPackages ? (
            <div className="ud-card ud-empty">
              <p>
                Loading available packages...
              </p>
            </div>
          ) : packages.length === 0 ? (
            <div className="ud-card ud-empty">
              <div className="ud-empty-icon">
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
          ) : (
            <div className="ud-package-grid">
              {packages.map((pkg) => {
                const purchased =
                  isPackagePurchased(
                    pkg._id
                  );

                return (
                  <div
                    className="ud-package"
                    key={pkg._id}
                  >
                    <div className="ud-package-top">
                      <div>
                        <span className="ud-package-label">
                          SESSION PACKAGE
                        </span>

                        <h3>
                          {pkg.name}
                        </h3>
                      </div>

                      <div className="ud-count">
                        {pkg.sessions}
                      </div>
                    </div>

                    <div className="ud-package-price">
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

                    <div className="ud-package-details">
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
                      type="button"
                      className="ud-buy"
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
        <section className="ud-section">
          <div className="ud-section-title">
            <div>
              <h2>
                Quick Actions
              </h2>

              <p>
                Jump directly to the things you
                use most.
              </p>
            </div>
          </div>

          <div className="ud-actions">
            <Link
              to="/therapists"
              className="ud-action-card"
            >
              <div className="ud-action-icon">
                🔎
              </div>

              <strong>
                Find a Therapist
              </strong>

              <span>
                Explore therapists and book a
                session.
              </span>
            </Link>

            <Link
              to="/sessions"
              className="ud-action-card"
            >
              <div className="ud-action-icon">
                📅
              </div>

              <strong>
                My Sessions
              </strong>

              <span>
                Review your appointments and
                sessions.
              </span>
            </Link>

            <Link
              to="/intake-form"
              className="ud-action-card"
            >
              <div className="ud-action-icon">
                📝
              </div>

              <strong>
                Intake Form
              </strong>

              <span>
                Update your therapy intake
                information.
              </span>
            </Link>

            <Link
              to="/user-profile"
              className="ud-action-card"
            >
              <div className="ud-action-icon">
                👤
              </div>

              <strong>
                My Profile
              </strong>

              <span>
                View and manage your profile.
              </span>
            </Link>
          </div>
        </section>

        {/* RECENT SESSION */}
        <section className="ud-section">
          <div className="ud-section-title">
            <div>
              <h2>
                Recent Session
              </h2>

              <p>
                Your latest completed therapy
                session.
              </p>
            </div>
          </div>

          <div className="ud-card">
            {loading ? (
              <div className="ud-empty">
                <p>Loading...</p>
              </div>
            ) : recentAppointment ? (
              <div className="ud-recent">
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

                <div className="ud-recent-date">
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

                <span className="ud-completed">
                  COMPLETED
                </span>
              </div>
            ) : (
              <div className="ud-empty">
                <div className="ud-empty-icon">
                  ✓
                </div>

                <h3>
                  No completed sessions yet
                </h3>

                <p>
                  Your completed sessions will
                  appear here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* SUPPORT */}
        <section className="ud-support">
          <div>
            <h2>
              Need support?
            </h2>

            <p>
              Connect with a therapist who
              understands what you're going
              through.
            </p>
          </div>

          <Link to="/therapists">
            Find a Therapist
          </Link>
        </section>
      </div>
    </div>
  );
}

export default UserDashboard;