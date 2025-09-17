// src/pages/MapPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map as MapIcon, LayoutGrid } from "lucide-react";

import { useStore } from "../store";
import MultiSelect from "../components/MultiSelect";
import { CompanyCard } from "../components/CompanyCard";
import { Globe } from "lucide-react";

/* ---- Leaflet default marker fix (Vite) ---- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL(
    "leaflet/dist/images/marker-icon.png",
    import.meta.url
  ).toString(),
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url
  ).toString(),
  shadowUrl: new URL(
    "leaflet/dist/images/marker-shadow.png",
    import.meta.url
  ).toString(),
});

/* ---- Helpers ---- */
function ResizeHack() {
  const map = useMap();
  useEffect(() => {
    const bump = () => map.invalidateSize();
    setTimeout(bump, 0);
    window.addEventListener("resize", bump);
    return () => window.removeEventListener("resize", bump);
  }, [map]);
  return null;
}

function FocusOnId({ focusId, markerRefs }) {
  const map = useMap();
  useEffect(() => {
    if (!focusId) return;
    const t = setTimeout(() => {
      const mk = markerRefs.current.get(String(focusId));
      if (mk && mk.getLatLng) {
        const ll = mk.getLatLng();
        map.flyTo(ll, 13, { duration: 0.8 });
        setTimeout(() => mk.openPopup && mk.openPopup(), 450);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [focusId, map, markerRefs]);
  return null;
}

function clusterIcon(count) {
  const size = count < 10 ? 30 : count < 50 ? 36 : count < 200 ? 44 : 52;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:#0ea5e9;color:#fff;display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:${Math.max(
        12,
        size * 0.38
      )}px;border:2px solid #fff;
      box-shadow:0 4px 14px rgba(17,24,39,.15);
    ">${count}</div>`,
    className: "",
    iconSize: [size, size],
  });
}

/* Compact on-brand pill used in popup */
function Tag({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
        border: "1px solid rgba(148,163,184,.35)",
        color: "#e7f9ff",
        background:
          "radial-gradient(120% 120% at 30% 0%, rgba(56,189,248,.18), transparent 60%), linear-gradient(180deg, rgba(12,36,56,.85), rgba(10,28,48,.75))",
      }}
    >
      {children}
    </span>
  );
}

