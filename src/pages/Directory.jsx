// src/pages/Directory.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { CompanyCard } from "../components/CompanyCard";
import MultiSelect from "../components/MultiSelect";
import { useLocation, useNavigate } from "react-router-dom";

// --- helpers ---
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

function matchGroup(itemVals = [], selected = []) {
  if (!selected?.length) return true;
  if (!itemVals?.length) return false;
  const set = new Set(itemVals.map((s) => String(s).trim()));
  return selected.some((t) => set.has(t));
}

function mapTokensToOptions(raw, options) {
  const tokens = String(raw || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (!tokens.length || !options.length) return [];

  const lookup = new Map(options.map((o) => [norm(o), o]));
  const out = [];
  const seen = new Set();

  tokens.forEach((tok) => {
    const nt = norm(tok);
    // exact (normalized)
    if (lookup.has(nt)) {
      const val = lookup.get(nt);
      if (!seen.has(val)) {
        seen.add(val);
        out.push(val);
      }
      return;
    }
    // fuzzy contains/startsWith
    for (const [lo, original] of lookup.entries()) {
      if (lo.includes(nt) || nt.includes(lo)) {
        if (!seen.has(original)) {
          seen.add(original);
          out.push(original);
        }
      }
    }
  });

  return out;
}

export default function Directory() {
  const { data, status, error } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Basic filters (MULTI)
  const [q, setQ] = useState("");
  const [selTypes, setSelTypes] = useState([]);
  const [selDomains, setSelDomains] = useState([]);

  // Advanced filters (multi) — research & gov intentionally removed
  const [selSupport, setSelSupport] = useState([]);
  const [selApps, setSelApps] = useState([]);
  const [selMfg, setSelMfg] = useState([]);
  const [selHwSw, setSelHwSw] = useState([]);

  // UI state
  const [pinned, setPinned] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Build options
  const typeOptions = useMemo(() => {
    const s = new Set();
    data.forEach(
      (d) => d.typeOfStakeholder && s.add(String(d.typeOfStakeholder).trim())
    );
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const domainOptions = useMemo(() => {
    const s = new Set();
    data.forEach((d) => d.domain && s.add(String(d.domain).trim()));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const supportOptions = useMemo(() => {
    const s = new Set();
    data.forEach((d) => (d.cat_support || []).forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const appOptions = useMemo(() => {
    const s = new Set();
    data.forEach((d) => (d.cat_applications || []).forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const mfgOptions = useMemo(() => {
    const s = new Set();
    data.forEach((d) => (d.cat_manufacturers || []).forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const hwSwOptions = useMemo(() => {
    const s = new Set();
    data.forEach((d) => (d.cat_hw_sw || []).forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // ===== One-time URL → State hydration after options are ready =====
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!typeOptions.length && !domainOptions.length) return; // wait until options exist

    const sp = new URLSearchParams(location.search);

    // q
    const qParam = (sp.get("q") || "").trim();

    // domains (domain or domains)
    const domParam = (sp.get("domain") || sp.get("domains") || "").trim();
    const mappedDomains = mapTokensToOptions(domParam, domainOptions);

    // types (type/types/stakeholder/stakeholders)
    const typeParam = (
      sp.get("type") ||
      sp.get("types") ||
      sp.get("stakeholder") ||
      sp.get("stakeholders") ||
      ""
    ).trim();
    const mappedTypes = mapTokensToOptions(typeParam, typeOptions);

    // Apply once
    if (qParam) setQ(qParam);
    if (mappedDomains.length) setSelDomains(mappedDomains);
    if (mappedTypes.length) setSelTypes(mappedTypes);

    hydratedRef.current = true;
  }, [location.search, typeOptions, domainOptions]);

  // ===== State → URL sync (q, domain, type) =====
  useEffect(() => {
    if (!hydratedRef.current) return; // avoid churning URL during hydration

    const sp = new URLSearchParams(location.search);
    const before = sp.toString();

    // q
    if (q.trim()) sp.set("q", q.trim());
    else sp.delete("q");

    // domains
    if (selDomains.length) sp.set("domain", selDomains.join(","));
    else sp.delete("domain");

    // types
    if (selTypes.length) sp.set("type", selTypes.join(","));
    else sp.delete("type");

    const after = sp.toString();
    if (after !== before) {
      navigate({ search: after ? `?${after}` : "" }, { replace: true });
    }
  }, [q, selDomains, selTypes, navigate, location.search]);

  // ---- filtering ----
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return data.filter((d) => {
      const typeOk =
        !selTypes.length ||
        selTypes.includes(String(d.typeOfStakeholder || "").trim());
      if (!typeOk) return false;

      const domOk =
        !selDomains.length ||
        selDomains.includes(String(d.domain || "").trim());
      if (!domOk) return false;

      if (ql) {
        const hay = [
          d.name,
          d.website,
          d.address,
          d.description,
          d.domain,
          d.typeOfStakeholder,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(ql)) return false;
      }

      if (!matchGroup(d.cat_support, selSupport)) return false;
      if (!matchGroup(d.cat_applications, selApps)) return false;
      if (!matchGroup(d.cat_manufacturers, selMfg)) return false;
      if (!matchGroup(d.cat_hw_sw, selHwSw)) return false;

      return true;
    });
  }, [data, q, selTypes, selDomains, selSupport, selApps, selMfg, selHwSw]);

  const clearAll = () => {
    setQ("");
    setSelTypes([]);
    setSelDomains([]);
    setSelSupport([]);
    setSelApps([]);
    setSelMfg([]);
    setSelHwSw([]);
  };

  // Selected chips (shown above the dock)
  const activeChips = useMemo(() => {
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

  if (status === "loading") {
    return (
      <div className="container">
        <div className="card">
          <strong>Loading data…</strong>
        </div>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="container">
        <div className="card">
          <strong>Could not load data</strong>
          <p className="muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container dir-container">
      {/* Selected filters row */}
      <div
        className="toolbar"
        style={{ marginBottom: 10, gap: 8, alignItems: "center" }}
      >
        <strong className="muted">Selected Filters:</strong>
        {activeChips.length ? (
          <div className="f-chips" style={{ margin: 0 }}>
            {activeChips.map((chip) => (
              <button key={chip.key} className="chip" onClick={chip.onClear}>
                {chip.label}
                <span>×</span>
              </button>
            ))}
          </div>
        ) : (
          <span className="muted">None</span>
        )}
        <div style={{ marginLeft: "auto" }}>
          <button className="btn-squircle" onClick={clearAll}>
            Clear all
          </button>
        </div>
      </div>

      <div className="dir-layout">
        {/* FILTER DOCK */}
        <aside
          className={`filters-dock ${pinned ? "pinned" : ""} ${
            showAdvanced ? "dock-expanded" : "dock-collapsed"
          }`}
          aria-label="Filters"
        >
          <div className="filters-handle" aria-hidden>
            <span>FILTERS</span>
          </div>

          <div className="filters-dock-inner">
            {/* Head */}
            <header className="f-head">
              <h3 className="f-title">FILTERS</h3>
              <div className="f-head-actions">
                <button
                  className="btn-squircle icon-only"
                  onClick={() => setPinned((v) => !v)}
                  aria-label={pinned ? "Unpin filters" : "Pin filters"}
                  title={pinned ? "Unpin" : "Pin"}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M16.24 3.56l4.2 4.2-2.12 2.12-.7-.7-3.54 3.54 2.12 2.12-1.41 1.41-2.12-2.12-3.54 3.54-.7-.7 3.54-3.54-2.12-2.12 1.41-1.41 2.12 2.12 3.54-3.54-.7-.7 2.12-2.12zM5 19l4-4"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <button className="btn-squircle" onClick={clearAll}>
                  Clear all
                </button>
              </div>
            </header>

            {/* Search */}
            <section className="f-section">
              <input
                className="input"
                placeholder="Search keywords…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search organizations"
              />
            </section>

            {/* Basic (MULTI) */}
            <section className="f-section">
              <h4 className="f-section-title">Basic</h4>
              <div className="f-stack">
                <MultiSelect
                  label="All stakeholders"
                  options={typeOptions}
                  value={selTypes}
                  onChange={setSelTypes}
                  soft
                />
                <MultiSelect
                  label="All domains"
                  options={domainOptions}
                  value={selDomains}
                  onChange={setSelDomains}
                  soft
                />
              </div>
            </section>

            <hr className="f-hr" />

            {/* Advanced */}
            <section className="f-section f-section-advanced">
              <div className="f-section-row" style={{ alignItems: "center" }}>
                <h4 className="f-section-title f-section-title--soft">
                  Advanced
                </h4>
                {!showAdvanced ? (
                  <button
                    className="btn-squircle"
                    onClick={() => setShowAdvanced(true)}
                    aria-expanded="false"
                    aria-controls="advanced-panel"
                  >
                    Show advanced filters
                  </button>
                ) : (
                  <button
                    className="btn-squircle"
                    onClick={() => setShowAdvanced(false)}
                    aria-expanded="true"
                    aria-controls="advanced-panel"
                  >
                    Hide advanced filters
                  </button>
                )}
              </div>

              {showAdvanced && (
                <div
                  id="advanced-panel"
                  className="f-grid"
                  role="region"
                  aria-label="Advanced filters"
                >
                  <MultiSelect
                    label="Support & Enabling Services"
                    options={supportOptions}
                    value={selSupport}
                    onChange={setSelSupport}
                    soft
                  />
                  <MultiSelect
                    label="Applications & End-Users"
                    options={appOptions}
                    value={selApps}
                    onChange={setSelApps}
                    soft
                  />
                  <MultiSelect
                    label="Manufacturers/Developers"
                    options={mfgOptions}
                    value={selMfg}
                    onChange={setSelMfg}
                    soft
                  />
                  <MultiSelect
                    label="Hardware/Software"
                    options={hwSwOptions}
                    value={selHwSw}
                    onChange={setSelHwSw}
                    soft
                  />
                </div>
              )}
            </section>

            {/* Sticky actions */}
            <div className="f-sticky">
              <button
                className="btn-squircle"
                onClick={() => {
                  setSelSupport([]);
                  setSelApps([]);
                  setSelMfg([]);
                  setSelHwSw([]);
                }}
              >
                Clear advanced
              </button>
              <span className="f-sticky-count">{filtered.length} results</span>
            </div>
          </div>
        </aside>

        {/* RESULTS */}

        <main className="dir-results">
          <div className="grid grid-cards">
            {filtered.length === 0 ? (
              <div className="card">
                <strong>No results</strong>
                <p className="muted">Try adjusting or clearing filters.</p>
              </div>
            ) : (
              filtered.map((c) => <CompanyCard key={c.id} c={c} query={q} />)
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
