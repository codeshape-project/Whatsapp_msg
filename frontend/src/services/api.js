


import {
  getOrganizationData,
  getCurrentOrganization,
} from "../data/dummyData";

import { supabase, backendEnabled } from "../lib/supabase";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ================= DEMO HELPERS ================= */

const delay = (data, ms = 250) =>
  new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(data)), ms)
  );

const storageKey = (key, org) => `wa_data_${org.id}_${key}`;

const read = (key, fallback, org) => {
  try {
    const saved = localStorage.getItem(storageKey(key, org));

    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
};

const demoGet = (key, selector) => {
  const org = getCurrentOrganization();

  return delay(read(key, selector(getOrganizationData(org)), org));
};

/* ================= API REQUEST HELPER ================= */

async function request(path, options = {}) {
  const session = supabase
    ? (await supabase.auth.getSession()).data.session
    : null;

  if (!session?.access_token) {
    throw new Error(
      "Please sign in with your organization admin account to use the backend."
    );
  }

  const org = getCurrentOrganization();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,

    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),

      Authorization: `Bearer ${session.access_token}`,
      "x-organization-id": org.id,

      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body.error || `Request failed (${response.status})`
    );
  }

  return body;
}

/* ================= RESPONSE HELPERS ================= */

const unwrapArray = (response, keys = []) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }

    if (Array.isArray(response?.data?.[key])) {
      return response.data[key];
    }
  }

  return [];
};

/* ================= API METHODS ================= */

export const api = {
  baseUrl: BASE_URL,

  /* ---------- DASHBOARD ---------- */
// ---------- DASHBOARD ----------

getDashboardStats: async () =>
  (await request("/dashboard/stats")).data,

getMessageTrend: async () => {
  const response = await request("/dashboard/trend");

  return unwrapArray(response, ["trend"]).map((day) => ({
    day: day.date
      ? new Date(`${day.date}T00:00:00`).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        })
      : "—",
    value: Number(day.total) || 0,
    sent: Number(day.sent) || 0,
    delivered: Number(day.delivered) || 0,
    failed: Number(day.failed) || 0,
  }));
},

getRecentCampaigns: async () => {
  const response = await request("/dashboard/recent-campaigns");

  return unwrapArray(response, ["campaigns"]).map((campaign) => ({
    ...campaign,
    name: campaign.name ?? campaign.campaign_name ?? "Untitled Campaign",
    template: campaign.template_name ?? campaign.template ?? "—",
    recipients: Number(campaign.recipient_count) || 0,
    sent: Number(campaign.sent_count) || 0,
    failed: Number(campaign.failed_count) || 0,
    status: campaign.status
      ? campaign.status.charAt(0).toUpperCase() +
        campaign.status.slice(1).toLowerCase()
      : "—",
  }));
},

getRecentActivity: async () => {
  const response = await request("/dashboard/activity");

  return unwrapArray(response, ["activity"]).map((item) => ({
    id: item.id,
    type: item.status ?? item.type ?? "completed",
    text: item.title ?? item.text ?? "Message activity",
    sub: item.description ?? item.sub ?? "",
    time: item.created_at
      ? new Date(item.created_at).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
  }));
},

  /* ---------- BRANCHES ---------- */

  getBranches: async () => {
    const response = await request("/master/branches");

    return unwrapArray(response, ["branches"]);
  },

  createBranch: async (payload) =>
    request("/master/branches", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /* ---------- DEPARTMENTS ---------- */

  // No branchId: fetch all departments, including standalone departments.
  // With branchId: fetch departments belonging to that branch.
  getDepartments: async (branchId = null) => {
    const query = branchId
      ? `?branch_id=${encodeURIComponent(branchId)}`
      : "";

    const response = await request(`/master/departments${query}`);

    return unwrapArray(response, ["departments"]);
  },

  createDepartment: async (payload) =>
    request("/master/departments", {
      method: "POST",

      body: JSON.stringify({
        name: payload.name,
        description: payload.description || "",
        branch_id: payload.branch_id || null,
      }),
    }),

  /* ---------- CONTACTS ---------- */

  getContacts: async () => {
    const response = await request("/contacts?limit=250");

    return unwrapArray(response, ["contacts"]);
  },

  getContactGroups: async () => {
    const contacts = await api.getContacts();

    return [
      "All Contacts",
      ...new Set(
        contacts
          .map((contact) => contact.group_name || contact.group)
          .filter(Boolean)
      ),
    ];
  },

  createContact: (payload) =>
    request("/contacts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteContact: (id) =>
    request(`/contacts/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  // Import contacts with the selected branch and department.
  // The backend must save these fields to the database.
  importContacts: (file, metadata = {}) => {
    const body = new FormData();

    body.append("file", file);

    if (metadata.branch_id) {
      body.append("branch_id", metadata.branch_id);
    }

    if (metadata.department_id) {
      body.append("department_id", metadata.department_id);
    }

    if (metadata.group_name) {
      body.append("group_name", metadata.group_name);
    }

    return request("/contacts/import", {
      method: "POST",
      body,
    });
  },

  /* ---------- TEMPLATES ---------- */

  getTemplates: async () => {
    const response = await request("/templates");

    return unwrapArray(response, ["templates"]);
  },

  createTemplate: async (payload) => {
    const response = await request("/templates", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return response.data ?? response;
  },

  /* ---------- CAMPAIGNS ---------- */

  getCampaigns: async () => {
    const response = await request("/campaigns");

    return unwrapArray(response, ["campaigns"]).map((campaign) => ({
      ...campaign,
      template: campaign.template_name,
      recipients: campaign.recipient_count ?? 0,
      sent: campaign.sent_count ?? 0,
      delivered: campaign.delivered_count ?? 0,
      read: campaign.read_count ?? 0,
      failed: campaign.failed_count ?? 0,
      scheduledAt: campaign.scheduled_at,
    }));
  },

  createCampaign: (payload) =>
    request("/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  sendCampaign: (id) =>
    request(`/campaigns/${encodeURIComponent(id)}/send`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  /* ---------- SCHEDULED MESSAGES ---------- */

 getScheduledMessages: async () => {
  const response = await request("/campaigns");

  const campaigns = unwrapArray(response, ["campaigns"]);

  return campaigns
    .filter(
      (campaign) =>
        campaign.status === "scheduled" &&
        campaign.scheduled_at
    )
    .map((campaign) => {
      const scheduledDate = new Date(campaign.scheduled_at);

      return {
        ...campaign,
        campaign: campaign.name,
        template: campaign.template_name,
        recipients: campaign.recipient_count ?? 0,
        date: scheduledDate.toLocaleDateString("en-IN"),
        time: scheduledDate.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    });
},
cancelScheduledMessage: (id) =>
  request(`/campaigns/${encodeURIComponent(id)}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({}),
  }),
  /* ---------- REPORTS ---------- */

  getReports: async () =>
    backendEnabled
      ? (await request("/reports")).data
      : demoGet("reports", (data) => data.reportSummary),

  /* ---------- GENERIC HELPERS ---------- */

 
post: (path, payload = {}) =>
  request(path, {
    method: "POST",
    body:
      payload instanceof FormData
        ? payload
        : JSON.stringify(payload),
  }),


  request,

  isBackendEnabled: backendEnabled,
};

export default api;
