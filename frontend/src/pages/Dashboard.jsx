// import { Link } from "react-router-dom";
// import {
//   Users, Send, Check, Eye, X, TrendingUp, Calendar, ChevronDown, ChevronRight, CheckCircle2,
// } from "lucide-react";
// import useFetch from "../hooks/useFetch";
// import api from "../services/api";
// import { useAuth } from "../hooks/useAuth";

// const n = (v) => (Number(v) || 0).toLocaleString("en-IN");

// /* ---------- colours (change here) ---------- */
// const COLORS = {
//   contacts: "#8b5cf6",  // violet
//   messages: "#f59e0b",  // amber
//   delivered: "#25d366", // WhatsApp green
//   read: "#34b7f1",      // WhatsApp blue tick
//   failed: "#f43f5e",    // rose
// };

// const activityStyle = {
//   delivered: { icon: Check, bg: "bg-emerald-500" },
//   read: { icon: Eye, bg: "bg-sky-500" },
//   failed: { icon: X, bg: "bg-rose-500" },
//   completed: { icon: Check, bg: "bg-teal-600" },
//   scheduled: { icon: Send, bg: "bg-amber-500" },
// };

// /* ---------- small helpers used only on this page ---------- */

// function Loader() {
//   return (
//     <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
//       <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
//       Loading...
//     </div>
//   );
// }

// function PageHeader({ title, subtitle, children }) {
//   return (
//     <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
//       <div>
//         <h2 className="text-2xl font-semibold text-brand-900">{title}</h2>
//         {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
//       </div>
//       {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
//     </div>
//   );
// }

// const badgeStyles = {
//   Completed: "bg-emerald-100 text-emerald-700",
//   Running: "bg-sky-100 text-sky-700",
//   Scheduled: "bg-amber-100 text-amber-700",
//   Failed: "bg-rose-100 text-rose-700",
// };

// function StatusBadge({ status }) {
//   return (
//     <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[status] || "bg-slate-100 text-slate-600"}`}>
//       {status}
//     </span>
//   );
// }

// // Colourful summary box with a glowing border
// function StatCard({ icon: Icon, label, value, footer, footerIcon: FooterIcon, color }) {
//   return (
//     <div
//       className="rounded-2xl p-5 transition duration-200 hover:-translate-y-1"
//       style={{
//         border: `1.5px solid ${color}`,
//         background: `linear-gradient(135deg, ${color}26 0%, #ffffff 65%)`,
//         boxShadow: `0 0 0 3px ${color}1f, 0 0 24px ${color}70, 0 12px 26px -14px ${color}`,
//       }}
//     >
//       <div className="flex items-start justify-between">
//         <div className="flex items-center gap-3">
//           <span
//             className="flex h-12 w-12 items-center justify-center rounded-full text-white"
//             style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 0 16px ${color}99` }}
//           >
//             <Icon size={22} />
//           </span>
//           <span className="text-sm font-medium text-slate-800">{label}</span>
//         </div>
//         <ChevronRight size={16} className="text-slate-400" />
//       </div>
//       <p className="mt-4 text-center text-3xl font-semibold text-slate-900">{value}</p>
//       <p className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-600">
//         {FooterIcon && <FooterIcon size={13} style={{ color }} />}
//         {footer}
//       </p>
//     </div>
//   );
// }

// // SVG donut chart (no chart library needed)
// function DonutChart({ segments, centerValue, centerLabel, size = 220, stroke = 38 }) {
//   const r = (size - stroke) / 2;
//   const c = 2 * Math.PI * r;
//   const total = segments.reduce((s, x) => s + x.value, 0);
//   let offset = 0;

//   return (
//     <div className="relative shrink-0" style={{ width: size, height: size }}>
//       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
//         <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e6f2ea" strokeWidth={stroke} />
//         {segments.map((s) => {
//           const len = (s.value / total) * c;
//           const el = (
//             <circle
//               key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none"
//               stroke={s.color} strokeWidth={stroke}
//               strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
//             />
//           );
//           offset += len;
//           return el;
//         })}
//       </svg>
//       <div className="absolute inset-0 flex flex-col items-center justify-center">
//         <span className="text-2xl font-semibold text-slate-900">{centerValue}</span>
//         <span className="text-xs text-slate-600">{centerLabel}</span>
//       </div>
//     </div>
//   );
// }

