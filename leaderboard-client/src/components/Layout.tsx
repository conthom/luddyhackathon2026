import { NavLink, Outlet } from "react-router-dom";
import "./Layout.css";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "nav-link nav-link-active" : "nav-link";

export function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
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
            <div className="brand-title">Growth ranker</div>
            <div className="brand-sub">Career skills & focus tracker</div>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end className={linkClass}>
            Leaderboard
          </NavLink>
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
