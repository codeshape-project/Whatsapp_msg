
// import { useCallback, useEffect, useState } from "react";
// import {
//   Plus,
//   Search,
//   Building2,
//   Layers3,
//   RefreshCw,
//   X,
//   GitBranch,
// } from "lucide-react";
// import api from "../services/api";
// import { useAuth } from "../hooks/useAuth";

// export default function MasterManagement() {
//   const { organization } = useAuth();

//   const [type, setType] = useState("department");
//   const [branches, setBranches] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [selectedBranch, setSelectedBranch] = useState("");
//   const [query, setQuery] = useState("");
//   const [modalOpen, setModalOpen] = useState(false);
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [formBranch, setFormBranch] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [notice, setNotice] = useState("");
//   const [error, setError] = useState("");

 
// const loadData = useCallback(async () => {
//   setLoading(true);
//   setError("");

//   try {
//     const branchRows = await api.getBranches();
//     const branchList = Array.isArray(branchRows)
//       ? branchRows
//       : branchRows?.data || [];

//     const departmentResults = await Promise.all([
//       api.getDepartments(),
//       ...branchList.map((branch) => api.getDepartments(branch.id)),
//     ]);

//     const allDepartments = departmentResults.flatMap((result) =>
//       Array.isArray(result) ? result : result?.data || []
//     );

//     // Remove duplicates in case the API returns all departments
//     // even when a branch ID is supplied.
//     const uniqueDepartments = [
//       ...new Map(
//         allDepartments.map((department) => [
//           department.id,
//           department,
//         ])
//       ).values(),
//     ];

//     setBranches(branchList);
//     setDepartments(uniqueDepartments);
//   } catch (err) {
//     console.error("Master Management load error:", err);
//     setError(err.message || "Unable to load Master Management.");
//   } finally {
//     setLoading(false);
//   }
// }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData, organization?.id]);

//   const openAdd = () => {
//     setName("");
//     setDescription("");
//     setFormBranch(selectedBranch || "");
//     setNotice("");
//     setError("");
//     setModalOpen(true);
//   };

//   const save = async (event) => {
//     event.preventDefault();

//     if (!name.trim()) {
//       setError("Enter a name.");
//       return;
//     }

//     setSaving(true);
//     setError("");
//     setNotice("");

//     try {
//       if (type === "branch") {
//         await api.createBranch({
//           name: name.trim(),
//           description: description.trim(),
//         });
//       } else {
//         await api.createDepartment({
//           name: name.trim(),
//           description: description.trim(),
//           branch_id: formBranch || null,
//         });
//       }

//       setModalOpen(false);
//       setNotice(
//         `${type === "branch" ? "Branch" : "Department"} created successfully.`
//       );

//       await loadData();
//     } catch (err) {
//       setError(err.message || "Unable to save entry.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const filteredBranches = branches.filter((item) =>
//     `${item.name} ${item.description || ""}`
//       .toLowerCase()
//       .includes(query.toLowerCase())
//   );

//   const filteredDepartments = departments.filter((item) => {
//     const matchesSearch = `${item.name} ${item.description || ""}`
//       .toLowerCase()
//       .includes(query.toLowerCase());

//     return matchesSearch;
//   });

//   const activeDepartments = selectedBranch
//     ? filteredDepartments.filter(
//         (item) => item.branch_id === selectedBranch
//       )
//     : filteredDepartments;

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
//         <div>
//           <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
//             <Building2 size={14} /> Organization workspace
//           </p>

//           <h2 className="text-2xl font-bold text-brand-950">
//             Master Management
//           </h2>

//           <p className="mt-1 text-sm text-slate-600">
//             Manage branches and departments for{" "}
//             <strong>{organization.name}</strong>.
//           </p>
//         </div>

//         <button onClick={openAdd} className="btn-primary">
//           <Plus size={17} /> Add{" "}
//           {type === "branch" ? "Branch" : "Department"}
//         </button>
//       </div>