// // SVG area/line chart (no chart library needed)
// function TrendChart({ data, max = 1000, step = 200 }) {
//   const W = 640, H = 260;
//   const pad = { l: 44, r: 16, t: 14, b: 32 };
//   const iw = W - pad.l - pad.r;
//   const ih = H - pad.t - pad.b;
//   const x = (i) => pad.l + (i / (data.length - 1)) * iw;
//   const y = (v) => pad.t + ih - (v / max) * ih;

//   const points = data.map((d, i) => [x(i), y(d.value)]);
//   const line = points.map((p) => p.join(",")).join(" ");
//   const area = `${pad.l},${pad.t + ih} ${line} ${x(data.length - 1)},${pad.t + ih}`;
//   const ticks = [];
//   for (let v = 0; v <= max; v += step) ticks.push(v);

//   return (
//     <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Messages sent trend">
//       <defs>
//         <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0%" stopColor="#25d366" stopOpacity="0.45" />
//           <stop offset="100%" stopColor="#25d366" stopOpacity="0.03" />
//         </linearGradient>
//       </defs>
//       {ticks.map((v) => (
//         <g key={v}>
//           <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#e2ece6" />
//           <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#64748b">{v.toLocaleString()}</text>
//         </g>
//       ))}
//       <polygon points={area} fill="url(#trendFill)" />
//       <polyline points={line} fill="none" stroke="#128c7e" strokeWidth="2.5" strokeLinejoin="round" />
//       {points.map(([px, py], i) => (
//         <circle key={i} cx={px} cy={py} r="4.5" fill="#25d366" stroke="#fff" strokeWidth="2" />
//       ))}
//       {data.map((d, i) => (
//         <text key={d.day} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748b">{d.day}</text>
//       ))}
//     </svg>
//   );
// }

// /* ---------- the page ---------- */

// export default function Dashboard() {
//   const { organization } = useAuth();
//   const { data: stats, loading } = useFetch(api.getDashboardStats);
//   const { data: trend } = useFetch(api.getMessageTrend);
//   const { data: campaigns } = useFetch(api.getRecentCampaigns);
//   const { data: activity } = useFetch(api.getRecentActivity);

//   if (loading || !stats) return <Loader />;

//   const statusRows = [
//     { label: "Delivered", value: stats.delivered, pct: stats.deliveryRate, icon: Check, color: COLORS.delivered },
//     { label: "Read", value: stats.read, pct: stats.readRate, icon: Eye, color: COLORS.read },
//     { label: "Failed", value: stats.failed, pct: stats.failureRate, icon: X, color: COLORS.failed },
//   ];

//   return (
//     <>
//       <PageHeader title={`${organization.name} Dashboard`} subtitle={`Overview of WhatsApp messaging for your ${organization.type.toLowerCase()}`}>
//         <button className="btn-ghost">
//           <Calendar size={16} /> 01 Jun 2026 - 29 Jun 2026 <ChevronDown size={16} />
//         </button>
//       </PageHeader>

//       {/* Summary boxes */}
//       <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
//         <StatCard icon={Users} label="Total Contacts" value={n(stats.totalContacts)} color={COLORS.contacts}
//           footerIcon={TrendingUp} footer={`+${stats.contactsGrowth}% from last month`} />
//         <StatCard icon={Send} label="Total Messages" value={n(stats.totalMessages)} color={COLORS.messages}
//           footerIcon={TrendingUp} footer={`+${stats.messagesGrowth}% from last month`} />
//         <StatCard icon={CheckCircle2} label="Delivered" value={n(stats.delivered)} color={COLORS.delivered}
//           footer={`${stats.deliveryRate.toFixed(1)}% delivery rate`} />
//         <StatCard icon={Eye} label="Read" value={n(stats.read)} color={COLORS.read}
//           footer={`${stats.readRate}% read rate`} />
//         <StatCard icon={X} label="Failed" value={n(stats.failed)} color={COLORS.failed}
//           footer={`${stats.failureRate}% failure rate`} />
//       </div>

