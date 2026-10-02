import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../App.css";
function Booking() {
  const { slug } = useParams();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarAvailability, setCalendarAvailability] = useState({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [reason, setReason] = useState("General Consultation");
  const [message, setMessage] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [myPackages, setMyPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const SESSION_FEE = 500;
  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt")
    );
  };

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existingScript) {
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("Razorpay Checkout loaded");
    };
    script.onerror = () => {
      console.error(
        "Failed to load Razorpay Checkout"
      );
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const fetchTherapist = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/therapists/${slug}`
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load therapist"
          );
        }
        setTherapist(data.therapist);
      } catch (error) {
        console.error(
          "Booking therapist error:",
          error
        );
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTherapist();
  }, [slug]);

  useEffect(() => {
    const fetchCalendarAvailability = async () => {
      if (!slug) return;
      try {
        setCalendarLoading(true);
        const year = calendarMonth.getFullYear();
        const month = String(
          calendarMonth.getMonth() + 1
        ).padStart(2, "0");
        const response = await fetch(
          `http://localhost:5000/api/availability/public/${slug}/calendar?month=${year}-${month}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load calendar availability"
          );
        }
        setCalendarAvailability(
          data.dates || {}
        );
      } catch (error) {
        console.error(
          "Calendar availability error:",
          error
        );
        setCalendarAvailability({});
      } finally {
        setCalendarLoading(false);
      }
    };
    fetchCalendarAvailability();
  }, [slug, calendarMonth]);

  const formatCalendarDate = (value) => {
    const year = value.getFullYear();
    const month = String(
      value.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      value.getDate()
    ).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleCalendarChange = (value) => {
    if (!(value instanceof Date)) return;
    const dateKey = formatCalendarDate(value);
    const dateInfo =
      calendarAvailability[dateKey];
    if (!dateInfo || !dateInfo.available) {
      return;
    }
    setDate(dateKey);
    setTime("");
    setError("");
    setMessage("");
  };

  useEffect(() => {
    const fetchMyPackages = async () => {
      const token = getToken();
      if (!token) {
        setMyPackages([]);
        return;
      }
      try {
        setPackagesLoading(true);
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
        const activePackages =
          (data.clientPackages || []).filter(
            (item) => {
              const packageTherapist =
                item.therapist?._id ||
                item.therapist;
              const matchesTherapist =
                !packageTherapist ||
                String(packageTherapist) ===
                  String(therapist?._id);
              return (
                matchesTherapist &&
                item.paymentStatus === "paid" &&
                item.status === "active" &&
                Number(item.sessionsRemaining) > 0 &&
                new Date(item.expiryDate) >=
                  new Date()
              );
            }
          );
        setMyPackages(activePackages);
      } catch (error) {
        console.error(
          "BOOKING MY PACKAGES ERROR:",
          error
        );
        setMyPackages([]);
      } finally {
        setPackagesLoading(false);
      }
    };
    if (therapist?._id) {
      fetchMyPackages();
    }
  }, [therapist]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!date || !slug) {
        setSlots([]);
        setTime("");
        return;
      }
      try {
        setSlotsLoading(true);
        setTime("");
        setError("");
        const response = await fetch(
          `http://localhost:5000/api/availability/public/${slug}/slots?date=${date}`
        );
        const data = await response.json();
        console.log(
          "SLOTS API RESPONSE:",
          data
        );
        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load available slots"
          );
        }
        setSlots(data.slots || []);
      } catch (error) {
        console.error(
          "Fetch slots error:",
          error
        );
        setSlots([]);
        setError(error.message);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [date, slug]);

  const formatTime = (time) => {
    const [hours, minutes] =
      time.split(":");
    let hour = Number(hours);
    const period =
      hour >= 12 ? "PM" : "AM";
    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }
    return `${String(hour).padStart(
      2,
      "0"
    )}:${minutes} ${period}`;
  };

  const handleSelectPackage = (
    clientPackage
  ) => {
    if (
      selectedPackage?._id ===
      clientPackage._id
    ) {
      setSelectedPackage(null);
      return;
    }
    setSelectedPackage(clientPackage);
    setMessage("");
    setError("");
  };
  
  const verifyRazorpayPayment = async ({
    response,
    appointment,
    token,
  }) => {
    try {
      setPaymentLoading(true);
      setError("");
      setMessage(
        "Payment received. Verifying your payment..."
      );
      console.log(
        "Sending Razorpay payment for verification:",
        response
      );
      const verificationResponse =
        await fetch(
          "http://localhost:5000/api/payments/razorpay/verify",
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

      const verificationData =
        await verificationResponse.json();
      console.log(
        "RAZORPAY VERIFICATION RESPONSE:",
        verificationData
      );
      if (!verificationResponse.ok) {
        throw new Error(
          verificationData.message ||
            "Payment verification failed"
        );
      }
      if (!verificationData.success) {
        throw new Error(
          verificationData.message ||
            "Payment verification failed"
        );
      }
      
      const invoiceMessage =
        verificationData.invoice
          ? " Your invoice has also been generated."
          : "";
      setMessage(
        `Payment successful! Your session with ${
          therapist.name
        } is booked for ${date} at ${formatTime(
          time
        )}.${invoiceMessage}`
      );

      localStorage.setItem(
        "intakeTherapistId",
        therapist._id
      );
      localStorage.setItem(
        "intakeTherapistName",
        therapist.name
      );

      setDate("");
      setTime("");
      setReason(
        "General Consultation"
      );
      setSelectedPackage(null);
      console.log(
        "Razorpay payment verified successfully for appointment:",
        appointment._id
      );
      return true;
    } catch (error) {
      console.error(
        "Razorpay verification error:",
        error
      );
      setError(
        error.message ||
          "Payment verification failed. Please contact support if money was deducted."
      );
      return false;
    } finally {
      setPaymentLoading(false);
    }
  };

  const openRazorpayCheckout = ({
    order,
    keyId,
    appointment,
    token,
  }) => {
    if (!window.Razorpay) {
      throw new Error(
        "Razorpay Checkout is still loading. Please try again."
      );
    }
    if (!keyId) {
      throw new Error(
        "Razorpay key is missing."
      );
    }
    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: "UNFAZED",
      description: "Therapy Session",
      order_id: order.id,
      handler: async function (response) {
        console.log(
          "RAZORPAY PAYMENT RESPONSE:",
          response
        );

        await verifyRazorpayPayment({
          response,
          appointment,
          token,
        });
      },
      modal: {
        ondismiss: function () {
          console.log(
            "Razorpay Checkout closed"
          );
          setPaymentLoading(false);
          setError(
            "Payment was cancelled or the Razorpay checkout was closed."
          );
        },
      },
      theme: {
        color: "#315f51",
      },
    };

    const razorpayInstance =
      new window.Razorpay(options);
    razorpayInstance.on(
      "payment.failed",
      function (response) {
        console.error(
          "RAZORPAY PAYMENT FAILED:",
          response
        );
        setPaymentLoading(false);
        setError(
          response?.error?.description ||
            "Razorpay payment failed. Please try again."
        );
      }
    );
    razorpayInstance.open();
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    const token = getToken();
    if (!token) {
      setError(
        "Please login before booking a session."
      );
      return;
    }
    if (!date || !time || !reason) {
      setError(
        "Please fill in all the fields."
      );
      return;
    }
    if (!therapist) {
      setError(
        "Therapist information is missing."
      );
      return;
    }
    try {
      setPaymentLoading(true);
      const appointmentDateTime =
        `${date}T${time}`;
      const requestBody = {
        therapistId: therapist._id,
        date: appointmentDateTime,
        time: time,
        duration: 50,
        notes: reason,
      };

      if (selectedPackage) {
        requestBody.clientPackageId =
          selectedPackage._id;
      }
      console.log(
        "BOOKING REQUEST:",
        requestBody
      );
      const appointmentResponse =
        await fetch(
          "http://localhost:5000/api/appointments",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(
              requestBody
            ),
          }
        );
      const appointmentData =
        await appointmentResponse.json();
      console.log(
        "BOOKING RESPONSE:",
        appointmentData
      );
      if (!appointmentResponse.ok) {
        throw new Error(
          appointmentData.message ||
            "Booking failed"
        );
      }
      const appointment =
        appointmentData.appointment;
      if (selectedPackage) {
        const remainingSessions =
          appointmentData.sessionsRemaining ??
          Math.max(
            Number(
              selectedPackage.sessionsRemaining
            ) - 1,
            0
          );
        setMessage(
          `Session booked successfully using your package with ${therapist.name} for ${date} at ${formatTime(
            time
          )}. ${remainingSessions} session${
            remainingSessions === 1
              ? ""
              : "s"
          } remaining.`
        );
        setMyPackages(
          (currentPackages) =>
            currentPackages
              .map((pkg) => {
                if (
                  pkg._id ===
                  selectedPackage._id
                ) {
                  return {
                    ...pkg,
                    sessionsRemaining:
                      remainingSessions,
                    status:
                      remainingSessions ===
                      0
                        ? "completed"
                        : pkg.status,
                  };
                }
                return pkg;
              })
              .filter(
                (pkg) =>
                  Number(
                    pkg.sessionsRemaining
                  ) > 0
              )
        );
        setSelectedPackage(null);
        localStorage.setItem(
          "intakeTherapistId",
          therapist._id
        );
        localStorage.setItem(
          "intakeTherapistName",
          therapist.name
        );
        setDate("");
        setTime("");
        setReason(
          "General Consultation"
        );
        setPaymentLoading(false);
        return;
      }
      console.log(
        "Creating Razorpay order for appointment:",
        appointment._id
      );
      const paymentResponse =
        await fetch(
          "http://localhost:5000/api/payments/razorpay/order",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              appointmentId:
                appointment._id,
            }),
          }
        );
      const paymentData =
        await paymentResponse.json();
      console.log(
        "RAZORPAY ORDER RESPONSE:",
        paymentData
      );
      if (!paymentResponse.ok) {
        throw new Error(
          paymentData.message ||
            "Failed to create Razorpay order"
        );
      }
      if (
        !paymentData.order ||
        !paymentData.order.id
      ) {
        throw new Error(
          "Razorpay order was not created correctly."
        );
      }
      openRazorpayCheckout({
        order: paymentData.order,
        keyId: paymentData.keyId,
        appointment,
        token,
      });
    } catch (error) {
      console.error(
        "Booking/payment error:",
        error
      );
      setError(error.message);
      setPaymentLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-card">
          <h1>
            Loading therapist...
          </h1>
        </div>
      </div>
    );
  }

  if (error && !therapist) {
    return (
      <div className="booking-page">
        <div className="booking-card">
          <h1>
            Therapist Not Found
          </h1>
          <p>{error}</p>
          <Link
            to="/therapists"
            className="back-btn booking-back"
          >
            Back to Therapists
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="booking-page">
      <div className="booking-card">
        <p className="section-label">
          UNFAZED
        </p>
        <h1>
          Book a Session
        </h1>
        <p className="booking-subtitle">
          Schedule a session with your
          therapist.
        </p>
        <div className="booking-therapist">
          <div className="booking-avatar">
            {therapist.name
              ?.replace("Dr. ", "")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <h2>
              {therapist.name}
            </h2>

            <p>
              {therapist.specializations
                ?.length > 0
                ? therapist
                    .specializations[0]
                : "Mental Health Therapist"}
            </p>
          </div>
        </div>
        {!packagesLoading &&
          myPackages.length > 0 && (
            <div
              style={{marginBottom: "24px", padding: "18px",borderRadius: "14px", background: "#eef6f1", border: "1px solid #cfe3d7", }} >
              <div
                style={{marginBottom: "14px",}}>
                <h3 
                  style={{ margin: "0 0 5px",color: "#203d35", }}>
                  Your Active Package
                </h3>
                <p
                  style={{margin: 0,color: "#5d7068",fontSize: "14px",}} >
                  Use a remaining package
                  session instead of paying
                  ₹500.
                </p>
              </div>
              {myPackages.map(
                (clientPackage) => {
                  const packageData =
                    clientPackage.package ||
                    {};
                  const isSelected =
                    selectedPackage?._id ===
                    clientPackage._id;
                  return (
                    <div
                      key={
                        clientPackage._id
                      }
                      onClick={() =>
                        handleSelectPackage(
                          clientPackage
                        )
                      }
                      style={{
                        padding: "16px",
                        marginBottom: "10px",
                        borderRadius: "12px",
                        cursor: "pointer",
                        background:
                          isSelected
                            ? "#dfeae3"
                            : "#ffffff",
                        border: isSelected
                          ? "2px solid #315f51"
                          : "1px solid #d5e0da",
                        transition:
                          "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <strong
                            style={{
                              color:
                                "#203d35",
                            }}
                          >
                            {packageData.name ||
                              "Session Package"}
                          </strong>

                          <p
                            style={{
                              margin:
                                "5px 0 0",
                              fontSize:
                                "14px",
                              color:
                                "#5d7068",
                            }}
                          >
                            {
                              clientPackage.sessionsRemaining
                            }{" "}
                            session
                            {Number(
                              clientPackage.sessionsRemaining
                            ) === 1
                              ? ""
                              : "s"}{" "}
                            remaining
                          </p>
                        </div>
                        <div
                          style={{
                            minWidth: "80px",
                            textAlign:
                              "center",
                            padding:
                              "8px 12px",
                            borderRadius:
                              "8px",
                            background:
                              isSelected
                                ? "#315f51"
                                : "#eef4f0",
                            color:
                              isSelected
                                ? "#ffffff"
                                : "#315f51",
                            fontWeight:
                              "600",
                            fontSize:
                              "13px",
                          }}
                        >
                          {isSelected
                            ? "Selected"
                            : "Use Package"}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        {packagesLoading && (
          <p
            style={{
              fontSize: "14px",
              color: "#66756f",
              marginBottom: "20px",
            }}
          >
            Checking your active packages...
          </p>
        )}
        <form onSubmit={handleBooking}>
          <div className="form-group">
            <label>
              Select Date
            </label>
            <div className="unfazed-calendar-wrapper">
              <Calendar
                value={
                  date
                    ? new Date(
                        `${date}T00:00:00`
                      )
                    : null
                }
                minDate={new Date()}
                onChange={
                  handleCalendarChange
                }
                onActiveStartDateChange={({
                  activeStartDate,
                }) => {
                  if (activeStartDate) {
                    setCalendarMonth(
                      activeStartDate
                    );
                  }
                }}
                tileClassName={({
                  date: tileDate,
                }) => {
                  const dateKey =
                    formatCalendarDate(
                      tileDate
                    );

                  const dateInfo =
                    calendarAvailability[
                      dateKey
                    ];

                  if (
                    dateInfo &&
                    dateInfo.available ===
                      false
                  ) {
                    return "unavailable-date";
                  }
                  return "";
                }}
                tileDisabled={({
                  date: tileDate,
                }) => {
                  const dateKey = formatCalendarDate(tileDate);
                  const dateInfo = calendarAvailability[dateKey];
                  return (
                    dateInfo !== undefined &&
                    dateInfo.available ===
                      false
                  );
                }}
                calendarType="gregory"
                prev2Label={null}
                next2Label={null}
              />
              <div className="calendar-legend">
                <span className="legend-item">
                  <span className="legend-dot available-dot"></span>
                  Available
                </span>
                <span className="legend-item">
                  <span className="legend-dot unavailable-dot"></span>
                  Not Available
                </span>
              </div>
              {calendarLoading && (
                <p className="calendar-loading">
                  Checking availability...
                </p>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>
              Select Time
            </label>
            <select
              value={time}
              onChange={(e) =>
                setTime(e.target.value)
              }
              disabled={
                !date ||
                slotsLoading ||
                slots.length === 0
              }
              required
            >
              <option value="">
                {!date
                  ? "Select a date first"
                  : slotsLoading
                  ? "Loading available times..."
                  : slots.length === 0
                  ? "No available slots"
                  : "Select a time"}
              </option>
              {slots.map((slot) => (
                <option
                  key={slot.startTime}
                  value={slot.startTime}
                >
                  {formatTime(
                    slot.startTime
                  )}{" "}
                  -{" "}
                  {formatTime(
                    slot.endTime
                  )}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>
              Session Type / Reason
            </label>
            <select
              value={reason}
              onChange={(e) =>
                setReason(e.target.value)
              }
              required
            >
              <option value="General Consultation">
                General Consultation
              </option>
              <option value="Initial Consultation">
                Initial Consultation
              </option>
              <option value="Follow-up Session">
                Follow-up Session
              </option>
              <option value="Mental Health Checkup">
                Mental Health Checkup
              </option>
              <option value="Counselling Session">
                Counselling Session
              </option>
              <option value="Therapy Session">
                Therapy Session
              </option>
              <option value="Stress Management">
                Stress Management
              </option>
              <option value="Anxiety Support">
                Anxiety Support
              </option>
              <option value="Other">
                Other
              </option>
            </select>
          </div>
          <div className="booking-fee">
            <span>
              {selectedPackage
                ? "Package Session"
                : "Session Fee"}
            </span>
            <strong>
              {selectedPackage
                ? "Included"
                : `₹${SESSION_FEE}`}
            </strong>
          </div>
          <button
            type="submit"
            className="dashboard-btn booking-submit"
            disabled={paymentLoading}
          >
            {paymentLoading
              ? "Processing..."
              : selectedPackage
              ? "Book Using Package"
              : `Pay ₹${SESSION_FEE} with Razorpay`}
          </button>
        </form>
        {message && (
          <div className="booking-message">
            {message}
          </div>
        )}
        {error && therapist && (
          <div className="error-message">
            {error}
          </div>
        )}
        <Link
          to={`/therapists/${therapist.slug}`}
          className="back-btn booking-back"
        >
          Back to Therapist Profile
        </Link>
      </div>
    </div>
  );
}
export default Booking;
