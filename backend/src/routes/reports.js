
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

    // Fetch actual message records from the last 180 days.
    const since = new Date();
    since.setDate(since.getDate() - 179);
    since.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("messages")
      .select("status, created_at, sent_at")
      .eq("organization_id", organizationId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true })
      .limit(10000);

    if (error) throw error;

    const byDate = new Map();

    for (const message of data || []) {
      const timestamp = message.created_at;

      if (!timestamp) continue;

      // Use the database creation date for reporting.
      const dateKey = new Date(timestamp).toLocaleDateString(
        "en-CA",
        { timeZone: "Asia/Kolkata" }
      );

      if (!dateKey || dateKey === "Invalid Date") continue;

      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, {
          date: new Date(`${dateKey}T00:00:00`).toLocaleDateString(
            "en-IN",
            { timeZone: "Asia/Kolkata" }
          ),
          sent: 0,
          queued: 0,
          failed: 0,
        });
      }

      const row = byDate.get(dateKey);
      const status = String(message.status || "").toLowerCase();

      if (status === "queued") {
        row.queued += 1;
      } else if (status === "failed") {
        row.failed += 1;
      } else if (
        ["sent", "delivered", "read"].includes(status)
      ) {
        // Delivered and read messages have already been sent.
        row.sent += 1;
      }
    }

    const reports = [...byDate.values()];

    return res.json({
      data: reports,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