//       {/* Charts */}
//       <div className="mt-6 grid gap-5 lg:grid-cols-5">
//         <section className="card min-w-0 p-5 lg:col-span-3">
//           <div className="flex flex-wrap items-center justify-between gap-2">
//             <h3 className="text-lg font-semibold text-brand-900">Message Status Overview</h3>
//             <div className="flex items-center gap-4 text-xs text-slate-700">
//               {statusRows.map((s) => (
//                 <span key={s.label} className="flex items-center gap-1.5">
//                   <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.label}
//                 </span>
//               ))}
//             </div>
//           </div>

//           <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
//             <DonutChart
//               centerValue={n(stats.totalMessages)}
//               centerLabel="Total Messages"
//               segments={statusRows.map((s) => ({ label: s.label, value: s.value, color: s.color }))}
//             />
//             <ul className="w-full flex-1 divide-y divide-slate-100 sm:border-l sm:border-slate-100 sm:pl-6">
//               {statusRows.map(({ label, value, pct, icon: Icon, color }) => (
//                 <li key={label} className="flex items-center gap-3 py-3.5">
//                   <span className="flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ background: color, boxShadow: `0 0 12px ${color}88` }}>
//                     <Icon size={18} />
//                   </span>
//                   <div className="flex-1">
//                     <p className="text-sm text-slate-700">{label}</p>
//                     <p className="text-xl font-semibold text-slate-900">{n(value)}</p>
//                   </div>
//                   <span className="text-xs text-slate-500"> {(Number(pct) || 0).toFixed(1)}%</span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </section>

//         <section className="card min-w-0 p-5 lg:col-span-2">
//           <div className="flex items-center justify-between">
//             <h3 className="text-lg font-semibold text-brand-900">Messages Sent Trend</h3>
//             <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm" defaultValue="7">
//               <option value="7">Last 7 Days</option>
//               <option value="30">Last 30 Days</option>
//             </select>
//           </div>
//           <div className="mt-4">{trend && <TrendChart data={trend} />}</div>
//         </section>
//       </div>

//       {/* Tables */}
//       <div className="mt-6 grid gap-5 xl:grid-cols-5">
//         <section className="card min-w-0 p-5 xl:col-span-3">
//           <div className="mb-3 flex items-center justify-between">
//             <h3 className="text-lg font-semibold text-brand-900">Recent Campaigns</h3>
//             <Link to="/campaigns" className="text-sm font-medium text-brand-700 hover:underline">View All</Link>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[720px] text-left text-sm">
//               <thead>
//                 <tr className="bg-brand-50 text-xs font-semibold text-brand-900">
//                   {["Campaign Name", "Template", "Recipients", "Sent", "Delivered", "Read", "Failed", "Status", "Date"].map((h) => (
//                     <th key={h} className="px-3 py-2.5">{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100 text-xs">
//                 {(campaigns || []).map((c) => (
//                   <tr key={c.id} className="hover:bg-brand-50/60">
//                     <td className="px-3 py-3 text-sm">
//                       <span className="mr-2 inline-block h-2 w-2 rounded-full bg-wa" />{c.name}
//                     </td>
//                     <td className="px-3 py-3 text-slate-500">{c.template}</td>
//                     <td className="px-3 py-3">{n(c.recipients)}</td>
//                     <td className="px-3 py-3">{n(c.sent)}</td>
//                     <td className="px-3 py-3">{n(c.delivered)}</td>
//                     <td className="px-3 py-3">{n(c.read)}</td>
//                     <td className="px-3 py-3">{n(c.failed)}</td>
//                     <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
//                     <td className="px-3 py-3 leading-tight">{c.date}<br /><span className="text-slate-500">{c.time}</span></td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         <section className="card min-w-0 p-5 xl:col-span-2">
//           <div className="mb-3 flex items-center justify-between">
//             <h3 className="text-lg font-semibold text-brand-900">Recent Activity</h3>
//             <Link to="/reports" className="text-sm font-medium text-brand-700 hover:underline">View All</Link>
//           </div>
//           <ul className="divide-y divide-slate-100">
//             {(activity || []).map((a) => {
//             const s = activityStyle[a.type] || activityStyle.completed;
// const Icon = s.icon;
//               return (
//                 <li key={a.id} className="flex items-center gap-3 py-3">
//                   <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${s.bg}`}>
//                     <Icon size={17} />
//                   </span>
//                   <div className="min-w-0 flex-1">
//                     <p className="truncate text-sm text-slate-800">{a.text}</p>
//                     <p className="text-xs text-slate-500">{a.sub}</p>
//                   </div>
//                   <span className="shrink-0 text-xs text-slate-500">{a.time}</span>
//                 </li>
//               );
//             })}
//           </ul>
//         </section>
//       </div>
//     </>
//   );
// }
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Send,
  CheckCircle2,
  X,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Activity,
  RefreshCw,
} from "lucide-react";

