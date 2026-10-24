import { useEffect, useState } from "react";

function currentOrganizationId() {
  try { return JSON.parse(localStorage.getItem("cs_user") || "null")?.organizationId || "codeshape-hospital"; }
  catch { return "codeshape-hospital"; }
}
function keyFor(fetcher) {
  const names = {
    getDashboardStats: "dashboardStats", getMessageTrend: "messageTrend",
    getRecentCampaigns: "recentCampaigns", getRecentActivity: "recentActivity",
    getContacts: "contacts", getContactGroups: "contactGroups", getTemplates: "templates",
    getCampaigns: "campaigns", getScheduledMessages: "scheduledMessages", getReports: "reports",
  };
  return names[fetcher?.name] || null;
}

// Reloads on organization switch and persists edits independently for each organization.
export default function useFetch(fetcher) {
  const [data, setDataState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dataKey = keyFor(fetcher);

  const setData = (update) => {
    setDataState((previous) => {
      const next = typeof update === "function" ? update(previous) : update;
      if (dataKey && next !== undefined && next !== null) {
        try { localStorage.setItem(`wa_data_${currentOrganizationId()}_${dataKey}`, JSON.stringify(next)); } catch { /* browser storage is optional */ }
      }
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    const load = () => {
      setLoading(true);
      setError(null);
      fetcher().then((result) => {
        if (active) setDataState(result);
      }).catch((err) => {
        if (active) setError(err);
      }).finally(() => { if (active) setLoading(false); });
    };
    load();
    const onOrganizationChange = () => load();
    window.addEventListener("organization-changed", onOrganizationChange);
    return () => {
      active = false;
      window.removeEventListener("organization-changed", onOrganizationChange);
    };
  }, []); // Fetchers are stable API methods; reload on the custom organization event.

  return { data, setData, loading, error };
}
