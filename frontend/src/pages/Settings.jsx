// ============================================================================
// SETTINGS PAGE – everything for this page lives in this one file
// ============================================================================
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

function PageHeader({ title, subtitle }) {
  return <div className="mb-6"><h2 className="text-2xl font-semibold text-brand-900">{title}</h2>{subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}</div>;
}

const defaultConnection = { phoneId: "", businessId: "" };
function settingsKey(orgId) { return `wa_settings_${orgId}`; }
function settingsFor(organization) {
  try {
    const saved = localStorage.getItem(settingsKey(organization.id));
    if (saved) { const parsed = JSON.parse(saved); delete parsed.token; return { organizationName: organization.name, location: organization.location, ...defaultConnection, ...parsed }; }
  } catch { /* use organization defaults */ }
  return { organizationName: organization.name, location: organization.location, ...defaultConnection };
}

export default function Settings() {
  const { organization } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(() => settingsFor(organization));

  useEffect(() => {
    setForm(settingsFor(organization));
    setSaved(false);
  }, [organization.id]);

  const submit = (e) => {
    e.preventDefault();
    try {
      const safeForm = { organizationName: form.organizationName, location: form.location, phoneId: form.phoneId, businessId: form.businessId };
      localStorage.setItem(settingsKey(organization.id), JSON.stringify(safeForm));
      window.dispatchEvent(new CustomEvent("organization-settings-updated", { detail: { organizationId: organization.id, settings: safeForm } }));
      setSaved(true);
    } catch { setSaved(false); }
  };

  const field = (key, label, type = "text") => (
    <div><label className="mb-1 block text-sm font-medium text-slate-700">{label}</label><input type={type} className="input" value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></div>
  );
  const profileLabel = organization.type === "Hospital" ? "Hospital" : organization.type === "School" ? "School" : organization.type === "Hotel" ? "Hotel" : "Business";

  return <>
    <PageHeader title="Settings" subtitle={`${organization.name} profile and WhatsApp Cloud API connection`} />
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2">
      <section className="card space-y-4 p-5"><h3 className="text-lg font-semibold text-brand-900">{profileLabel} profile</h3>{field("organizationName", `${profileLabel} name`)}{field("location", "Location")}</section>
      <section className="card space-y-4 p-5"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-brand-900">WhatsApp Cloud API</h3><span className="flex items-center gap-1.5 text-xs font-medium text-brand-700"><span className="h-2 w-2 rounded-full bg-wa shadow-[0_0_8px_#25d366]" /> Demo configuration</span></div>{field("phoneId", "Phone number ID")}{field("businessId", "Business account ID")}<p className="text-xs text-slate-500">Access tokens are managed securely in the backend environment file and are never stored in browser settings.</p></section>
      <div className="flex items-center gap-3 lg:col-span-2"><button type="submit" className="btn-primary">Save changes</button>{saved && <span className="text-sm text-brand-700">Changes saved successfully for {form.organizationName}.</span>}</div>
    </form>
  </>;
}
