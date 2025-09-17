// src/App.jsx
import { useEffect } from "react";
import { Routes, Route, useLocation, NavLink } from "react-router-dom";

import Topbar from "./components/Topbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Directory from "./pages/Directory";
import MapPage from "./pages/MapPage";

import { useStore } from "./store";

/* Smooth scroll to top on route change */
function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (hash) return; // allow in-page anchors
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, search, hash]);
  return null;
}

/* Dev helper: open /?debug=1 to see workbook/headers */
function DataDoctor() {
  const {
    data,
    status,
    error,
    lastSheet,
    reload,
    headersOriginal,
    headersNormalized,
  } = useStore();
  const { search } = useLocation();
  const show = new URLSearchParams(search).get("debug") === "1";
  if (!show) return null;
  const sample = data?.[0];

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        bottom: 12,
        zIndex: 1000,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "var(--shadow)",
        padding: 12,
        maxWidth: 520,
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
        <strong>DataDoctor</strong>
        <button className="button small" onClick={reload}>
          Reload
        </button>
      </div>
      <div className="muted" style={{ marginTop: 6 }}>
        Status: <b>{status}</b>
        {lastSheet ? ` • Sheet: "${lastSheet}"` : ""} • Rows:{" "}
        <b>{data.length}</b>
      </div>
      {error && (
        <div style={{ color: "#b91c1c", marginTop: 6 }}>{String(error)}</div>
      )}
      {!!headersOriginal?.length && (
        <>
          <div className="muted" style={{ marginTop: 8 }}>
            Original headers:
          </div>
          <pre
            style={{ margin: 0, maxHeight: 90, overflow: "auto", fontSize: 12 }}
          >
            {JSON.stringify(headersOriginal, null, 2)}
          </pre>
          <div className="muted" style={{ marginTop: 8 }}>
            Normalized headers:
          </div>
          <pre
            style={{ margin: 0, maxHeight: 90, overflow: "auto", fontSize: 12 }}
          >
            {JSON.stringify(headersNormalized, null, 2)}
          </pre>
        </>
      )}
      {sample ? (
        <>
          <div className="muted" style={{ marginTop: 8 }}>
            First mapped row:
          </div>
          <pre
            style={{
              margin: 0,
              maxHeight: 160,
              overflow: "auto",
              fontSize: 12,
            }}
          >
            {JSON.stringify(sample, null, 2)}
          </pre>
        </>
      ) : (
        status === "ready" && (
          <div className="muted" style={{ marginTop: 6 }}>
            No rows mapped.
          </div>
        )
      )}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    document.body.classList.add("theme-dark");
    return () => document.body.classList.remove("theme-dark");
  }, []);

  return (
    <>
      <ScrollToTop />
      <DataDoctor />

      <Topbar>
        <nav className="nav">
          <NavLink to="/" className="nav-link">
            <span>Home</span>
          </NavLink>
          <NavLink to="/directory" className="nav-link">
            <span>Directory</span>
          </NavLink>
          <NavLink to="/map" className="nav-link">
            <span>Map</span>
          </NavLink>
        </nav>
      </Topbar>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/map" element={<MapPage />} />
        <Route
          path="*"
          element={
            <div className="container" style={{ paddingTop: 24 }}>
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Page not found</h3>
                <p className="muted">
                  Try Home, Directory, or Map from the navigation.
                </p>
              </div>
            </div>
          }
        />
      </Routes>

      <Footer />
      
    </>
  );
}
