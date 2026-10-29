
import { Router } from "express";
import { supabase } from "../db.js";
import { processCampaign } from "./campaigns.js";

const router = Router();

const MAX_CAMPAIGNS_PER_RUN = 5;
const BATCH_SIZE = 100;

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization;

  if (!secret || !authorization) {
    return false;
  }

  return authorization === `Bearer ${secret}`;
}

/**
 * Fetch campaigns that are due to run.
 * Include running campaigns so campaigns with remaining queued
 * messages can continue in later cron executions.
 */
async function getEligibleCampaigns(now) {
  const [scheduledResult, runningResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, organization_id, status, scheduled_at")
      .eq("status", "scheduled")
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(MAX_CAMPAIGNS_PER_RUN),

    supabase
      .from("campaigns")
      .select("id, organization_id, status, scheduled_at")
      .eq("status", "running")
      .order("updated_at", { ascending: true })
      .limit(MAX_CAMPAIGNS_PER_RUN),
  ]);

  if (scheduledResult.error) {
    throw scheduledResult.error;
  }

  if (runningResult.error) {
    throw runningResult.error;
  }

  // Scheduled campaigns first, followed by running campaigns.
  const combined = [
    ...(scheduledResult.data || []),
    ...(runningResult.data || []),
  ];

  // Avoid duplicates if results ever overlap.
  const unique = new Map();

  for (const campaign of combined) {
    unique.set(campaign.id, campaign);
  }

  return [...unique.values()].slice(0, MAX_CAMPAIGNS_PER_RUN);
}

/**
 * Atomically claim a scheduled campaign.
 *
 * Only one invocation can change its status from scheduled to running.
 */
async function claimScheduledCampaign(campaign, now) {
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      status: "running",
      updated_at: now,
    })
    .eq("id", campaign.id)
    .eq("organization_id", campaign.organization_id)
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .select("id, organization_id, status")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Check whether a running campaign still has queued messages.
 */
async function hasQueuedMessages(campaign) {
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", campaign.organization_id)
    .eq("campaign_id", campaign.id)
    .eq("status", "queued");

  if (error) {
    throw error;
  }

  return (count || 0) > 0;
}

router.get("/scheduled-campaigns", async (req, res) => {
  // Keep the cron endpoint protected.
  if (!isAuthorized(req)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized cron request.",
    });
  }

  const now = new Date().toISOString();

  try {
    const campaigns = await getEligibleCampaigns(now);
    const results = [];

    for (const campaign of campaigns) {
      try {
        let shouldProcess = false;

        if (campaign.status === "scheduled") {
          // Claim scheduled campaigns before processing.
          const claimedCampaign = await claimScheduledCampaign(
            campaign,
            now
          );

          if (!claimedCampaign) {
            results.push({
              campaignId: campaign.id,
              status: "skipped",
              reason: "Campaign was already claimed or is no longer due.",
            });

            continue;
          }

          shouldProcess = true;
        } else if (campaign.status === "running") {
          // Continue only if queued messages remain.
          // Note: this check alone is NOT a concurrency lock.
          shouldProcess = await hasQueuedMessages(campaign);
        }

        if (!shouldProcess) {
          results.push({
            campaignId: campaign.id,
            status: "skipped",
            reason: "No queued messages remain.",
          });

          continue;
        }

        const result = await processCampaign({
          campaignId: campaign.id,
          organizationId: campaign.organization_id,
          batchSize: BATCH_SIZE,
          source: "cron",
        });

        results.push({
          campaignId: campaign.id,
          status: result?.status || "processed",
          processed: result?.processed ?? null,
        });
      } catch (error) {
        console.error(
          `[CRON] Campaign ${campaign.id} failed:`,
          error
        );

        results.push({
          campaignId: campaign.id,
          status: "processing_failed",
          message: error.message || "Campaign processing failed.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      checkedAt: now,
      campaignsFound: campaigns.length,
      results,
    });
  } catch (error) {
    console.error("[CRON] Scheduled campaign worker failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process scheduled campaigns.",
      error: error.message,
    });
  }
});

export default router;
