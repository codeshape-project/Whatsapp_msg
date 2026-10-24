
// import { useEffect, useState } from "react";
// import { Plus, X, Send, CalendarClock, Save, Eye, Users } from "lucide-react";
// import useFetch from "../hooks/useFetch";
// import api from "../services/api";
// import { getOrganizationData } from "../data/dummyData";
// import { useAuth } from "../hooks/useAuth";

// const initialForm = {
//   name: "",
//   template: "",
//   group: "All Contacts",
//   scheduledAt: "",
// };

// function Button({ children, onClick, variant = "secondary", type = "button", disabled = false }) {
//   const styles = {
//     primary: "bg-emerald-700 text-white hover:bg-emerald-800",
//     secondary: "border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50",
//     schedule: "bg-blue-700 text-white hover:bg-blue-800",
//   };

//   return (
//     <button
//       type={type}
//       disabled={disabled}
//       onClick={onClick}
//       className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
//     >
//       {children}
//     </button>
//   );
// }

// export default function Campaigns() {
//   const { organization } = useAuth();
//   const organizationData = getOrganizationData(organization);
//   const allTemplates = organizationData.templates;
//   const contactGroups = organizationData.contactGroups;
//   const allContacts = organizationData.contacts;
//   const { data: campaigns, setData, loading } = useFetch(api.getCampaigns);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [form, setForm] = useState(initialForm);
//   const [action, setAction] = useState("draft");
//   const [notice, setNotice] = useState("");
//   const [error, setError] = useState("");

//   useEffect(() => {
//     setForm({ ...initialForm, template: "" });
//     setNotice(""); setError("");
//   }, [organization.id]);

//   const approvedTemplates = allTemplates.filter(
//     (template) => template.status === "Approved"
//   );

//   const selectedTemplate = approvedTemplates.find(
//     (template) => template.name === form.template
//   );

//   const activeContacts = allContacts.filter(
//     (contact) => contact.status === "Active"
//   );

//   const recipients = form.group === "All Contacts"
//     ? activeContacts
//     : activeContacts.filter((contact) => contact.group === form.group);

//   const update = (key, value) =>
//     setForm((previous) => ({ ...previous, [key]: value }));

//   const openModal = () => {
//     setForm({
//       ...initialForm,
//       template: approvedTemplates[0]?.name || "",
//     });
//     setAction("draft");
//     setError("");
//     setModalOpen(true);
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setError("");
//     setNotice("");

//     if (!form.name.trim()) {
//       setError("Please enter a campaign name.");
//       return;
//     }

//     if (!selectedTemplate) {
//       setError("Please select an approved template.");
//       return;
//     }

//     if (recipients.length === 0) {
//       setError("No active contacts found in this group.");
//       return;
//     }

//     if (action === "schedule") {
//       if (!form.scheduledAt) {
//         setError("Please select the date and time for scheduling.");
//         return;
//       }

//       if (new Date(form.scheduledAt).getTime() <= Date.now()) {
//         setError("Please select a future date and time.");
//         return;
//       }
//     }

//     if (api.isBackendEnabled) {
//       try {
//         const backendContacts = await api.getContacts();
//         const eligible = (backendContacts || []).filter(c => c.opted_in && (form.group === "All Contacts" || (c.group_name || c.group) === form.group));
//         if (!eligible.length) { setError("No opted-in contacts found for this group. Import contacts and record consent before sending."); return; }
//         const created = await api.createCampaign({ name: form.name.trim(), template_name: selectedTemplate.name, language: selectedTemplate.language || "en_US", group_name: form.group, scheduled_at: action === "schedule" ? new Date(form.scheduledAt).toISOString() : null, contact_ids: eligible.map(c => c.id) });
//         if (action === "send") await api.sendCampaign(created.data.id);
//         const campaign = { id: created.data.id, name: created.data.name, template: created.data.template_name, group: created.data.group_name, recipients: eligible.length, sent: action === "send" ? eligible.length : 0, delivered: 0, read: 0, failed: 0, status: action === "schedule" ? "Scheduled" : action === "send" ? "Running" : "Draft", scheduledAt: created.data.scheduled_at, date: new Date().toLocaleDateString("en-IN") };
//         setData(previous => [campaign, ...(previous || [])]); setModalOpen(false); setForm(initialForm);
//         setNotice(action === "send" ? "Campaign submitted to Meta. Delivery statuses update through the webhook." : action === "schedule" ? "Campaign saved with its schedule. Configure a server-side scheduler to send it automatically." : "Campaign saved as a draft.");
//       } catch (error) { setError(error.message || "Could not save the campaign."); }
//       return;
//     }

