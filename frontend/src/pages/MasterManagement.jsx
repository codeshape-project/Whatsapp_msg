
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Building2,
  Layers3,
  RefreshCw,
  X,
  GitBranch,
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
  const [description, setDescription] = useState("");
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

    // Remove duplicates in case the API returns all departments
    // even when a branch ID is supplied.
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
    setDescription("");
    setFormBranch(selectedBranch || "");
    setNotice("");
    setError("");
    setModalOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Enter a name.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (type === "branch") {
        await api.createBranch({
          name: name.trim(),
          description: description.trim(),
        });
      } else {
        await api.createDepartment({
          name: name.trim(),
          description: description.trim(),
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

  const filteredBranches = branches.filter((item) =>
    `${item.name} ${item.description || ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const filteredDepartments = departments.filter((item) => {
    const matchesSearch = `${item.name} ${item.description || ""}`
      .toLowerCase()
      .includes(query.toLowerCase());

    return matchesSearch;
  });

  const activeDepartments = selectedBranch
    ? filteredDepartments.filter(
        (item) => item.branch_id === selectedBranch
      )
    : filteredDepartments;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            <Building2 size={14} /> Organization workspace
          </p>

          <h2 className="text-2xl font-bold text-brand-950">
            Master Management
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Manage branches and departments for{" "}
            <strong>{organization.name}</strong>.
          </p>
        </div>

        <button onClick={openAdd} className="btn-primary">
          <Plus size={17} /> Add{" "}
          {type === "branch" ? "Branch" : "Department"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => {
            setType("branch");
            setQuery("");
            setError("");
          }}
          className={`rounded-2xl border p-4 text-left transition ${
            type === "branch"
              ? "border-brand-500 bg-brand-50 shadow-sm"
              : "border-brand-100 bg-white hover:border-brand-300"
          }`}
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
            <GitBranch size={19} />
          </span>
          <span className="block font-semibold text-brand-950">
            Branches
          </span>
          <span className="mt-1 text-xs text-slate-500">
            {branches.length} branches
          </span>
        </button>

        <button
          onClick={() => {
            setType("department");
            setQuery("");
            setError("");
          }}
          className={`rounded-2xl border p-4 text-left transition ${
            type === "department"
              ? "border-brand-500 bg-brand-50 shadow-sm"
              : "border-brand-100 bg-white hover:border-brand-300"
          }`}
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
            <Layers3 size={19} />
          </span>
          <span className="block font-semibold text-brand-950">
            Departments
          </span>
          <span className="mt-1 text-xs text-slate-500">
            {departments.length} departments
          </span>
        </button>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-brand-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-brand-950">
              {type === "branch" ? "Branches" : "Departments"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Loaded from your database
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {type === "department" && branches.length > 0 && (
              <select
                className="input"
                value={selectedBranch}
                onChange={(event) => setSelectedBranch(event.target.value)}
              >
                <option value="">All Departments</option>
                <option value="__independent__">
                  Departments without a branch
                </option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}

            <label className="flex min-w-[180px] items-center gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2">
              <Search size={16} />
              <input
                className="w-full bg-transparent text-sm outline-none"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
              />
            </label>

            <button onClick={loadData} className="btn-ghost">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-brand-50 text-xs uppercase text-brand-900">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-50">
                {(type === "branch"
                  ? filteredBranches
                  : activeDepartments.filter((item) => {
                      if (selectedBranch === "__independent__") {
                        return item.branch_id == null;
                      }

                      if (selectedBranch) {
                        return item.branch_id === selectedBranch;
                      }

                      return true;
                    })
                ).map((item) => {
                  const branch = branches.find(
                    (entry) => entry.id === item.branch_id
                  );

                  return (
                    <tr key={item.id} className="hover:bg-brand-50/50">
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {item.name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {type === "branch"
                          ? "—"
                          : branch?.name || "No branch"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.description || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                          {item.is_active === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!(
                  type === "branch"
                    ? filteredBranches.length
                    : activeDepartments.filter((item) => {
                        if (selectedBranch === "__independent__") {
                          return item.branch_id == null;
                        }
                        if (selectedBranch) {
                          return item.branch_id === selectedBranch;
                        }
                        return true;
                      }).length
                ) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No records found. Use Add to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setModalOpen(false)}
          />

          <form
            onSubmit={save}
            className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-brand-950">
                Add {type === "branch" ? "Branch" : "Department"}
              </h3>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Name *
              <input
                autoFocus
                required
                maxLength={80}
                className="input mt-1.5"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  type === "branch" ? "Enter branch name" : "Enter department name"
                }
              />
            </label>

            {type === "department" && branches.length > 0 && (
              <label className="block text-sm font-medium text-slate-700">
                Branch (optional)
                <select
                  className="input mt-1.5"
                  value={formBranch}
                  onChange={(event) => setFormBranch(event.target.value)}
                >
                  <option value="">No branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea
                className="input mt-1.5 min-h-20"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional description"
              />
            </label>

            {error && (
              <p className="text-sm text-rose-600">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>

              <button
                disabled={saving}
                className="btn-primary disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
