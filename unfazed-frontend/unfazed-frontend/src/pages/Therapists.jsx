import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";
function Therapists() {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/therapists"
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load therapists"
          );
        }

        setTherapists(data.therapists || []);
      } catch (error) {
        console.error("Therapists error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, []);

  if (loading) {
    return (
      <div className="therapists-page">
        <div className="therapists-header">
          <h1>Loading therapists...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="therapists-page">
        <div className="therapists-header">
          <h1>Unable to load therapists</h1>

          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="therapists-page">

      <div className="therapists-header">

        <p className="section-label">
          OUR PROFESSIONALS
        </p>

        <h1>
          Find the right therapist for you.
        </h1>

        <p>
          Explore our trusted mental health professionals
          and find someone who matches your needs.
        </p>

      </div>

      <div className="therapist-grid">

        {therapists.map((therapist) => (

          <div
            className="therapist-card"
            key={therapist._id}
          >

            <div className="therapist-avatar">

              {therapist.name
                ? therapist.name
                    .replace("Dr. ", "")
                    .charAt(0)
                    .toUpperCase()
                : "T"}

            </div>

            <h2>
              {therapist.name}
            </h2>

            <p className="specialization">

              {therapist.specializations &&
              therapist.specializations.length > 0
                ? therapist.specializations[0]
                : "Mental Health Therapist"}
            </p>
            <p className="experience">
              {therapist.bio
                ? therapist.bio
                : "Professional mental health support"}
            </p>
            <Link
              to={`/therapists/${therapist.slug}`}
              className="profile-btn"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Therapists;
