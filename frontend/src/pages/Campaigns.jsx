
import { useEffect, useMemo, useState } from "react";
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
  branch_id: "",
  department_id: "",
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

function getArray(response, key) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.[key])) return response[key];
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  return [];
}

function getQueuedCount(campaign) {
  const value = campaign.queued_count ?? campaign.queued;

  return value == null || !Number.isFinite(Number(value))
    ? 0
    : Number(value);
}

export default function Campaigns() {
  const { organization } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [action, setAction] = useState("draft");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setDataError("");

      try {
        if (!api.isBackendEnabled) {
          throw new Error(
            "Backend mode is disabled. Configure the backend before using campaigns."
          );
        }

        if (!organization?.id) {
          throw new Error(
            "Select a valid organization before continuing."
          );
        }

        const [
          branchRows,
          templates,
          contacts,
          campaignData,
          departmentRows,
        ] = await Promise.all([
          api.getBranches(),
          api.getTemplates(),
          api.getContacts(),
          api.getCampaigns(),
          api.getDepartments(),
        ]);

        if (cancelled) return;

        setBranches(
          getArray(branchRows, "branches").filter(
            (item) => item.is_active !== false
          )
        );

        setDepartments(
          getArray(departmentRows, "departments").filter(
            (item) => item.is_active !== false
          )
        );

        setAllTemplates(getArray(templates, "templates"));
        setAllContacts(getArray(contacts, "contacts"));
        setCampaigns(getArray(campaignData, "campaigns"));
      } catch (err) {
        if (!cancelled) {
          setDataError(
            err.message || "Could not load campaign data from the backend."
          );

          setBranches([]);
          setDepartments([]);
          setAllTemplates([]);
          setAllContacts([]);
          setCampaigns([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
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

  const approvedTemplates = useMemo(
    () =>
      allTemplates.filter(
        (template) =>
          String(template.status || "").toUpperCase() === "APPROVED"
      ),
    [allTemplates]
  );

  const selectedTemplate = approvedTemplates.find(
    (template) => template.name === form.template
  );

  const optedInContacts = useMemo(
    () => allContacts.filter((contact) => contact.opted_in === true),
    [allContacts]
  );

  const availableDepartments = useMemo(() => {
    if (!form.branch_id) return departments;

    return departments.filter(
      (department) =>
        String(department.branch_id || "") === String(form.branch_id)
    );
  }, [departments, form.branch_id]);

  const selectedDepartment = departments.find(
    (department) =>
      String(department.id) === String(form.department_id)
  );

  const normalizeGroupName = (value) =>
    String(value ?? "").trim().toLowerCase();

  const contactPhone = (contact) =>
    contact.phone_number ||
    contact.phone ||
    contact.whatsapp_number ||
    contact.mobile_number ||
    contact.mobile ||
    contact.wa_id ||
    contact.number ||
    "";

  const matchesSelectedAudience = (contact) => {
    if (
      form.branch_id &&
      String(contact.branch_id || "") !== String(form.branch_id)
    ) {
      return false;
    }

    if (!form.department_id || !selectedDepartment) return false;

    const contactDepartmentId = String(contact.department_id || "");
    const selectedDepartmentId = String(selectedDepartment.id);

    const selectedName = normalizeGroupName(selectedDepartment.name);

    const contactGroupName = normalizeGroupName(
      contact.group_name ||
        contact.group ||
        contact.department_name ||
        contact.department
    );

    return (
      contactDepartmentId === selectedDepartmentId ||
      contactGroupName === selectedName
    );
  };

  const recipients = optedInContacts.filter(matchesSelectedAudience);

  const update = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const selectBranch = (branchId) => {
    setForm((previous) => ({
      ...previous,
      branch_id: branchId,
      department_id: "",
      group: "All Contacts",
    }));
  };

  const selectDepartment = (departmentId) => {
    const department = departments.find(
      (item) => String(item.id) === String(departmentId)
    );

    setForm((previous) => ({
      ...previous,
      department_id: departmentId,
      group: department ? department.name : "All Contacts",
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

    if (!form.department_id) {
      setError("Please select a department.");
      return;
    }

    if (
      !availableDepartments.some(
        (department) =>
          String(department.id) === String(form.department_id)
      )
    ) {
      setError(
        "Please select a valid department for the selected branch."
      );
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
        "No opted-in contacts were found for this branch or department."
      );
      return;
    }

    setSubmitting(true);

    try {
      const contactsResponse = await api.getContacts();
      const backendContacts = getArray(contactsResponse, "contacts");

      const selectedName = normalizeGroupName(selectedDepartment?.name);

      const eligible = backendContacts.filter((contact) => {
        if (contact.opted_in !== true) return false;

        if (
          form.branch_id &&
          String(contact.branch_id || "") !== String(form.branch_id)
        ) {
          return false;
        }

        const contactDepartmentId = String(contact.department_id || "");

        const contactGroupName = normalizeGroupName(
          contact.group_name ||
            contact.group ||
            contact.department_name ||
            contact.department
        );

        return (
          contactDepartmentId === String(form.department_id) ||
          (selectedName && contactGroupName === selectedName)
        );
      });

      if (!eligible.length) {
        throw new Error(
          "No opted-in contacts found for this audience in the database."
        );
      }

      const created = await api.createCampaign({
        name: form.name.trim(),
        template_name: selectedTemplate.name,
        language: selectedTemplate.language || "en_US",
        group_name: form.group,
        branch_id: form.branch_id || null,
        department_id: form.department_id || null,
        scheduled_at:
          requestedAction === "schedule"
            ? new Date(form.scheduledAt).toISOString()
            : null,
        contact_ids: eligible.map((contact) => contact.id),
      });

      if (!created?.data?.id) {
        throw new Error("The backend did not return a campaign ID.");
      }

      let sendResult = null;

      if (requestedAction === "send") {
        sendResult = await api.sendCampaign(created.data.id);
      }

      const refreshedCampaigns = await api.getCampaigns();
      setCampaigns(getArray(refreshedCampaigns, "campaigns"));

      setModalOpen(false);
      setForm(initialForm);
      setAction("draft");

      if (requestedAction === "send") {
        const sent = Number(sendResult?.sent ?? 0);
        const failed = Number(sendResult?.failed ?? 0);
        const processed = Number(
          sendResult?.processed ?? sent + failed
        );

        if (sendResult?.hasMoreQueued) {
          setNotice(
            `This batch processed ${processed} recipient(s): ${sent} accepted by Meta and ${failed} failed. More recipients may still be queued.`
          );
        } else if (failed > 0) {
          setNotice(
            `Campaign processed: ${sent} message(s) accepted by Meta and ${failed} failed. Check backend message records for details.`
          );
        } else {
          setNotice(
            `${sent} message(s) accepted by Meta for processing. Delivery and read status depend on webhook updates.`
          );
        }
      } else if (requestedAction === "schedule") {
        setNotice(
          "Campaign schedule saved. Automatic sending requires a configured backend scheduler."
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
          <Plus size={17} />
          New Campaign
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
                  "Waiting",
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
                    colSpan={8}
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
                      {campaign.recipients ??
                        campaign.recipient_count ??
                        0}
                    </td>

                    <td className="px-4 py-3">
                      {campaign.sent ?? campaign.sent_count ?? 0}
                    </td>

                    <td className="px-4 py-3">
                      {getQueuedCount(campaign)}
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
                            campaign.scheduledAt ||
                              campaign.scheduled_at
                          ).toLocaleString("en-IN")
                        : "No"}
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
                  onChange={(event) =>
                    update("name", event.target.value)
                  }
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
                  onChange={(event) =>
                    update("template", event.target.value)
                  }
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
                      <Eye size={16} />
                      Message Preview
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {selectedTemplate.body ||
                        selectedTemplate.content ||
                        "Template body is not available."}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {selectedTemplate.category || "Template"} ·{" "}
                      {selectedTemplate.language ||
                        "Language not specified"}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Branch (Optional)
                </label>
                <select
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600"
                  value={form.branch_id}
                  onChange={(event) =>
                    selectBranch(event.target.value)
                  }
                >
                  <option value="">All branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Department <span className="text-rose-600">*</span>
                </label>
                <select
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-50"
                  value={form.department_id}
                  onChange={(event) =>
                    selectDepartment(event.target.value)
                  }
                  required
                >
                  <option value="">Select department</option>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>

                {form.branch_id &&
                  availableDepartments.length === 0 && (
                    <p className="mt-1 text-xs text-rose-600">
                      No active departments are available for this branch.
                    </p>
                  )}

                <div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
                  <Users className="text-emerald-800" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">
                      {recipients.length} opted-in recipient(s)
                    </p>
                    <p className="text-xs text-slate-600">
                      Matching the selected department and group name
                      {form.branch_id
                        ? " within the selected branch"
                        : " across all branches"}.
                    </p>
                  </div>
                </div>

                {form.department_id && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between bg-emerald-50 px-3 py-2">
                      <p className="text-sm font-semibold text-emerald-950">
                        Contacts included in this campaign
                      </p>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-800">
                        {recipients.length}
                      </span>
                    </div>

                    {recipients.length === 0 ? (
                      <p className="p-3 text-sm text-slate-600">
                        No opted-in contacts match this department/group.
                        Check that the contact's department or group matches
                        “{selectedDepartment?.name}” and that consent is
                        enabled.
                      </p>
                    ) : (
                      <div className="max-h-52 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="sticky top-0 bg-white text-xs text-slate-600">
                            <tr>
                              <th className="px-3 py-2 font-semibold">
                                Contact
                              </th>
                              <th className="px-3 py-2 font-semibold">
                                Phone number
                              </th>
                              <th className="px-3 py-2 font-semibold">
                                Group
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-emerald-50">
                            {recipients.map((contact, index) => (
                              <tr
                                key={
                                  contact.id ||
                                  `${contactPhone(contact)}-${index}`
                                }
                              >
                                <td className="px-3 py-2 text-slate-800">
                                  {contact.name ||
                                    contact.full_name ||
                                    "Unnamed contact"}
                                </td>

                                <td className="px-3 py-2 font-medium text-slate-800">
                                  {contactPhone(contact) ||
                                    "No phone number saved"}
                                </td>

                                <td className="px-3 py-2 text-slate-600">
                                  {contact.group_name ||
                                    contact.group ||
                                    contact.department_name ||
                                    selectedDepartment?.name ||
                                    "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
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
                Messages are submitted through your configured backend and
                Meta WhatsApp Cloud API. Scheduled campaigns require a
                working backend scheduler. Only send messages to contacts
                who have consented to receive them.
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
                  {submitting ? "Saving..." : "Save Draft"}
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