//       <div className="grid gap-3 sm:grid-cols-2">
//         <button
//           onClick={() => {
//             setType("branch");
//             setQuery("");
//             setError("");
//           }}
//           className={`rounded-2xl border p-4 text-left transition ${
//             type === "branch"
//               ? "border-brand-500 bg-brand-50 shadow-sm"
//               : "border-brand-100 bg-white hover:border-brand-300"
//           }`}
//         >
//           <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
//             <GitBranch size={19} />
//           </span>
//           <span className="block font-semibold text-brand-950">
//             Branches
//           </span>
//           <span className="mt-1 text-xs text-slate-500">
//             {branches.length} branches
//           </span>
//         </button>

//         <button
//           onClick={() => {
//             setType("department");
//             setQuery("");
//             setError("");
//           }}
//           className={`rounded-2xl border p-4 text-left transition ${
//             type === "department"
//               ? "border-brand-500 bg-brand-50 shadow-sm"
//               : "border-brand-100 bg-white hover:border-brand-300"
//           }`}
//         >
//           <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
//             <Layers3 size={19} />
//           </span>
//           <span className="block font-semibold text-brand-950">
//             Departments
//           </span>
//           <span className="mt-1 text-xs text-slate-500">
//             {departments.length} departments
//           </span>
//         </button>
//       </div>

//       {notice && (
//         <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
//           {notice}
//         </div>
//       )}

//       {error && (
//         <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
//           {error}
//         </div>
//       )}

//       <section className="card overflow-hidden">
//         <div className="flex flex-col gap-3 border-b border-brand-100 p-4 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h3 className="font-semibold text-brand-950">
//               {type === "branch" ? "Branches" : "Departments"}
//             </h3>
//             <p className="mt-1 text-xs text-slate-500">
//               Loaded from your database
//             </p>
//           </div>

//           <div className="flex flex-wrap gap-2">
//             {type === "department" && branches.length > 0 && (
//               <select
//                 className="input"
//                 value={selectedBranch}
//                 onChange={(event) => setSelectedBranch(event.target.value)}
//               >
//                 <option value="">All Departments</option>
//                 <option value="__independent__">
//                   Departments without a branch
//                 </option>
//                 {branches.map((branch) => (
//                   <option key={branch.id} value={branch.id}>
//                     {branch.name}
//                   </option>
//                 ))}
//               </select>
//             )}

//             <label className="flex min-w-[180px] items-center gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2">
//               <Search size={16} />
//               <input
//                 className="w-full bg-transparent text-sm outline-none"
//                 value={query}
//                 onChange={(event) => setQuery(event.target.value)}
//                 placeholder="Search..."
//               />
//             </label>

//             <button onClick={loadData} className="btn-ghost">
//               <RefreshCw size={15} /> Refresh
//             </button>
//           </div>
//         </div>

//         {loading ? (
//           <div className="py-12 text-center text-sm text-slate-500">
//             Loading records...
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[520px] text-left text-sm">
//               <thead className="bg-brand-50 text-xs uppercase text-brand-900">
//                 <tr>
//                   <th className="px-5 py-3">Name</th>
//                   <th className="px-5 py-3">Branch</th>
//                   <th className="px-5 py-3">Description</th>
//                   <th className="px-5 py-3">Status</th>
//                 </tr>
//               </thead>

//               <tbody className="divide-y divide-brand-50">
//                 {(type === "branch"
//                   ? filteredBranches
//                   : activeDepartments.filter((item) => {
//                       if (selectedBranch === "__independent__") {
//                         return item.branch_id == null;
//                       }

//                       if (selectedBranch) {
//                         return item.branch_id === selectedBranch;
//                       }

//                       return true;
//                     })
//                 ).map((item) => {
//                   const branch = branches.find(
//                     (entry) => entry.id === item.branch_id
//                   );

//                   return (
//                     <tr key={item.id} className="hover:bg-brand-50/50">
//                       <td className="px-5 py-4 font-medium text-slate-800">
//                         {item.name}
//                       </td>

//                       <td className="px-5 py-4 text-slate-600">
//                         {type === "branch"
//                           ? "—"
//                           : branch?.name || "No branch"}
//                       </td>

//                       <td className="px-5 py-4 text-slate-600">
//                         {item.description || "—"}
//                       </td>

//                       <td className="px-5 py-4">
//                         <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
//                           {item.is_active === false ? "Inactive" : "Active"}
//                         </span>
//                       </td>
//                     </tr>
//                   );
//                 })}