//     const status = action === "schedule"
//       ? "Scheduled"
//       : action === "send"
//         ? "Running"
//         : "Draft";

//     const campaign = {
//       id: Date.now(),
//       name: form.name.trim(),
//       template: selectedTemplate.name,
//       group: form.group,
//       recipients: recipients.length,
//       sent: 0,
//       delivered: 0,
//       read: 0,
//       failed: 0,
//       status,
//       scheduledAt: action === "schedule" ? form.scheduledAt : null,
//       date: new Date().toLocaleDateString("en-IN"),
//     };

//     // Demo mode only. Backend mode creates campaigns through the Express API.
//     setData((previous) => [campaign, ...(previous || [])]);
//     setModalOpen(false);
//     setForm(initialForm);

//     setNotice(
//       action === "send"
//         ? "Campaign created in demo mode. Real WhatsApp messages have not been sent."
//         : action === "schedule"
//           ? "Campaign saved as scheduled in demo mode. Automatic delivery requires a backend scheduler."
//           : "Campaign saved as a draft."
//     );
//   };

//   if (loading) {
//     return <div className="py-12 text-center text-emerald-800">Loading campaigns...</div>;
//   }

//   return (
//     <div className="space-y-5">
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div>
//           <h2 className="text-2xl font-bold text-emerald-950">Campaigns</h2>
//           <p className="mt-1 text-sm text-slate-600">
//             Create, send, schedule, and manage WhatsApp campaigns.
//           </p>
//         </div>

//         <Button variant="primary" onClick={openModal}>
//           <Plus size={17} /> New Campaign
//         </Button>
//       </div>

//       {notice && (
//         <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
//           <p>{notice}</p>
//           <button onClick={() => setNotice("")} aria-label="Dismiss">
//             <X size={17} />
//           </button>
//         </div>
//       )}

