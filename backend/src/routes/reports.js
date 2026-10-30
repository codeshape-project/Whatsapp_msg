
// import { Router } from "express";
// import { supabase } from "../db.js";

// const router = Router();

// router.get("/", async (req, res, next) => {
//   try {
//     const organizationId = req.organizationId;

//     if (!organizationId) {
//       return res.status(403).json({
//         error: "Organization not found",
//       });
//     }

//     // Fetch messages from the last 180 days.
//     const since = new Date();
//     since.setDate(since.getDate() - 179);
//     since.setHours(0, 0, 0, 0);

//     // Fetch messages with their associated campaigns.
//     const { data: messages, error: messagesError } = await supabase
//       .from("messages")
//       .select(`
//         id,
//         organization_id,
//         status,
//         created_at,
//         sent_at,
//         campaign_id,
//         campaigns!inner (
//           id,
//           name,
//           department_id,
//           branch_id,
//           departments (
//             id,
//             name
//           ),
//           branches (
//             id,
//             name
//           )
//         )
//       `)
//       .eq("organization_id", organizationId)
//       .gte("created_at", since.toISOString())
//       .order("created_at", { ascending: true })
//       .limit(10000);

//     if (messagesError) throw messagesError;

//     const byDate = new Map();
//     const byDepartment = new Map();

//     function getStatusGroup(status) {
//       const value = String(status || "").toLowerCase();

//       if (value === "queued") return "queued";
//       if (value === "failed") return "failed";

//       if (["sent", "delivered", "read"].includes(value)) {
//         return "sent";
//       }

//       return null;
//     }

//     function getDateKey(timestamp) {
//       if (!timestamp) return null;

//       const date = new Date(timestamp);

//       if (Number.isNaN(date.getTime())) return null;

//       const parts = new Intl.DateTimeFormat("en-CA", {
//         timeZone: "Asia/Kolkata",
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//       }).formatToParts(date);

//       const values = Object.fromEntries(
//         parts.map(({ type, value }) => [type, value])
//       );

//       return `${values.year}-${values.month}-${values.day}`;
//     }

//     function getDisplayDate(dateKey) {
//       const [year, month, day] = dateKey.split("-");
//       return `${day}/${month}/${year}`;
//     }

//     function createCounts() {
//       return {
//         sent: 0,
//         queued: 0,
//         failed: 0,
//       };
//     }

//     for (const message of messages || []) {
//       const statusGroup = getStatusGroup(message.status);

//       // Ignore statuses not included in these report totals.
//       if (!statusGroup) continue;

//       const dateKey = getDateKey(message.created_at);

//       if (dateKey) {
//         if (!byDate.has(dateKey)) {
//           byDate.set(dateKey, {
//             date: getDisplayDate(dateKey),
//             sent: 0,
//             queued: 0,
//             failed: 0,
//           });
//         }

//         byDate.get(dateKey)[statusGroup] += 1;
//       }

//       const campaign = message.campaigns;

//       if (!campaign) continue;

//       const departmentId = campaign.department_id || null;
//       const department = campaign.departments;
//       const branch = campaign.branches;

//       // Include standalone departments and campaigns without a department.
//       const key = departmentId || "__unassigned__";

//       if (!byDepartment.has(key)) {
//         byDepartment.set(key, {
//           department_id: departmentId,
//           department: department?.name || "Unassigned",
//           branch_id: campaign.branch_id || null,
//           branch: branch?.name || "No branch",
//           sent: 0,
//           queued: 0,
//           failed: 0,
//         });
//       }

//       byDepartment.get(key)[statusGroup] += 1;
//     }

//     const rows = [...byDate.entries()]
//       .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
//       .map(([, row]) => row);

//     const departmentRows = [...byDepartment.values()].sort(
//       (a, b) => a.department.localeCompare(b.department)
//     );

