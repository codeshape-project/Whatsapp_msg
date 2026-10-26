import { useCallback, useEffect, useState } from "react";

function currentOrganizationId() {
  try {
    return (
      JSON.parse(localStorage.getItem("cs_user") || "null")
        ?.organizationId || "codeshape-hospital"
    );
  } catch {
    return "codeshape-hospital";
  }
}

function keyFor(fetcher) {
  const names = {
    getDashboardStats: "dashboardStats",
    getMessageTrend: "messageTrend",
    getRecentCampaigns: "recentCampaigns",
    getRecentActivity: "recentActivity",
    getContacts: "contacts",
    getContactGroups: "contactGroups",
    getTemplates: "templates",
    getCampaigns: "campaigns",
    getScheduledMessages: "scheduledMessages",
    getReports: "reports",
  };

  return names[fetcher?.name] || null;
}

// Reloads when the organization changes and persists local edits per organization.
export default function useFetch(fetcher) {
  const [data, setDataState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dataKey = keyFor(fetcher);

  const setData = useCallback(
    (update) => {
      setDataState((previous) => {
        const next =
          typeof update === "function" ? update(previous) : update;

        if (dataKey && next !== undefined && next !== null) {
          try {
            localStorage.setItem(
              `wa_data_${currentOrganizationId()}_${dataKey}`,
              JSON.stringify(next)
            );
          } catch {
            // Browser storage is optional.
          }
        }

        return next;
      });
    },
    [dataKey]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setDataState(result);
      return result;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();

        if (active) {
          setDataState(result);
        }
      } catch (err) {
        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    const onOrganizationChange = () => {
      loadData();
    };

    window.addEventListener(
      "organization-changed",
      onOrganizationChange
    );

    return () => {
      active = false;

      window.removeEventListener(
        "organization-changed",
        onOrganizationChange
      );
    };
  }, [fetcher]);

  return {
    data,
    setData,
    loading,
    error,
    refetch: load,
  };
}
