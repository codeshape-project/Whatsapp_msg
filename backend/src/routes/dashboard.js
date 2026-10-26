
import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

function getError(result) {
  if (result.error) throw result.error;
  return result;
}

async function countRows(table, organizationId, status) {
  let query = supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (status) query = query.eq('status', status);

  const { count, error } = await query;
  if (error) throw error;

  return count || 0;
}

// GET /api/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    const orgId = req.organizationId;

    const [
      totalContacts,
      totalMessages,
      sent,
      delivered,
      read,
      failed,
      queued,
    ] = await Promise.all([
      countRows('contacts', orgId),
      countRows('messages', orgId),
      countRows('messages', orgId, 'sent'),
      countRows('messages', orgId, 'delivered'),
      countRows('messages', orgId, 'read'),
      countRows('messages', orgId, 'failed'),
      countRows('messages', orgId, 'queued'),
    ]);

    res.json({
      data: {
        totalContacts,
        totalMessages,
        sent,
        delivered,
        read,
        failed,
        queued,
        deliveryRate: totalMessages
          ? Number(((delivered / totalMessages) * 100).toFixed(1))
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/trend
router.get('/trend', async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 6);

    const { data, error } = await supabase
      .from('messages')
      .select('created_at, status')
      .eq('organization_id', orgId)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + index);

      return {
        date: date.toISOString().slice(0, 10),
        sent: 0,
        delivered: 0,
        failed: 0,
        total: 0,
      };
    });

    const byDate = new Map(days.map(day => [day.date, day]));

    for (const message of data || []) {
      const day = byDate.get(message.created_at?.slice(0, 10));
      if (!day) continue;

      day.total++;

      if (message.status === 'sent') day.sent++;
      if (message.status === 'delivered') day.delivered++;
      if (message.status === 'read') {
        day.delivered++;
      }
      if (message.status === 'failed') day.failed++;
    }

    res.json({ data: days });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/recent-campaigns
router.get('/recent-campaigns', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('organization_id', req.organizationId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    res.json({
      data: (data || []).map(campaign => ({
        ...campaign,
        template: campaign.template_name,
        recipients: campaign.recipient_count || 0,
        sent: campaign.sent_count || 0,
        failed: campaign.failed_count || 0,
        scheduledAt: campaign.scheduled_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/activity
// Activity is derived from recent messages because no activity table
// has been confirmed in the supplied schema.
router.get('/activity', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, status, created_at, campaign_id, contact_id')
      .eq('organization_id', req.organizationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const messages = data || [];
    const campaignIds = [
      ...new Set(messages.map(item => item.campaign_id).filter(Boolean)),
    ];

    let campaignNames = {};

    if (campaignIds.length) {
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('organization_id', req.organizationId)
        .in('id', campaignIds);

      if (campaignError) throw campaignError;

      campaignNames = Object.fromEntries(
        (campaigns || []).map(campaign => [campaign.id, campaign.name])
      );
    }

    res.json({
  data: messages.map((message) => ({
    id: message.id,
    type: ["delivered", "read", "failed", "scheduled"].includes(
      message.status
    )
      ? message.status
      : message.status === "sent"
        ? "completed"
        : "completed",
    title: `Message ${
      message.status || "updated"
    }`,
    description:
      campaignNames[message.campaign_id] || "WhatsApp message",
    status: message.status,
    created_at: message.created_at,
    timestamp: message.created_at,
  })),
});
  } catch (error) {
    next(error);
  }
});

export default router;
