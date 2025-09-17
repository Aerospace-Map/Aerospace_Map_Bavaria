// src/pages/LandingPage.jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import globeHero from "/assets/earth-hero.png"; // Aerospace Map image
import rocket from "/assets/rocket.png";
import planes from "/assets/planes.png";
import drones from "/assets/drones.png";
import cockpit from "/assets/cockpit.png";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* HERO */}
      <section className="hero full-screen">
        <motion.img
          src={globeHero}
          alt="Earth connectivity"
          className="hero-bg"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
        />
        <div className="hero-text">
          <h1>Aerospace Map</h1>
          <p>Exploring Germany’s Aerospace Ecosystem</p>
          <span className="scroll-hint">▼ Scroll to explore</span>
        </div>
      </section>

      {/* ROCKETS */}
      <section className="full-screen">
        <motion.img
          src={rocket}
          alt="Rocket launch"
          className="bg"
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        />
        <div className="overlay-text">
          <h2>From Earth to Orbit</h2>
        </div>
      </section>

      {/* PLANES */}
      <section className="full-screen">
        <motion.img
          src={planes}
          alt="Airplanes in flight"
          className="bg"
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        />
        <div className="overlay-text">
          <h2>Innovation in Aviation</h2>
        </div>
      </section>

      {/* DRONES */}
      <section className="full-screen">
        <motion.img
          src={drones}
          alt="Drones over Germany"
          className="bg"
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        />
        <div className="overlay-text">
          <h2>Drones & New Mobility</h2>
        </div>
      </section>

      {/* COCKPIT CHOICE */}
      <section className="full-screen split-cockpit">
        <img src={cockpit} alt="Cockpit views" className="bg" />
        <div className="choice-overlay">
          <h2>Choose Your Domain</h2>
          <div className="choices">
            <button onClick={() => navigate("/directory?domain=Aviation")}>
              Aviation
            </button>
            <button onClick={() => navigate("/directory?domain=Space")}>
              Space
            </button>
            <a href="/directory" className="all-link">
              All Aerospace
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