//       <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
//         <div className="border-b border-emerald-100 px-5 py-4">
//           <h3 className="font-semibold text-emerald-950">Campaign History</h3>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full min-w-[850px] text-left text-sm">
//             <thead className="bg-emerald-50 text-emerald-950">
//               <tr>
//                 {["Campaign", "Template", "Recipients", "Sent", "Delivered", "Read", "Failed", "Status", "Schedule"].map((heading) => (
//                   <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-emerald-50">
//               {(campaigns || []).length === 0 ? (
//                 <tr>
//                   <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
//                     No campaigns yet. Click New Campaign to begin.
//                   </td>
//                 </tr>
//               ) : (
//                 campaigns.map((campaign, index) => (
//                   <tr key={campaign.id || index} className="hover:bg-emerald-50/40">
//                     <td className="px-4 py-3 font-medium text-emerald-950">{campaign.name}</td>
//                     <td className="px-4 py-3">{campaign.template || "—"}</td>
//                     <td className="px-4 py-3">{campaign.recipients ?? 0}</td>
//                     <td className="px-4 py-3">{campaign.sent ?? 0}</td>
//                     <td className="px-4 py-3">{campaign.delivered ?? 0}</td>
//                     <td className="px-4 py-3">{campaign.read ?? 0}</td>
//                     <td className="px-4 py-3">{campaign.failed ?? 0}</td>
//                     <td className="px-4 py-3">
//                       <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
//                         {campaign.status || "Draft"}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-xs text-slate-600">
//                       {campaign.scheduledAt
//                         ? new Date(campaign.scheduledAt).toLocaleString("en-IN")
//                         : "—"}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {modalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
//           <div className="my-auto max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-emerald-100 bg-white shadow-2xl">
//             <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
//               <div>
//                 <h3 className="text-lg font-bold text-emerald-950">New Campaign</h3>
//                 <p className="text-xs text-slate-500">Configure your message and delivery time</p>
//               </div>
//               <button
//                 onClick={() => setModalOpen(false)}
//                 className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50"
//                 aria-label="Close"
//               >
//                 <X size={19} />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit} className="space-y-5 p-5">
//               <div>
//                 <label className="mb-1.5 block text-sm font-semibold text-slate-800">Campaign Name *</label>
//                 <input
//                   className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
//                   placeholder="e.g. Festival Offer"
//                   value={form.name}
//                   onChange={(e) => update("name", e.target.value)}
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="mb-1.5 block text-sm font-semibold text-slate-800">WhatsApp Template *</label>
//                 <select
//                   className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600"
//                   value={form.template}
//                   onChange={(e) => update("template", e.target.value)}
//                   required
//                 >
//                   <option value="">Choose approved template</option>
//                   {approvedTemplates.map((template) => (
//                     <option key={template.id || template.name} value={template.name}>
//                       {template.name}
//                     </option>
//                   ))}
//                 </select>

//                 {selectedTemplate && (
//                   <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
//                     <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-950">
//                       <Eye size={16} /> Message Preview
//                     </div>
//                     <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
//                       {selectedTemplate.body || selectedTemplate.content || "Template body is not available in demo data."}
//                     </p>
//                     <p className="mt-2 text-xs text-slate-500">
//                       {selectedTemplate.category || "Template"} · {selectedTemplate.language || "Language not specified"}
//                     </p>
//                   </div>
//                 )}
//               </div>

//               <div>
//                 <label className="mb-1.5 block text-sm font-semibold text-slate-800">Contact Group *</label>
//                 <select
//                   className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600"
//                   value={form.group}
//                   onChange={(e) => update("group", e.target.value)}
//                 >
//                   <option value="All Contacts">All Contacts</option>
//                   {contactGroups.map((group) => (
//                     <option key={group} value={group}>{group}</option>
//                   ))}
//                 </select>

//                 <div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
//                   <Users className="text-emerald-800" size={20} />
//                   <div>
//                     <p className="text-sm font-semibold text-emerald-950">
//                       {recipients.length} active recipient(s)
//                     </p>
//                     <p className="text-xs text-slate-500">Based on the selected group in demo data</p>
//                   </div>
//                 </div>
//               </div>

//               {action === "schedule" && (
//                 <div>
//                   <label className="mb-1.5 block text-sm font-semibold text-slate-800">Schedule Date & Time *</label>
//                   <input
//                     type="datetime-local"
//                     className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600"
//                     min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
//                     value={form.scheduledAt}
//                     onChange={(e) => update("scheduledAt", e.target.value)}
//                     required
//                   />
//                   <p className="mt-1 text-xs text-slate-500">
//                     Choose a future date and time.
//                   </p>
//                 </div>
//               )}

//               {error && (
//                 <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
//                   {error}
//                 </div>
//               )}

//               <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
//                 Demo mode: these buttons save campaign records only. Real sending and automatic scheduling require the backend, a scheduler, and Meta WhatsApp Cloud API configuration.
//               </div>

//               <div className="flex flex-wrap justify-end gap-2 border-t border-emerald-100 pt-4">
//                 <Button onClick={() => setModalOpen(false)}>
//                   Cancel
//                 </Button>