import useFetch from "../hooks/useFetch";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const n = (value) => (Number(value) || 0).toLocaleString("en-IN");

const COLORS = {
  contacts: "#f97316",
  messages: "#f59e0b",
  sent: "#25d366",
  failed: "#f43f5e",
  queued: "#8b5cf6",
};

const activityStyle = {
  delivered: { icon: CheckCircle2, bg: "bg-emerald-500" },
  read: { icon: CheckCircle2, bg: "bg-sky-500" },
  failed: { icon: X, bg: "bg-rose-500" },
  completed: { icon: CheckCircle2, bg: "bg-teal-600" },
  sent: { icon: Send, bg: "bg-indigo-500" },
  queued: { icon: Clock, bg: "bg-amber-500" },
  scheduled: { icon: Clock, bg: "bg-amber-500" },
};

const getArray = (value, keys = []) => {
  if (Array.isArray(value)) return value;

  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
    if (Array.isArray(value?.data?.[key])) return value.data[key];
  }

  if (Array.isArray(value?.data)) return value.data;

  return [];
};

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (status) => {
  if (!status) return "—";

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

function Loader() {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      Loading...
    </div>
  );
}

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold text-brand-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}

const badgeStyles = {
  Completed: "bg-emerald-100 text-emerald-700",
  Running: "bg-sky-100 text-sky-700",
  Scheduled: "bg-amber-100 text-amber-700",
  Failed: "bg-rose-100 text-rose-700",
  Sent: "bg-indigo-100 text-indigo-700",
  Queued: "bg-amber-100 text-amber-700",
  Cancelled: "bg-slate-100 text-slate-600",
  Draft: "bg-slate-100 text-slate-600",
  Pending: "bg-amber-100 text-amber-700",
};

function StatusBadge({ status }) {
  const formatted = formatStatus(status);

  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
        badgeStyles[formatted] || "bg-slate-100 text-slate-600"
      }`}
    >
      {formatted}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, footer, color }) {
  return (
    <div
      className="min-w-0 rounded-2xl p-4 transition duration-200 hover:-translate-y-1 sm:p-5"
      style={{
        border: `1.5px solid ${color}`,
        background: `linear-gradient(135deg, ${color}26 0%, #ffffff 65%)`,
        boxShadow: `0 0 0 3px ${color}1f, 0 0 20px ${color}55, 0 12px 26px -14px ${color}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white sm:h-11 sm:w-11"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}bb)`,
              boxShadow: `0 0 14px ${color}77`,
            }}
          >
            <Icon size={20} />
          </span>

          <span className="text-sm font-medium leading-5 text-slate-800">
            {label}
          </span>
        </div>

        <ChevronRight size={15} className="shrink-0 text-slate-400" />
      </div>

      <p className="mt-4 break-words text-center text-2xl font-semibold text-slate-900 sm:text-3xl">
        {value}
      </p>

      <p className="mt-3 text-center text-xs leading-5 text-slate-600">
        {footer}
      </p>
    </div>
  );
}

function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 220,
  stroke = 38,
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce(
    (sum, item) => sum + Math.max(0, item.value),
    0
  );

  let offset = 0;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size, maxWidth: "100%" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label="Sent, failed and queued message distribution"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e6f2ea"
          strokeWidth={stroke}
        />

        {total > 0 &&
          segments
            .filter((segment) => segment.value > 0)
            .map((segment) => {
              const length = (segment.value / total) * circumference;

              const circle = (
                <circle
                  key={segment.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                />
              );

              offset += length;
              return circle;
            })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-slate-900">
          {centerValue}
        </span>
        <span className="text-xs text-slate-600">{centerLabel}</span>
      </div>
    </div>
  );
}

