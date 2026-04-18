import { NavLink, Outlet, Link } from "react-router-dom";
import "./Layout.css";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "nav-link nav-link-active" : "nav-link";

export function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand-link">
          <div className="brand">
            <img
              className="brand-mark"
              src="/pixelsprite.png"
              alt=""
              width={42}
              height={42}
              decoding="async"
            />
            <div>
              <div className="brand-title">Race leaderboard</div>
              <div className="brand-sub">Little 500 replay & results</div>
            </div>
          </div>
        </Link>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/stats" className={linkClass}>
            Statistics
          </NavLink>
          <NavLink to="/log" className={linkClass}>
            Activity log
          </NavLink>
          <NavLink to="/admin" className={linkClass}>
            Admin
          </NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
