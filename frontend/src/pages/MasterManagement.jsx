
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

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold text-brand-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
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

function SummaryBox({ label, value, color, description, icon: Icon, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 text-left transition duration-200 hover:-translate-y-1 ${
        active ? "ring-2 ring-offset-2" : ""
      }`}
      style={{
        border: `1.5px solid ${color}`,
        background: `linear-gradient(135deg, ${color}20 0%, #ffffff 72%)`,
        boxShadow: `0 0 0 3px ${color}12, 0 0 20px ${color}30`,
        "--tw-ring-color": color,
      }}
    >
      <div
        className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full blur-2xl"
        style={{ background: `${color}22` }}
      />
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-600">
            {description}
          </p>
        </div>
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 14px ${color}45`,
          }}
        >
          <Icon size={21} />
        </span>
      </div>
    </button>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Feedback({ message, type = "success", onClose }) {
  if (!message) return null;

  const isError = type === "error";

  return (
    <div
      role="status"
      className={`mb-4 flex items-start gap-3 rounded-xl border p-3 text-sm ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      {isError ? (
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      )}
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 hover:bg-black/5"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

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
      const branchResponse = await api.getBranches();
      const branchList = Array.isArray(branchResponse)
        ? branchResponse
        : Array.isArray(branchResponse?.data)
          ? branchResponse.data
          : Array.isArray(branchResponse?.branches)
            ? branchResponse.branches
            : [];

      const departmentResults = await Promise.all([
        api.getDepartments(),
        ...branchList.map((branch) => api.getDepartments(branch.id)),
      ]);

      const allDepartments = departmentResults.flatMap((result) => {
        if (Array.isArray(result)) return result;
        if (Array.isArray(result?.data)) return result.data;
        if (Array.isArray(result?.departments)) return result.departments;
        return [];
      });

      const uniqueDepartments = [
        ...new Map(
          allDepartments
            .filter((department) => department?.id != null)
            .map((department) => [String(department.id), department])
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
    setFormBranch(selectedBranch === "__independent__" ? "" : selectedBranch);
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError("");
  };

  const selectType = (nextType) => {
    setType(nextType);
    setSelectedBranch("");
    setQuery("");
    setError("");
    setNotice("");
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
        await api.createBranch({ name: name.trim() });
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
    String(item.name || "").toLowerCase().includes(normalizedQuery)
  );

  const filteredDepartments = departments.filter((item) => {
    const matchesSearch = String(item.name || "")
      .toLowerCase()
      .includes(normalizedQuery);

    if (!matchesSearch) return false;

    if (selectedBranch === "__independent__") {
      return item.branch_id == null;
    }

    if (selectedBranch) {
      return String(item.branch_id || "") === String(selectedBranch);
    }

    return true;
  });

  const records =
    type === "branch" ? filteredBranches : filteredDepartments;

  const activeCount = records.filter(
    (item) => item.is_active !== false
  ).length;

  const selectedBranchName =
    branches.find(
      (branch) => String(branch.id) === String(selectedBranch)
    )?.name || "";

  return (
    <div className="relative space-y-6 pb-8">
      {/* Page header */}
      <PageHeader
        title="Master Management"
        subtitle="Manage your organization's branches and departments."
      >
        <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-brand-900">
          <Building2 size={16} className="text-emerald-700" />
          {organization?.name || "Your Organization"}
        </span>

        <button
          type="button"
          onClick={openAdd}
          className="btn-primary"
        >
          <Plus size={16} />
          Add {type === "branch" ? "Branch" : "Department"}
        </button>
      </PageHeader>

      <Feedback
        message={notice}
        onClose={() => setNotice("")}
      />

      {!modalOpen && (
        <Feedback
          message={error}
          type="error"
          onClose={() => setError("")}
        />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryBox
          label="Total Branches"
          value={branches.length}
          description="Manage your locations"
          color="#8b5cf6"
          icon={GitBranch}
          active={type === "branch"}
          onClick={() => selectType("branch")}
        />

        <SummaryBox
          label="Total Departments"
          value={departments.length}
          description="Manage your teams"
          color="#25a875"
          icon={Layers3}
          active={type === "department"}
          onClick={() => selectType("department")}
        />

        <SummaryBox
          label={`Active ${type === "branch" ? "Branches" : "Departments"}`}
          value={activeCount}
          description="Currently active in this view"
          color="#0ea5e9"
          icon={CheckCircle2}
          active={false}
        />
      </div>

      {/* Records panel */}
      <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-brand-50 via-white to-emerald-50 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700 shadow-sm">
                {type === "branch" ? (
                  <GitBranch size={20} />
                ) : (
                  <Layers3 size={20} />
                )}
              </span>

              <div>
                <h3 className="text-lg font-semibold text-brand-900">
                  {type === "branch" ? "Branches" : "Departments"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  {records.length} {records.length === 1 ? "record" : "records"}
                  {selectedBranchName ? ` · ${selectedBranchName}` : ""}
                  {selectedBranch === "__independent__"
                    ? " · Standalone departments"
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {type === "department" && (
                <select
                  className="input w-full sm:w-auto sm:min-w-[190px]"
                  value={selectedBranch}
                  onChange={(event) => setSelectedBranch(event.target.value)}
                >
                  <option value="">All departments</option>
                  <option value="__independent__">
                    Standalone departments
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}

              <label className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 sm:min-w-[220px]">
                <Search size={16} className="shrink-0 text-emerald-700" />
                <input
                  className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${type === "branch" ? "branches" : "departments"}...`}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>

              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
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
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
              <RefreshCw size={20} className="animate-spin" />
            </span>
            <p className="text-sm text-slate-600">Loading records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              {type === "branch" ? (
                <GitBranch size={25} />
              ) : (
                <Layers3 size={25} />
              )}
            </span>

            <h4 className="text-base font-semibold text-brand-900">
              {query
                ? "No matching records"
                : `No ${type === "branch" ? "branches" : "departments"} yet`}
            </h4>

            <p className="mt-1 text-sm text-slate-600">
              {query
                ? "Try changing your search or filter."
                : "Add your first record to get started."}
            </p>

            {!query && (
              <button
                type="button"
                onClick={openAdd}
                className="btn-primary mt-4"
              >
                <Plus size={16} />
                Add {type === "branch" ? "Branch" : "Department"}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="bg-brand-50 text-xs font-semibold text-brand-900">
                  <th className="px-4 py-3.5">Name</th>
                  {type === "department" && (
                    <th className="px-4 py-3.5">Branch</th>
                  )}
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {records.map((item) => {
                  const branch = branches.find(
                    (entry) =>
                      String(entry.id) === String(item.branch_id || "")
                  );

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-brand-50/60"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              type === "branch"
                                ? "bg-violet-50 text-violet-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {type === "branch" ? (
                              <GitBranch size={18} />
                            ) : (
                              <Layers3 size={18} />
                            )}
                          </span>
                          <span className="font-medium text-slate-900">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {type === "department" && (
                        <td className="px-4 py-3.5 text-slate-700">
                          {branch?.name || (
                            <span className="text-slate-500">
                              Standalone
                            </span>
                          )}
                        </td>
                      )}

                      <td className="px-4 py-3.5">
                        <StatusBadge active={item.is_active !== false} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="master-modal-title"
        >
          <button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 bg-slate-950/50"
            onClick={closeModal}
          />

          <form
            onSubmit={save}
            className="relative my-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-brand-50 via-white to-emerald-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  {type === "branch" ? (
                    <GitBranch size={20} />
                  ) : (
                    <Layers3 size={20} />
                  )}
                </span>
                <div>
                  <h3
                    id="master-modal-title"
                    className="text-lg font-semibold text-brand-900"
                  >
                    Add {type === "branch" ? "Branch" : "Department"}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {organization?.name || "Your Organization"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <label className="block text-sm font-medium text-slate-800">
                {type === "branch" ? "Branch Name" : "Department Name"}
                <span className="ml-1 text-rose-600">*</span>
                <input
                  autoFocus
                  required
                  maxLength={80}
                  className="input mt-1.5"
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
                <label className="block text-sm font-medium text-slate-800">
                  Assign Branch
                  <select
                    className="input mt-1.5"
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
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn-ghost justify-center"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
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