function TrendChart({ data = [] }) {
  const pointsData = useMemo(() => {
    return getArray(data).map((item, index) => {
      const rawDate = item.day ?? item.date;
      let day = rawDate ?? `Day ${index + 1}`;

      if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(String(rawDate))) {
        const parsed = new Date(`${rawDate}T00:00:00`);

        if (!Number.isNaN(parsed.getTime())) {
          day = parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          });
        }
      }

      return {
        day: String(day),
        value:
          Number(
            item.value ?? item.total ?? item.count ?? item.messages
          ) || 0,
      };
    });
  }, [data]);

  const W = 640;
  const H = 260;
  const pad = { l: 44, r: 16, t: 14, b: 32 };
  const innerWidth = W - pad.l - pad.r;
  const innerHeight = H - pad.t - pad.b;

  const maxValue = Math.max(4, ...pointsData.map((item) => item.value));
  const max = Math.ceil(maxValue / 4) * 4;
  const step = max / 4;

  const x = (index) =>
    pointsData.length <= 1
      ? pad.l + innerWidth / 2
      : pad.l + (index / (pointsData.length - 1)) * innerWidth;

  const y = (value) =>
    pad.t + innerHeight - (value / max) * innerHeight;

  const points = pointsData.map((item, index) => [
    x(index),
    y(item.value),
  ]);
  const line = points.map((point) => point.join(",")).join(" ");

  const area = points.length
    ? `${pad.l},${pad.t + innerHeight} ${line} ${
        pad.l + innerWidth
      },${pad.t + innerHeight}`
    : "";

  const ticks = [0, 1, 2, 3, 4].map((index) => index * step);

  if (!pointsData.length || pointsData.every((item) => item.value === 0)) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center text-center">
        <Activity size={28} className="text-slate-400" />
        <p className="mt-2 text-sm font-medium text-slate-700">
          No message trend available
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Daily message totals will appear here when records are available.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Messages trend"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#25d366" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#25d366" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {ticks.map((value) => (
          <g key={value}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(value)}
              y2={y(value)}
              stroke="#e2ece6"
            />
            <text
              x={pad.l - 8}
              y={y(value) + 4}
              textAnchor="end"
              fontSize="11"
              fill="#64748b"
            >
              {n(value)}
            </text>
          </g>
        ))}

        <polygon points={area} fill="url(#trendFill)" />

        {points.length > 1 && (
          <polyline
            points={line}
            fill="none"
            stroke="#128c7e"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}

        {points.map(([px, py], index) => (
          <circle
            key={`${pointsData[index].day}-${index}`}
            cx={px}
            cy={py}
            r="4.5"
            fill="#25d366"
            stroke="#fff"
            strokeWidth="2"
          >
            <title>
              {pointsData[index].day}: {n(pointsData[index].value)} messages
            </title>
          </circle>
        ))}

        {pointsData.map((item, index) => (
          <text
            key={`${item.day}-label`}
            x={x(index)}
            y={H - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
          >
            {item.day}
          </text>
        ))}
      </svg>

      <p className="mt-2 text-xs text-slate-500">
        Total messages in displayed period:{" "}
        <strong className="text-slate-800">
          {n(pointsData.reduce((sum, item) => sum + item.value, 0))}
        </strong>
      </p>
    </div>
  );
}

