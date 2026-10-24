import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, X, Layers3, Building2, Tag, Package, RotateCcw } from "lucide-react";
import { DEFAULT_MASTER_ITEMS } from "../data/dummyData";
import { useAuth } from "../hooks/useAuth";

const TYPES = [
  { id: "department", label: "Department / Service Point", icon: Layers3 },
  { id: "contactCategory", label: "Contact Category", icon: Tag },
  { id: "branch", label: "Branch", icon: Building2 },
  { id: "service", label: "Service / Product", icon: Package },
];
const defaultsFor = (type, organization) => {
  if (type === "department") return DEFAULT_MASTER_ITEMS[organization.type] || DEFAULT_MASTER_ITEMS.Business;
  if (type === "contactCategory") return ["General", "Existing Customer", "New Enquiry", "VIP"];
  if (type === "branch") return [organization.location || "Main Branch"];
  return organization.type === "Hospital" ? ["OPD Consultation", "Laboratory Test", "Health Checkup"] : organization.type === "School" ? ["Admission Enquiry", "Fee Reminder", "Parent Meeting"] : organization.type === "Hotel" ? ["Room Booking", "Dining", "Guest Service"] : ["Product Update", "Service Enquiry", "Special Offer"];
};
const keyFor = (orgId, type) => `wa_master_${orgId}_${type}`;
function readItems(org, type) {
  try {
    const stored = localStorage.getItem(keyFor(org.id, type));
    if (stored) return JSON.parse(stored);
  } catch { /* use demo defaults */ }
  return defaultsFor(type, org).map((name, index) => ({ id: `${type}-${index + 1}`, name, description: "", status: "Active" }));
}

export default function MasterManagement() {
  const { organization } = useAuth();
  const [type, setType] = useState("department");
  const [items, setItems] = useState(() => readItems(organization, "department"));
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setItems(readItems(organization, type));
    setQuery("");
    setNotice("");
  }, [organization.id, type]);

  const activeType = TYPES.find((item) => item.id === type);
  const filtered = useMemo(() => items.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const persist = (next) => {
    setItems(next);
    localStorage.setItem(keyFor(organization.id, type), JSON.stringify(next));
  };
  const openAdd = () => { setEditing(null); setForm({ name: "", description: "" }); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name, description: item.description || "" }); setModalOpen(true); };
  const save = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    if (items.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== editing?.id)) {
      setNotice("An entry with this name already exists.");
      return;
    }
    const next = editing
      ? items.map((item) => item.id === editing.id ? { ...item, name, description: form.description.trim() } : item)
      : [...items, { id: `${type}-${Date.now()}`, name, description: form.description.trim(), status: "Active" }];
    persist(next);
    setModalOpen(false);
    setNotice(`${activeType.label} ${editing ? "updated" : "added"} for ${organization.name}.`);
  };
  const toggleStatus = (item) => persist(items.map((entry) => entry.id === item.id ? { ...entry, status: entry.status === "Active" ? "Inactive" : "Active" } : entry));
  const remove = (item) => {
    if (!window.confirm(`Delete “${item.name}” from ${organization.name}?`)) return;
    persist(items.filter((entry) => entry.id !== item.id));
  };
  const reset = () => {
    if (!window.confirm(`Restore demo defaults for ${activeType.label.toLowerCase()} in ${organization.name}?`)) return;
    localStorage.removeItem(keyFor(organization.id, type));
    setItems(readItems(organization, type));
    setNotice("Demo defaults restored.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700"><Building2 size={14} /> Organization workspace</p>
          <h2 className="text-2xl font-bold text-brand-950">Master Management</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">Manage reusable lists for <strong className="text-brand-900">{organization.name}</strong>. Entries are stored separately in this browser for each organization.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={17} /> Add Entry</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TYPES.map(({ id, label, icon: Icon }) => {
          const active = type === id;
          return <button key={id} onClick={() => setType(id)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${active ? "border-brand-500 bg-brand-50 shadow-[0_0_0_2px_rgba(37,211,102,.14),0_0_20px_rgba(37,211,102,.18)]" : "border-brand-100 bg-white hover:border-brand-300"}`}>
            <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-800"}`}><Icon size={19} /></span>
            <span className="block text-sm font-semibold text-brand-950">{label}</span>
            <span className="mt-1 block text-xs text-slate-500">{active ? items.length : "Manage entries"} {active ? "entries" : ""}</span>
          </button>;
        })}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-brand-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><h3 className="font-semibold text-brand-950">{activeType.label}</h3><p className="mt-0.5 text-xs text-slate-500">{items.filter((item) => item.status === "Active").length} active · {items.length} total</p></div>
          <div className="flex flex-wrap gap-2">
            <label className="flex min-w-[190px] items-center gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2 focus-within:border-brand-500"><Search size={16} className="text-brand-700" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search entries..." className="w-full bg-transparent text-sm outline-none" /></label>
            <button onClick={reset} className="btn-ghost"><RotateCcw size={15} /> Reset demo</button>
          </div>
        </div>
        {notice && <div className="mx-4 mt-4 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900 sm:mx-5">{notice}</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-brand-50 text-xs uppercase tracking-wide text-brand-900"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map((item) => <tr key={item.id} className="transition hover:bg-brand-50/50"><td className="px-5 py-4 font-medium text-slate-800">{item.name}</td><td className="px-5 py-4 text-slate-600">{item.description || "—"}</td><td className="px-5 py-4"><button onClick={() => toggleStatus(item)} className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{item.status}</button></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(item)} title="Edit" className="rounded-lg p-2 text-brand-800 hover:bg-brand-100"><Pencil size={16} /></button><button onClick={() => remove(item)} title="Delete" className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div></td></tr>)}
              {!filtered.length && <tr><td colSpan="4" className="px-5 py-12 text-center text-sm text-slate-500">No entries found. Add a new entry to get started.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-brand-100 px-5 py-3 text-xs text-slate-500">Demo mode: changes are saved in this browser only. Backend authorization and PostgreSQL persistence are not connected yet.</div>
      </section>

      {modalOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true"><button aria-label="Close modal" onClick={() => setModalOpen(false)} className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm" /><form onSubmit={save} className="relative w-full max-w-md rounded-2xl border border-brand-200 bg-white p-5 shadow-[0_0_0_2px_rgba(37,211,102,.12),0_20px_70px_rgba(3,45,41,.3)] sm:p-6"><div className="mb-5 flex items-start justify-between"><div><h3 className="text-lg font-bold text-brand-950">{editing ? "Edit Entry" : "Add Entry"}</h3><p className="mt-1 text-xs text-slate-500">{activeType.label} · {organization.name}</p></div><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-50"><X size={18} /></button></div><label className="mb-4 block text-sm font-medium text-slate-700">Name <span className="text-rose-500">*</span><input autoFocus required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input mt-1.5" placeholder="Enter a name" /></label><label className="mb-5 block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span><textarea maxLength={240} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input mt-1.5 resize-y" placeholder="Short description" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button><button type="submit" className="btn-primary">{editing ? "Save Changes" : "Create Entry"}</button></div></form></div>}
    </div>
  );
}
