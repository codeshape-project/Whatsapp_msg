
import { useEffect, useState } from "react";
import { CalendarClock, XCircle } from "lucide-react";
import useFetch from "../hooks/useFetch";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

// ---------- Loader ----------

function Loader() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      Loading scheduled messages...
    </div>
  );
}

// ---------- Page Header ----------

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

// ---------- Data Table ----------

function DataTable({
  columns = [],
  rows = [],
  empty = "No records found.",
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="bg-brand-50 text-xs font-semibold text-brand-900">
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3.5">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {safeRows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-slate-500"
              >
                {empty}
              </td>
            </tr>
          )}

          {safeRows.map((row, index) => (
            <tr
              key={row.id ?? index}
              className="transition-colors hover:bg-brand-50/60"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3.5 text-slate-700"
                >
                  {column.render
                    ? column.render(row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Scheduled Messages Page ----------

export default function ScheduledMessages() {
  const { organization } = useAuth();

  const { data, loading } = useFetch(api.getScheduledMessages);

  // Local state replaces setData from useFetch.
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (Array.isArray(data)) {
      setScheduledMessages(data);
    }
  }, [data]);

  // Cancel a scheduled campaign through the backend.
  const handleCancel = async (id) => {
    if (!id || cancellingId !== null) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this scheduled campaign?"
    );

    if (!confirmed) return;

    try {
      setCancellingId(id);

      // This must update the campaign in your database.
      await api.cancelScheduledMessage(id);

      // Remove the row only after the API succeeds.
      setScheduledMessages((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (error) {
      alert(
        error?.message || "Failed to cancel scheduled campaign."
      );
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const columns = [
    {
      key: "campaign",
      label: "Campaign",
      render: (row) => (
        <span className="flex items-center gap-2 font-medium text-slate-900">
          <CalendarClock size={17} className="shrink-0 text-brand-700" />
          {row.campaign ?? row.name ?? "—"}
        </span>
      ),
    },
    {
      key: "template",
      label: "Template",
      render: (row) => (
        <span className="text-slate-600">
          {row.template ?? row.template_name ?? "—"}
        </span>
      ),
    },
    {
      key: "recipients",
      label: "Recipients",
      render: (row) =>
        (
          Number(row.recipients ?? row.recipient_count) || 0
        ).toLocaleString("en-IN"),
    },
    {
      key: "date",
      label: "Scheduled For",
      render: (row) => {
        if (row.date) {
          return `${row.date}${row.time ? `, ${row.time}` : ""}`;
        }

        if (row.scheduled_at) {
          const date = new Date(row.scheduled_at);

          if (!Number.isNaN(date.getTime())) {
            return date.toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            });
          }
        }

        return "—";
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        const isCancelling = cancellingId === row.id;

        return (
          <button
            type="button"
            onClick={() => handleCancel(row.id)}
            disabled={cancellingId !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-600 hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle size={16} />
            {isCancelling ? "Cancelling..." : "Cancel"}
          </button>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title={`${organization?.name ?? "Organization"} Scheduled Messages`}
        subtitle={`Messages waiting to be sent for this ${
          organization?.type?.toLowerCase() ?? "organization"
        }`}
      />

      <section className="card">
        <DataTable
          columns={columns}
          rows={scheduledMessages}
          empty="No scheduled messages. Schedule a campaign to see it here."
        />
      </section>
    </>
  );
}
