import { Router } from "express";
import { supabase } from "../db.js";

const router = Router();

const CHUNK_SIZE = 100;
const MAX_INCOMING_ROWS = 5000;
const MAX_THREAD_ROWS = 500;

function throwIfError(error) {
  if (error) throw error;
}

function chunk(items, size = CHUNK_SIZE) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function messageTime(message) {
  return message.message_timestamp || message.created_at;
}

// GET /api/inbox/unread-count
router.get("/unread-count", async (req, res, next) => {
  try {
    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", req.organizationId)
      .eq("direction", "incoming")
      .is("inbox_read_at", null);

    throwIfError(error);
    res.json({ data: { unread: count || 0 } });
  } catch (error) {
    next(error);
  }
});

// GET /api/inbox/conversations?filter=all|unread
router.get("/conversations", async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const onlyUnread = req.query.filter === "unread";

    const { data: incoming, error: incomingError } = await supabase
      .from("messages")
      .select(
        "id, contact_id, message_body, message_type, message_timestamp, created_at, inbox_read_at"
      )
      .eq("organization_id", organizationId)
      .eq("direction", "incoming")
      .order("message_timestamp", { ascending: false, nullsFirst: false })
      .limit(MAX_INCOMING_ROWS);

    throwIfError(incomingError);

    const byContact = new Map();

    for (const message of incoming || []) {
      let entry = byContact.get(message.contact_id);

      if (!entry) {
        entry = {
          contact_id: message.contact_id,
          last_message: message,
          reply_count: 0,
          unread_count: 0,
        };
        byContact.set(message.contact_id, entry);
      }

      entry.reply_count += 1;
      if (!message.inbox_read_at) entry.unread_count += 1;
    }

    let entries = [...byContact.values()];

    if (onlyUnread) {
      entries = entries.filter((entry) => entry.unread_count > 0);
    }

    const contactIds = entries.map((entry) => entry.contact_id);

    const contactMap = new Map();

    for (const ids of chunk(contactIds)) {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, phone, group_name")
        .eq("organization_id", organizationId)
        .in("id", ids);

      throwIfError(error);
      for (const contact of data || []) contactMap.set(contact.id, contact);
    }

    const campaignMap = new Map();

    for (const ids of chunk(contactIds)) {
      const { data, error } = await supabase
        .from("messages")
        .select("contact_id, created_at, campaigns(name)")
        .eq("organization_id", organizationId)
        .eq("direction", "outgoing")
        .not("campaign_id", "is", null)
        .in("contact_id", ids)
        .order("created_at", { ascending: false })
        .limit(2000);

      throwIfError(error);

      for (const row of data || []) {
        if (!campaignMap.has(row.contact_id) && row.campaigns?.name) {
          campaignMap.set(row.contact_id, row.campaigns.name);
        }
      }
    }

    const conversations = entries
      .filter((entry) => contactMap.has(entry.contact_id))
      .map((entry) => {
        const contact = contactMap.get(entry.contact_id);

        return {
          contact_id: entry.contact_id,
          name: contact.name,
          phone: contact.phone,
          group_name: contact.group_name || null,
          last_campaign: campaignMap.get(entry.contact_id) || null,
          last_message: entry.last_message.message_body || "",
          last_message_type: entry.last_message.message_type || "text",
          last_message_at: messageTime(entry.last_message),
          reply_count: entry.reply_count,
          unread_count: entry.unread_count,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.last_message_at).getTime() -
          new Date(a.last_message_at).getTime()
      );

    res.json({ data: conversations });
  } catch (error) {
    next(error);
  }
});

// GET /api/inbox/conversations/:contactId/messages
router.get("/conversations/:contactId/messages", async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { contactId } = req.params;

    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, name, phone, group_name")
      .eq("organization_id", organizationId)
      .eq("id", contactId)
      .maybeSingle();

    throwIfError(contactError);

    if (!contact) {
      return res.status(404).json({
        error: "Contact not found for this organization.",
      });
    }

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(
        `id, direction, status, message_type, message_body,
         message_timestamp, created_at, sent_at, delivered_at, read_at,
         last_error, inbox_read_at, campaign_id, campaigns(name)`
      )
      .eq("organization_id", organizationId)
      .eq("contact_id", contact.id)
      .not("status", "in", "(queued,sending)")
      .order("message_timestamp", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(MAX_THREAD_ROWS);

    throwIfError(messagesError);

    const thread = (messages || [])
      .map((message) => ({
        id: message.id,
        direction: message.direction,
        status: message.status,
        message_type: message.message_type,
        message_body: message.message_body || "",
        campaign_name: message.campaigns?.name || null,
        at: messageTime(message),
        last_error: message.last_error || null,
      }))
      .reverse();

    res.json({ data: thread, contact });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/inbox/conversations/:contactId/read
router.patch("/conversations/:contactId/read", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .update({ inbox_read_at: new Date().toISOString() })
      .eq("organization_id", req.organizationId)
      .eq("contact_id", req.params.contactId)
      .eq("direction", "incoming")
      .is("inbox_read_at", null)
      .select("id");

    throwIfError(error);
    res.json({ success: true, updated: (data || []).length });
  } catch (error) {
    next(error);
  }
});

export default router;