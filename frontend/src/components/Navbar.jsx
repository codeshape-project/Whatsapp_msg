
// import { useEffect, useState } from "react";
// import { Menu, Building2, ChevronDown } from "lucide-react";
// import { useAuth } from "../hooks/useAuth";
// const { user, organization } = useAuth();
// // Returns the current date/time (updates every 15 seconds – seconds are not shown)
// function useNow() {
//   const [now, setNow] = useState(new Date());
//   useEffect(() => {
//     const id = setInterval(() => setNow(new Date()), 15000);
//     return () => clearInterval(id);
//   }, []);
//   return now;
// }

// export default function Navbar({ onMenuClick }) {
//   const now = useNow();
//   const { user, organization, organizations, switchOrganization } = useAuth();

//   const weekday = now.toLocaleDateString("en-IN", { weekday: "short" });
//   const date = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
//   const time = now
//     .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
//     .toUpperCase();

//   const name = user?.name || "Admin Panel";
//   const role = user?.role || "Administrator";
//   const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");

//   return (
//     <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 px-3 text-white shadow-[0_6px_20px_-8px_rgba(3,45,41,0.7)] sm:px-6 lg:left-52">
//       {/* Menu button (mobile only) */}
    

//       {/* Organization switcher, date/time and signed-in user */}
//       <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-5">
        
//         <div className="text-right leading-tight">
//           <p className="text-xs font-medium text-white sm:text-sm">
//             <span className="hidden sm:inline">{weekday}, </span>
//             {date}
//           </p>
//           <p className="text-xs font-semibold text-wa sm:text-sm">{time}</p>
//         </div>

//         <div className="flex items-center gap-3">
//           <span className="hidden text-right leading-tight md:block">
//             <span className="block text-sm font-medium">{name}</span>
//             <span className="block text-xs text-emerald-100/80">{role}</span>
//           </span>
//           <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-wa to-brand-600 text-sm font-semibold text-brand-950 shadow-[0_0_14px_rgba(37,211,102,0.6)]">
//             {initials}
//           </span>
//         </div>
//       </div>
//     </header>
//   );
// }

import { useEffect, useState } from "react";
import { Menu, Building2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

// Returns current date/time (updates every 15 seconds)
function useNow() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 15000);

    return () => clearInterval(id);
  }, []);

  return now;
}

export default function Navbar({ onMenuClick }) {
  const now = useNow();

  const { user, organization } = useAuth();

  const weekday = now.toLocaleDateString("en-IN", {
    weekday: "short",
  });

  const date = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const time = now
    .toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
    .toUpperCase();

  const name = user?.name || "Admin Panel";
  const role = user?.role || "Administrator";

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 px-3 text-white shadow-[0_6px_20px_-8px_rgba(3,45,41,0.7)] sm:px-6 lg:left-52">

      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Organization, Date and User */}
      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-5">

        {/* Organization Name and Logo */}
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2 py-1.5 sm:px-3">

          {organization?.logo_url ? (
            <img
              src={organization.logo_url}
              alt={organization.name || "Organization Logo"}
              className="h-7 w-7 shrink-0 rounded-full bg-white object-contain"
            />
          ) : (
            <Building2
              size={18}
              className="shrink-0 text-wa"
            />
          )}

          <span className="max-w-[125px] truncate text-xs font-semibold sm:max-w-[190px] sm:text-sm">
            {organization?.name || "CodeShape School"}
          </span>
        </div>

        {/* Date and Time */}
        <div className="text-right leading-tight">
          <p className="text-xs font-medium text-white sm:text-sm">
            <span className="hidden sm:inline">
              {weekday},{" "}
            </span>
            {date}
          </p>

          <p className="text-xs font-semibold text-wa sm:text-sm">
            {time}
          </p>
        </div>

        {/* Logged-in User */}
        <div className="flex items-center gap-3">

          <span className="hidden text-right leading-tight md:block">
            <span className="block text-sm font-medium">
              {name}
            </span>

            <span className="block text-xs text-emerald-100/80">
              {role}
            </span>
          </span>

          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-wa to-brand-600 text-sm font-semibold text-brand-950 shadow-[0_0_14px_rgba(37,211,102,0.6)]">
            {initials}
          </span>

        </div>
      </div>
    </header>
  );
}
