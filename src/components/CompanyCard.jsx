// src/components/CompanyCard.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Globe } from "lucide-react";

/** Safe, case-insensitive highlighter using captured split (no lastIndex bugs). */
function Highlight({ text = "", query = "" }) {
  const q = String(query || "").trim();
  if (!q) return <>{text}</>;

  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${esc})`, "ig");
  const parts = String(text).split(re);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="hl">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** Normalize stakeholder values from string/array into a clean, deduped array. */
function normalizeStakeholders(value) {
  if (Array.isArray(value)) {
    const seen = new Set();
    return value
      .map((v) => String(v || "").trim())
      .filter(Boolean)
      .filter((v) => (seen.has(v) ? false : (seen.add(v), true)));
  }
  if (value == null) return [];
  const seen = new Set();
  return String(value)
    .split(/[\n,;/]| \| |\//g)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v) => (seen.has(v) ? false : (seen.add(v), true)));
}

function Modal({
  open,
  onClose,
  title,
  chips, // [typeOfStakeholder, domain, federalState]
  address,
  website,
  bullets,
  stakeholders = [],
  query = "",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 16,
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="card modal-card"
        style={{
          width: "min(760px, 100%)",
          maxHeight: "60vh", // short, scrollable
          borderRadius: 20,
          padding: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingBottom: 6,
          }}
        >
          <h3 style={{ margin: 0, lineHeight: 1.2 }}>{title}</h3>
          <button className="button small" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        {/* Chips */}
        {(chips?.length ?? 0) > 0 && (
          <div className="toolbar" style={{ gap: 8, margin: "6px 0 8px" }}>
            {chips[0] && (
              <span className="tag tag--stakeholder">
                <Highlight text={chips[0]} query={query} />
              </span>
            )}
            {chips[1] && (
              <span className="tag tag--domain">
                <Highlight text={chips[1]} query={query} />
              </span>
            )}
            {chips[2] && <span className="badge">{chips[2]}</span>}
          </div>
        )}

        <hr
          style={{
            border: "none",
            height: 1,
            background: "var(--border)",
            margin: "6px 0 10px",
          }}
        />

        {/* Scrollable body — block flow so bullets don't spread */}
        <div
          className="modal-body"
          style={{
            display: "block", // override any grid styles
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            paddingRight: 6,
          }}
        >
          {address && (
            <div className="muted" style={{ margin: "0 0 10px" }}>
              📍 <Highlight text={address} query={query} />
            </div>
          )}

          {stakeholders.length > 0 && (
            <div className="stakeholder-section" style={{ marginBottom: 10 }}>
              <div className="stakeholder-title">Stakeholder(s)</div>
              <div className="stakeholder-wrap">
                {stakeholders.map((s, i) => (
                  <span key={`${s}-${i}`} className="tag tag--stakeholder">
                    <Highlight text={s} query={query} />
                  </span>
                ))}
              </div>
            </div>
          )}

          {bullets?.length ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {bullets.map((p, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: "var(--text)",
                    marginBottom: 8, // tight, consistent spacing
                  }}
                >
                  <Highlight text={p} query={query} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              No additional description.
            </p>
          )}
        </div>

        {/* Footer — website button like before */}
        <div
          className="modal-footer"
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          {website && (
            <a
              className="button"
              href={website}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
              }}
            >
              <Globe size={16} /> Open Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function CompanyCard({ c, query = "" }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const stakeholders = useMemo(() => {
    const sources = [
      c.stakeholders,
      c.stakeholder,
      c.Stakeholder,
      c["Stakeholder"],
      c["Stakeholder(s)"],
    ].filter((v) => v !== undefined && v !== null);

    const merged = sources.flatMap(normalizeStakeholders);
    const seen = new Set();
    return merged.filter((s) => (seen.has(s) ? false : (seen.add(s), true)));
  }, [
    c.stakeholders,
    c.stakeholder,
    c.Stakeholder,
    c["Stakeholder"],
    c["Stakeholder(s)"],
  ]);

  const allPoints = useMemo(() => {
    const raw = String(c.description || "").trim();
    if (!raw) return [];
    const parts = raw
      .split(/\r?\n|;\s+/)
      .flatMap((s) => s.split(/•\s+/))
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^[*\-•]\s*/, ""))
      .filter(Boolean);
    if (parts.length) return parts;
    return raw
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [c.description]);

  const visible = allPoints.slice(0, 3);
  const placeholders = Math.max(0, 3 - visible.length);

  return (
    <>
      <article
        className="card card--tight hoverable"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          height: "100%",
        }}
      >
        {/* Title */}
        <header
          style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
        >
          <h3 className="card-title" style={{ margin: 0, lineHeight: 1.2 }}>
            <Highlight text={c.name} query={query} />
          </h3>
          {c.munichAerospace && <span className="badge">Munich Aerospace</span>}
        </header>

        {/* Address */}
        {c.address && (
          <div
            className="muted"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span aria-hidden>📍</span>
            <span>
              <Highlight text={c.address} query={query} />
            </span>
          </div>
        )}

        {/* Chips on the card */}
        <div className="toolbar" style={{ gap: 8 }}>
          {c.typeOfStakeholder && (
            <span className="tag tag--stakeholder">
              <Highlight text={c.typeOfStakeholder} query={query} />
            </span>
          )}
          {c.domain && (
            <span className="tag tag--domain">
              <Highlight text={c.domain} query={query} />
            </span>
          )}
        </div>

        {/* Description with highlights */}
        {(visible.length > 0 || placeholders > 0) && (
          <ul className="desc-list">
            {visible.map((p, i) => (
              <li key={i} className="desc-item">
                <Highlight text={p} query={query} />
              </li>
            ))}
            {Array.from({ length: placeholders }).map((_, i) => (
              <li key={`ph-${i}`} className="desc-item placeholder">
                &nbsp;
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <div style={{ marginTop: "auto" }}>
          <div
            className="toolbar"
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <div className="toolbar" style={{ gap: 8 }}>
              <button className="button small" onClick={() => setOpen(true)}>
                See more
              </button>
            </div>
            <div>
              {c.website && (
                <a
                  className="button small"
                  href={c.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <Globe size={14} /> Website
                </a>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={c.name}
        chips={[c.typeOfStakeholder, c.domain, c.federalState].filter(Boolean)}
        address={c.address}
        website={c.website}
        bullets={allPoints}
        stakeholders={stakeholders}
        query={query}
      />
    </>
  );
}
