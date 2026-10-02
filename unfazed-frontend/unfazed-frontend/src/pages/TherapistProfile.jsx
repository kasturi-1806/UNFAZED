import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "../App.css";

function TherapistProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTherapist, setIsTherapist] = useState(false);

  // ================= PACKAGES =================

  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packageError, setPackageError] = useState("");
  const [buyingPackage, setBuyingPackage] = useState(null);
  const [packageMessage, setPackageMessage] = useState("");

  // ================= CHECK LOGGED-IN ROLE =================

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedRole = localStorage.getItem("userRole");

      let therapistUser = false;

      if (storedUser) {
        const currentUser = JSON.parse(storedUser);

        therapistUser =
          currentUser?.role === "therapist";
      }

      if (storedRole === "therapist") {
        therapistUser = true;
      }

      setIsTherapist(therapistUser);
    } catch (userError) {
      console.error(
        "Logged-in user data error:",
        userError
      );

      setIsTherapist(false);
    }
  }, []);

  // ================= FETCH THERAPIST =================

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
          "Therapist profile error:",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapist();
  }, [slug]);

  // ================= FETCH PACKAGES =================

  useEffect(() => {
    const fetchPackages = async () => {
      if (!therapist?._id) {
        return;
      }

      try {
        setPackagesLoading(true);
        setPackageError("");

        const response = await fetch(
          `http://localhost:5000/api/packages/therapist/${therapist._id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load packages"
          );
        }

        setPackages(data.packages || []);
      } catch (error) {
        console.error(
          "Package fetch error:",
          error
        );

        setPackageError(error.message);
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchPackages();
  }, [therapist]);

  // ================= BUY PACKAGE =================

  const handleBuyPackage = async (packageId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setBuyingPackage(packageId);
      setPackageMessage("");
      setPackageError("");

      // STEP 1: CREATE CLIENT PACKAGE

      const purchaseResponse = await fetch(
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
            "Failed to purchase package"
        );
      }

      const clientPackage =
        purchaseData.clientPackage;

      if (!clientPackage?._id) {
        throw new Error(
          "Package purchase was created, but package information was not returned."
        );
      }

      // STEP 2: DEMO PAYMENT

      const paymentResponse = await fetch(
        "http://localhost:5000/api/client-packages/demo-payment",
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

      const paymentData =
        await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData.message ||
            "Package payment failed"
        );
      }

      setPackageMessage(
        "Package purchased successfully! You can now use these sessions while booking."
      );
    } catch (error) {
      console.error(
        "Package purchase error:",
        error
      );

      setPackageError(error.message);
    } finally {
      setBuyingPackage(null);
    }
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h1>Loading therapist...</h1>
        </div>
      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error || !therapist) {
    return (
      <div className="profile-page">
        <div className="profile-card">

          <h1>Therapist Not Found</h1>

          <p>
            {error ||
              "We couldn't find this therapist."}
          </p>

          <Link
            to="/therapists"
            className="back-btn"
          >
            Back to Therapists
          </Link>

        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">

      <div className="profile-card">

        {/* ================= AVATAR ================= */}

        <div className="profile-avatar">
          {therapist.name
            ?.replace("Dr. ", "")
            .charAt(0)
            .toUpperCase()}
        </div>

        {/* ================= NAME ================= */}

        <h1>{therapist.name}</h1>

        {/* ================= SPECIALIZATION ================= */}

        <p className="profile-specialization">
          {therapist.specializations?.length > 0
            ? therapist.specializations[0]
            : "Mental Health Therapist"}
        </p>

        {/* ================= EXPERIENCE ================= */}

        <p className="profile-experience">
          Professional Mental Health Support
        </p>

        <div className="profile-divider"></div>

        {/* ================= ABOUT ================= */}

        <div className="profile-section">

          <h2>About</h2>

          <p>
            {therapist.bio ||
              "This therapist is dedicated to helping individuals improve their mental wellbeing."}
          </p>

        </div>

        {/* ================= SPECIALIZATIONS ================= */}

        <div className="profile-section">

          <h2>Specializations</h2>

          <div className="specialization-tags">

            {therapist.specializations?.length > 0 ? (
              therapist.specializations.map(
                (specialization, index) => (
                  <span key={index}>
                    {specialization}
                  </span>
                )
              )
            ) : (
              <span>
                Mental Health
              </span>
            )}

          </div>

        </div>

        {/* ================= LANGUAGES ================= */}

        <div className="profile-section">

          <h2>Languages</h2>

          <div className="specialization-tags">

            {therapist.languages?.length > 0 ? (
              therapist.languages.map(
                (language, index) => (
                  <span key={index}>
                    {language}
                  </span>
                )
              )
            ) : (
              <span>English</span>
            )}

          </div>

        </div>

{/* ================= PACKAGES ================= */}

<div className="profile-section packages-section">

  <div className="section-heading">
    <h2>Available Packages</h2>

    <p>
      Choose a session package for your therapy
      sessions with {therapist.name}.
    </p>
  </div>

  {packagesLoading && (
    <div className="package-empty">

      <div className="package-empty-icon">
        ...
      </div>

      <h3>Loading Packages</h3>

      <p>
        Please wait while we load the available
        session packages.
      </p>

    </div>
  )}

  {!packagesLoading && packageError && (
    <div className="package-empty">

      <div className="package-empty-icon">
        !
      </div>

      <h3>Unable to Load Packages</h3>

      <p>{packageError}</p>

    </div>
  )}

  {!packagesLoading &&
    !packageError &&
    packages.length === 0 && (
      <div className="package-empty">

        <div className="package-empty-icon">
          +
        </div>

        <h3>No Packages Available</h3>

        <p>
          This therapist has not added any session
          packages yet.
        </p>

      </div>
    )}

  {!packagesLoading &&
    !packageError &&
    packages.length > 0 && (
      <div className="packages-container">

        {packageMessage && (
          <div className="package-success">
            {packageMessage}
          </div>
        )}

        <div className="packages-grid">

          {packages.map((pkg) => (
            <div
              key={pkg._id}
              className="user-package-card"
            >

              {/* CARD HEADER */}

              <div className="package-card-header">

                <div>

                  <span className="package-label">
                    SESSION PACKAGE
                  </span>

                  <h3>{pkg.name}</h3>

                </div>

                <div className="package-session-count">
                  {pkg.sessions}
                </div>

              </div>

              {/* MAIN PRICE */}

              <div className="package-main-price">

                <strong>
                  ₹{pkg.totalPrice}
                </strong>

                <span>
                  total
                </span>

              </div>

              {/* PACKAGE DETAILS */}

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
                    Per Session
                  </span>

                  <strong>
                    ₹{pkg.pricePerSession}
                  </strong>
                </div>

                <div>
                  <span>
                    Valid For
                  </span>

                  <strong>
                    {pkg.expiryDays} days
                  </strong>
                </div>

              </div>

              {/* BUY BUTTON */}

              {!isTherapist && (
                <button
                  type="button"
                  className="package-buy-button"
                  onClick={() =>
                    handleBuyPackage(pkg._id)
                  }
                  disabled={
                    buyingPackage === pkg._id
                  }
                >
                  {buyingPackage === pkg._id
                    ? "Processing..."
                    : "Buy Package"}
                </button>
              )}

            </div>
          ))}

        </div>

      </div>
    )}

</div>

        {/* ================= ACTIONS ================= */}

        <div className="profile-actions">

          {!isTherapist && (
            <button
              type="button"
              className="book-btn"
              onClick={() =>
                navigate(
                  `/book-session/${therapist.slug}`
                )
              }
            >
              Book a Session
            </button>
          )}

          <Link
            to="/therapists"
            className="back-btn"
          >
            Back to Therapists
          </Link>

        </div>

      </div>

    </div>
  );
}

export default TherapistProfile;