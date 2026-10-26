
import { useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Send,
  CheckCircle2,
  Eye,
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
        <h2 className="text-2xl font-semibold text-brand-900">{title}</h2>
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
                key={r.id ?? i}
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

function syntheticDailyRows(source, period) {
  const now = new Date();

  const days =
    period === "today"
      ? 1
      : period === "weekly"
        ? 7
        : period === "monthly"
          ? 30
          : 180;

  // Demo data is distributed over the selected range until
  // real backend message records are connected.
  const totals = source.reduce(
    (a, r) => ({
      sent: a.sent + Number(r.sent || 0),
      delivered: a.delivered + Number(r.delivered || 0),
      read: a.read + Number(r.read || 0),
      failed: a.failed + Number(r.failed || 0),
    }),
    { sent: 0, delivered: 0, read: 0, failed: 0 }
  );

  const divisor = Math.max(1, days);

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - 1 - i));

    const factor =
      period === "today" ? 1 : (i + 3) % 7 === 0 ? 1.7 : 0.72;

    const sent = Math.round((totals.sent / divisor) * factor);
    const delivered = Math.min(
      sent,
      Math.round((totals.delivered / divisor) * factor)
    );
    const read = Math.min(
      delivered,
      Math.round((totals.read / divisor) * factor)
    );
    const failed = Math.max(0, sent - delivered);

    return {
      date: date.toLocaleDateString("en-IN"),
      sent,
      delivered,
      read,
      failed,
    };
  });
}

