export default function Footer() {
  return (
    <footer style={{ marginTop: 32 }}>
      <div
        className="card"
        style={{
          padding: 32,
          borderRadius: 0, // flat edges
          maxWidth: "100%", // stretch full width
        }}
      >
        {/* Top grid */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            alignItems: "start",
          }}
        >
          {/* Brand + blurb */}
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--primary)",
                  color: "#fff",
                  boxShadow: "var(--shadow)",
                  flexShrink: 0,
                }}
                aria-hidden
              >
                🚀
              </div>
              <strong style={{ fontSize: 18 }}>AeroSpace Map</strong>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Exploring Bavarian&apos;s aerospace ecosystem through interactive
              mapping and comprehensive directory services.
            </p>
          </div>

          {/* Platform */}
          <div>
            <strong>Platform</strong>
            <ul className="footer-list">
              <li>
                <a className="link" href="/">
                  Home
                </a>
              </li>
              <li>
                <a className="link" href="/map">
                  Map View
                </a>
              </li>
              <li>
                <a className="link" href="/directory">
                  Directory
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <strong>Resources</strong>
            <ul className="footer-list">
              <li>
                <a className="link" href="#">
                  Data Sources
                </a>
              </li>
              <li>
                <a className="link" href="#">
                  API Documentation
                </a>
              </li>
              <li>
                <a className="link" href="#">
                  Submit Organization
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <strong>Legal</strong>
            <ul className="footer-list">
              <li>
                <a className="link" href="#">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a className="link" href="#">
                  Imprint
                </a>
              </li>
              <li>
                <a className="link" href="#">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="footer-hr" />

        {/* Bottom row */}
        <div
          className="toolbar"
          style={{
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div className="muted">
            © {new Date().getFullYear()} AeroSpace Map. Built for Germany&apos;s
            aerospace community.
          </div>
          <div className="muted">
            Made with{" "}
            <span aria-hidden style={{ color: "#ef4444" }}>
              ♥
            </span>{" "}
            for the aerospace industry
          </div>
        </div>
      </div>
    </footer>
  );
}