/* ---- Filters bar (same visual structure as before) ---- */
function FiltersBar({
  q,
  setQ,
  selTypes,
  setSelTypes,
  selDomains,
  setSelDomains,
  options,
  showAdvanced,
  setShowAdvanced,
  onClearAll,
  selectedChips,
}) {
  return (
    <div className="container">
      <div className="card filters-shell" style={{ display: "grid", gap: 10 }}>
        {/* Row 0: Selected chips & top-right "Filters" label */}
        <div className="toolbar" style={{ alignItems: "center", gap: 10 }}>
          <div className="f-chips" style={{ margin: 0 }}>
            {selectedChips.length ? (
              selectedChips.map((chip) => (
                <button
                  key={chip.key}
                  className="chip"
                  onClick={chip.onClear}
                  title="Remove filter"
                >
                  {chip.label}
                  <span>×</span>
                </button>
              ))
            ) : (
              <span className="muted">No filters selected</span>
            )}
          </div>
          <div
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          ></div>
        </div>

        {/* Row 1: Search + right-aligned actions */}
        <div className="toolbar" style={{ gap: 12, alignItems: "center" }}>
          <input
            className="input"
            placeholder="Search keywords…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search organizations"
            style={{ flex: 1, minWidth: 240 }}
          />
          <div style={{ marginLeft: "auto", display: "inline-flex", gap: 10 }}>
            <button
              className="btn-squircle"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
            >
              {showAdvanced ? "Hide advanced filters" : "Show advanced filters"}
            </button>
            <button className="btn-squircle" onClick={onClearAll}>
              Clear all
            </button>
          </div>
        </div>

        {/* Row 2: Basic multi-selects */}
        <div className="toolbar" style={{ gap: 12, flexWrap: "wrap" }}>
          <MultiSelect
            label="All stakeholders"
            options={options.types}
            value={selTypes}
            onChange={setSelTypes}
            soft
          />
          <MultiSelect
            label="All domains"
            options={options.domains}
            value={selDomains}
            onChange={setSelDomains}
            soft
          />
        </div>

        {/* Row 3: Advanced (optional) */}
        {showAdvanced && (
          <div className="toolbar" style={{ gap: 12, flexWrap: "wrap" }}>
            <MultiSelect
              label="Support & Enabling Services"
              options={options.support}
              value={options.selSupport}
              onChange={options.setSelSupport}
              soft
            />
            <MultiSelect
              label="Applications & End-Users"
              options={options.applications}
              value={options.selApps}
              onChange={options.setSelApps}
              soft
            />
            <MultiSelect
              label="Manufacturers/Developers"
              options={options.manufacturers}
              value={options.selMfg}
              onChange={options.setSelMfg}
              soft
            />
            <MultiSelect
              label="Hardware/Software"
              options={options.hw_sw}
              value={options.selHwSw}
              onChange={options.setSelHwSw}
              soft
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- MAIN PAGE ---- */
export default function MapPage() {
  const { data: storeData } = useStore();
  const location = useLocation();

  // Map/Grid toggle (restored)
  const [view, setView] = useState("map"); // "map" | "grid"

  // Filters
  const [q, setQ] = useState("");
  const [selTypes, setSelTypes] = useState([]); // multi
  const [selDomains, setSelDomains] = useState([]); // multi
  const [selSupport, setSelSupport] = useState([]);
  const [selApps, setSelApps] = useState([]);
  const [selMfg, setSelMfg] = useState([]);
  const [selHwSw, setSelHwSw] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Seed domains from URL (?domain=Space or Space,Aviation; Aerospace/All => none)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("domain");
    if (!raw) return;
    const incoming = raw
      .split(",")
      .map(decodeURIComponent)
      .map((s) => s.trim())
      .filter(Boolean);
    const none =
      incoming.length === 1 && /^(aerospace|all)$/i.test(incoming[0]);
    setSelDomains(none ? [] : incoming);
  }, [location.search]);

  // Build option lists
  const typeOptions = useMemo(() => {
    const s = new Set();
    storeData.forEach((d) => d.typeOfStakeholder && s.add(d.typeOfStakeholder));
    return Array.from(s).sort();
  }, [storeData]);

  const domainOptions = useMemo(() => {
    const s = new Set();
    storeData.forEach((d) => d.domain && s.add(d.domain));
    return Array.from(s).sort();
  }, [storeData]);

  const supportOptions = useMemo(() => {
    const s = new Set();
    storeData.forEach((d) => (d.cat_support || []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [storeData]);

  const appOptions = useMemo(() => {
    const s = new Set();
    storeData.forEach((d) =>
      (d.cat_applications || []).forEach((t) => s.add(t))
    );
    return Array.from(s).sort();
  }, [storeData]);

  const mfgOptions = useMemo(() => {
    const s = new Set();
    storeData.forEach((d) =>
      (d.cat_manufacturers || []).forEach((t) => s.add(t))
    );
    return Array.from(s).sort();
  }, [storeData]);

  const hwSwOptions = useMemo(() => {
    const s = new Set();
    storeData.forEach((d) => (d.cat_hw_sw || []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [storeData]);

  // Selected chips row
  const selectedChips = useMemo(() => {
    const chips = [];
    if (q.trim())
      chips.push({ key: "q", label: `“${q.trim()}”`, onClear: () => setQ("") });
    selTypes.forEach((t) =>
      chips.push({
        key: `t:${t}`,
        label: t,
        onClear: () => setSelTypes(selTypes.filter((x) => x !== t)),
      })
    );
    selDomains.forEach((d) =>
      chips.push({
        key: `d:${d}`,
        label: d,
        onClear: () => setSelDomains(selDomains.filter((x) => x !== d)),
      })
    );
    selSupport.forEach((t) =>
      chips.push({
        key: `s:${t}`,
        label: t,
        onClear: () => setSelSupport(selSupport.filter((x) => x !== t)),
      })
    );
    selApps.forEach((t) =>
      chips.push({
        key: `a:${t}`,
        label: t,
        onClear: () => setSelApps(selApps.filter((x) => x !== t)),
      })
    );
    selMfg.forEach((t) =>
      chips.push({
        key: `m:${t}`,
        label: t,
        onClear: () => setSelMfg(selMfg.filter((x) => x !== t)),
      })
    );
    selHwSw.forEach((t) =>
      chips.push({
        key: `h:${t}`,
        label: t,
        onClear: () => setSelHwSw(selHwSw.filter((x) => x !== t)),
      })
    );
    return chips;
  }, [q, selTypes, selDomains, selSupport, selApps, selMfg, selHwSw]);

  const clearAll = () => {
    setQ("");
    setSelTypes([]);
    setSelDomains([]);
    setSelSupport([]);
    setSelApps([]);
    setSelMfg([]);
    setSelHwSw([]);
  };

  // Source set with valid coords
  const pointsAll = useMemo(
    () =>
      storeData.filter(
        (d) => typeof d.lat === "number" && typeof d.lng === "number"
      ),
    [storeData]
  );

  // Apply filters for both Map and Grid
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return pointsAll.filter((c) => {
      if (selTypes.length && !selTypes.includes(c.typeOfStakeholder))
        return false;
      if (selDomains.length && !selDomains.includes(c.domain)) return false;

      if (ql) {
        const hay = [
          c.name,
          c.address,
          c.description,
          c.website,
          c.domain,
          c.typeOfStakeholder,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(ql)) return false;
      }

      const hasAny = (arr = [], sel = []) =>
        sel.length ? arr.some((x) => sel.includes(x)) : true;
      if (!hasAny(c.cat_support, selSupport)) return false;
      if (!hasAny(c.cat_applications, selApps)) return false;
      if (!hasAny(c.cat_manufacturers, selMfg)) return false;
      if (!hasAny(c.cat_hw_sw, selHwSw)) return false;

      return true;
    });
  }, [
    pointsAll,
    q,
    selTypes,
    selDomains,
    selSupport,
    selApps,
    selMfg,
    selHwSw,
  ]);

  // Map center
  const center = useMemo(() => {
    if (!filtered.length) return [51.163, 10.447]; // Germany
    const lat =
      filtered.reduce((s, p) => s + (p.lat || 0), 0) / filtered.length;
    const lng =
      filtered.reduce((s, p) => s + (p.lng || 0), 0) / filtered.length;
    return [lat, lng];
  }, [filtered]);

  const focusId = useMemo(
    () => new URLSearchParams(location.search).get("focus"),
    [location.search]
  );
  const markerRefs = useRef(new Map());

  return (
    <>
      {/* View toggle bar ABOVE filters */}
      <div className="container" style={{ marginBottom: 10 }}>
        <div
          className="card"
          style={{
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "space-between",
          }}
        >
          <div className="view-toggle" role="tablist" aria-label="View mode">
            <button
              role="tab"
              aria-selected={view === "map"}
              className={
                "view-toggle__btn " +
                (view === "map" ? "view-toggle__btn--active" : "")
              }
              onClick={() => setView("map")}
            >
              <MapIcon className="view-toggle__icon" />
              Map view
            </button>
            <button
              role="tab"
              aria-selected={view === "grid"}
              className={
                "view-toggle__btn " +
                (view === "grid" ? "view-toggle__btn--active" : "")
              }
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="view-toggle__icon" />
              Grid view
            </button>
          </div>

          <span className="results-badge">
            <span className="dot" /> {filtered.length} RESULTS
          </span>
        </div>
      </div>

      {/* Filters (unchanged visual) */}
      <FiltersBar
        q={q}
        setQ={setQ}
        selTypes={selTypes}
        setSelTypes={setSelTypes}
        selDomains={selDomains}
        setSelDomains={setSelDomains}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        onClearAll={clearAll}
        selectedChips={selectedChips}
        options={{
          types: typeOptions,
          domains: domainOptions,
          support: supportOptions,
          applications: appOptions,
          manufacturers: mfgOptions,
          hw_sw: hwSwOptions,
          selSupport,
          setSelSupport,
          selApps,
          setSelApps,
          selMfg,
          setSelMfg,
          selHwSw,
          setSelHwSw,
        }}
      />

      {/* View area */}
      {view === "map" ? (
        <div className="container">
          <div className="map-shell">
            <MapContainer
              center={center}
              zoom={6}
              preferCanvas
              style={{ width: "100%", height: "100%" }}
            >
              <ResizeHack />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <FocusOnId focusId={focusId} markerRefs={markerRefs} />

              <MarkerClusterGroup
                chunkedLoading
                showCoverageOnHover={false}
                maxClusterRadius={50}
                iconCreateFunction={(cluster) =>
                  clusterIcon(cluster.getChildCount())
                }
              >
                {filtered.map((c) => (
                  <Marker
                    key={c.id}
                    position={[c.lat, c.lng]}
                    ref={(m) => {
                      if (m) markerRefs.current.set(String(c.id), m);
                      else markerRefs.current.delete(String(c.id));
                    }}
                  >
                    <Popup>
                      <div
                        style={{
                          minWidth: 260,
                          display: "grid",
                          gap: 8,
                          padding: 4,
                          color: "var(--text)",
                        }}
                      >
                        <strong style={{ color: "#eaf2ff" }}>{c.name}</strong>
                        {c.address && <div className="muted">{c.address}</div>}

                        {/* Domain pill + globe in same row (no stakeholder type) */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          {c.domain && <Tag>{c.domain}</Tag>}
                          {c.website && (
                            <a
                              href={c.website}
                              target="_blank"
                              rel="noreferrer"
                              title="Open website"
                              style={{
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 34,
                                height: 28,
                                borderRadius: 999,
                                border: "1px solid rgba(148,163,184,.35)",
                                background:
                                  "linear-gradient(180deg, rgba(17,34,56,.75), rgba(12,25,44,.65))",
                                boxShadow:
                                  "0 2px 10px rgba(2,6,23,.35), inset 0 0 0 1px rgba(255,255,255,.05)",
                              }}
                            >
                              <Globe size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          </div>
        </div>
      ) : (
        <div className="container">
          <div className="grid grid-cards">
            {filtered.length ? (
              filtered.map((c) => <CompanyCard key={c.id} c={c} query={q} />)
            ) : (
              <div className="card">
                <strong>No results</strong>
                <p className="muted">Try adjusting or clearing filters.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