export default function Reports() {
  const { organization } = useAuth();
  const { data, loading } = useFetch(api.getReports);

  const [period, setPeriod] = useState("monthly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const source = Array.isArray(data) ? data : [];

  const liveRows =
    source.length > 0 && source[0]?.date ? source : null;

  const rows = useMemo(() => {
    let result = liveRows
      ? liveRows
      : syntheticDailyRows(source, period);

    if (liveRows && period !== "custom") {
      const days =
        period === "today"
          ? 1
          : period === "weekly"
            ? 7
            : period === "monthly"
              ? 30
              : 180;

      result = result.slice(-days);
    }

    if (from) {
      result = result.filter((r) => {
        const [d, m, y] = r.date.split("/").map(Number);
        return new Date(y, m - 1, d) >= localDay(new Date(from));
      });
    }

    if (to) {
      result = result.filter((r) => {
        const [d, m, y] = r.date.split("/").map(Number);
        return new Date(y, m - 1, d) <= localDay(new Date(to));
      });
    }

    return result;
  }, [source, period, from, to, liveRows]);

  const summary = rows.reduce(
    (a, r) => ({
      sent: a.sent + r.sent,
      delivered: a.delivered + r.delivered,
      read: a.read + r.read,
      failed: a.failed + r.failed,
    }),
    { sent: 0, delivered: 0, read: 0, failed: 0 }
  );

  const columns = [
    { key: "date", label: "Date" },
    { key: "sent", label: "Sent", render: (r) => n(r.sent) },
    {
      key: "delivered",
      label: "Delivered",
      render: (r) => n(r.delivered),
    },
    { key: "read", label: "Read", render: (r) => n(r.read) },
    { key: "failed", label: "Failed", render: (r) => n(r.failed) },
    {
      key: "rate",
      label: "Delivery Rate",
      render: (r) =>
        r.sent
          ? `${((r.delivered / r.sent) * 100).toFixed(1)}%`
          : "0.0%",
    },
  ];

  const exportRows = rows.map((r) => ({
    Date: r.date,
    Sent: r.sent,
    Delivered: r.delivered,
    Read: r.read,
    Failed: r.failed,
    "Delivery Rate": r.sent
      ? `${((r.delivered / r.sent) * 100).toFixed(1)}%`
      : "0.0%",
  }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Messaging Report");

    XLSX.writeFile(
      wb,
      `${organization.name.replace(/\W+/g, "_")}_${period}_report.xlsx`
    );
  };

  const exportPdf = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(
      `${organization.name} - ${
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
      head: [
        ["Date", "Sent", "Delivered", "Read", "Failed", "Delivery Rate"],
      ],
      body: rows.map((r) => [
        r.date,
        r.sent,
        r.delivered,
        r.read,
        r.failed,
        r.sent
          ? `${((r.delivered / r.sent) * 100).toFixed(1)}%`
          : "0.0%",
      ]),
    });

    doc.save(
      `${organization.name.replace(/\W+/g, "_")}_${period}_report.pdf`
    );
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Loading reports...
      </div>
    );
  }

  const max = Math.max(1, ...rows.map((r) => r.sent));

  return (
    <>
      <PageHeader
        title={`${organization.name} Reports`}
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

      <section className="card mb-6 p-5">
        {/* Updated filter UI */}
        <div className="mb-5 flex flex-wrap items-end gap-4 rounded-2xl border border-sky-100 bg-gradient-to-r from-white via-sky-50/70 to-emerald-50/60 p-4 shadow-[0_6px_24px_rgba(56,189,248,0.10)]">
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
              <option value="custom">Custom range (6 months)</option>
            </select>
          </div>

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

          <button
            type="button"
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-white to-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
            onClick={() => {
              setFrom("");
              setTo("");
              setPeriod("monthly");
            }}
          >
            <RefreshCw size={16} />
            Reset filters
          </button>
        </div>

        {/* Updated colorful summary boxes */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Sent",
              value: summary.sent,
              icon: <Send size={22} />,
              styles:
                "border-violet-500 bg-gradient-to-br from-violet-100/90 via-white to-violet-50 shadow-violet-300/70",
              iconStyles: "bg-gradient-to-br from-violet-400 to-violet-700",
            },
            {
              label: "Delivered",
              value: summary.delivered,
              icon: <CheckCircle2 size={22} />,
              styles:
                "border-emerald-500 bg-gradient-to-br from-emerald-100/90 via-white to-emerald-50 shadow-emerald-300/70",
              iconStyles: "bg-gradient-to-br from-emerald-400 to-emerald-700",
            },
            {
              label: "Read",
              value: summary.read,
              icon: <Eye size={22} />,
              styles:
                "border-amber-500 bg-gradient-to-br from-amber-100/90 via-white to-amber-50 shadow-amber-300/70",
              iconStyles: "bg-gradient-to-br from-amber-400 to-amber-600",
            },
            {
              label: "Failed",
              value: summary.failed,
              icon: <AlertTriangle size={22} />,
              styles:
                "border-sky-500 bg-gradient-to-br from-sky-100/90 via-white to-sky-50 shadow-sky-300/70",
              iconStyles: "bg-gradient-to-br from-sky-400 to-sky-700",
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

      {/* Existing chart — unchanged */}
      <section className="card mb-6 p-5">
        <h3 className="mb-4 text-lg font-semibold text-brand-900">
          Messages sent by day
        </h3>

        <div className="flex h-56 items-end gap-1 overflow-x-auto">
          {rows.map((r, i) => (
            <div
              title={`${r.date}: ${r.sent} sent`}
              key={`${r.date}-${i}`}
              className="flex min-w-[9px] flex-1 flex-col items-center justify-end gap-1"
            >
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-brand-800 to-wa"
                style={{
                  height: `${Math.max(2, (r.sent / max) * 150)}px`,
                }}
              />

              <span className="text-[9px] text-slate-500 [writing-mode:vertical-rl]">
                {r.date}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Existing report details table — unchanged */}
      <section className="card">
        <div className="border-b border-slate-100 px-4 py-4">
          <h3 className="font-semibold text-brand-900">
            Report details
          </h3>

          <p className="text-xs text-slate-500">
            {rows.length} date records · filtered to the selected period
          </p>
        </div>

        <DataTable columns={columns} rows={rows} />
      </section>

      {!liveRows && (
        <p className="mt-3 text-xs text-slate-500">
          Demo mode: report totals are distributed across the selected
          period. Configure backend mode to report actual message history.
        </p>
      )}
    </>
  );
}
