import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  Clock,
  Upload,
  Download,
  RefreshCw,
} from "lucide-react";

import useFetch from "../hooks/useFetch";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const PAGE_SIZE = 6;

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  opted_in: false,
};

/* ================= HELPERS ================= */

function getContactArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.contacts)) return response.contacts;
  if (Array.isArray(response?.data?.contacts)) return response.data.contacts;
  return [];
}

function normalizeContact(contact) {
  return {
    ...contact,
    group: contact.group || contact.group_name || "",
    email: contact.email || "",
    status: contact.status || "Active",
    phone_valid: contact.phone_valid === true,
    opted_in: contact.opted_in === true,
  };
}

function validatePhone(value) {
  const raw = String(value ?? "").trim();
  let digits = raw.replace(/\D/g, "");

  if (raw.startsWith("00")) digits = digits.slice(2);

  if (digits.length === 10) {
    return /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : null;
  }

  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) {
    return null;
  }

  return digits;
}

/* ================= SHARED UI (same look as Contacts page) ================= */

function Loader() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      Loading...
    </div>
  );
}

function PageHeader({ title, subtitle, back, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        {back}
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
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-slate-100 text-slate-600",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        badgeStyles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "Active"}
    </span>
  );
}

function SummaryBox({ label, value, color }) {
  return (
    <div
      className="w-full rounded-2xl p-5 transition duration-300 hover:-translate-y-1"
      style={{
        border: `1.5px solid ${color}`,
        background: `linear-gradient(135deg, ${color}26 0%, #ffffff 70%)`,
        boxShadow: `0 0 0 3px ${color}1f, 0 0 22px ${color}66, 0 10px 22px -14px ${color}`,
      }}
    >
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function DataTable({ columns, rows, empty = "No records found." }) {
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
            <tr key={row.id ?? index} className="hover:bg-brand-50/60">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3.5 text-slate-700">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================= MESSAGE HISTORY MODAL ================= */

function MessageHistoryModal({ contact, messages, loading, error, onClose }) {
  if (!contact) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageCircle size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-brand-900">
                {contact.name || "Contact"}
              </h3>
              <p className="text-sm text-slate-600">{contact.phone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-[280px] flex-1 space-y-3 overflow-y-auto bg-slate-50 px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
              Loading message history...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="py-12 text-center">
              <MessageCircle size={32} className="mx-auto mb-3 text-slate-400" />
              <p className="font-medium text-slate-900">
                No message history found
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Stored messages will appear here when available.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            messages.map((message, index) => {
              const direction = String(
                message.direction || message.message_type || ""
              ).toLowerCase();

              const outgoing =
                ["outgoing", "sent", "template"].includes(direction) ||
                message.from_business === true;

             const body =
  message.message_body ||
  message.message ||
  message.text ||
  message.body ||
  message.content ||
  message.message_text ||
  `[${message.message_type || "Message"}]`;

const timestamp =
  message.message_timestamp ||
  message.created_at ||
  message.timestamp ||
  message.sent_at;
              return (
                <div
                  key={message.id || message.message_id || index}
                  className={`flex ${outgoing ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      outgoing
                        ? "rounded-br-sm bg-emerald-100 text-slate-900"
                        : "rounded-bl-sm border border-slate-100 bg-white text-slate-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {body}
                    </p>
                    <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-slate-600">
                      {timestamp && (
                        <span>
                          {Number.isNaN(Date.parse(timestamp))
                            ? timestamp
                            : new Date(timestamp).toLocaleString()}
                        </span>
                      )}
                      {outgoing && (
                        <span className="ml-1">
                          {String(message.status || "").toLowerCase() ===
                          "read" ? (
                            <CheckCircle size={13} className="text-blue-600" />
                          ) : (
                            <Clock size={13} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-600">
          This panel displays message history returned by your backend.
        </div>
      </div>
    </div>
  );
}

/* ================= DEPARTMENT CONTACTS PAGE ================= */

export default function DepartmentContacts() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { organization } = useAuth();

  const departmentId = searchParams.get("department_id");
  const departmentNameFromUrl = searchParams.get("department_name") || "";
  const isHospital = organization?.type === "Hospital";

  const { data: contactsResponse, loading } = useFetch(api.getContacts);

  const [refreshedContacts, setRefreshedContacts] = useState(null);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [masterLoading, setMasterLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  // Edit contact directly on this page.
  const [editingContact, setEditingContact] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  // Match Contacts page import flow: choose assignment, then choose file.
  const [showImport, setShowImport] = useState(false);
  const [importBranchId, setImportBranchId] = useState("");
  const [importDepartmentId, setImportDepartmentId] = useState(departmentId || "");
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");

  const contacts = useMemo(() => {
    const source = refreshedContacts ?? contactsResponse;
    return getContactArray(source).map(normalizeContact);
  }, [contactsResponse, refreshedContacts]);

  useEffect(() => {
    let cancelled = false;

    async function loadMasterData() {
      setMasterLoading(true);
      try {
        const [branchResponse, departmentResponse] = await Promise.all([
          api.getBranches(),
          api.getDepartments(),
        ]);

        if (cancelled) return;

        setBranches(
          (Array.isArray(branchResponse) ? branchResponse : []).filter(
            (item) => item.is_active !== false
          )
        );
        setDepartments(
          (Array.isArray(departmentResponse) ? departmentResponse : []).filter(
            (item) => item.is_active !== false
          )
        );
      } catch (error) {
        if (!cancelled) {
          setNotice({
            type: "error",
            text: error.message || "Could not load branches and departments.",
          });
          setBranches([]);
          setDepartments([]);
        }
      } finally {
        if (!cancelled) setMasterLoading(false);
      }
    }

    setRefreshedContacts(null);

    if (api.isBackendEnabled) {
      loadMasterData();
    } else {
      setBranches([]);
      setDepartments([]);
      setMasterLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [organization?.id]);

  const department = departments.find(
    (item) => String(item.id) === String(departmentId || "")
  );
  const departmentName = department?.name || departmentNameFromUrl;

  const departmentContacts = useMemo(() => {
    if (!departmentId) return [];

    return contacts.filter((contact) => {
      const contactDepartmentId = String(contact.department_id || "");
      const contactGroup = String(
        contact.group || contact.group_name || ""
      ).trim().toLowerCase();

      return (
        contactDepartmentId === String(departmentId) ||
        (departmentName.trim() &&
          contactGroup === departmentName.trim().toLowerCase())
      );
    });
  }, [contacts, departmentId, departmentName]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const normalizedQuery = q.replace(/\s/g, "");

    return departmentContacts.filter((contact) => {
      const name = String(contact.name || "").toLowerCase();
      const phone = String(contact.phone || "").replace(/\s/g, "");
      const email = String(contact.email || "").toLowerCase();

      return (
        !q ||
        name.includes(q) ||
        phone.includes(normalizedQuery) ||
        (!isHospital && email.includes(q))
      );
    });
  }, [departmentContacts, query, isHospital]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const availableDepartments = useMemo(() => {
    if (!selectedBranchId) return departments;
    return departments.filter(
      (item) => String(item.branch_id || "") === String(selectedBranchId)
    );
  }, [departments, selectedBranchId]);

  const availableImportDepartments = useMemo(() => {
    if (!importBranchId) return departments.filter((item) => !item.branch_id);
    return departments.filter(
      (item) => String(item.branch_id || "") === String(importBranchId)
    );
  }, [departments, importBranchId]);

  useEffect(() => {
    setPage(1);
  }, [departmentId, query]);

  async function refreshContacts() {
    const response = await api.getContacts();
    setRefreshedContacts(getContactArray(response));
  }

  function openEdit(contact) {
    const matchedDepartment = departments.find(
      (item) =>
        String(item.id) === String(contact.department_id || "") ||
        String(item.name || "").trim().toLowerCase() ===
          String(contact.group || contact.group_name || "")
            .trim()
            .toLowerCase()
    );

    setEditingContact(contact);
    setSelectedBranchId(
      String(contact.branch_id || matchedDepartment?.branch_id || "")
    );
    setSelectedDepartmentId(
      String(contact.department_id || matchedDepartment?.id || "")
    );
    setForm({
      name: contact.name || "",
      phone: contact.phone || "",
      email: contact.email || "",
      opted_in: contact.opted_in === true,
    });
  }

  function closeEdit() {
    if (busy) return;
    setEditingContact(null);
    setForm(emptyForm);
  }

  async function saveContact(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      setNotice({ type: "error", text: "Name and WhatsApp number are required." });
      return;
    }

    const selectedDepartment = departments.find(
      (item) => String(item.id) === String(selectedDepartmentId)
    );

    if (!selectedDepartment) {
      setNotice({ type: "error", text: "Please select a valid department." });
      return;
    }

    if (
      selectedBranchId &&
      String(selectedDepartment.branch_id || "") !== String(selectedBranchId)
    ) {
      setNotice({
        type: "error",
        text: "Choose a department that belongs to the selected branch.",
      });
      return;
    }

    const phone = validatePhone(form.phone);
    if (!phone) {
      setNotice({
        type: "error",
        text: "Enter a valid phone number, including the country code for international numbers.",
      });
      return;
    }

    setBusy(true);
    setNotice(null);

    const payload = {
      id: editingContact.id,
      name: form.name.trim(),
      phone,
      email: isHospital ? null : form.email.trim(),
      branch_id: selectedBranchId || null,
      department_id: selectedDepartment.id,
      group_name: selectedDepartment.name,
      opted_in: form.opted_in === true,
    };

    try {
      if (api.isBackendEnabled) {
        const result = await api.createContact(payload);
        const saved = result?.data ?? result;

        if (!saved?.id) {
          throw new Error("The server did not return the saved contact.");
        }

        setRefreshedContacts((previous) => {
          const source = previous ?? contacts;
          return [
            normalizeContact(saved),
            ...getContactArray(source).filter(
              (item) => String(item.id) !== String(saved.id)
            ),
          ];
        });
      } else {
        setRefreshedContacts((previous) => {
          const source = getContactArray(previous ?? contacts);
          return source.map((item) =>
            String(item.id) === String(editingContact.id)
              ? normalizeContact({
                  ...item,
                  ...payload,
                  group: selectedDepartment.name,
                  status: item.status || "Active",
                })
              : item
          );
        });
      }

      setNotice({ type: "success", text: "Contact updated successfully." });
      setEditingContact(null);
      setForm(emptyForm);
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Could not update contact.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeContact(contact) {
    if (!window.confirm(`Delete ${contact.name || "this contact"}?`)) return;

    try {
      if (api.isBackendEnabled) {
        await api.deleteContact(contact.id);
      }

      setRefreshedContacts((previous) =>
        getContactArray(previous ?? contacts).filter(
          (item) => String(item.id) !== String(contact.id)
        )
      );
      setNotice({ type: "success", text: "Contact deleted successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Could not delete contact.",
      });
    }
  }

  async function openMessageHistory(contact) {
    setSelectedContact(contact);
    setMessages([]);
    setMessagesError("");
    setMessagesLoading(true);

    try {
      if (!api.isBackendEnabled) {
        throw new Error("Connect the backend to view stored WhatsApp messages.");
      }

      const response = await api.request(
        `/contacts/${encodeURIComponent(contact.id)}/messages`
      );

      setMessages(
        Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.messages)
              ? response.messages
              : Array.isArray(response?.data?.messages)
                ? response.data.messages
                : []
      );
    } catch (error) {
      setMessagesError(error.message || "Could not load message history.");
    } finally {
      setMessagesLoading(false);
    }
  }

  function openImport() {
    setNotice(null);
    setImportError("");
    setImportBranchId(department?.branch_id || "");
    setImportDepartmentId(department?.id || departmentId || "");
    setShowImport(true);
  }

  function chooseImportFile() {
    if (!importDepartmentId) {
      setImportError("Please select a department first.");
      return;
    }

    setImportError("");
    setShowImport(false);
    fileRef.current?.click();
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const selectedDepartment = departments.find(
      (item) => String(item.id) === String(importDepartmentId)
    );

    if (!selectedDepartment) {
      setNotice({ type: "error", text: "Please select a valid department." });
      return;
    }

    if (
      importBranchId &&
      String(selectedDepartment.branch_id || "") !== String(importBranchId)
    ) {
      setNotice({
        type: "error",
        text: "The selected department does not belong to that branch.",
      });
      return;
    }

    if (!api.isBackendEnabled) {
      setNotice({
        type: "error",
        text: "Connect the backend before importing contacts.",
      });
      return;
    }

    setImporting(true);
    setNotice(null);

    try {
      const result = await api.importContacts(file, {
        branch_id: selectedDepartment.branch_id || null,
        department_id: selectedDepartment.id,
        group_name: selectedDepartment.name,
      });

      await refreshContacts();

      setNotice({
        type: "success",
        text:
          result?.message ||
          `Contacts imported for ${selectedDepartment.name}.`,
      });
      setPage(1);
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Failed to import contacts.",
      });
    } finally {
      setImporting(false);
    }
  }

  function exportContacts() {
    if (filtered.length === 0) {
      setNotice({ type: "error", text: "There are no contacts to export." });
      return;
    }

    const exportRows = filtered.map((contact) => ({
      Name: contact.name || "",
      Phone: contact.phone || "",
      Email: contact.email || "",
      Department: contact.group_name || contact.group || departmentName,
      Status: contact.status || "Active",
      "Phone Validation": contact.phone_valid ? "Valid" : "Not checked",
      "Opted In": contact.opted_in ? "Yes" : "No",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

    const safeName = (departmentName || "Department")
      .replace(/[\\/:*?"<>|]/g, "-")
      .trim();

    XLSX.writeFile(workbook, `${safeName}-contacts.xlsx`);
    setNotice({
      type: "success",
      text: `${filtered.length} contacts exported.`,
    });
  }

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (contact) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-wa to-brand-700 text-xs font-semibold text-white">
            {String(contact.name || "")
              .split(" ")
              .map((word) => word[0])
              .slice(0, 2)
              .join("")}
          </span>

          <div>
            <p className="font-medium text-slate-900">
              {contact.name || "Unnamed contact"}
            </p>

            {!isHospital && (
              <p className="text-xs text-slate-500">{contact.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "WhatsApp Number",
      render: (contact) => (
        <span className="whitespace-nowrap">{contact.phone || "—"}</span>
      ),
    },
    {
      key: "phone_valid",
      label: "Phone Validation",
      render: (contact) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            contact.phone_valid
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {contact.phone_valid ? "Format valid" : "Not checked"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (contact) => <StatusBadge status={contact.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (contact) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openMessageHistory(contact)}
            className="rounded p-1.5 text-brand-700 hover:bg-brand-50"
            aria-label={`Message history for ${contact.name}`}
            title="WhatsApp message history"
          >
            <MessageCircle size={16} />
          </button>

          <button
            type="button"
            onClick={() => openEdit(contact)}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
            aria-label={`Edit ${contact.name}`}
            title="Edit contact"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={() => removeContact(contact)}
            className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
            aria-label={`Delete ${contact.name}`}
            title="Delete contact"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const isBusy = loading || masterLoading;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleImportFile}
      />

      <PageHeader
        title={departmentName || "Department Contacts"}
        subtitle="Contacts assigned to this department"
        back={
          <div className="mb-2">
            <button
              type="button"
              onClick={() => navigate("/contacts")}
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900"
            >
              <ArrowLeft size={16} />
              All Contacts
            </button>
          </div>
        }
      >
        <button
          type="button"
          onClick={openImport}
          disabled={importing}
          className="btn-ghost disabled:opacity-50"
        >
          <Upload size={16} />
          {importing ? "Importing..." : "Import"}
        </button>

        <button type="button" onClick={exportContacts} className="btn-ghost">
          <Download size={16} />
          Export Excel
        </button>

        <button
          type="button"
          onClick={async () => {
            setNotice(null);
            try {
              await refreshContacts();
              setNotice({
                type: "success",
                text: "Contacts refreshed successfully.",
              });
            } catch (error) {
              setNotice({
                type: "error",
                text: error.message || "Could not refresh contacts.",
              });
            }
          }}
          className="btn-ghost"
          title="Refresh contacts"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </PageHeader>

      {notice && (
        <div
          role="status"
          className={`mb-4 flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${
            notice.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="mb-6 grid w-full grid-cols-1 gap-5 sm:grid-cols-3">
  <SummaryBox
    label="Department Contacts"
    value={departmentContacts.length}
    color="#8b5cf6"
  />

  <SummaryBox
    label="Active"
    value={departmentContacts.filter(
      (contact) => contact.status === "Active"
    ).length}
    color="#25d366"
  />

  <SummaryBox
    label="Inactive"
    value={departmentContacts.filter(
      (contact) => contact.status === "Inactive"
    ).length}
    color="#f59e0b"
  />
</div>

      <section className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isHospital
                  ? "Search by name or phone"
                  : "Search by name, phone or email"
              }
              className="input pl-9"
            />
          </div>

          <span className="text-sm text-slate-600">
            {filtered.length} contact{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {isBusy ? (
          <Loader />
        ) : !departmentId ? (
          <div className="px-4 py-12 text-center text-sm text-rose-700">
            No department was selected. Please open a department from the
            sidebar.
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              empty="No contacts found in this department."
            />

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
              <span>
                Showing{" "}
                {filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}
                –{Math.min(current * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                  className="btn-ghost px-3 py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>

                <span>
                  Page {current} of {pages}
                </span>

                <button
                  type="button"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                  className="btn-ghost px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Edit modal */}
      <Modal
        isOpen={Boolean(editingContact)}
        onClose={closeEdit}
        title="Edit Contact"
        footer={
          <>
            <button
              type="button"
              onClick={closeEdit}
              disabled={busy}
              className="btn-ghost"
            >
              Cancel
            </button>

            <button
              form="department-edit-contact-form"
              type="submit"
              disabled={busy}
              className="btn-primary disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save Contact"}
            </button>
          </>
        }
      >
        <form
          id="department-edit-contact-form"
          onSubmit={saveContact}
          className="space-y-3"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>

            <input
              className="input"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              WhatsApp number
            </label>

            <input
              className="input"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Indian 10-digit mobile numbers are saved with country code 91.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <label className="flex items-start gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={form.opted_in}
                onChange={(event) =>
                  setForm({ ...form, opted_in: event.target.checked })
                }
                className="mt-1"
              />

              <span>
                <span className="font-semibold">
                  WhatsApp consent confirmed
                </span>
                <span className="mt-1 block text-xs text-slate-600">
                  Select only if the contact has explicitly agreed to receive
                  WhatsApp messages.
                </span>
              </span>
            </label>
          </div>

          {!isHospital && (
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>

              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Branch (optional)
            </label>
            <select
              className="input"
              value={selectedBranchId}
              onChange={(event) => {
                setSelectedBranchId(event.target.value);
                setSelectedDepartmentId("");
              }}
            >
              <option value="">No branch / show all departments</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Department <span className="text-rose-600">*</span>
            </label>
            <select
              className="input"
              value={selectedDepartmentId}
              onChange={(event) => setSelectedDepartmentId(event.target.value)}
              required
            >
              <option value="">Select department</option>
              {availableDepartments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Import modal */}
      <Modal
        isOpen={showImport}
        onClose={() => {
          setShowImport(false);
          setImportError("");
        }}
        title="Choose Contact Department"
        footer={
          <>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowImport(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!importDepartmentId || importing}
              onClick={chooseImportFile}
            >
              Choose Excel File
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Select the department before choosing a spreadsheet. Imported
            contacts will be assigned to the selected department.
          </p>

          {branches.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Branch (optional)
              </label>
              <select
                className="input"
                value={importBranchId}
                onChange={(event) => {
                  const value = event.target.value;
                  setImportBranchId(value);

                  const nextDepartments = departments.filter((item) =>
                    value
                      ? String(item.branch_id || "") === String(value)
                      : !item.branch_id
                  );

                  setImportDepartmentId(
                    nextDepartments.some(
                      (item) => String(item.id) === String(importDepartmentId)
                    )
                      ? importDepartmentId
                      : nextDepartments[0]?.id || ""
                  );
                }}
              >
                <option value="">Standalone departments</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Department <span className="text-rose-600">*</span>
            </label>
            <select
              className="input"
              value={importDepartmentId}
              onChange={(event) => setImportDepartmentId(event.target.value)}
              required
            >
              <option value="">Select department</option>
              {availableImportDepartments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {importDepartmentId && (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              Group name:{" "}
              <strong>
                {
                  departments.find(
                    (item) => String(item.id) === String(importDepartmentId)
                  )?.name
                }
              </strong>
            </p>
          )}

          {importError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {importError}
            </p>
          )}
        </div>
      </Modal>

      <MessageHistoryModal
        contact={selectedContact}
        messages={messages}
        loading={messagesLoading}
        error={messagesError}
        onClose={() => {
          setSelectedContact(null);
          setMessages([]);
          setMessagesError("");
        }}
      />
    </>
  );
}