//     return res.json({
//       data: rows,
//       rows,
//       departmentRows,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// export default router;


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

    // Fetch messages with associated campaigns.
    const [
      { data: messages, error: messagesError },
      { data: branches, error: branchesError },
      { data: departments, error: departmentsError },
    ] = await Promise.all([
      supabase
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
  group_name,
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
        .limit(10000),

      // All branches belonging to this organization.
      supabase
        .from("branches")
        .select("id, name")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true }),

      // All departments, including standalone departments.
      supabase
        .from("departments")
        .select("id, name, branch_id")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true }),
    ]);

    if (messagesError) throw messagesError;
    if (branchesError) throw branchesError;
    if (departmentsError) throw departmentsError;

    // Create lookup maps for branches and departments.
const departmentById = new Map(
  (departments || []).map((department) => [
    String(department.id),
    department,
  ])
);

const branchById = new Map(
  (branches || []).map((branch) => [
    String(branch.id),
    branch,
  ])
);

const departmentsByName = new Map();

for (const department of departments || []) {
  const key = String(department.name || "").trim().toLowerCase();

  if (!departmentsByName.has(key)) {
    departmentsByName.set(key, []);
  }

  departmentsByName.get(key).push(department);
}

    const byDate = new Map();
    const byDepartment = new Map();
    const detailMap = new Map();

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

      if (!statusGroup) continue;

      const dateKey = getDateKey(message.created_at);

      if (!dateKey) continue;

      const campaign = message.campaigns;

if (!campaign) continue;

// Resolve department from its ID first.
let department = Array.isArray(campaign.departments)
  ? campaign.departments[0]
  : campaign.departments;

if (!department && campaign.department_id) {
  department =
    departmentById.get(String(campaign.department_id)) || null;
}

// For older campaigns, resolve department using group_name.
if (!department && campaign.group_name) {
  const key = String(campaign.group_name).trim().toLowerCase();

  const matches = departmentsByName.get(key) || [];

  if (campaign.branch_id) {
    department =
      matches.find(
        (item) =>
          String(item.branch_id || "") ===
          String(campaign.branch_id)
      ) || null;
  }

  if (!department && matches.length === 1) {
    department = matches[0];
  }
}

// Resolve branch from campaign or department.
const departmentId =
  campaign.department_id || department?.id || null;

const branchId =
  campaign.branch_id || department?.branch_id || null;

let branch = Array.isArray(campaign.branches)
  ? campaign.branches[0]
  : campaign.branches;

if (!branch && branchId) {
  branch = branchById.get(String(branchId)) || null;
}

const departmentName =
  department?.name ||
  campaign.group_name ||
  "Unassigned";

const branchName = branch?.name || "No branch";

      // 1. Overall daily report.
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, {
          date: getDisplayDate(dateKey),
          ...createCounts(),
        });
      }

      byDate.get(dateKey)[statusGroup] += 1;

      // 2. Department and branch-wise report.
      const departmentKey =
        `${branchId || "no-branch"}_${departmentId || "unassigned"}`;

      if (!byDepartment.has(departmentKey)) {
        byDepartment.set(departmentKey, {
          department_id: departmentId,
          department: departmentName,
          branch_id: branchId,
          branch: branchName,
          ...createCounts(),
        });
      }

      byDepartment.get(departmentKey)[statusGroup] += 1;

      // 3. Date + department + branch detail report.
      const detailKey =
        `${dateKey}_${branchId || "no-branch"}_${departmentId || "unassigned"}`;

      if (!detailMap.has(detailKey)) {
        detailMap.set(detailKey, {
          date: getDisplayDate(dateKey),
          department_id: departmentId,
          department: departmentName,
          branch_id: branchId,
          branch: branchName,
          ...createCounts(),
        });
      }

      detailMap.get(detailKey)[statusGroup] += 1;
    }

    const rows = [...byDate.entries()]
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([, row]) => row);

    const departmentRows = [...byDepartment.values()].sort(
      (a, b) => a.department.localeCompare(b.department)
    );

    const detailRows = [...detailMap.values()].sort((a, b) => {
      const dateA = a.date.split("/").reverse().join("-");
      const dateB = b.date.split("/").reverse().join("-");

      return (
        dateA.localeCompare(dateB) ||
        a.department.localeCompare(b.department)
      );
    });

    return res.json({
      data: rows,
      rows,
      departmentRows,
      detailRows,

      // Database-backed dropdown options.
      branches: branches || [],
      departments: departments || [],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