function ErrorMessage({ error, onRetry }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-rose-600">
        {error?.message || "Unable to load data."}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { organization } = useAuth();

  const {
    data: statsResponse,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useFetch(api.getDashboardStats);

  const {
    data: trendResponse,
    loading: trendLoading,
    error: trendError,
    refetch: refetchTrend,
  } = useFetch(api.getMessageTrend);

  const {
    data: campaignsResponse,
    loading: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useFetch(api.getRecentCampaigns);

  const {
    data: activityResponse,
    loading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = useFetch(api.getRecentActivity);

  const stats = useMemo(() => {
    const source = statsResponse?.data ?? statsResponse ?? {};
    const totalMessages = Number(source.totalMessages) || 0;

    return {
      ...source,
      totalContacts: Number(source.totalContacts) || 0,
      totalMessages,
      sent: Number(source.sent) || 0,
      failed: Number(source.failed) || 0,
      queued: Number(source.queued) || 0,
      failureRate:
        source.failureRate !== undefined
          ? Number(source.failureRate) || 0
          : totalMessages > 0
            ? ((Number(source.failed) || 0) / totalMessages) * 100
            : 0,
    };
  }, [statsResponse]);

  const trend = useMemo(
    () => getArray(trendResponse, ["trend"]),
    [trendResponse]
  );

  const campaigns = useMemo(
    () =>
      getArray(campaignsResponse, ["campaigns"]).map((campaign) => ({
        ...campaign,
        name:
          campaign.name ??
          campaign.campaign_name ??
          campaign.template_name ??
          "Untitled Campaign",
        template: campaign.template ?? campaign.template_name ?? "—",
        recipients:
          Number(campaign.recipients ?? campaign.recipient_count) || 0,
        sent: Number(campaign.sent ?? campaign.sent_count) || 0,
        failed: Number(campaign.failed ?? campaign.failed_count) || 0,
        status: campaign.status ?? "—",
      })),
    [campaignsResponse]
  );

  const activities = useMemo(
    () =>
      getArray(activityResponse, ["activity"]).map((item) => ({
        ...item,
        type: String(item.status ?? item.type ?? "completed").toLowerCase(),
        text:
          item.text ??
          item.title ??
          item.message ??
          "Message activity",
        sub: item.sub ?? item.description ?? item.details ?? "",
        time:
          item.time ??
          formatDateTime(item.created_at ?? item.timestamp),
      })),
    [activityResponse]
  );

  const retryAll = () => {
    refetchStats?.();
    refetchTrend?.();
    refetchCampaigns?.();
    refetchActivity?.();
  };

  if (statsLoading && !statsResponse) return <Loader />;

  if (statsError && !statsResponse) {
    return <ErrorMessage error={statsError} onRetry={refetchStats} />;
  }

  const statusRows = [
    {
      label: "Sent",
      value: stats.sent,
      pct:
        stats.totalMessages > 0
          ? (stats.sent / stats.totalMessages) * 100
          : 0,
      icon: CheckCircle2,
      color: COLORS.sent,
    },
    {
      label: "Failed",
      value: stats.failed,
      pct:
        stats.totalMessages > 0
          ? (stats.failed / stats.totalMessages) * 100
          : 0,
      icon: X,
      color: COLORS.failed,
    },
    {
      label: "Waiting",
      value: stats.queued,
      pct:
        stats.totalMessages > 0
          ? (stats.queued / stats.totalMessages) * 100
          : 0,
      icon: Clock,
      color: COLORS.queued,
    },
  ];

  return (
    <>
      <PageHeader
        title={`${organization?.name || "Organization"} Dashboard`}
        subtitle={`Overview of WhatsApp messaging${
          organization?.type
            ? ` for your ${String(organization.type).toLowerCase()}`
            : ""
        }`}
      >
        <button
          type="button"
          onClick={retryAll}
          className="btn-ghost inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>

        <span className="btn-ghost inline-flex items-center gap-2">
          <Calendar size={16} />
          Last 7 Days
          <ChevronDown size={16} />
        </span>
      </PageHeader>

      {/* Five summary cards in one row on large screens */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={Users}
          label="Total Contacts"
          value={n(stats.totalContacts)}
          color={COLORS.contacts}
          footer="Contacts in your organization"
        />

        <StatCard
          icon={Send}
          label="Total Messages"
          value={n(stats.totalMessages)}
          color={COLORS.messages}
          footer="Messages recorded in database"
        />

        <StatCard
          icon={CheckCircle2}
          label="Sent Messages"
          value={n(stats.sent)}
          color={COLORS.sent}
          footer="Successfully sent"
        />

        <StatCard
          icon={X}
          label="Failed Messages"
          value={n(stats.failed)}
          color={COLORS.failed}
          footer={`${stats.failureRate.toFixed(1)}% failure rate`}
        />

        <StatCard
          icon={Clock}
          label="Wating Messages"
          value={n(stats.queued)}
          color={COLORS.queued}
          footer="Waiting to be sent"
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <section className="card min-w-0 p-5 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-brand-900">
              Message Status Overview
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
              {statusRows.map((item) => (
                <span key={item.label} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: item.color }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {statsError ? (
            <ErrorMessage error={statsError} onRetry={refetchStats} />
          ) : (
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
              <DonutChart
                centerValue={n(stats.totalMessages)}
                centerLabel="Total Messages"
                segments={statusRows.map((item) => ({
                  label: item.label,
                  value: item.value,
                  color: item.color,
                }))}
              />

              <ul className="w-full flex-1 divide-y divide-slate-100 sm:border-l sm:border-slate-100 sm:pl-6">
                {statusRows.map(
                  ({ label, value, pct, icon: Icon, color }) => (
                    <li
                      key={label}
                      className="flex items-center gap-3 py-3.5"
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                        style={{
                          background: color,
                          boxShadow: `0 0 12px ${color}88`,
                        }}
                      >
                        <Icon size={18} />
                      </span>

                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{label}</p>
                        <p className="text-xl font-semibold text-slate-900">
                          {n(value)}
                        </p>
                      </div>

                      <span className="text-xs text-slate-500">
                        {pct.toFixed(1)}%
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </section>

        <section className="card min-w-0 p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-brand-900">
              Messages Sent Trend
            </h3>

            <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm text-brand-800">
              Last 7 Days
            </span>
          </div>

          <div className="mt-4">
            {trendError ? (
              <ErrorMessage error={trendError} onRetry={refetchTrend} />
            ) : trendLoading ? (
              <Loader />
            ) : (
              <TrendChart data={trend} />
            )}
          </div>
        </section>
      </div>

      {/* Independent panel heights prevent empty campaign space */}
      <div className="mt-6 grid grid-cols-1 items-start gap-5 xl:grid-cols-5">
        {/* Recent Campaigns */}
        <section className="card min-w-0 self-start p-5 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-brand-900">
              Recent Campaigns
            </h3>

            <Link
              to="/campaigns"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              View All
            </Link>
          </div>

          {campaignsError ? (
            <ErrorMessage
              error={campaignsError}
              onRetry={refetchCampaigns}
            />
          ) : campaignsLoading ? (
            <Loader />
          ) : campaigns.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No campaigns found. Created campaigns will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="bg-brand-50 text-xs font-semibold text-brand-900">
                    {[
                      "Campaign Name",
                      "Template",
                      "Recipients",
                      "Sent",
                      "Failed",
                      "Status",
                    ].map((heading) => (
                      <th key={heading} className="px-3 py-2.5">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {campaigns.map((campaign, index) => (
                    <tr
                      key={campaign.id ?? `${campaign.name}-${index}`}
                      className="hover:bg-brand-50/60"
                    >
                      <td className="px-3 py-3 text-sm text-slate-800">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-wa" />
                        {campaign.name}
                      </td>

                      <td className="px-3 py-3 text-slate-600">
                        {campaign.template}
                      </td>

                      <td className="px-3 py-3">
                        {n(campaign.recipients)}
                      </td>

                      <td className="px-3 py-3">{n(campaign.sent)}</td>

                      <td className="px-3 py-3">{n(campaign.failed)}</td>

                      <td className="px-3 py-3">
                        <StatusBadge status={campaign.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Activity: fixed maximum height, hidden scrollbar */}
        <section className="card min-w-0 self-start p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-brand-900">
              Recent Activity
            </h3>

            <Link
              to="/reports"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              View All
            </Link>
          </div>

          {activityError ? (
            <ErrorMessage
              error={activityError}
              onRetry={refetchActivity}
            />
          ) : activityLoading ? (
            <Loader />
          ) : activities.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No recent activity found.
            </p>
          ) : (
            <ul className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activities.map((item, index) => {
                const style =
                  activityStyle[item.type] || activityStyle.completed;
                const Icon = style.icon;

                return (
                  <li
                    key={item.id ?? `${item.text}-${index}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${style.bg}`}
                    >
                      <Icon size={17} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-800">
                        {item.text}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {item.sub}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-slate-500">
                      {item.time}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
