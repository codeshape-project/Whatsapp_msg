// import { Router } from 'express';
// import { config } from '../config.js';
// import { supabase } from '../db.js';
// const router=Router();
// router.get('/whatsapp',(req,res)=>{const mode=req.query['hub.mode'];const token=req.query['hub.verify_token'];const challenge=req.query['hub.challenge'];if(mode==='subscribe'&&token&&token===config.metaVerifyToken)return res.status(200).send(challenge);return res.sendStatus(403);});
// router.post('/whatsapp',async(req,res,next)=>{try{res.sendStatus(200);const entries=req.body?.entry||[];for(const entry of entries)for(const change of entry.changes||[]){const statuses=change.value?.statuses||[];for(const status of statuses){const id=status.id;const state=status.status;if(!id||!state)continue;const patch={status:state,updated_at:new Date().toISOString()};if(state==='delivered')patch.delivered_at=new Date((Number(status.timestamp)||Date.now()/1000)*1000).toISOString();if(state==='read')patch.read_at=new Date((Number(status.timestamp)||Date.now()/1000)*1000).toISOString();if(state==='failed')patch.last_error=JSON.stringify(status.errors||[]).slice(0,500);await supabase?.from('messages').update(patch).eq('meta_message_id',id);}}}catch(e){next(e)}});
// export default router;

import { Router } from "express";
import { supabase } from "../db.js";
import { config } from "../config.js";

const router = Router();

function throwIfError(error) {
  if (error) throw error;
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function getMessageBody(message) {
  switch (message.type) {
    case "text":
      return message.text?.body || "";

    case "image":
      return message.image?.caption || "[Image]";

    case "video":
      return message.video?.caption || "[Video]";

    case "audio":
      return "[Audio]";

    case "document":
      return message.document?.caption ||
        message.document?.filename ||
        "[Document]";

    case "sticker":
      return "[Sticker]";

    case "location":
      return "[Location]";

    case "contacts":
      return "[Contact card]";

    case "button":
      return message.button?.text || "[Button reply]";

    case "interactive":
      return (
        message.interactive?.button_reply?.title ||
        message.interactive?.list_reply?.title ||
        "[Interactive reply]"
      );

    default:
      return `[${message.type || "Unknown message"}]`;
  }
}

async function resolveOrganizationId(phoneNumberId) {
  if (!phoneNumberId) return null;

  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("id, settings");

  throwIfError(error);

  const matches = (organizations || []).filter((organization) => {
    const settings = organization.settings || {};

    const configuredId =
      settings.metaPhoneNumberId ||
      settings.meta_phone_number_id ||
      settings.phone_number_id;

    return configuredId && String(configuredId) === String(phoneNumberId);
  });

  if (matches.length === 1) {
    return matches[0].id;
  }

  // Safe single-organization fallback for the current global .env setup.
  // Do not use this fallback when the database has multiple organizations.
  if (
    matches.length === 0 &&
    config.metaPhoneNumberId &&
    String(config.metaPhoneNumberId) === String(phoneNumberId) &&
    (organizations || []).length === 1
  ) {
    return organizations[0].id;
  }

  console.error(
    "[WhatsApp webhook] No unique organization matches phone number ID:",
    phoneNumberId
  );

  return null;
}

async function findContact(organizationId, phone) {
  const wanted = normalizePhone(phone);

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("id, phone")
    .eq("organization_id", organizationId);

  throwIfError(error);

  return (contacts || []).find(
    (contact) => normalizePhone(contact.phone) === wanted
  ) || null;
}

/* ================= VERIFY WEBHOOK ================= */

router.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token &&
    token === config.metaVerifyToken
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/* ================= RECEIVE META EVENTS ================= */

router.post("/whatsapp", async (req, res) => {
  try {
    const payload = req.body;

    if (payload?.object !== "whatsapp_business_account") {
      return res.sendStatus(404);
    }

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;

        const value = change.value || {};
        const phoneNumberId = value.metadata?.phone_number_id;

        const organizationId =
          await resolveOrganizationId(phoneNumberId);

        if (!organizationId) {
          // Do not save a message under the wrong organization.
          console.error(
            "[WhatsApp webhook] Skipping event: organization not resolved."
          );
          continue;
        }

        /* ---------- Incoming messages ---------- */

        for (const message of value.messages || []) {
          const from = message.from;
          const metaMessageId = message.id;

          if (!from || !metaMessageId) continue;

          const contact = await findContact(organizationId, from);

          if (!contact) {
            console.warn(
              "[WhatsApp webhook] Incoming message is from a number not in this organization's contacts:",
              from
            );
            continue;
          }

          const timestamp = message.timestamp
            ? new Date(Number(message.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          const row = {
            organization_id: organizationId,
            campaign_id: null,
            contact_id: contact.id,
            status: "received",
            meta_message_id: metaMessageId,
            direction: "incoming",
            message_type: message.type || "unknown",
            message_body: getMessageBody(message),
            message_timestamp: timestamp,
            sender_phone: from,
            recipient_phone: phoneNumberId,
            raw_payload: message,
          };

          const { error: insertError } = await supabase
            .from("messages")
            .upsert(row, {
              onConflict: "meta_message_id",
              ignoreDuplicates: true,
            });

          throwIfError(insertError);
        }

        /* ---------- Delivery status updates ---------- */

        for (const statusEvent of value.statuses || []) {
          const metaMessageId = statusEvent.id;
          const status = statusEvent.status;

          if (!metaMessageId || !status) continue;

          const timestamp = statusEvent.timestamp
            ? new Date(
                Number(statusEvent.timestamp) * 1000
              ).toISOString()
            : new Date().toISOString();

          const update = {
            status,
            updated_at: new Date().toISOString(),
          };

          if (status === "sent") {
            update.sent_at = timestamp;
          } else if (status === "delivered") {
            update.delivered_at = timestamp;
          } else if (status === "read") {
            update.read_at = timestamp;
          } else if (status === "failed") {
            update.last_error = (
              statusEvent.errors || []
            )
              .map((item) => item.title || item.message || "Meta delivery error")
              .join("; ")
              .slice(0, 500);
          }

          const { error: updateError } = await supabase
            .from("messages")
            .update(update)
            .eq("meta_message_id", metaMessageId)
            .eq("organization_id", organizationId);

          throwIfError(updateError);
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("[WhatsApp webhook] Processing failed:", error);
    return res.sendStatus(500);
  }
});

export default router;