//                 {!(
//                   type === "branch"
//                     ? filteredBranches.length
//                     : activeDepartments.filter((item) => {
//                         if (selectedBranch === "__independent__") {
//                           return item.branch_id == null;
//                         }
//                         if (selectedBranch) {
//                           return item.branch_id === selectedBranch;
//                         }
//                         return true;
//                       }).length
//                 ) && (
//                   <tr>
//                     <td
//                       colSpan={4}
//                       className="px-5 py-12 text-center text-slate-500"
//                     >
//                       No records found. Use Add to create one.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </section>

//       {modalOpen && (
//         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
//           <button
//             aria-label="Close"
//             className="absolute inset-0 bg-slate-950/50"
//             onClick={() => setModalOpen(false)}
//           />

//           <form
//             onSubmit={save}
//             className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
//           >
//             <div className="flex items-center justify-between">
//               <h3 className="text-lg font-bold text-brand-950">
//                 Add {type === "branch" ? "Branch" : "Department"}
//               </h3>

//               <button
//                 type="button"
//                 onClick={() => setModalOpen(false)}
//                 className="rounded-lg p-2 hover:bg-slate-100"
//               >
//                 <X size={18} />
//               </button>
//             </div>

//             <label className="block text-sm font-medium text-slate-700">
//               Name *
//               <input
//                 autoFocus
//                 required
//                 maxLength={80}
//                 className="input mt-1.5"
//                 value={name}
//                 onChange={(event) => setName(event.target.value)}
//                 placeholder={
//                   type === "branch" ? "Enter branch name" : "Enter department name"
//                 }
//               />
//             </label>

//             {type === "department" && branches.length > 0 && (
//               <label className="block text-sm font-medium text-slate-700">
//                 Branch (optional)
//                 <select
//                   className="input mt-1.5"
//                   value={formBranch}
//                   onChange={(event) => setFormBranch(event.target.value)}
//                 >
//                   <option value="">No branch</option>
//                   {branches.map((branch) => (
//                     <option key={branch.id} value={branch.id}>
//                       {branch.name}
//                     </option>
//                   ))}
//                 </select>
//               </label>
//             )}

//             <label className="block text-sm font-medium text-slate-700">
//               Description
//               <textarea
//                 className="input mt-1.5 min-h-20"
//                 value={description}
//                 onChange={(event) => setDescription(event.target.value)}
//                 placeholder="Optional description"
//               />
//             </label>

//             {error && (
//               <p className="text-sm text-rose-600">{error}</p>
//             )}

//             <div className="flex justify-end gap-2">
//               <button
//                 type="button"
//                 className="btn-ghost"
//                 onClick={() => setModalOpen(false)}
//               >
//                 Cancel
//               </button>

