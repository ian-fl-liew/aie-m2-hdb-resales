import { NavLink, useNavigate } from "react-router";
import { Home, Building2, Sparkles, LogOut, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { to: "/app", label: "Browse", icon: Home, end: true },
  { to: "/app/my-listings", label: "My Listings", icon: Building2 },
  { to: "/app/agents", label: "Agents", icon: Users },
  { to: "/app/assistant", label: "AI Assistant", icon: Sparkles },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className={styles.sidebar} aria-label="Main">
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true" />
        <span className={styles.brandName}>HDB Resale Marketplace</span>
      </div>

      <ul className={styles.navList}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            {/* NavLink gives us the active state for free */}
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden="true">
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </span>
          <div className={styles.userText}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>{user?.role}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className={styles.logoutBtn}
        >
          <LogOut size={16} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;
