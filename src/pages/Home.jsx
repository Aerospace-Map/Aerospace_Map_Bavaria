// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DomainModal({ open, onClose, onSelect }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const DomainButton = ({ title, sub, emoji, value }) => (
    <button
      className="domain-pick"
      onClick={() => onSelect(value)}
      aria-label={`Select ${title}`}
    >
      <div className="pick-emoji" aria-hidden>
        {emoji}
      </div>
      <div className="pick-text">
        <div className="pick-title">{title}</div>
        <div className="pick-sub">{sub}</div>
      </div>
      <div className="pick-arrow" aria-hidden>
        →
      </div>
    </button>
  );

  return (
    <div
      className="interstitial-wrap"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="interstitial-card" onClick={(e) => e.stopPropagation()}>
        <div className="interstitial-head">
          <h3 className="interstitial-title">Choose a domain</h3>
          <button className="button small" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <div className="interstitial-grid" role="list">
          <DomainButton
            title="Aviation"
        
            emoji="✈️"
            value="Aviation"
          />
          <DomainButton
            title="Space"
           
            emoji="🛰️"
            value="Space"
          />
          <DomainButton
            title="All (Aerospace)"
         
            emoji="🚀"
            value="" // no filter → all
          />
        </div>

        <div className="interstitial-actions">
          <button className="button" onClick={() => onSelect("")}>
            Skip — show all
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const subline = "Where industry meets academia, from aviation to space.";
  const [pendingDest, setPendingDest] = useState(null); // "map" | "directory" | null
  const [showModal, setShowModal] = useState(false);

  const openModalFor = (dest) => {
    setPendingDest(dest);
    setShowModal(true);
  };

  const handleSelectDomain = (domain) => {
    const dest = pendingDest === "directory" ? "/directory" : "/map";
    const qs = domain ? `?domain=${encodeURIComponent(domain)}` : "";
    setShowModal(false);
    setPendingDest(null);
    navigate(`${dest}${qs}`);
  };

  return (
    <main id="landing" className="landing">
      <section className={["hero-wrap", "pos-center", "pos-middle"].join(" ")}>
        <img
          src="/kush-new.png"
          alt="Bavarian aerospace landscape"
          className="hero-bg"
          loading="eager"
          fetchpriority="high"
        />
        <div className="hero-veil" aria-hidden />

        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Get ready to explore the{" "}
              <span className="accent">Bavarian Aerospace</span> Ecosystem
            </h1>
            <p className="hero-sub">{subline}</p>

            <div className="hero-stats-cards" role="list">
              <div
                className="stat-card"
                role="listitem"
                aria-label="500+ organizations"
              >
                <span className="stat-number">500+</span>
                <span className="stat-label">Organizations</span>
              </div>
              <div
                className="stat-card"
                role="listitem"
                aria-label="20+ research chairs"
              >
                <span className="stat-number">20+</span>
                <span className="stat-label">Research Chairs</span>
              </div>
              <div
                className="stat-card"
                role="listitem"
                aria-label="Startups to primes"
              >
                <span className="stat-number" aria-hidden>
                  🏭
                </span>
                <span className="stat-label">Startups → Primes</span>
              </div>
              <div
                className="stat-card"
                role="listitem"
                aria-label="Munich Aerospace network"
              >
                <span className="stat-number" aria-hidden>
                  🤝
                </span>
                <span className="stat-label">Munich Aerospace Network</span>
              </div>
            </div>
          </div>

          {/* Bigger hex buttons */}
          <div className="hero-cta">
            <button className="hex-btn" onClick={() => openModalFor("map")}>
              <span className="icon" aria-hidden>
                🗺️
              </span>
              Launch Interactive Map
            </button>
            <button
              className="hex-btn"
              onClick={() => openModalFor("directory")}
            >
              <span className="icon" aria-hidden>
                📇
              </span>
              Aerospace Directory
            </button>
          </div>
        </div>
      </section>

      {/* Interstitial domain selector */}
      <DomainModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleSelectDomain}
      />
    </main>
  );
}