//               <button
//                 disabled={saving}
//                 className="btn-primary disabled:opacity-60"
//               >
//                 {saving ? "Saving..." : "Save"}
//               </button>
//             </div>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// }
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Building2,
  Layers3,
  RefreshCw,
  X,
  GitBranch,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function MasterManagement() {
  const { organization } = useAuth();

  const [type, setType] = useState("department");
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const branchRows = await api.getBranches();
      const branchList = Array.isArray(branchRows)
        ? branchRows
        : branchRows?.data || [];

      const departmentResults = await Promise.all([
        api.getDepartments(),
        ...branchList.map((branch) => api.getDepartments(branch.id)),
      ]);

      const allDepartments = departmentResults.flatMap((result) =>
        Array.isArray(result) ? result : result?.data || []
      );

      const uniqueDepartments = [
        ...new Map(
          allDepartments.map((department) => [
            department.id,
            department,
          ])
        ).values(),
      ];

      setBranches(branchList);
      setDepartments(uniqueDepartments);
    } catch (err) {
      console.error("Master Management load error:", err);
      setError(err.message || "Unable to load Master Management.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, organization?.id]);

  const openAdd = () => {
    setName("");
    setFormBranch(selectedBranch || "");
    setNotice("");
    setError("");
    setModalOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (type === "branch") {
        await api.createBranch({
          name: name.trim(),
        });
      } else {
        await api.createDepartment({
          name: name.trim(),
          branch_id: formBranch || null,
        });
      }

      setModalOpen(false);
      setNotice(
        `${type === "branch" ? "Branch" : "Department"} created successfully.`
      );

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();

  const filteredBranches = branches.filter((item) =>
    (item.name || "").toLowerCase().includes(normalizedQuery)
  );

  const filteredDepartments = departments.filter((item) => {
    const matchesSearch = (item.name || "")
      .toLowerCase()
      .includes(normalizedQuery);

    if (!matchesSearch) return false;

    if (selectedBranch === "__independent__") {
      return item.branch_id == null;
    }

    if (selectedBranch) {
      return item.branch_id === selectedBranch;
    }

    return true;
  });

  const records =
    type === "branch" ? filteredBranches : filteredDepartments;

  const branchCount = branches.length;
  const departmentCount = departments.length;
  const activeCount = records.filter(
    (item) => item.is_active !== false
  ).length;

  return (
    <div className="relative space-y-6 pb-8">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 -z-10 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-64 -z-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-300/60 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-5 shadow-[0_0_25px_rgba(16,185,129,0.10)] sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 shadow-sm">
              <Sparkles size={14} />
              Organization workspace
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Master Management
            </h2>

            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Building2 size={16} className="text-emerald-700" />
              {organization?.name || "Your Organization"}
            </p>
          </div>

          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400 bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_18px_rgba(16,185,129,0.30)] transition hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 hover:shadow-[0_0_25px_rgba(16,185,129,0.40)] active:translate-y-0"
          >
            <Plus size={18} />
            Add {type === "branch" ? "Branch" : "Department"}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => {
            setType("branch");
            setSelectedBranch("");
            setQuery("");
            setError("");
            setNotice("");
          }}
          className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition duration-300 hover:-translate-y-1 ${
            type === "branch"
              ? "border-violet-400 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 shadow-[0_0_24px_rgba(139,92,246,0.22)] ring-1 ring-violet-300"
              : "border-violet-200 bg-white shadow-[0_4px_20px_rgba(139,92,246,0.06)] hover:border-violet-400 hover:shadow-[0_0_22px_rgba(139,92,246,0.16)]"
          }`}
        >
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-violet-400/10 blur-2xl transition group-hover:bg-violet-400/20" />

          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Total Branches
              </p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {branchCount}
              </p>
              <p className="mt-2 text-xs font-semibold text-violet-700">
                Manage your locations
              </p>
            </div>

            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_0_18px_rgba(139,92,246,0.28)]">
              <GitBranch size={25} />
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            setType("department");
            setSelectedBranch("");
            setQuery("");
            setError("");
            setNotice("");
          }}
          className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition duration-300 hover:-translate-y-1 ${
            type === "department"
              ? "border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-[0_0_24px_rgba(16,185,129,0.20)] ring-1 ring-emerald-300"
              : "border-emerald-200 bg-white shadow-[0_4px_20px_rgba(16,185,129,0.06)] hover:border-emerald-400 hover:shadow-[0_0_22px_rgba(16,185,129,0.16)]"
          }`}
        >
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl transition group-hover:bg-emerald-400/20" />

          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Total Departments
              </p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {departmentCount}
              </p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                Manage your teams
              </p>
            </div>

            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.28)]">
              <Layers3 size={25} />
            </span>
          </div>
        </button>

        <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-5 shadow-[0_4px_20px_rgba(14,165,233,0.07)] transition duration-300 hover:border-sky-400 hover:shadow-[0_0_22px_rgba(14,165,233,0.15)] sm:col-span-2 lg:col-span-1">
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Active {type === "branch" ? "Branches" : "Departments"}
              </p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {activeCount}
              </p>
              <p className="mt-2 text-xs font-semibold text-sky-700">
                Currently active
              </p>
            </div>

            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300 bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-[0_0_18px_rgba(14,165,233,0.25)]">
              <CheckCircle2 size={25} />
            </span>
          </div>
        </div>
      </div>

      {/* Feedback messages */}
      {notice && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-[0_0_15px_rgba(16,185,129,0.10)]">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-600" />
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            className="ml-auto rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && !modalOpen && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-300 bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-3 text-sm font-medium text-rose-800 shadow-[0_0_15px_rgba(244,63,94,0.08)]">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto rounded-lg p-1 hover:bg-rose-100"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Records panel */}
      <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-[0_6px_28px_rgba(15,23,42,0.06)]">
        <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                  type === "branch"
                    ? "border-violet-300 bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700"
                    : "border-emerald-300 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700"
                }`}
              >
                {type === "branch" ? (
                  <GitBranch size={21} />
                ) : (
                  <Layers3 size={21} />
                )}
              </span>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {type === "branch" ? "Branches" : "Departments"}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-slate-600">
                  {records.length} {records.length === 1 ? "record" : "records"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex min-w-0 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 shadow-sm transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 sm:min-w-[240px]">
                <Search size={17} className="shrink-0 text-emerald-700" />
                <input
                  className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${type === "branch" ? "branches" : "departments"}...`}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="rounded-md p-1 text-slate-500 hover:bg-emerald-50 hover:text-emerald-800"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>

              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-300 bg-gradient-to-r from-sky-50 to-cyan-50 px-4 py-2.5 text-sm font-bold text-sky-800 shadow-sm transition hover:border-sky-400 hover:shadow-[0_0_15px_rgba(14,165,233,0.16)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <RefreshCw size={22} className="animate-spin" />
            </span>
            <p className="text-sm font-semibold text-slate-700">
              Loading records...
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50 text-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.10)]">
              {type === "branch" ? (
                <GitBranch size={28} />
              ) : (
                <Layers3 size={28} />
              )}
            </span>

            <h4 className="text-base font-bold text-slate-900">
              {query ? "No matching records" : `No ${type === "branch" ? "branches" : "departments"} yet`}
            </h4>

            <p className="mt-1 text-sm text-slate-600">
              {query
                ? "Try a different search."
                : "Select Add to create your first record."}
            </p>

            {!query && (
              <button
                onClick={openAdd}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(16,185,129,0.25)] transition hover:from-emerald-700 hover:to-teal-700"
              >
                <Plus size={17} />
                Add {type === "branch" ? "Branch" : "Department"}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-cyan-50/80 text-xs uppercase tracking-wider text-slate-700">
                  <th className="px-5 py-4 font-bold">Name</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-50">
                {records.map((item) => (
                  <tr
                    key={item.id}
                    className="group transition hover:bg-gradient-to-r hover:from-emerald-50/70 hover:to-cyan-50/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition group-hover:shadow-sm ${
                            type === "branch"
                              ? "border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 text-violet-700 group-hover:border-violet-300"
                              : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 group-hover:border-emerald-300"
                          }`}
                        >
                          {type === "branch" ? (
                            <GitBranch size={18} />
                          ) : (
                            <Layers3 size={18} />
                          )}
                        </span>
                        <span className="font-bold text-slate-800">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                          item.is_active === false
                            ? "border-slate-200 bg-slate-100 text-slate-600"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-[0_0_10px_rgba(16,185,129,0.08)]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.is_active === false
                              ? "bg-slate-400"
                              : "bg-emerald-500"
                          }`}
                        />
                        {item.is_active === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4">
          <button
            aria-label="Close modal"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => {
              setModalOpen(false);
              setError("");
            }}
          />

          <form
            onSubmit={save}
            className="relative my-auto w-full max-w-md overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-[0_0_45px_rgba(16,185,129,0.22)]"
          >
            <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.25)]">
                    {type === "branch" ? (
                      <GitBranch size={21} />
                    ) : (
                      <Layers3 size={21} />
                    )}
                  </span>

                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Add {type === "branch" ? "Branch" : "Department"}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                      {organization?.name || "Organization"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setError("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <label className="block text-sm font-bold text-slate-800">
                {type === "branch" ? "Branch Name *" : "Department Name *"}
                <input
                  autoFocus
                  required
                  maxLength={80}
                  className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={
                    type === "branch"
                      ? "Enter branch name"
                      : "Enter department name"
                  }
                />
              </label>

              {type === "department" && branches.length > 0 && (
                <label className="block text-sm font-bold text-slate-800">
                  Assign Branch
                  <select
                    className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    value={formBranch}
                    onChange={(event) => setFormBranch(event.target.value)}
                  >
                    <option value="">No branch (standalone department)</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-emerald-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    setModalOpen(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(16,185,129,0.22)] transition hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Save {type === "branch" ? "Branch" : "Department"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}