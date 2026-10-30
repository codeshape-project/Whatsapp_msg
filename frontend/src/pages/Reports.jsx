
// import { useMemo, useState } from "react";
// import {
//   Download,
//   FileSpreadsheet,
//   FileText,
//   Send,
//   CheckCircle2,
//   AlertTriangle,
//   RefreshCw,
// } from "lucide-react";
// import * as XLSX from "xlsx";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import useFetch from "../hooks/useFetch";
// import api from "../services/api";
// import { useAuth } from "../hooks/useAuth";

// const n = (v) => Number(v || 0).toLocaleString("en-IN");

// function PageHeader({ title, subtitle, children }) {
//   return (
//     <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
//       <div>
//         <h2 className="text-2xl font-semibold text-brand-900">
//           {title}
//         </h2>
//         {subtitle && (
//           <p className="text-sm text-slate-600">{subtitle}</p>
//         )}
//       </div>

//       {children && (
//         <div className="flex flex-wrap items-center gap-2">
//           {children}
//         </div>
//       )}
//     </div>
//   );
// }

// function DataTable({ columns, rows }) {
//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full min-w-[640px] text-left text-sm">
//         <thead>
//           <tr className="bg-brand-50 text-xs font-semibold text-brand-900">
//             {columns.map((c) => (
//               <th key={c.key} className="px-4 py-3.5">
//                 {c.label}
//               </th>
//             ))}
//           </tr>
//         </thead>

