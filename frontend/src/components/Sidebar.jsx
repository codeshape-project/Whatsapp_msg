

// import { NavLink, useNavigate } from "react-router-dom";
// import {
//   LayoutDashboard, Users, FileText, Send, CalendarClock, BarChart3, Settings, LogOut, X, PanelsTopLeft,
// } from "lucide-react";
// import { useAuth } from "../hooks/useAuth";


// // Logo is loaded from the /public folder
// const LOGO_SRC = "/logo.png";

// const links = [
//   { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//   { to: "/master-management", label: "Master Management", icon: PanelsTopLeft },
//   { to: "/contacts", label: "Contacts", icon: Users },
//   { to: "/templates", label: "Templates", icon: FileText },
//   { to: "/campaigns", label: "Campaigns", icon: Send },
//   { to: "/scheduled", label: "Scheduled Messages", icon: CalendarClock },
//   { to: "/reports", label: "Reports", icon: BarChart3 },
//   { to: "/settings", label: "Settings", icon: Settings },
// ];

// export default function Sidebar({ open, onClose }) {
//   const { logout, organization } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate("/login", { replace: true });
//   };

//   return (
//     <>
//       {/* mobile overlay */}
//       {open && (
//         <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />
//       )}

//       <aside
//         className={`fixed inset-y-0 left-0 z-50 flex w-52 flex-col bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 px-2.5 pb-4 pt-5 text-white shadow-[4px_0_24px_-8px_rgba(3,45,41,0.6)] transition-transform duration-200 lg:translate-x-0 ${
//           open ? "translate-x-0" : "-translate-x-full"
//         }`}
//       >
//         <button
//           onClick={onClose}
//           className="absolute right-2 top-2 rounded p-1 hover:bg-white/10 lg:hidden"
//           aria-label="Close menu"
//         >
//           <X size={18} />
//         </button>

//         {/* Logo + name */}
//         <div className="flex flex-col items-center px-2 pb-5 text-center">
//           <img
//             src={LOGO_SRC}
//             alt={`${organization.name} logo`}
//             className="h-16 w-16 rounded-full object-cover ring-2 ring-wa shadow-[0_0_22px_rgba(37,211,102,0.55)]"
//           />
//           <h1 className="mt-3 text-[15px] font-semibold leading-tight">{organization.name}</h1>
//           <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-wa/50 to-transparent" />
//         </div>

//         {/* Menu */}
//         <nav className="flex-1 space-y-1 overflow-y-auto">
//           {links.map(({ to, label, icon: Icon }) => (
//             <NavLink
//               key={to}
//               to={to}
//               onClick={onClose}
//               className={({ isActive }) =>
//                 `flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] font-medium transition ${
//                   isActive
//                     ? "bg-wa text-brand-950 shadow-[0_0_18px_rgba(37,211,102,0.55)]"
//                     : "text-emerald-50/85 hover:bg-white/10 hover:text-white"
//                 }`
//               }
//             >
//               <Icon size={18} />
//               {label}
//             </NavLink>
//           ))}
//         </nav>

//         {/* Logout at the bottom */}
//         <button
//           onClick={handleLogout}
//           className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-[13px] font-medium text-white transition hover:border-red-400 hover:bg-red-500"
//         >
//           <LogOut size={18} /> Logout
//         </button>
//       </aside>
//     </>
//   );
// }

import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  CalendarClock,
  BarChart3,
  Settings,
  LogOut,
  X,
  PanelsTopLeft,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Folder,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

const LOGO_SRC = "/logo.png";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/campaigns", label: "Campaigns", icon: Send },
  { to: "/scheduled", label: "Scheduled Messages", icon: CalendarClock },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

function getRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.branches)) return result.branches;
  if (Array.isArray(result?.departments)) return result.departments;
  if (Array.isArray(result?.data?.branches)) return result.data.branches;
  if (Array.isArray(result?.data?.departments)) return result.data.departments;
  return [];
}

export default function Sidebar({ open, onClose }) {
  const { logout, organization } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [masterOpen, setMasterOpen] = useState(
    location.pathname.startsWith("/master-management")
  );
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expandedBranches, setExpandedBranches] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const loadMasterData = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const [branchResult, departmentResult] = await Promise.all([
        api.getBranches(),
        api.getDepartments(),
      ]);

      setBranches(
        getRows(branchResult).filter((item) => item.is_active !== false)
      );

      setDepartments(
        getRows(departmentResult).filter(
          (item) => item.is_active !== false
        )
      );
    } catch (error) {
      console.error("Unable to load master data:", error);
      setLoadError("Unable to load branches and departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
    // Reload when the signed-in organization changes.
  }, [organization?.id]);

  // Keep the sidebar open and expand the relevant branch when needed.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const branchId = params.get("branch_id");

    if (location.pathname.startsWith("/master-management")) {
      setMasterOpen(true);
    }

    if (branchId) {
      setExpandedBranches((previous) => ({
        ...previous,
        [branchId]: true,
      }));
    }
  }, [location.pathname, location.search]);

  // Master Management opens the page for creating/managing branches
  // and departments. It does not toggle away from the management page.
  
