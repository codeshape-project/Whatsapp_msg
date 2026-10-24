// import { getOrganizationData, getCurrentOrganization } from "../data/dummyData";
// import { supabase, backendEnabled } from "../lib/supabase";
// const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// const delay = (data, ms = 250) => new Promise(resolve => setTimeout(() => resolve(structuredClone(data)), ms));
// const storageKey = (key, org) => `wa_data_${org.id}_${key}`;
// const read = (key, fallback, org) => { try { const saved=localStorage.getItem(storageKey(key,org)); return saved===null?fallback:JSON.parse(saved); } catch { return fallback; } };
// const demoGet = (key,selector) => { const org=getCurrentOrganization(); return delay(read(key,selector(getOrganizationData(org)),org)); };
// async function request(path, options={}) {
//   const session = supabase ? (await supabase.auth.getSession()).data.session : null;
//   if (!session?.access_token) throw new Error('Please sign in with your organization admin account to use the backend.');
//   const org=getCurrentOrganization();
//   const response=await fetch(`${BASE_URL}${path}`,{...options,headers:{...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),Authorization:`Bearer ${session.access_token}`,'x-organization-id':org.id,...options.headers}});
//   const body=await response.json().catch(()=>({}));
//   if(!response.ok) throw new Error(body.error||`Request failed (${response.status})`);
//   return body;
// }
// export const api = {
//   baseUrl:BASE_URL,
// getDashboardStats: async () =>
//   (await request('/dashboard/stats')).data,

// getMessageTrend: async () =>
//   (await request('/dashboard/trend')).data,

// getRecentCampaigns: async () =>
//   (await request('/dashboard/recent-campaigns')).data,

// getRecentActivity: async () =>
//   (await request('/dashboard/activity')).data,
//   getContacts: async () => {
//   const response = await request("/contacts?limit=250");
//   return Array.isArray(response.data) ? response.data : [];
// },
//  getContactGroups: async () => {
//   const contacts = await api.getContacts();

//   return [
//     "All Contacts",
//     ...new Set(
//       (contacts || [])
//         .map((contact) => contact.group_name || contact.group)
//         .filter(Boolean)
//     ),
//   ];
// },

// getTemplates: async () => {
//   const response = await request('/templates');
//   return Array.isArray(response.data) ? response.data : [];
// },
//   getCampaigns: async () => {
//   const response = await request("/campaigns");

//   return (Array.isArray(response.data) ? response.data : []).map((c) => ({
//     ...c,
//     template: c.template_name,
//     recipients: c.recipient_count ?? 0,
//     sent: c.sent_count ?? 0,
//     delivered: c.delivered_count ?? 0,
//     read: c.read_count ?? 0,
//     failed: c.failed_count ?? 0,
//     scheduledAt: c.scheduled_at,
//   }));
// },
//   getScheduledMessages: async () => {
//   const response = await request("/scheduled-messages");
//   return Array.isArray(response.data) ? response.data : [];
// },
  
//   getReports:async()=>backendEnabled?(await request('/reports')).data:demoGet('reports',d=>d.reportSummary),
//   createContact:(payload)=>request('/contacts',{method:'POST',body:JSON.stringify(payload)}),
//   deleteContact:(id)=>request(`/contacts/${encodeURIComponent(id)}`,{method:'DELETE'}),
//   importContacts:(file)=>{const body=new FormData();body.append('file',file);return request('/contacts/import',{method:'POST',body});},
//   createCampaign:(payload)=>request('/campaigns',{method:'POST',body:JSON.stringify(payload)}),
//   sendCampaign:(id)=>request(`/campaigns/${encodeURIComponent(id)}/send`,{method:'POST',body:JSON.stringify({})}),
//   request,
//   isBackendEnabled:backendEnabled,
// };
// export default api;



import { getOrganizationData, getCurrentOrganization } from "../data/dummyData";
import { supabase, backendEnabled } from "../lib/supabase";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

export const api = {
  baseUrl: BASE_URL,

  getDashboardStats: async () =>
    (await request("/dashboard/stats")).data,

  getMessageTrend: async () =>
    (await request("/dashboard/trend")).data,

  getRecentCampaigns: async () =>
    (await request("/dashboard/recent-campaigns")).data,

  getRecentActivity: async () =>
    (await request("/dashboard/activity")).data,
  
  // Fetch branches created in Master Management.
  getBranches: async () => {
  const response = await request("/master/branches");
  return response.data;
},

getDepartments: async (branchId = null) => {
  const query = branchId
    ? `?branch_id=${encodeURIComponent(branchId)}`
    : "";

  return request(`/master/departments${query}`);
},

  // Create a branch.
  createBranch: async (payload) => {
    return request("/master/branches", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Create a department, optionally under a branch.
  createDepartment: async (payload) => {
    return request("/master/departments", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        description: payload.description || "",
        branch_id: payload.branch_id || null,
      }),
    });
  },

  getContacts: async () => {
    const response = await request("/contacts?limit=250");
    return Array.isArray(response.data) ? response.data : [];
  },

  getContactGroups: async () => {
    const contacts = await api.getContacts();

    return [
      "All Contacts",
      ...new Set(
        (contacts || [])
          .map((contact) => contact.group_name || contact.group)
          .filter(Boolean)
      ),
    ];
  },

  // Fetch templates and their actual statuses from the backend/Meta.
  getTemplates: async () => {
    const response = await request("/templates");
    return Array.isArray(response.data) ? response.data : [];
  },

  // Submit a new template to Meta for approval.
  createTemplate: async (payload) => {
    const response = await request("/templates", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return response.data;
  },

  getCampaigns: async () => {
    const response = await request("/campaigns");

    return (Array.isArray(response.data) ? response.data : []).map(
      (c) => ({
        ...c,
        template: c.template_name,
        recipients: c.recipient_count ?? 0,
        sent: c.sent_count ?? 0,
        delivered: c.delivered_count ?? 0,
        read: c.read_count ?? 0,
        failed: c.failed_count ?? 0,
        scheduledAt: c.scheduled_at,
      })
    );
  },

  getScheduledMessages: async () => {
    const response = await request("/scheduled-messages");
    return Array.isArray(response.data) ? response.data : [];
  },

  getReports: async () =>
    backendEnabled
      ? (await request("/reports")).data
      : demoGet("reports", (d) => d.reportSummary),

  createContact: (payload) =>
    request("/contacts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteContact: (id) =>
    request(`/contacts/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  importContacts: (file) => {
    const body = new FormData();
    body.append("file", file);

    return request("/contacts/import", {
      method: "POST",
      body,
    });
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

  // Add this method for POST requests
  post: (path, payload = {}) =>
    request(path, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  request,
  isBackendEnabled: backendEnabled,
};


export default api;
