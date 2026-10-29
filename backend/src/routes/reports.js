
import { Router } from "express";
import { supabase } from "../db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(403).json({
        error: "Organization not found",
      });
    }

    // Fetch messages from the last 180 days.
    const since = new Date();
    since.setDate(since.getDate() - 179);
    since.setHours(0, 0, 0, 0);

    // Fetch messages with their associated campaigns.
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(`
        id,
        organization_id,
        status,
        created_at,
        sent_at,
        campaign_id,
        campaigns!inner (
          id,
          name,
          department_id,
          branch_id,
          departments (
            id,
            name
          ),
          branches (
            id,
            name
          )
        )
      `)
      .eq("organization_id", organizationId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true })
      .limit(10000);

    if (messagesError) throw messagesError;

    const byDate = new Map();
    const byDepartment = new Map();

    function getStatusGroup(status) {
      const value = String(status || "").toLowerCase();

      if (value === "queued") return "queued";
      if (value === "failed") return "failed";

      if (["sent", "delivered", "read"].includes(value)) {
        return "sent";
      }

      return null;
    }

    function getDateKey(timestamp) {
      if (!timestamp) return null;

      const date = new Date(timestamp);

      if (Number.isNaN(date.getTime())) return null;

      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);

      const values = Object.fromEntries(
        parts.map(({ type, value }) => [type, value])
      );

      return `${values.year}-${values.month}-${values.day}`;
    }

    function getDisplayDate(dateKey) {
      const [year, month, day] = dateKey.split("-");
      return `${day}/${month}/${year}`;
    }

    function createCounts() {
      return {
        sent: 0,
        queued: 0,
        failed: 0,
      };
    }

    for (const message of messages || []) {
      const statusGroup = getStatusGroup(message.status);

      // Ignore statuses not included in these report totals.
      if (!statusGroup) continue;

      const dateKey = getDateKey(message.created_at);

      if (dateKey) {
        if (!byDate.has(dateKey)) {
          byDate.set(dateKey, {
            date: getDisplayDate(dateKey),
            sent: 0,
            queued: 0,
            failed: 0,
          });
        }

        byDate.get(dateKey)[statusGroup] += 1;
      }

      const campaign = message.campaigns;

      if (!campaign) continue;

      const departmentId = campaign.department_id || null;
      const department = campaign.departments;
      const branch = campaign.branches;

      // Include standalone departments and campaigns without a department.
      const key = departmentId || "__unassigned__";

      if (!byDepartment.has(key)) {
        byDepartment.set(key, {
          department_id: departmentId,
          department: department?.name || "Unassigned",
          branch_id: campaign.branch_id || null,
          branch: branch?.name || "No branch",
          sent: 0,
          queued: 0,
          failed: 0,
        });
      }

      byDepartment.get(key)[statusGroup] += 1;
    }

    const rows = [...byDate.entries()]
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([, row]) => row);

    const departmentRows = [...byDepartment.values()].sort(
      (a, b) => a.department.localeCompare(b.department)
    );

    return res.json({
      data: rows,
      rows,
      departmentRows,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
