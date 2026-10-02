import { Link } from "react-router-dom";
import "../App.css";

function Home() {
  return (
    <div className="home-page">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          Unfazed
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/therapists">Therapists</Link>
          <Link to="/login">Login</Link>
          <Link to="/register" className="nav-register">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">

        <div className="hero-content">
          <p className="hero-small-title">
            YOUR MENTAL WELLBEING MATTERS
          </p>

          <h1>
            A calmer mind.
            <br />
            A stronger you.
          </h1>

          <p className="hero-description">
            Unfazed helps you connect with trusted therapists,
            understand your emotions, and take meaningful steps
            toward better mental wellbeing.
          </p>

          <div className="hero-buttons">
            <Link to="/therapists" className="primary-btn">
              Find a Therapist
            </Link>

            <Link to="/register" className="secondary-btn">
              Get Started
            </Link>
          </div>
        </div>

      </section>

      {/* Why Unfazed */}
      <section className="why-section">

        <p className="section-label">
          WHY UNFAZED
        </p>

        <h2>
          Support that puts you first.
        </h2>

        <div className="feature-container">

          <div className="feature-card">
            <div className="feature-icon">♡</div>

            <h3>Trusted Therapists</h3>

            <p>
              Connect with qualified professionals
              who understand what you're going through.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>

            <h3>Private & Secure</h3>

            <p>
              Your personal information and wellbeing
              are treated with care and confidentiality.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✦</div>

            <h3>Simple & Comfortable</h3>

            <p>
              Find the right support without complicated
              processes or unnecessary stress.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">

        <h2>
          You don't have to figure everything out alone.
        </h2>

        <p>
          Take the first step toward feeling better.
        </p>

        <Link to="/register" className="primary-btn">
          Start Your Journey
        </Link>

      </section>

      {/* Footer */}
      <footer className="footer">
        <h2>Unfazed</h2>

        <p>
          Supporting your journey toward better mental wellbeing.
        </p>

        <p className="copyright">
          © 2026 Unfazed. All rights reserved.
        </p>
      </footer>

    </div>
  );
}

export default Home;