//         <tbody className="divide-y divide-slate-100">
//           {rows.length === 0 ? (
//             <tr>
//               <td
//                 colSpan={columns.length}
//                 className="px-4 py-10 text-center text-slate-500"
//               >
//                 No report records found for this filter.
//               </td>
//             </tr>
//           ) : (
//             rows.map((r, i) => (
//               <tr
//                 key={r.id ?? r.date ?? i}
//                 className="hover:bg-brand-50/60"
//               >
//                 {columns.map((c) => (
//                   <td
//                     key={c.key}
//                     className="px-4 py-3.5 text-slate-700"
//                   >
//                     {c.render ? c.render(r) : r[c.key]}
//                   </td>
//                 ))}
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function localDay(d) {
//   const x = new Date(d);
//   x.setHours(0, 0, 0, 0);
//   return x;
// }

// function parseReportDate(value) {
//   if (!value) return null;

//   // Supports DD/MM/YYYY returned by the backend.
//   const parts = String(value).split("/");

//   if (parts.length === 3) {
//     const [d, m, y] = parts.map(Number);

//     if (!d || !m || !y) return null;

//     const date = new Date(y, m - 1, d);

//     return Number.isNaN(date.getTime()) ? null : date;
//   }

//   // Also supports ISO dates such as YYYY-MM-DD.
//   const date = new Date(value);

//   return Number.isNaN(date.getTime()) ? null : date;
// }

// export default function Reports() {
//   const { organization } = useAuth();
//   const { data, loading } = useFetch(api.getReports);

//   const [period, setPeriod] = useState("monthly");
//   const [from, setFrom] = useState("");
//   const [to, setTo] = useState("");

//   // Use backend data only. No generated or synthetic report rows.
//   const source = Array.isArray(data)
//     ? data
//     : Array.isArray(data?.rows)
//       ? data.rows
//       : [];

//   const rows = useMemo(() => {
//     let result = [...source];

//     const now = new Date();
//     const today = localDay(now);
//     const endOfToday = new Date(today);
//     endOfToday.setHours(23, 59, 59, 999);

//     if (period !== "custom") {
//       const days =
//         period === "today"
//           ? 1
//           : period === "weekly"
//             ? 7
//             : period === "monthly"
//               ? 30
//               : 180;

//       const startDate = new Date(today);
//       startDate.setDate(startDate.getDate() - days + 1);

//       result = result.filter((r) => {
//         const date = parseReportDate(r.date);

//         return date && date >= startDate && date <= endOfToday;
//       });
//     }

//     if (from) {
//       const start = localDay(new Date(`${from}T00:00:00`));

//       result = result.filter((r) => {
//         const date = parseReportDate(r.date);
//         return date && date >= start;
//       });
//     }

//     if (to) {
//       const end = localDay(new Date(`${to}T00:00:00`));
//       end.setHours(23, 59, 59, 999);

//       result = result.filter((r) => {
//         const date = parseReportDate(r.date);
//         return date && date <= end;
//       });
//     }

//     return result;
//   }, [source, period, from, to]);

//   const summary = useMemo(
//     () =>
//       rows.reduce(
//         (a, r) => {
//           const sent = Number(r.sent || 0);
//           const queued = Number(r.queued || 0);
//           const failed = Number(r.failed || 0);

//           return {
//             total: a.total + sent + queued + failed,
//             sent: a.sent + sent,
//             failed: a.failed + failed,
//             queued: a.queued + queued,
//           };
//         },
//         { total: 0, sent: 0, failed: 0, queued: 0 }
//       ),
//     [rows]
//   );

//   const getSendRate = (r) => {
//     const sent = Number(r.sent || 0);
//     const queued = Number(r.queued || 0);
//     const failed = Number(r.failed || 0);
//     const total = sent + queued + failed;

//     return total
//       ? `${((sent / total) * 100).toFixed(1)}%`
//       : "0.0%";
//   };

//   const columns = [
//     { key: "date", label: "Date" },
//     {
//       key: "sent",
//       label: "Sent",
//       render: (r) => n(r.sent),
//     },
//     {
//       key: "queued",
//       label: "Queued",
//       render: (r) => n(r.queued),
//     },
//     {
//       key: "failed",
//       label: "Failed",
//       render: (r) => n(r.failed),
//     },
//     {
//       key: "rate",
//       label: "Send Rate",
//       render: (r) => getSendRate(r),
//     },
//   ];

//   const exportRows = rows.map((r) => ({
//     Date: r.date,
//     Sent: Number(r.sent || 0),
//     Queued: Number(r.queued || 0),
//     Failed: Number(r.failed || 0),
//     "Send Rate": getSendRate(r),
//   }));

//   const exportExcel = () => {
//     const ws = XLSX.utils.json_to_sheet(exportRows);
//     const wb = XLSX.utils.book_new();

//     XLSX.utils.book_append_sheet(wb, ws, "Messaging Report");

//     XLSX.writeFile(
//       wb,
//       `${(organization?.name || "Organization").replace(
//         /\W+/g,
//         "_"
//       )}_${period}_report.xlsx`
//     );
//   };

//   const exportPdf = () => {
//     const doc = new jsPDF();

//     doc.setFontSize(16);
//     doc.text(
//       `${organization?.name || "Organization"} - ${
//         period[0].toUpperCase() + period.slice(1)
//       } Report`,
//       14,
//       18
//     );

//     doc.setFontSize(9);
//     doc.text(
//       `Generated: ${new Date().toLocaleString("en-IN")}`,
//       14,
//       25
//     );

//     autoTable(doc, {
//       startY: 31,
//       head: [["Date", "Sent", "Queued", "Failed", "Send Rate"]],
//       body: exportRows.map((r) => [
//         r.Date,
//         r.Sent,
//         r.Queued,
//         r.Failed,
//         r["Send Rate"],
//       ]),
//     });

//     doc.save(
//       `${(organization?.name || "Organization").replace(
//         /\W+/g,
//         "_"
//       )}_${period}_report.pdf`
//     );
//   };

//   const max = Math.max(1, ...rows.map((r) => Number(r.sent || 0)));

//   if (loading) {
//     return (
//       <div className="py-16 text-center text-sm text-slate-500">
//         Loading reports...
//       </div>
//     );
//   }

//   return (
//     <>
//       <PageHeader
//         title={`${organization?.name || "Organization"} Reports`}
//         subtitle="Today, weekly and monthly WhatsApp messaging performance"
//       >
//         <button onClick={exportPdf} className="btn-ghost">
//           <FileText size={16} />
//           Export PDF
//         </button>

//         <button onClick={exportExcel} className="btn-primary">
//           <FileSpreadsheet size={16} />
//           Export Excel
//         </button>
//       </PageHeader>

//       <section className="card mb-6 p-5">
//         <div className="mb-5 flex flex-wrap items-end gap-4 rounded-2xl border border-sky-100 bg-gradient-to-r from-white via-sky-50/70 to-emerald-50/60 p-4 shadow-[0_6px_24px_rgba(56,189,248,0.10)]">
//           <div className="min-w-[180px] flex-1">
//             <label className="mb-2 block text-sm font-medium text-slate-700">
//               Report period
//             </label>

//             <select
//               value={period}
//               onChange={(e) => setPeriod(e.target.value)}
//               className="input w-full rounded-xl border border-violet-200 bg-white/90 shadow-sm transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
//             >
//               <option value="today">Today</option>
//               <option value="weekly">Weekly</option>
//               <option value="monthly">Monthly</option>
//               <option value="custom">Custom range</option>
//             </select>
//           </div>

//           <div className="min-w-[160px] flex-1">
//             <label className="mb-2 block text-sm font-medium text-slate-700">
//               From
//             </label>

//             <input
//               type="date"
//               value={from}
//               onChange={(e) => setFrom(e.target.value)}
//               className="input w-full rounded-xl border border-sky-200 bg-white/90 shadow-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
//             />
//           </div>

//           <div className="min-w-[160px] flex-1">
//             <label className="mb-2 block text-sm font-medium text-slate-700">
//               To
//             </label>

//             <input
//               type="date"
//               value={to}
//               onChange={(e) => setTo(e.target.value)}
//               className="input w-full rounded-xl border border-sky-200 bg-white/90 shadow-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
//             />
//           </div>

//           <button
//             type="button"
//             className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-white to-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
//             onClick={() => {
//               setFrom("");
//               setTo("");
//               setPeriod("monthly");
//             }}
//           >
//             <RefreshCw size={16} />
//             Reset filters
//           </button>
//         </div>

//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//           {[
//             {
//               label: "Total Messages",
//               value: summary.total,
//               icon: <FileText size={22} />,
//               styles:
//                 "border-violet-500 bg-gradient-to-br from-violet-100/90 via-white to-violet-50 shadow-violet-300/70",
//               iconStyles:
//                 "bg-gradient-to-br from-violet-400 to-violet-700",
//             },
//             {
//               label: "Sent Messages",
//               value: summary.sent,
//               icon: <Send size={22} />,
//               styles:
//                 "border-emerald-500 bg-gradient-to-br from-emerald-100/90 via-white to-emerald-50 shadow-emerald-300/70",
//               iconStyles:
//                 "bg-gradient-to-br from-emerald-400 to-emerald-700",
//             },
//             {
//               label: "Failed Messages",
//               value: summary.failed,
//               icon: <AlertTriangle size={22} />,
//               styles:
//                 "border-sky-500 bg-gradient-to-br from-sky-100/90 via-white to-sky-50 shadow-sky-300/70",
//               iconStyles:
//                 "bg-gradient-to-br from-sky-400 to-sky-700",
//             },
//             {
//               label: "Queued Messages",
//               value: summary.queued,
//               icon: <RefreshCw size={22} />,
//               styles:
//                 "border-amber-500 bg-gradient-to-br from-amber-100/90 via-white to-amber-50 shadow-amber-300/70",
//               iconStyles:
//                 "bg-gradient-to-br from-amber-400 to-amber-600",
//             },
//           ].map((item) => (
//             <div
//               key={item.label}
//               className={`group flex min-h-[112px] items-center gap-4 rounded-[22px] border p-5 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl ${item.styles}`}
//             >
//               <div
//                 className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-md transition group-hover:scale-105 ${item.iconStyles}`}
//               >
//                 {item.icon}
//               </div>

//               <div className="min-w-0">
//                 <p className="text-sm font-medium text-slate-600">
//                   {item.label}
//                 </p>

//                 <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
//                   {n(item.value)}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       <section className="card mb-6 p-5">
//         <h3 className="mb-4 text-lg font-semibold text-brand-900">
//           Messages sent by day
//         </h3>

//         {rows.length === 0 ? (
//           <p className="py-12 text-center text-sm text-slate-500">
//             No message history available for this filter.
//           </p>
//         ) : (
//           <div className="flex h-56 items-end gap-1 overflow-x-auto">
//             {rows.map((r, i) => (
//               <div
//                 title={`${r.date}: ${n(r.sent)} sent`}
//                 key={`${r.date}-${i}`}
//                 className="flex min-w-[9px] flex-1 flex-col items-center justify-end gap-1"
//               >
//                 <div
//                   className="w-full rounded-t-sm bg-gradient-to-t from-brand-800 to-wa"
//                   style={{
//                     height: `${Math.max(
//                       2,
//                       (Number(r.sent || 0) / max) * 150
//                     )}px`,
//                   }}
//                 />

//                 <span className="text-[9px] text-slate-500 [writing-mode:vertical-rl]">
//                   {r.date}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <section className="card">
//         <div className="border-b border-slate-100 px-4 py-4">
//           <h3 className="font-semibold text-brand-900">
//             Report details
//           </h3>

//           <p className="text-xs text-slate-500">
//             {rows.length} date records · filtered to the selected period
//           </p>
//         </div>

//         <DataTable columns={columns} rows={rows} />
//       </section>
//     </>
//   );
// }



import { useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import useFetch from "../hooks/useFetch";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const n = (v) => Number(v || 0).toLocaleString("en-IN");

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold text-brand-900">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-slate-600">{subtitle}</p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="bg-brand-50 text-xs font-semibold text-brand-900">
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3.5">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-slate-500"
              >
                No report records found for this filter.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={
                  r.id ??
                  `${r.date}-${r.branch_id || "no-branch"}-${
                    r.department_id || "unassigned"
                  }-${i}`
                }
                className="hover:bg-brand-50/60"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="px-4 py-3.5 text-slate-700"
                  >
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function localDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseReportDate(value) {
  if (!value) return null;

  // Supports DD/MM/YYYY returned by backend.
  const parts = String(value).split("/");

  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);

    if (!d || !m || !y) return null;

    const date = new Date(y, m - 1, d);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Also supports ISO dates.
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export default function Reports() {
 
const {
  organization,
} = useAuth();

const {
  data,
  loading,
  error,
  refetch,
} = useFetch(api.getReports);

// Daily report records
const source = Array.isArray(data?.rows)
  ? data.rows
  : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];

  // Existing date filters.
  const [period, setPeriod] = useState("monthly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // New branch and department filters.
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  // Backend report data.
  const detailSource = Array.isArray(data?.detailRows)
    ? data.detailRows
    : [];

  // Database-backed dropdown options.
  const branches = Array.isArray(data?.branches)
    ? data.branches
    : [];

  const departments = Array.isArray(data?.departments)
    ? data.departments
    : [];
const departmentSummary = Array.isArray(data?.departmentRows)
  ? data.departmentRows
  : [];
  // Show all departments when no branch is selected.
  // Show only selected branch departments otherwise.
  const filteredDepartments = useMemo(() => {
    if (!branchId) return departments;

   return departments.filter(
  (department) =>
    String(department.branch_id || "") === String(branchId)
);
  }, [departments, branchId]);

  // Apply date, branch and department filters.
  const filteredDetailRows = useMemo(() => {
    let result = [...detailSource];

    const now = new Date();
    const today = localDay(now);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Existing period filter.
    if (period !== "custom") {
      const days =
        period === "today"
          ? 1
          : period === "weekly"
            ? 7
            : period === "monthly"
              ? 30
              : 180;

      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - days + 1);

      result = result.filter((r) => {
        const date = parseReportDate(r.date);

        return date && date >= startDate && date <= endOfToday;
      });
    }

    // From date filter.
    if (from) {
      const start = localDay(new Date(`${from}T00:00:00`));

      result = result.filter((r) => {
        const date = parseReportDate(r.date);
        return date && date >= start;
      });
    }

    // To date filter.
    if (to) {
      const end = localDay(new Date(`${to}T00:00:00`));
      end.setHours(23, 59, 59, 999);

      result = result.filter((r) => {
        const date = parseReportDate(r.date);
        return date && date <= end;
      });
    }

    // Branch filter.
    if (branchId) {
  result = result.filter(
    (r) => String(r.branch_id || "") === String(branchId)
  );
}

    // Department filter.
    if (departmentId) {
  result = result.filter(
    (r) => String(r.department_id || "") === String(departmentId)
  );
}

    return result;
  }, [
    detailSource,
    period,
    from,
    to,
    branchId,
    departmentId,
  ]);

  // Aggregate filtered department records by date.
  // Used by existing summary cards and chart.
  const rows = useMemo(() => {
    const grouped = new Map();

    for (const record of filteredDetailRows) {
      if (!grouped.has(record.date)) {
        grouped.set(record.date, {
          date: record.date,
          sent: 0,
          queued: 0,
          failed: 0,
        });
      }

      const row = grouped.get(record.date);

      row.sent += Number(record.sent || 0);
      row.queued += Number(record.queued || 0);
      row.failed += Number(record.failed || 0);
    }

    return [...grouped.values()].sort((a, b) => {
      const dateA = parseReportDate(a.date);
      const dateB = parseReportDate(b.date);

      return dateA - dateB;
    });
  }, [filteredDetailRows]);

  // Existing summary calculations.
  const summary = useMemo(
    () =>
      rows.reduce(
        (a, r) => {
          const sent = Number(r.sent || 0);
          const queued = Number(r.queued || 0);
          const failed = Number(r.failed || 0);

          return {
            total: a.total + sent + queued + failed,
            sent: a.sent + sent,
            failed: a.failed + failed,
            queued: a.queued + queued,
          };
        },
        { total: 0, sent: 0, failed: 0, queued: 0 }
      ),
    [rows]
  );

  const getSendRate = (r) => {
    const sent = Number(r.sent || 0);
    const queued = Number(r.queued || 0);
    const failed = Number(r.failed || 0);

    const total = sent + queued + failed;

    return total
      ? `${((sent / total) * 100).toFixed(1)}%`
      : "0.0%";
  };

  // Report table columns.
  const columns = [
    {
      key: "date",
      label: "Date",
    },
    {
      key: "department",
      label: "Department",
      render: (r) => (
        <span className="font-semibold text-brand-900">
          {r.department || "Unassigned"}
        </span>
      ),
    },
    {
      key: "sent",
      label: "Sent",
      render: (r) => n(r.sent),
    },
    {
      key: "queued",
      label: "Queued",
      render: (r) => n(r.queued),
    },
    {
      key: "failed",
      label: "Failed",
      render: (r) => n(r.failed),
    },
    {
      key: "rate",
      label: "Send Rate",
      render: (r) => getSendRate(r),
    },
  ];

  // Existing Excel export.
  // Excel export with department and branch details.
const exportRows = filteredDetailRows.map((r) => ({
  Date: r.date,
  Branch: r.branch || "No branch",
  Department: r.department || "Unassigned",
  Sent: Number(r.sent || 0),
  Queued: Number(r.queued || 0),
  Failed: Number(r.failed || 0),
  "Send Rate": getSendRate(r),
}));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Messaging Report"
    );

    XLSX.writeFile(
      wb,
      `${(organization?.name || "Organization").replace(
        /\W+/g,
        "_"
      )}_${period}_report.xlsx`
    );
  };

  // Existing PDF export.
  const exportPdf = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);

    doc.text(
      `${organization?.name || "Organization"} - ${
        period[0].toUpperCase() + period.slice(1)
      } Report`,
      14,
      18
    );

    doc.setFontSize(9);

    doc.text(
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      14,
      25
    );

    autoTable(doc, {
      startY: 31,
     head: [[
  "Date",
  "Branch",
  "Department",
  "Sent",
  "Queued",
  "Failed",
  "Send Rate",
]],

body: exportRows.map((r) => [
  r.Date,
  r.Branch,
  r.Department,
  r.Sent,
  r.Queued,
  r.Failed,
  r["Send Rate"],
]),

styles: {
  fontSize: 8,
  cellPadding: 2.5,
},

headStyles: {
  fontSize: 8,
},

columnStyles: {
  0: { cellWidth: 22 },
  1: { cellWidth: 30 },
  2: { cellWidth: 35 },
},
    });

    doc.save(
      `${(organization?.name || "Organization").replace(
        /\W+/g,
        "_"
      )}_${period}_report.pdf`
    );
  };

  // Existing chart maximum.
  const max = Math.max(
    1,
    ...rows.map((r) => Number(r.sent || 0))
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Loading reports...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`${organization?.name || "Organization"} Reports`}
        subtitle="Today, weekly and monthly WhatsApp messaging performance"
      >
        <button onClick={exportPdf} className="btn-ghost">
          <FileText size={16} />
          Export PDF
        </button>

        <button onClick={exportExcel} className="btn-primary">
          <FileSpreadsheet size={16} />
          Export Excel
        </button>
      </PageHeader>

      {/* Filters */}
      <section className="card mb-6 p-5">
        <div className="mb-5 flex flex-wrap items-end gap-4 rounded-2xl border border-sky-100 bg-gradient-to-r from-white via-sky-50/70 to-emerald-50/60 p-4 shadow-[0_6px_24px_rgba(56,189,248,0.10)]">

          {/* Period Filter */}
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Report period
            </label>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="input w-full rounded-xl border border-violet-200 bg-white/90 shadow-sm transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
            >
              <option value="today">Today</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* From Date */}
          <div className="min-w-[160px] flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              From
            </label>

            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input w-full rounded-xl border border-sky-200 bg-white/90 shadow-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            />
          </div>

          {/* To Date */}
          <div className="min-w-[160px] flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              To
            </label>

            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input w-full rounded-xl border border-sky-200 bg-white/90 shadow-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            />
          </div>

          {/* Branch Filter */}
          <div className="min-w-[170px] flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Filter by Branch
            </label>

            <select
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setDepartmentId("");
              }}
              className="input w-full rounded-xl border border-violet-200 bg-white/90 shadow-sm transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
            >
              <option value="">All Branches</option>

              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="min-w-[170px] flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Filter by Department
            </label>

            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="input w-full rounded-xl border border-sky-200 bg-white/90 shadow-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            >
              <option value="">All Departments</option>

              {filteredDepartments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-white to-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
            onClick={() => {
              setFrom("");
              setTo("");
              setPeriod("monthly");
              setBranchId("");
              setDepartmentId("");
            }}
          >
            <RefreshCw size={16} />
            Reset filters
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Messages",
              value: summary.total,
              icon: <FileText size={22} />,
              styles:
                "border-violet-500 bg-gradient-to-br from-violet-100/90 via-white to-violet-50 shadow-violet-300/70",
              iconStyles:
                "bg-gradient-to-br from-violet-400 to-violet-700",
            },
            {
              label: "Sent Messages",
              value: summary.sent,
              icon: <Send size={22} />,
              styles:
                "border-emerald-500 bg-gradient-to-br from-emerald-100/90 via-white to-emerald-50 shadow-emerald-300/70",
              iconStyles:
                "bg-gradient-to-br from-emerald-400 to-emerald-700",
            },
            {
              label: "Failed Messages",
              value: summary.failed,
              icon: <AlertTriangle size={22} />,
              styles:
                "border-sky-500 bg-gradient-to-br from-sky-100/90 via-white to-sky-50 shadow-sky-300/70",
              iconStyles:
                "bg-gradient-to-br from-sky-400 to-sky-700",
            },
            {
              label: "Queued Messages",
              value: summary.queued,
              icon: <RefreshCw size={22} />,
              styles:
                "border-amber-500 bg-gradient-to-br from-amber-100/90 via-white to-amber-50 shadow-amber-300/70",
              iconStyles:
                "bg-gradient-to-br from-amber-400 to-amber-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`group flex min-h-[112px] items-center gap-4 rounded-[22px] border p-5 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl ${item.styles}`}
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-md transition group-hover:scale-105 ${item.iconStyles}`}
              >
                {item.icon}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-600">
                  {item.label}
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {n(item.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Messages Sent By Day */}
      <section className="card mb-6 p-5">
        <h3 className="mb-4 text-lg font-semibold text-brand-900">
          Messages sent by day
        </h3>

        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            No message history available for this filter.
          </p>
        ) : (
          <div className="flex h-56 items-end gap-1 overflow-x-auto">
            {rows.map((r, i) => (
              <div
                title={`${r.date}: ${n(r.sent)} sent`}
                key={`${r.date}-${i}`}
                className="flex min-w-[9px] flex-1 flex-col items-center justify-end gap-1"
              >
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-brand-800 to-wa"
                  style={{
                    height: `${Math.max(
                      2,
                      (Number(r.sent || 0) / max) * 150
                    )}px`,
                  }}
                />

                <span className="text-[9px] text-slate-500 [writing-mode:vertical-rl]">
                  {r.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Department-wise Report Details */}
      <section className="card">
        <div className="border-b border-slate-100 px-4 py-4">
          <h3 className="font-semibold text-brand-900">
            Report details
          </h3>

          <p className="text-xs text-slate-500">
            {filteredDetailRows.length} department-wise records · filtered to the selected period
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={filteredDetailRows}
        />
      </section>
    </>
  );
}
