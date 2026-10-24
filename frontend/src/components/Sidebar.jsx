

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, Send, CalendarClock, BarChart3, Settings, LogOut, X, PanelsTopLeft,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";


// Logo is loaded from the /public folder
const LOGO_SRC = "/logo.png";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/master-management", label: "Master Management", icon: PanelsTopLeft },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/campaigns", label: "Campaigns", icon: Send },
  { to: "/scheduled", label: "Scheduled Messages", icon: CalendarClock },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { logout, organization } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-52 flex-col bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 px-2.5 pb-4 pt-5 text-white shadow-[4px_0_24px_-8px_rgba(3,45,41,0.6)] transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded p-1 hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>

        {/* Logo + name */}
        <div className="flex flex-col items-center px-2 pb-5 text-center">
          <img
            src={LOGO_SRC}
            alt={`${organization.name} logo`}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-wa shadow-[0_0_22px_rgba(37,211,102,0.55)]"
          />
          <h1 className="mt-3 text-[15px] font-semibold leading-tight">{organization.name}</h1>
          <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-wa/50 to-transparent" />
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] font-medium transition ${
                  isActive
                    ? "bg-wa text-brand-950 shadow-[0_0_18px_rgba(37,211,102,0.55)]"
                    : "text-emerald-50/85 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout at the bottom */}
        <button
          onClick={handleLogout}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-[13px] font-medium text-white transition hover:border-red-400 hover:bg-red-500"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>
    </>
  );
}
