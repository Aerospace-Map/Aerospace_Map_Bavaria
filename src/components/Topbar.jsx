// src/components/Topbar.jsx
import { NavLink } from "react-router-dom";
import logo from "../assets/MAE-Logo-weiß.png";

export default function Topbar({ children }) {
  const DefaultNav = (
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
  );

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Brand */}
        <div className="brand">
          <img src={logo} alt="Munich Aerospace" className="brand-icon-img" />
          <div className="brand-text">
            <div className="brand-title">Aerospace Map</div>
          </div>
        </div>

        {/* Nav (children overrides default) */}
        {children ? children : DefaultNav}
      </div>
    </header>
  );
}