//                 <Button
//                   variant="secondary"
//                   onClick={() => {
//                     setAction("draft");
//                     document.getElementById("campaign-action-submit")?.click();
//                   }}
//                 >
//                   <Save size={16} /> Save Draft
//                 </Button>

//                 <Button
//                   variant="schedule"
//                   onClick={() => {
//                     setAction("schedule");
//                     if (!form.scheduledAt) {
//                       setError("Select a future date and time, then click Schedule Message again.");
//                       return;
//                     }
//                     document.getElementById("campaign-action-submit")?.click();
//                   }}
//                 >
//                   <CalendarClock size={16} /> Schedule Message
//                 </Button>

//                 <Button
//                   variant="primary"
//                   onClick={() => {
//                     setAction("send");
//                     document.getElementById("campaign-action-submit")?.click();
//                   }}
//                 >
//                   <Send size={16} /> Send Now
//                 </Button>
//               </div>

//               <button id="campaign-action-submit" type="submit" className="hidden">
//                 Submit
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



import { useEffect, useState } from "react";
import {
  Plus,
  X,
  Send,
  CalendarClock,
  Save,
  Eye,
  Users,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const initialForm = {
  name: "",
  template: "",
  group: "All Contacts",
  scheduledAt: "",
};

function Button({
  children,
  onClick,
  variant = "secondary",
  type = "button",
  disabled = false,
}) {
  const styles = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800",
    secondary:
      "border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50",
    schedule: "bg-blue-700 text-white hover:bg-blue-800",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export default function Campaigns() {
  const { organization } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [allContacts, setAllContacts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [action, setAction] = useState("draft");

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [dataError, setDataError] = useState("");

  // Load real templates, contacts and campaign history.
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setDataError("");

      try {
        if (!api.isBackendEnabled) {
          throw new Error(
            "Backend mode is disabled. Configure Supabase authentication and the backend before using real campaigns."
          );
        }

        if (!organization?.id) {
          throw new Error("Select a valid organization before continuing.");
        }

       const [templates, contacts, campaignData] = await Promise.all([
  api.getTemplates(),
  api.getContacts(),
  api.getCampaigns(),
]);

if (cancelled) return;

console.log("Templates loaded:", templates);
console.log("Contacts loaded:", contacts);
console.log("Campaigns loaded:", campaignData);

setAllTemplates(Array.isArray(templates) ? templates : []);
setAllContacts(Array.isArray(contacts) ? contacts : []);
setCampaigns(Array.isArray(campaignData) ? campaignData : []);
      } catch (err) {
        if (!cancelled) {
          setDataError(
            err.message || "Could not load campaign data from the backend."
          );
          setAllTemplates([]);
          setAllContacts([]);
          setCampaigns([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setForm(initialForm);
    setNotice("");
    setError("");

    loadData();

    return () => {
      cancelled = true;
    };
  }, [organization?.id]);

  const approvedTemplates = allTemplates.filter(
    (template) =>
      template.status === "Approved" ||
      template.status === "APPROVED"
  );

  const selectedTemplate = approvedTemplates.find(
    (template) => template.name === form.template
  );

  // Only contacts with recorded opt-in consent are eligible.
  const optedInContacts = allContacts.filter(
    (contact) => contact.opted_in === true
     
  );
  console.log("All contacts:", allContacts);
console.log("Total contacts:", allContacts.length);
console.log(
  "Opted-in contacts:",
  allContacts.filter((contact) => contact.opted_in === true).length
);

  const contactGroups = [
    ...new Set([
      "All Contacts",
      ...optedInContacts
        .map((contact) => contact.group_name || contact.group)
        .filter(Boolean),
    ]),
  ];

  const recipients =
    form.group === "All Contacts"
      ? optedInContacts
      : optedInContacts.filter(
          (contact) =>
            (contact.group_name || contact.group) === form.group
        );

  const update = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const openModal = () => {
    setForm({
      ...initialForm,
      template: approvedTemplates[0]?.name || "",
    });

    setAction("draft");
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setModalOpen(false);
    setForm(initialForm);
    setAction("draft");
    setError("");
  };

  // Pass the requested action directly to avoid stale React state.
  const submitCampaign = async (requestedAction) => {
    if (submitting) return;

    setError("");
    setNotice("");

    if (!api.isBackendEnabled) {
      setError("Backend mode is disabled. Real sending is unavailable.");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter a campaign name.");
      return;
    }

    if (!selectedTemplate) {
      setError("Please select an approved Meta template.");
      return;
    }

    if (requestedAction === "schedule") {
      if (!form.scheduledAt) {
        setAction("schedule");
        setError("Please select the date and time for scheduling.");
        return;
      }

      if (new Date(form.scheduledAt).getTime() <= Date.now()) {
        setAction("schedule");
        setError("Please select a future date and time.");
        return;
      }
    }

    if (!recipients.length) {
      setError(
        "No opted-in contacts were found in this group. Check your contact group and consent records."
      );
      return;
    }

    setSubmitting(true);

    try {
      // Refresh contacts before creating the campaign.
      const backendContacts = await api.getContacts();

      const eligible = (backendContacts || []).filter(
        (contact) =>
          contact.opted_in === true &&
          (requestedAction === "send" ||
            requestedAction === "draft" ||
            requestedAction === "schedule") &&
          (form.group === "All Contacts" ||
            (contact.group_name || contact.group) === form.group)
      );

      if (!eligible.length) {
        throw new Error(
          "No opted-in contacts found for this group in the database."
        );
      }

      const created = await api.createCampaign({
        name: form.name.trim(),
        template_name: selectedTemplate.name,
        language: selectedTemplate.language || "en_US",
        group_name: form.group,
        scheduled_at:
          requestedAction === "schedule"
            ? new Date(form.scheduledAt).toISOString()
            : null,
        contact_ids: eligible.map((contact) => contact.id),
      });

      if (!created?.data?.id) {
        throw new Error(
          "The backend did not return a campaign ID."
        );
      }

      let sendResult = null;

      if (requestedAction === "send") {
        sendResult = await api.sendCampaign(created.data.id);
      }

      // Always refresh from the database; do not guess message counts.
      const refreshedCampaigns = await api.getCampaigns();
      setCampaigns(
        Array.isArray(refreshedCampaigns) ? refreshedCampaigns : []
      );

      setModalOpen(false);
      setForm(initialForm);
      setAction("draft");

      if (requestedAction === "send") {
        const sent = Number(sendResult?.sent ?? 0);
        const failed = Number(sendResult?.failed ?? 0);
        const processed = Number(sendResult?.processed ?? sent + failed);
        const hasMore = Boolean(sendResult?.hasMoreQueued);

        if (hasMore) {
          setNotice(
            `This batch processed ${processed} recipient(s): ${sent} accepted by Meta and ${failed} failed. More recipients may still be queued.`
          );
        } else if (failed > 0) {
          setNotice(
            `Campaign processed: ${sent} message(s) accepted by Meta and ${failed} failed. Check the backend message records for failure details.`
          );
        } else {
          setNotice(
            `${sent} message(s) accepted by Meta for processing. Actual delivery and read status depend on webhook updates.`
          );
        }
      } else if (requestedAction === "schedule") {
        setNotice(
          "Campaign schedule saved to the database. Automatic sending requires a configured backend scheduler."
        );
      } else {
        setNotice("Campaign draft saved to the database.");
      }
    } catch (err) {
      setError(err.message || "Could not process the campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-emerald-800">
        Loading campaigns...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-emerald-950">
            Campaigns
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Create, send, schedule, and manage WhatsApp campaigns.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openModal}
          disabled={Boolean(dataError)}
        >
          <Plus size={17} /> New Campaign
        </Button>
      </div>

      {dataError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-semibold">Could not load campaign data</p>
          <p className="mt-1">{dataError}</p>
        </div>
      )}

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>{notice}</p>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100 px-5 py-4">
          <h3 className="font-semibold text-emerald-950">
            Campaign History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-emerald-50 text-emerald-950">
              <tr>
                {[
                  "Campaign",
                  "Template",
                  "Recipients",
                  "Sent",
                  "Delivered",
                  "Read",
                  "Failed",
                  "Status",
                  "Schedule",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-emerald-50">
              {campaigns.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No campaigns yet. Click New Campaign to begin.
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign, index) => (
                  <tr
                    key={campaign.id || index}
                    className="hover:bg-emerald-50/40"
                  >
                    <td className="px-4 py-3 font-medium text-emerald-950">
                      {campaign.name}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.template || campaign.template_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.recipients ?? campaign.recipient_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.sent ?? campaign.sent_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.delivered ?? campaign.delivered_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.read ?? campaign.read_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.failed ?? campaign.failed_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        {campaign.status || "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {campaign.scheduledAt || campaign.scheduled_at
                        ? new Date(
                            campaign.scheduledAt || campaign.scheduled_at
                          ).toLocaleString("en-IN")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="my-auto max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-emerald-950">
                  New Campaign
                </h3>
                <p className="text-xs text-slate-500">
                  Configure your message and delivery time
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 disabled:opacity-50"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitCampaign(action);
              }}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Campaign Name *
                </label>
                <input
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  placeholder="e.g. Festival Offer"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  WhatsApp Template *
                </label>
                <select
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600"
                  value={form.template}
                  onChange={(event) => update("template", event.target.value)}
                  required
                >
                  <option value="">Choose approved template</option>
                  {approvedTemplates.map((template) => (
                    <option
                      key={template.id || template.name}
                      value={template.name}
                    >
                      {template.name}
                    </option>
                  ))}
                </select>

                {selectedTemplate && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-950">
                      <Eye size={16} /> Message Preview
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {selectedTemplate.body ||
                        selectedTemplate.content ||
                        "Template body is not available."}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {selectedTemplate.category || "Template"} ·{" "}
                      {selectedTemplate.language || "Language not specified"}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Contact Group *
                </label>
                <select
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600"
                  value={form.group}
                  onChange={(event) => update("group", event.target.value)}
                >
                  {contactGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>

                <div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
                  <Users className="text-emerald-800" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">
                      {recipients.length} opted-in recipient(s)
                    </p>
                    <p className="text-xs text-slate-500">
                      Based on contacts loaded from your backend
                    </p>
                  </div>
                </div>
              </div>

              {action === "schedule" && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                    Schedule Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600"
                    min={new Date(
                      Date.now() - new Date().getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16)}
                    value={form.scheduledAt}
                    onChange={(event) =>
                      update("scheduledAt", event.target.value)
                    }
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Choose a future date and time.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  {error}
                </div>
              )}

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                Messages are submitted through your configured backend and Meta
                WhatsApp Cloud API. Scheduled campaigns require a working
                backend scheduler. Only send messages to contacts who have
                consented to receive them.
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-emerald-100 pt-4">
                <Button onClick={closeModal} disabled={submitting}>
                  Cancel
                </Button>

                <Button
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => submitCampaign("draft")}
                >
                  <Save size={16} />
                  {submitting && action === "draft"
                    ? "Saving..."
                    : "Save Draft"}
                </Button>

                <Button
                  variant="schedule"
                  disabled={submitting}
                  onClick={() => {
                    setAction("schedule");

                    if (!form.scheduledAt) {
                      setError("Select a future date and time.");
                      return;
                    }

                    submitCampaign("schedule");
                  }}
                >
                  <CalendarClock size={16} />
                  Schedule Message
                </Button>

                <Button
                  variant="primary"
                  disabled={submitting}
                  onClick={() => submitCampaign("send")}
                >
                  <Send size={16} />
                  {submitting ? "Processing..." : "Send Now"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
