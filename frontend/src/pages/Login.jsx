
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ORGANIZATIONS } from "../data/dummyData";
import { backendEnabled } from "../lib/supabase";

const IMAGE_SRC = "/login-illustration.png";
const LOGO_SRC = "/logo.png";

const SCHOOL_ORGANIZATION = ORGANIZATIONS.find(
  (org) => org.id === "codeshape-school"
);

const ADMIN_EMAIL = "admin@codeshape-school.com";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [organizationId] = useState("codeshape-school");
  const [remember] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleOrganizationChange = (e) => {
    const selectedId = e.target.value;
    setOrganizationId(selectedId);

    const selectedEmail = ADMIN_EMAILS[selectedId];

    if (selectedEmail) {
      setEmail(selectedEmail);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (backendEnabled && (!email.trim() || !password)) {
      setLoginError("Enter your admin email and password.");
      return;
    }

    setBusy(true);

    try {
      await login(email, password, remember, organizationId);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setLoginError(
        error.message || "Login failed. Please check your credentials."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fdf9e9] px-4 py-10">
      <style>{`
        @property --glow-angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }

        @keyframes glow-spin {
          to {
            --glow-angle: 360deg;
          }
        }

        .glow-card,
        .glow-card::before {
          background: conic-gradient(
            from var(--glow-angle),
            #25d366,
            #d9f99d 18%,
            #0f8a52 40%,
            #86efac 62%,
            #25d366 80%,
            #bbf7d0
          );
          animation: glow-spin 7s linear infinite;
        }

        .glow-card {
          position: relative;
          isolation: isolate;
        }

        .glow-card::before {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: inherit;
          filter: blur(16px);
          opacity: 0.6;
          z-index: -1;
        }

        .login-field:focus-within {
          border-color: #17a862;
          box-shadow:
            0 0 0 3px rgba(23, 168, 98, 0.18),
            0 0 14px rgba(37, 211, 102, 0.35);
        }

        @media (prefers-reduced-motion: reduce) {
          .glow-card,
          .glow-card::before {
            animation: none;
          }
        }
      `}</style>

      {/* Soft background wash */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.9),rgba(253,249,233,0))]" />

      {/* Glowing card */}
      <div className="glow-card w-full max-w-[400px] rounded-[30px] p-[2px] lg:max-w-[760px]">
        <div className="flex min-h-[440px] overflow-hidden rounded-[28px] bg-[#fdfbf2]">
          {/* Left image */}
          <div className="hidden w-[50%] shrink-0 lg:block">
            <img
              src={IMAGE_SRC}
              alt="City Care Hospital"
              className="h-full w-full rounded-r-full object-cover object-center"
            />
          </div>

          {/* Login form */}
          <section className="flex flex-1 flex-col justify-center px-7 py-8 lg:pl-5 lg:pr-9">
            <div className="flex items-center gap-3">
             

              <div>
                <h1 className="text-lg font-bold leading-tight text-[#0b5a3c]">
                  WhatsApp Messaging
                </h1>
                <p className="text-[11px] font-medium text-[#0b5a3c]">
                  One platform. Multiple organizations.
                </p>
              </div>
            </div>

            <div className="mt-2 h-[3px] w-14 rounded bg-gradient-to-r from-[#17a862] to-transparent" />

            <h2 className="mt-5 text-lg font-bold text-[#0b5a3c]">
              Login to Your Account
            </h2>

            <p className="mt-0.5 text-xs text-[#2f6a56]">
              Enter your credentials to continue
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
              {/* Email */}
              <label className="login-field flex items-center gap-2.5 rounded-full border border-[#9fd5bd] bg-white/70 px-4 py-2 transition">
                <Mail size={16} className="shrink-0 text-[#0b5a3c]" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  autoComplete="username"
                  className="w-full bg-transparent text-xs text-[#0b5a3c] outline-none placeholder:text-[#6f8f84]"
                />
              </label>

              {/* Password */}
              <label className="login-field flex items-center gap-2.5 rounded-full border border-[#9fd5bd] bg-white/70 px-4 py-2 transition">
                <Lock size={16} className="shrink-0 text-[#0b5a3c]" />

                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full bg-transparent text-xs text-[#0b5a3c] outline-none placeholder:text-[#6f8f84]"
                />

                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="text-[#4b6b61] hover:text-[#0b5a3c]"
                >
                  
                </button>
              </label>

              {/* Login button */}
              {loginError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                >
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#12a460] to-[#08744a] py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(15,138,82,0.35)] transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#17a862]/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn size={16} />
                {busy ? "Signing in..." : "Login"}
              </button>

              {/* Organization selection below Login */}
              
{/* Organization selection below Login */}

<button
  type="button"
  onClick={() => setEmail(ADMIN_EMAIL)}
  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#9fd5bd] bg-white/80 py-2.5 text-sm font-semibold text-[#0b5a3c] transition hover:bg-[#e8f8ef]"
>
  <ShieldCheck size={16} />
  Admin 
</button>


            </form>

            {backendEnabled && (
              <p className="mt-2 text-center text-[10px] text-[#4b6b61]">
                Use the admin account created in Supabase Authentication.
              </p>
            )}

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#4b6b61]">
              <ShieldCheck size={14} className="text-[#0f8a52]" />
              Secure Login
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


// import { useState } from "react";
// import { Navigate, useNavigate } from "react-router-dom";
// import {
//   Mail,
//   Lock,
//   Eye,
//   EyeOff,
//   LogIn,
//   ShieldCheck,
//   Building2,
// } from "lucide-react";
// import { useAuth } from "../hooks/useAuth";
// import { ORGANIZATIONS } from "../data/dummyData";
// import { backendEnabled } from "../lib/supabase";

// const IMAGE_SRC = "/login-illustration.png";
// const LOGO_SRC = "/logo.png";

// const SCHOOL_ORGANIZATION = ORGANIZATIONS.find(
//   (org) => org.id === "codeshape-school"
// );

// const ADMIN_EMAIL = "admin@codeshape-school.com";

// export default function Login() {
//   const { login, isAuthenticated } = useAuth();
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [show, setShow] = useState(false);
//   const [organizationId] = useState("codeshape-school");
//   const [remember] = useState(true);
//   const [loginError, setLoginError] = useState("");
//   const [busy, setBusy] = useState(false);

//   // UI-only states
//   const [superAdminMode, setSuperAdminMode] = useState(false);
//   const [organizationCode, setOrganizationCode] = useState("");

//   const handleOrganizationChange = (e) => {
//     const selectedId = e.target.value;
//     setOrganizationId(selectedId);

//     const selectedEmail = ADMIN_EMAILS[selectedId];

//     if (selectedEmail) {
//       setEmail(selectedEmail);
//     }
//   };

//   if (isAuthenticated) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoginError("");

//     if (backendEnabled && (!email.trim() || !password)) {
//       setLoginError("Enter your admin email and password.");
//       return;
//     }

//     setBusy(true);

//     try {
//       await login(email, password, remember, organizationId);
//       navigate("/dashboard", { replace: true });
//     } catch (error) {
//       setLoginError(
//         error.message || "Login failed. Please check your credentials."
//       );
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fdf9e9] px-4 py-10">

//       <style>{`
//         @property --glow-angle {
//           syntax: "<angle>";
//           inherits: false;
//           initial-value: 0deg;
//         }

//         @keyframes glow-spin {
//           to {
//             --glow-angle: 360deg;
//           }
//         }

//         .glow-card,
//         .glow-card::before {
//           background: conic-gradient(
//             from var(--glow-angle),
//             #25d366,
//             #d9f99d 18%,
//             #0f8a52 40%,
//             #86efac 62%,
//             #25d366 80%,
//             #bbf7d0
//           );
//           animation: glow-spin 7s linear infinite;
//         }

//         .glow-card {
//           position: relative;
//           isolation: isolate;
//         }

//         .glow-card::before {
//           content: "";
//           position: absolute;
//           inset: -4px;
//           border-radius: inherit;
//           filter: blur(16px);
//           opacity: 0.58;
//           z-index: -1;
//         }

//         .login-field:focus-within {
//           border-color: #17a862;
//           box-shadow:
//             0 0 0 3px rgba(23, 168, 98, 0.18),
//             0 0 14px rgba(37, 211, 102, 0.25);
//         }

//         @media (prefers-reduced-motion: reduce) {
//           .glow-card,
//           .glow-card::before {
//             animation: none;
//           }
//         }
//       `}</style>

//       {/* Background glow */}
//       <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.9),rgba(253,249,233,0))]" />

//       {/* Main glowing card */}
//       <div className="glow-card w-full max-w-[440px] rounded-[30px] p-[2px] lg:max-w-[900px]">

//         <div className="flex min-h-[540px] overflow-hidden rounded-[28px] bg-[#fdfbf2]">

//           {/* Left illustration */}
          
// <div className="relative hidden w-[48%] shrink-0 overflow-hidden lg:block">
//   {/* Full vertical image */}
//   <img
//     src={IMAGE_SRC}
//     alt="City Care Hospital"
//     className="absolute inset-0 h-full w-full object-cover object-center"
//   />

//   {/* Full image overlay */}
//   <div
//     className="absolute inset-0 flex flex-col justify-end px-8 pb-8 pt-20 text-white"
//     style={{
//       background:
//         "linear-gradient(to top, rgba(6,78,59,0.85) 0%, rgba(6,78,59,0.35) 40%, rgba(6,78,59,0.05) 100%)",
//     }}
//   >
//     <div className="mb-3 flex items-center gap-3">
//       <img
//         src={LOGO_SRC}
//         alt="Codeshape logo"
//         className="h-12 w-12 rounded-full border border-white/50 bg-white object-contain p-1"
//       />

//       <div>
//         <p className="text-lg font-bold">WhatsApp Messaging</p>
//         <p className="text-xs text-white/80">Codeshape</p>
//       </div>
//     </div>

//     <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/90">
//       Manage your organization, contacts, campaigns, and messaging
//       securely from one workspace.
//     </p>

//     {/* Company Helpline */}
//     <div className="mt-5 flex items-center gap-3">
//       <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20">
//         <span className="text-lg">☎</span>
//       </div>

//       <div>
//         <p className="text-xs font-medium text-white/75">
//           Company Helpline
//         </p>
//         <p className="text-base font-bold tracking-wide">
//           9451501826
//         </p>
//       </div>
//     </div>
//   </div>
// </div>

//           {/* Login form */}
//           <section className="flex flex-1 flex-col justify-center px-7 py-8 sm:px-9 lg:px-10">

//             <div className="flex items-center gap-3">

//               <div className="rounded-xl bg-[#e1f7e9] p-3 text-[#08744a]">
//                 <ShieldCheck size={25} />
//               </div>

//               <div>
//                 <h1 className="text-lg font-bold leading-tight text-[#0b5a3c]">
//                   WhatsApp Messaging
//                 </h1>

//                 <p className="text-[11px] font-medium text-[#2f6a56]">
//                   Secure workspace access
//                 </p>
//               </div>
//             </div>

//             {/* Organization / Super Admin selector */}
//             <div className="mt-6 flex rounded-full border border-[#9fd5bd] bg-white/80 p-1">

//               <button
//                 type="button"
//                 onClick={() => {
//                   setSuperAdminMode(false);
//                   setLoginError("");
//                 }}
//                 className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition ${
//                   !superAdminMode
//                     ? "bg-[#08744a] text-white shadow"
//                     : "text-[#0b5a3c] hover:bg-[#e8f8ef]"
//                 }`}
//               >
//                 <Building2 size={14} />
//                 Organization
//               </button>

//               <button
//                 type="button"
//                 onClick={() => {
//                   setSuperAdminMode(true);
//                   setLoginError("");
//                 }}
//                 className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition ${
//                   superAdminMode
//                     ? "bg-[#08744a] text-white shadow"
//                     : "text-[#0b5a3c] hover:bg-[#e8f8ef]"
//                 }`}
//               >
//                 <ShieldCheck size={14} />
//                 Super Admin
//               </button>

//             </div>

//             <h2 className="mt-5 text-lg font-bold text-[#0b5a3c]">
//               {superAdminMode ? "Super Admin Login" : "Organization Login"}
//             </h2>

//             <p className="mt-1 text-xs text-[#2f6a56]">
//               Enter your credentials to continue.
//             </p>

//             <form
//               onSubmit={handleSubmit}
//               noValidate
//               className="mt-5 space-y-3"
//             >

//               {/* Email */}
//               <label className="login-field flex items-center gap-2.5 rounded-full border border-[#9fd5bd] bg-white/80 px-4 py-3 transition">

//                 <Mail size={16} className="shrink-0 text-[#0b5a3c]" />

//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="Email Address"
//                   autoComplete="username"
//                   className="w-full bg-transparent text-sm text-[#0b5a3c] outline-none placeholder:text-[#6f8f84]"
//                 />

//               </label>

//               {/* Password */}
//               <label className="login-field flex items-center gap-2.5 rounded-full border border-[#9fd5bd] bg-white/80 px-4 py-3 transition">

//                 <Lock size={16} className="shrink-0 text-[#0b5a3c]" />

//                 <input
//                   type={show ? "text" : "password"}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Password"
//                   autoComplete="current-password"
//                   className="w-full bg-transparent text-sm text-[#0b5a3c] outline-none placeholder:text-[#6f8f84]"
//                 />

//                 <button
//                   type="button"
//                   onClick={() => setShow((s) => !s)}
//                   aria-label={show ? "Hide password" : "Show password"}
//                   className="shrink-0 text-[#4b6b61] hover:text-[#0b5a3c]"
//                 >
//                   {show ? <EyeOff size={16} /> : <Eye size={16} />}
//                 </button>

//               </label>

//               {/* Organization Code - UI only */}
//               {!superAdminMode && (
//                 <label className="login-field flex items-center gap-2.5 rounded-full border border-[#9fd5bd] bg-white/80 px-4 py-3 transition">

//                   <Building2 size={16} className="shrink-0 text-[#0b5a3c]" />

//                   <input
//                     type="text"
//                     value={organizationCode}
//                     onChange={(e) => setOrganizationCode(e.target.value)}
//                     placeholder="Organization Code"
//                     autoComplete="organization"
//                     className="w-full bg-transparent text-sm text-[#0b5a3c] outline-none placeholder:text-[#6f8f84]"
//                   />

//                 </label>
//               )}

//               {/* Login error */}
//               {loginError && (
//                 <div
//                   role="alert"
//                   className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
//                 >
//                   {loginError}
//                 </div>
//               )}

//               {/* Login button */}
//               <button
//                 type="submit"
//                 disabled={busy}
//                 className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#12a460] to-[#08744a] py-3 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(15,138,82,0.35)] transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#17a862]/40 disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 <LogIn size={16} />
//                 {busy ? "Signing in..." : "Login"}
//               </button>

//               {/* Existing Admin button */}
//               <button
//                 type="button"
//                 onClick={() => setEmail(ADMIN_EMAIL)}
//                 className="flex w-full items-center justify-center gap-2 rounded-full border border-[#9fd5bd] bg-white/80 py-2.5 text-sm font-semibold text-[#0b5a3c] transition hover:bg-[#e8f8ef]"
//               >
//                 <ShieldCheck size={16} />
//                 Admin
//               </button>

//             </form>

//             {backendEnabled && (
//               <p className="mt-2 text-center text-[10px] text-[#4b6b61]">
//                 Use the admin account created in Supabase Authentication.
//               </p>
//             )}

//             <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#4b6b61]">
//               <ShieldCheck size={14} className="text-[#0f8a52]" />
//               Secure Login
//             </p>

//           </section>
//         </div>
//       </div>
//     </div>
//   );
// }