const handleMasterClick = () => {
  setMasterOpen((previous) => !previous);
  navigate("/master-management");
  onClose?.();
};


  // Clicking a branch expands/collapses it. The branch name also
  // opens Master Management with that branch selected.
  const toggleBranch = (branch) => {
    setExpandedBranches((previous) => ({
      ...previous,
      [branch.id]: !previous[branch.id],
    }));

    navigate(
      `/master-management?branch_id=${encodeURIComponent(branch.id)}`
    );
    onClose?.();
  };

  // IMPORTANT: clicking a department opens Contacts, not Master Management.
const openDepartment = (department, branchId = null) => {
  const params = new URLSearchParams({
    department_id: String(department.id),
    department_name: department.name,
  });

  if (branchId) {
    params.set("branch_id", String(branchId));
  }

  navigate(`/department-contacts?${params.toString()}`);
};

  const independentDepartments = departments.filter(
    (department) => department.branch_id == null
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-52 flex-col overflow-hidden bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 px-2.5 pb-4 pt-5 text-white shadow-[4px_0_24px_-8px_rgba(3,45,41,0.6)] transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo and organization */}
        <div className="flex shrink-0 flex-col items-center px-2 pb-5 text-center">
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded p-1 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

          <img
            src={LOGO_SRC}
            alt={`${organization?.name || "Organization"} logo`}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-wa shadow-[0_0_22px_rgba(37,211,102,0.55)]"
          />

          <h1 className="mt-3 text-[15px] font-semibold leading-tight">
            {organization?.name || "Business Panel"}
          </h1>

          <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-wa/50 to-transparent" />
        </div>

        {/* Navigation */}
        <nav
          className="min-h-0 flex-1 space-y-1 overflow-y-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`
            nav::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* Dashboard */}
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] font-medium transition ${
                isActive
                  ? "bg-wa text-brand-950 shadow-[0_0_18px_rgba(37,211,102,0.55)]"
                  : "text-emerald-50/85 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          {/* Master Management dropdown */}
          <div>
            <button
              type="button"
              onClick={handleMasterClick}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[13px] font-medium transition ${
                location.pathname.startsWith("/master-management")
                  ? "bg-wa text-brand-950 shadow-[0_0_18px_rgba(37,211,102,0.35)]"
                  : "text-emerald-50/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              <PanelsTopLeft size={18} />
              <span className="flex-1">Master</span>
              {masterOpen ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
            </button>

            {masterOpen && (
              <div className="ml-3 mt-1 space-y-1 border-l border-white/15 pl-2">
                {loading && (
                  <p className="px-2 py-2 text-xs text-emerald-50/60">
                    Loading...
                  </p>
                )}

                {loadError && (
                  <div className="px-2 py-2 text-xs text-red-200">
                    <p>{loadError}</p>
                    <button
                      type="button"
                      onClick={loadMasterData}
                      className="mt-2 underline"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Branches and their departments */}
                {!loading &&
                  branches.map((branch) => {
                    const isExpanded = Boolean(
                      expandedBranches[branch.id]
                    );

                    const branchDepartments = departments.filter(
                      (department) =>
                        department.branch_id != null &&
                        String(department.branch_id) === String(branch.id)
                    );

                    return (
                      <div key={branch.id}>
                        <button
                          type="button"
                          onClick={() => toggleBranch(branch)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] text-emerald-50/90 hover:bg-white/10 hover:text-white"
                        >
                          {isExpanded ? (
                            <ChevronDown size={14} className="shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="shrink-0" />
                          )}

                          <Folder size={15} className="shrink-0" />

                          <span className="flex-1 truncate">
                            {branch.name}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="ml-3 space-y-1 border-l border-white/10 pl-2">
                            {branchDepartments.length > 0 ? (
                              branchDepartments.map((department) => {
                                const params = new URLSearchParams(
                                  location.search
                                );

                                const isSelected =
                                  location.pathname === "/contacts" &&
                                  params.get("department_id") ===
                                    String(department.id);

                                return (
                                  <button
                                    key={department.id}
                                    type="button"
                                    onClick={() =>
                                      openDepartment(department, branch.id)
                                    }
                                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] transition ${
                                      isSelected
                                        ? "bg-wa text-brand-950"
                                        : "text-emerald-50/75 hover:bg-white/10 hover:text-white"
                                    }`}
                                  >
                                    <GitBranch
                                      size={13}
                                      className="shrink-0"
                                    />
                                    <span className="truncate">
                                      {department.name}
                                    </span>
                                  </button>
                                );
                              })
                            ) : (
                              <p className="px-2 py-2 text-[11px] text-white/50">
                                No departments
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Standalone departments */}
                {!loading &&
                  independentDepartments.map((department) => {
                    const params = new URLSearchParams(location.search);

                    const isSelected =
                      location.pathname === "/contacts" &&
                      params.get("department_id") === String(department.id);

                    return (
                      <button
                        key={department.id}
                        type="button"
                        onClick={() => openDepartment(department)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] transition ${
                          isSelected
                            ? "bg-wa text-brand-950"
                            : "text-emerald-50/85 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <GitBranch size={14} className="shrink-0" />
                        <span className="truncate">{department.name}</span>
                      </button>
                    );
                  })}

                {!loading &&
                  branches.length === 0 &&
                  independentDepartments.length === 0 &&
                  !loadError && (
                    <p className="px-2 py-2 text-[11px] text-white/50">
                      No branches or departments
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Remaining navigation links */}
          {links.slice(1).map(({ to, label, icon: Icon }) => (
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-4 flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-[13px] font-medium text-white transition hover:border-red-400 hover:bg-red-500"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>
    </>
  );
}

