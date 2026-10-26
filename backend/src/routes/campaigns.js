
// // import { Router } from 'express';
// // import { supabase } from '../db.js';
// // import { sendTemplate } from '../services/metaWhatsApp.js';

// // const router = Router();

// // const MAX_RECIPIENTS_PER_BATCH = 500;
// // const MAX_CONTACT_IDS = 5000;

// // /* ================= HELPERS ================= */

// // function throwIfError(error) {
// //   if (error) throw error;
// // }

// // function resolveMapping(source, contact, organization) {
// //   switch (source) {
// //     case 'contact.name':
// //       return contact.name;

// //     case 'contact.email':
// //       return contact.email;

// //     case 'organization.name':
// //       return organization.name;

// //     default:
// //       throw new Error(`Unsupported template variable source: ${source}`);
// //   }
// // }

// // function getPlaceholderPositions(body) {
// //   const positions = new Set();
// //   const regex = /\{\{(\d+)\}\}/g;
// //   let match;

// //   while ((match = regex.exec(String(body || ''))) !== null) {
// //     positions.add(Number(match[1]));
// //   }

// //   return [...positions].sort((a, b) => a - b);
// // }

// // function prepareTemplateComponents(mappings, templateBody, contact, organization) {
// //   if (!Array.isArray(mappings)) {
// //     throw new Error('Template variable mappings must be an array.');
// //   }

// //   const actualPositions = getPlaceholderPositions(templateBody);

// //   const normalizedMappings = mappings.map((mapping) => ({
// //     position: Number(mapping.position),
// //     source: mapping.source,
// //   }));

// //   for (const mapping of normalizedMappings) {
// //     if (
// //       !Number.isInteger(mapping.position) ||
// //       mapping.position < 1 ||
// //       typeof mapping.source !== 'string' ||
// //       !mapping.source.trim()
// //     ) {
// //       throw new Error('Invalid template variable mapping configuration.');
// //     }
// //   }

// //   const mappingPositions = normalizedMappings
// //     .map((mapping) => mapping.position)
// //     .sort((a, b) => a - b);

// //   if (new Set(mappingPositions).size !== mappingPositions.length) {
// //     throw new Error('Duplicate template variable positions were found.');
// //   }

// //   // When the saved template body contains numbered placeholders,
// //   // every placeholder must have a matching mapping and vice versa.
// //   if (actualPositions.length > 0) {
// //     if (
// //       actualPositions.length !== mappingPositions.length ||
// //       actualPositions.some((position, index) => position !== mappingPositions[index])
// //     ) {
// //       throw new Error(
// //         'Template variable mappings do not match the placeholders in the saved template body.'
// //       );
// //     }
// //   } else if (mappingPositions.length > 0) {
// //     // If the body is unavailable, still require consecutive numbered positions.
// //     const expectedPositions = Array.from(
// //       { length: mappingPositions.length },
// //       (_, index) => index + 1
// //     );

// //     if (
// //       expectedPositions.some(
// //         (position, index) => position !== mappingPositions[index]
// //       )
// //     ) {
// //       throw new Error(
// //         'Template variable positions must start at 1 and be consecutive.'
// //       );
// //     }
// //   }

// //   const sortedMappings = [...normalizedMappings].sort(
// //     (a, b) => a.position - b.position
// //   );

// //   const parameters = sortedMappings.map((mapping) => {
// //     const value = resolveMapping(mapping.source, contact, organization);

// //     if (value === null || value === undefined || String(value).trim() === '') {
// //       throw new Error(
// //         `Missing value for template placeholder {{${mapping.position}}}.`
// //       );
// //     }

// //     return {
// //       type: 'text',
// //       text: String(value),
// //     };
// //   });

// //   return parameters.length
// //     ? [
// //         {
// //           type: 'body',
// //           parameters,
// //         },
// //       ]
// //     : [];
// // }

// // /* ================= GET CAMPAIGNS ================= */

// // router.get('/', async (req, res, next) => {
// //   try {
// //     const { data, error } = await supabase
// //       .from('campaigns')
// //       .select('*')
// //       .eq('organization_id', req.organizationId)
// //       .order('created_at', { ascending: false });

// //     throwIfError(error);

// //     res.json({ data: data || [] });
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // /* ================= CREATE CAMPAIGN ================= */

// // router.post('/', async (req, res, next) => {
// //   try {
// //     const {
// //       name,
// //       template_name,
// //       language = 'en_US',
// //       group_name = null,
// //       scheduled_at = null,
// //       contact_ids = [],
// //     } = req.body || {};

// //     if (!name?.trim() || !template_name?.trim()) {
// //       return res.status(400).json({
// //         error: 'Campaign name and approved Meta template name are required.',
// //       });
// //     }

// //     if (
// //       !Array.isArray(contact_ids) ||
// //       contact_ids.length > MAX_CONTACT_IDS
// //     ) {
// //       return res.status(400).json({
// //         error: `contact_ids must be an array of up to ${MAX_CONTACT_IDS} contacts.`,
// //       });
// //     }

// //     if (new Set(contact_ids).size !== contact_ids.length) {
// //       return res.status(400).json({
// //         error: 'Duplicate contact IDs are not allowed.',
// //       });
// //     }

// //     if (scheduled_at && Number.isNaN(new Date(scheduled_at).getTime())) {
// //       return res.status(400).json({
// //         error: 'scheduled_at must be a valid date.',
// //       });
// //     }

// //     // Only accept opted-in contacts belonging to this organization.
// //     let eligibleContacts = [];

// //     if (contact_ids.length > 0) {
// //       const { data: contacts, error: contactsError } = await supabase
// //         .from('contacts')
// //         .select('id')
// //         .eq('organization_id', req.organizationId)
// //         .eq('opted_in', true)
// //         .in('id', contact_ids);

// //       throwIfError(contactsError);

// //       eligibleContacts = contacts || [];
// //     }

// //     const row = {
// //       organization_id: req.organizationId,
// //       name: name.trim(),
// //       template_name: template_name.trim(),
// //       language,
// //       group_name,
// //       scheduled_at,
// //       status: scheduled_at ? 'scheduled' : 'draft',
// //       recipient_count: eligibleContacts.length,
// //       created_by: req.user.id,
// //     };

// //     const { data: campaign, error: campaignError } = await supabase
// //       .from('campaigns')
// //       .insert(row)
// //       .select()
// //       .single();

// //     throwIfError(campaignError);

// //     if (eligibleContacts.length > 0) {
// //       const messageRows = eligibleContacts.map((contact) => ({
// //         organization_id: req.organizationId,
// //         campaign_id: campaign.id,
// //         contact_id: contact.id,
// //         status: 'queued',
// //       }));

// //       const { error: messagesError } = await supabase
// //         .from('messages')
// //         .insert(messageRows);

// //       throwIfError(messagesError);
// //     }

// //     res.status(201).json({ data: campaign });
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // /* ================= SEND CAMPAIGN ================= */

// // router.post('/:id/send', async (req, res, next) => {
// //   try {
// //     // Load the campaign within the authenticated organization.
// //     const { data: campaign, error: campaignError } = await supabase
// //       .from('campaigns')
// //       .select('*')
// //       .eq('organization_id', req.organizationId)
// //       .eq('id', req.params.id)
// //       .single();

// //     throwIfError(campaignError);

// //     if (
// //       campaign.status === 'scheduled' &&
// //       campaign.scheduled_at &&
// //       new Date(campaign.scheduled_at) > new Date()
// //     ) {
// //       return res.status(409).json({
// //         error: 'This campaign is scheduled for a future time.',
// //       });
// //     }

// //     // Find the saved mappings for this organization's template.
// //     const { data: savedTemplate, error: templateError } = await supabase
// //       .from('templates')
// //       .select('variable_mappings, body')
// //       .eq('organization_id', req.organizationId)
// //       .eq('meta_name', campaign.template_name)
// //       .eq('language', campaign.language)
// //       .maybeSingle();

// //     throwIfError(templateError);

// //     if (!savedTemplate) {
// //       return res.status(400).json({
// //         error:
// //           'Template configuration was not found in the database for this organization. Save the template mappings before sending.',
// //       });
// //     }

// //     const mappings = savedTemplate.variable_mappings || [];

// //     if (!Array.isArray(mappings)) {
// //       return res.status(400).json({
// //         error: 'Saved template variable mappings must be an array.',
// //       });
// //     }

// //     // Get the organization name used by organization.name mappings.
// //     const { data: organization, error: organizationError } = await supabase
// //       .from('organizations')
// //       .select('name')
// //       .eq('id', req.organizationId)
// //       .single();

// //     throwIfError(organizationError);

// //     // Process only queued messages for this campaign.
// //     const { data: queued, error: queuedError } = await supabase
// //       .from('messages')
// //       .select('id, contact_id, contacts(id, name, phone, email, opted_in)')
// //       .eq('organization_id', req.organizationId)
// //       .eq('campaign_id', campaign.id)
// //       .eq('status', 'queued')
// //       .limit(MAX_RECIPIENTS_PER_BATCH);

// //     throwIfError(queuedError);

// //     if (!queued?.length) {
// //       return res.status(400).json({
// //         error: 'No queued opted-in recipients found for this campaign.',
// //       });
// //     }

// //     const { error: runningError } = await supabase
// //       .from('campaigns')
// //       .update({ status: 'running' })
// //       .eq('organization_id', req.organizationId)
// //       .eq('id', campaign.id);

// //     throwIfError(runningError);

// //     let sent = 0;
// //     let failed = 0;

// //     for (const item of queued) {
// //       try {
// //         const contact = item.contacts;

// //         if (!contact) {
// //           throw new Error('Recipient contact could not be found.');
// //         }

// //         if (!contact.opted_in) {
// //           throw new Error('Recipient has not opted in.');
// //         }

// //         if (!contact.phone) {
// //           throw new Error('Recipient phone number is missing.');
// //         }

// //         // Build the body parameters from database mappings.
// //         const components = prepareTemplateComponents(
// //           mappings,
// //           savedTemplate.body,
// //           contact,
// //           organization
// //         );

// //         // Send the approved Meta template with its mapped values.
// //         const result = await sendTemplate({
// //           to: contact.phone,
// //           name: campaign.template_name,
// //           language: campaign.language,
// //           components,
// //         });

// //         const metaId = result?.messages?.[0]?.id || null;

// //         const { error: updateMessageError } = await supabase
// //           .from('messages')
// //           .update({
// //             status: 'sent',
// //             meta_message_id: metaId,
// //             sent_at: new Date().toISOString(),
// //             last_error: null,
// //           })
// //           .eq('organization_id', req.organizationId)
// //           .eq('id', item.id);

// //         throwIfError(updateMessageError);

// //         sent++;
// //       } catch (sendError) {
// //         const message = String(sendError?.message || sendError).slice(0, 500);

// //         const { error: updateFailureError } = await supabase
// //           .from('messages')
// //           .update({
// //             status: 'failed',
// //             last_error: message,
// //           })
// //           .eq('organization_id', req.organizationId)
// //           .eq('id', item.id);

// //         throwIfError(updateFailureError);

// //         failed++;
// //       }
// //     }

// //     // Check whether queued messages remain after this batch.
// //     const { count: remainingCount, error: remainingError } = await supabase
// //       .from('messages')
// //       .select('id', { count: 'exact', head: true })
// //       .eq('organization_id', req.organizationId)
// //       .eq('campaign_id', campaign.id)
// //       .eq('status', 'queued');

// //     throwIfError(remainingError);

// //     const hasMoreQueued = (remainingCount || 0) > 0;

// //     // Preserve counts from previous batches.
// //     const newSentCount = (campaign.sent_count || 0) + sent;
// //     const newFailedCount = (campaign.failed_count || 0) + failed;

// //     const finalStatus = hasMoreQueued
// //       ? 'running'
// //       : newFailedCount > 0
// //         ? 'completed_with_errors'
// //         : 'completed';

// //     const { error: updateCampaignError } = await supabase
// //       .from('campaigns')
// //       .update({
// //         status: finalStatus,
// //         sent_count: newSentCount,
// //         failed_count: newFailedCount,
// //       })
// //       .eq('organization_id', req.organizationId)
// //       .eq('id', campaign.id);

// //     throwIfError(updateCampaignError);

// //     res.json({
// //       success: true,
// //       processed: queued.length,
// //       sent,
// //       failed,
// //       hasMoreQueued,
// //       note: hasMoreQueued
// //         ? 'More messages remain queued. Send the campaign again to process the next batch.'
// //         : 'All currently queued messages have been processed.',
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // /* ================= GET CAMPAIGN MESSAGES ================= */

// // router.get('/:id/messages', async (req, res, next) => {
// //   try {
// //     // Verify the campaign belongs to this organization.
// //     const { data: campaign, error: campaignError } = await supabase
// //       .from('campaigns')
// //       .select('id')
// //       .eq('organization_id', req.organizationId)
// //       .eq('id', req.params.id)
// //       .maybeSingle();

// //     throwIfError(campaignError);

// //     if (!campaign) {
// //       return res.status(404).json({
// //         error: 'Campaign not found.',
// //       });
// //     }

// //     const { data, error } = await supabase
// //       .from('messages')
// //       .select('*, contacts(name, phone)')
// //       .eq('organization_id', req.organizationId)
// //       .eq('campaign_id', campaign.id)
// //       .order('created_at', { ascending: false })
// //       .limit(1000);

// //     throwIfError(error);

// //     res.json({ data: data || [] });
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // export default router;


// import { Router } from "express";
// import { supabase } from "../db.js";
// import { sendTemplate } from "../services/metaWhatsApp.js";

// const router = Router();

// const MAX_RECIPIENTS_PER_BATCH = 500;
// const MAX_CONTACT_IDS = 5000;

// /* HELPERS */

// function throwIfError(error) {
//   if (error) throw error;
// }

// function resolveMapping(source, contact, organization) {
//   switch (source) {
//     case "contact.name":
//       return contact.name;
//     case "contact.email":
//       return contact.email;
//     case "organization.name":
//       return organization.name;
//     default:
//       throw new Error(`Unsupported template variable source: ${source}`);
//   }
// }

// function getPlaceholderPositions(body) {
//   const positions = new Set();
//   const regex = /\{\{(\d+)\}\}/g;
//   let match;

//   while ((match = regex.exec(String(body || ""))) !== null) {
//     positions.add(Number(match[1]));
//   }

//   return [...positions].sort((a, b) => a - b);
// }

// function prepareTemplateComponents(
//   mappings,
//   templateBody,
//   contact,
//   organization
// ) {
//   if (!Array.isArray(mappings)) {
//     throw new Error("Template variable mappings must be an array.");
//   }

//   const actualPositions = getPlaceholderPositions(templateBody);

//   const normalizedMappings = mappings.map((mapping) => ({
//     position: Number(mapping.position),
//     source: mapping.source,
//   }));

//   for (const mapping of normalizedMappings) {
//     if (
//       !Number.isInteger(mapping.position) ||
//       mapping.position < 1 ||
//       typeof mapping.source !== "string" ||
//       !mapping.source.trim()
//     ) {
//       throw new Error("Invalid template variable mapping configuration.");
//     }
//   }

//   const mappingPositions = normalizedMappings
//     .map((mapping) => mapping.position)
//     .sort((a, b) => a - b);

//   if (new Set(mappingPositions).size !== mappingPositions.length) {
//     throw new Error("Duplicate template variable positions were found.");
//   }

//   if (
//     actualPositions.length !== mappingPositions.length ||
//     actualPositions.some(
//       (position, index) => position !== mappingPositions[index]
//     )
//   ) {
//     throw new Error(
//       "Saved template mappings do not match the placeholders in the template body. Save the correct mappings before sending."
//     );
//   }

//   const sortedMappings = [...normalizedMappings].sort(
//     (a, b) => a.position - b.position
//   );

//   const parameters = sortedMappings.map((mapping) => {
//     const value = resolveMapping(mapping.source, contact, organization);

//     if (
//       value === null ||
//       value === undefined ||
//       String(value).trim() === ""
//     ) {
//       throw new Error(
//         `Missing value for template placeholder {{${mapping.position}}}.`
//       );
//     }

//     return {
//       type: "text",
//       text: String(value),
//     };
//   });

//   return parameters.length
//     ? [{ type: "body", parameters }]
//     : [];
// }

// /* GET CAMPAIGNS */

// router.get("/", async (req, res, next) => {
//   try {
//     const { data, error } = await supabase
//       .from("campaigns")
//       .select("*")
//       .eq("organization_id", req.organizationId)
//       .order("created_at", { ascending: false });

//     throwIfError(error);
//     res.json({ data: data || [] });
//   } catch (error) {
//     next(error);
//   }
// });

// /* CREATE CAMPAIGN */

// router.post("/", async (req, res, next) => {
//   try {
//     const {
//       name,
//       template_name,
//       language = "en_US",
//       group_name = null,
//       scheduled_at = null,
//       contact_ids = [],
//     } = req.body || {};

//     if (!name?.trim() || !template_name?.trim()) {
//       return res.status(400).json({
//         error: "Campaign name and approved Meta template name are required.",
//       });
//     }

//     if (
//       !Array.isArray(contact_ids) ||
//       contact_ids.length > MAX_CONTACT_IDS
//     ) {
//       return res.status(400).json({
//         error: `contact_ids must be an array of up to ${MAX_CONTACT_IDS} contacts.`,
//       });
//     }

//     if (new Set(contact_ids).size !== contact_ids.length) {
//       return res.status(400).json({
//         error: "Duplicate contact IDs are not allowed.",
//       });
//     }

//     if (
//       scheduled_at &&
//       Number.isNaN(new Date(scheduled_at).getTime())
//     ) {
//       return res.status(400).json({
//         error: "scheduled_at must be a valid date.",
//       });
//     }

//     let eligibleContacts = [];

//     if (contact_ids.length > 0) {
//       const { data: contacts, error: contactsError } = await supabase
//         .from("contacts")
//         .select("id")
//         .eq("organization_id", req.organizationId)
//         .eq("opted_in", true)
//         .in("id", contact_ids);

//       throwIfError(contactsError);
//       eligibleContacts = contacts || [];
//     }

//     const row = {
//       organization_id: req.organizationId,
//       name: name.trim(),
//       template_name: template_name.trim(),
//       language,
//       group_name,
//       scheduled_at,
//       status: scheduled_at ? "scheduled" : "draft",
//       recipient_count: eligibleContacts.length,
//       created_by: req.user.id,
//     };

//     const { data: campaign, error: campaignError } = await supabase
//       .from("campaigns")
//       .insert(row)
//       .select()
//       .single();

//     throwIfError(campaignError);

//     if (eligibleContacts.length > 0) {
//       const messageRows = eligibleContacts.map((contact) => ({
//         organization_id: req.organizationId,
//         campaign_id: campaign.id,
//         contact_id: contact.id,
//         status: "queued",
//       }));

//       const { error: messagesError } = await supabase
//         .from("messages")
//         .insert(messageRows);

//       throwIfError(messagesError);
//     }

//     res.status(201).json({ data: campaign });
//   } catch (error) {
//     next(error);
//   }
// });

// /* SEND CAMPAIGN */

// router.post("/:id/send", async (req, res, next) => {
//   try {
//     const { data: campaign, error: campaignError } = await supabase
//       .from("campaigns")
//       .select("*")
//       .eq("organization_id", req.organizationId)
//       .eq("id", req.params.id)
//       .maybeSingle();

//     throwIfError(campaignError);

//     if (!campaign) {
//       return res.status(404).json({
//         error: "Campaign not found for this organization.",
//       });
//     }

//     if (
//       campaign.status === "scheduled" &&
//       campaign.scheduled_at &&
//       new Date(campaign.scheduled_at) > new Date()
//     ) {
//       return res.status(409).json({
//         error: "This campaign is scheduled for a future time.",
//       });
//     }

//     /*
//      * Find mappings belonging to this organization, template name
//      * and exact language.
//      */
//     const { data: savedTemplate, error: templateError } = await supabase
//       .from("templates")
//       .select("meta_name, language, variable_mappings, body")
//       .eq("organization_id", req.organizationId)
//       .eq("meta_name", campaign.template_name)
//       .eq("language", campaign.language)
//       .maybeSingle();

//     throwIfError(templateError);

//     if (!savedTemplate) {
//       return res.status(400).json({
//         error:
//           `No saved configuration was found for template "${campaign.template_name}" ` +
//           `with language "${campaign.language}" in this organization. ` +
//           "Open Templates, save the mappings for this existing Meta template, " +
//           "and then retry the campaign.",
//       });
//     }

//     const mappings = savedTemplate.variable_mappings;

//     if (!Array.isArray(mappings)) {
//       return res.status(400).json({
//         error: "Saved template variable mappings must be an array.",
//       });
//     }

//     if (typeof savedTemplate.body !== "string") {
//       return res.status(400).json({
//         error:
//           "The saved template body is missing. Refresh the template and save its mappings again.",
//       });
//     }

//     const { data: organization, error: organizationError } = await supabase
//       .from("organizations")
//       .select("name")
//       .eq("id", req.organizationId)
//       .single();

//     throwIfError(organizationError);

//     const { data: queued, error: queuedError } = await supabase
//       .from("messages")
//       .select("id, contact_id, contacts(id, name, phone, email, opted_in)")
//       .eq("organization_id", req.organizationId)
//       .eq("campaign_id", campaign.id)
//       .eq("status", "queued")
//       .limit(MAX_RECIPIENTS_PER_BATCH);

//     throwIfError(queuedError);

//     if (!queued?.length) {
//       return res.status(400).json({
//         error: "No queued opted-in recipients found for this campaign.",
//       });
//     }

//     const { error: runningError } = await supabase
//       .from("campaigns")
//       .update({ status: "running" })
//       .eq("organization_id", req.organizationId)
//       .eq("id", campaign.id);

//     throwIfError(runningError);

//     let sent = 0;
//     let failed = 0;

//     for (const item of queued) {
//       try {
//         const contact = item.contacts;

//         if (!contact) {
//           throw new Error("Recipient contact could not be found.");
//         }

//         if (!contact.opted_in) {
//           throw new Error("Recipient has not opted in.");
//         }

//         if (!contact.phone) {
//           throw new Error("Recipient phone number is missing.");
//         }

//         const components = prepareTemplateComponents(
//           mappings,
//           savedTemplate.body,
//           contact,
//           organization
//         );

//         const result = await sendTemplate({
//           to: contact.phone,
//           name: campaign.template_name,
//           language: campaign.language,
//           components,
//         });

//         const metaId = result?.messages?.[0]?.id || null;

//         const { error: updateMessageError } = await supabase
//           .from("messages")
//           .update({
//             status: "sent",
//             meta_message_id: metaId,
//             sent_at: new Date().toISOString(),
//             last_error: null,
//           })
//           .eq("organization_id", req.organizationId)
//           .eq("id", item.id);

//         throwIfError(updateMessageError);
//         sent++;
//       } catch (sendError) {
//         const message = String(
//           sendError?.message || sendError
//         ).slice(0, 500);

//         const { error: updateFailureError } = await supabase
//           .from("messages")
//           .update({
//             status: "failed",
//             last_error: message,
//           })
//           .eq("organization_id", req.organizationId)
//           .eq("id", item.id);

//         throwIfError(updateFailureError);
//         failed++;
//       }
//     }

//     const { count: remainingCount, error: remainingError } =
//       await supabase
//         .from("messages")
//         .select("id", { count: "exact", head: true })
//         .eq("organization_id", req.organizationId)
//         .eq("campaign_id", campaign.id)
//         .eq("status", "queued");

//     throwIfError(remainingError);

//     const hasMoreQueued = (remainingCount || 0) > 0;
//     const newSentCount = (campaign.sent_count || 0) + sent;
//     const newFailedCount = (campaign.failed_count || 0) + failed;

//     const finalStatus = hasMoreQueued
//       ? "running"
//       : newFailedCount > 0
//         ? "completed_with_errors"
//         : "completed";

//     const { error: updateCampaignError } = await supabase
//       .from("campaigns")
//       .update({
//         status: finalStatus,
//         sent_count: newSentCount,
//         failed_count: newFailedCount,
//       })
//       .eq("organization_id", req.organizationId)
//       .eq("id", campaign.id);

//     throwIfError(updateCampaignError);

//     res.json({
//       success: true,
//       processed: queued.length,
//       sent,
//       failed,
//       hasMoreQueued,
//       note: hasMoreQueued
//         ? "More messages remain queued. Send the campaign again to process the next batch."
//         : "All currently queued messages have been processed.",
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// /* GET CAMPAIGN MESSAGES */

// router.get("/:id/messages", async (req, res, next) => {
//   try {
//     const { data: campaign, error: campaignError } = await supabase
//       .from("campaigns")
//       .select("id")
//       .eq("organization_id", req.organizationId)
//       .eq("id", req.params.id)
//       .maybeSingle();

//     throwIfError(campaignError);

//     if (!campaign) {
//       return res.status(404).json({
//         error: "Campaign not found.",
//       });
//     }

//     const { data, error } = await supabase
//       .from("messages")
//       .select("*, contacts(name, phone)")
//       .eq("organization_id", req.organizationId)
//       .eq("campaign_id", campaign.id)
//       .order("created_at", { ascending: false })
//       .limit(1000);

//     throwIfError(error);
//     res.json({ data: data || [] });
//   } catch (error) {
//     next(error);
//   }
// });

// export default router;


import { Router } from "express";
import { supabase } from "../db.js";
import { sendTemplate } from "../services/metaWhatsApp.js";
import { config } from "../config.js";
const router = Router();

const MAX_RECIPIENTS_PER_BATCH = 500;
const MAX_CONTACT_IDS = 5000;

/* HELPERS */

function throwIfError(error) {
  if (error) throw error;
}

function resolveMapping(source, contact, organization) {
  switch (source) {
    case "contact.name":
      return contact.name;
    case "contact.email":
      return contact.email;
    case "organization.name":
      return organization.name;
    default:
      throw new Error(`Unsupported template variable source: ${source}`);
  }
}

function getPlaceholderPositions(body) {
  const positions = new Set();
  const regex = /\{\{(\d+)\}\}/g;
  let match;

  while ((match = regex.exec(String(body || ""))) !== null) {
    positions.add(Number(match[1]));
  }

  return [...positions].sort((a, b) => a - b);
}

function prepareTemplateComponents(
  mappings,
  templateBody,
  contact,
  organization
) {
  if (!Array.isArray(mappings)) {
    throw new Error("Template variable mappings must be an array.");
  }

  const actualPositions = getPlaceholderPositions(templateBody);

  const normalizedMappings = mappings.map((mapping) => ({
    position: Number(mapping.position),
    source: mapping.source,
  }));

  for (const mapping of normalizedMappings) {
    if (
      !Number.isInteger(mapping.position) ||
      mapping.position < 1 ||
      typeof mapping.source !== "string" ||
      !mapping.source.trim()
    ) {
      throw new Error("Invalid template variable mapping configuration.");
    }
  }

  const mappingPositions = normalizedMappings
    .map((mapping) => mapping.position)
    .sort((a, b) => a - b);

  if (new Set(mappingPositions).size !== mappingPositions.length) {
    throw new Error("Duplicate template variable positions were found.");
  }

  if (
    actualPositions.length !== mappingPositions.length ||
    actualPositions.some(
      (position, index) => position !== mappingPositions[index]
    )
  ) {
    throw new Error(
      "Saved template mappings do not match the placeholders in the template body. Save the correct mappings before sending."
    );
  }

  const sortedMappings = [...normalizedMappings].sort(
    (a, b) => a.position - b.position
  );

  const parameters = sortedMappings.map((mapping) => {
    const value = resolveMapping(mapping.source, contact, organization);

    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      throw new Error(
        `Missing value for template placeholder {{${mapping.position}}}.`
      );
    }

    return {
      type: "text",
      text: String(value),
    };
  });

  return parameters.length
    ? [{ type: "body", parameters }]
    : [];
}

/* GET CAMPAIGNS */

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("organization_id", req.organizationId)
      .order("created_at", { ascending: false });

    throwIfError(error);
    res.json({ data: data || [] });
  } catch (error) {
    next(error);
  }
});

/* CREATE CAMPAIGN */

router.post("/", async (req, res, next) => {
  try {
    const {
      name,
      template_name,
      language = "en_US",
      group_name = null,
      scheduled_at = null,
      contact_ids = [],
    } = req.body || {};

    if (!name?.trim() || !template_name?.trim()) {
      return res.status(400).json({
        error: "Campaign name and approved Meta template name are required.",
      });
    }

    if (
      !Array.isArray(contact_ids) ||
      contact_ids.length > MAX_CONTACT_IDS
    ) {
      return res.status(400).json({
        error: `contact_ids must be an array of up to ${MAX_CONTACT_IDS} contacts.`,
      });
    }

    if (new Set(contact_ids).size !== contact_ids.length) {
      return res.status(400).json({
        error: "Duplicate contact IDs are not allowed.",
      });
    }

    if (
      scheduled_at &&
      Number.isNaN(new Date(scheduled_at).getTime())
    ) {
      return res.status(400).json({
        error: "scheduled_at must be a valid date.",
      });
    }

    let eligibleContacts = [];

    if (contact_ids.length > 0) {
      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("id")
        .eq("organization_id", req.organizationId)
        .eq("opted_in", true)
        .in("id", contact_ids);

      throwIfError(contactsError);
      eligibleContacts = contacts || [];
    }

    const row = {
      organization_id: req.organizationId,
      name: name.trim(),
      template_name: template_name.trim(),
      language,
      group_name,
      scheduled_at,
      status: scheduled_at ? "scheduled" : "draft",
      recipient_count: eligibleContacts.length,
      created_by: req.user.id,
    };

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert(row)
      .select()
      .single();

    throwIfError(campaignError);

    if (eligibleContacts.length > 0) {
      const messageRows = eligibleContacts.map((contact) => ({
        organization_id: req.organizationId,
        campaign_id: campaign.id,
        contact_id: contact.id,
        status: "queued",
      }));

      const { error: messagesError } = await supabase
        .from("messages")
        .insert(messageRows);

      throwIfError(messagesError);
    }

    res.status(201).json({ data: campaign });
  } catch (error) {
    next(error);
  }
});

/* SEND CAMPAIGN */

router.post("/:id/send", async (req, res, next) => {
  try {
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("organization_id", req.organizationId)
      .eq("id", req.params.id)
      .maybeSingle();

    throwIfError(campaignError);

    if (!campaign) {
      return res.status(404).json({
        error: "Campaign not found for this organization.",
      });
    }

    if (
      campaign.status === "scheduled" &&
      campaign.scheduled_at &&
      new Date(campaign.scheduled_at) > new Date()
    ) {
      return res.status(409).json({
        error: "This campaign is scheduled for a future time.",
      });
    }

    /*
     * Find mappings belonging to this organization, template name
     * and exact language.
     */
    const { data: savedTemplate, error: templateError } = await supabase
      .from("templates")
      .select("meta_name, language, variable_mappings, body")
      .eq("organization_id", req.organizationId)
      .eq("meta_name", campaign.template_name)
      .eq("language", campaign.language)
      .maybeSingle();

    throwIfError(templateError);

    if (!savedTemplate) {
      return res.status(400).json({
        error:
          `No saved configuration was found for template "${campaign.template_name}" ` +
          `with language "${campaign.language}" in this organization. ` +
          "Open Templates, save the mappings for this existing Meta template, " +
          "and then retry the campaign.",
      });
    }

    const mappings = savedTemplate.variable_mappings;

    if (!Array.isArray(mappings)) {
      return res.status(400).json({
        error: "Saved template variable mappings must be an array.",
      });
    }

    if (typeof savedTemplate.body !== "string") {
      return res.status(400).json({
        error:
          "The saved template body is missing. Refresh the template and save its mappings again.",
      });
    }

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", req.organizationId)
      .single();

    throwIfError(organizationError);

    const { data: queued, error: queuedError } = await supabase
      .from("messages")
      .select("id, contact_id, contacts(id, name, phone, email, opted_in)")
      .eq("organization_id", req.organizationId)
      .eq("campaign_id", campaign.id)
      .eq("status", "queued")
      .limit(MAX_RECIPIENTS_PER_BATCH);

    throwIfError(queuedError);

    if (!queued?.length) {
      return res.status(400).json({
        error: "No queued opted-in recipients found for this campaign.",
      });
    }

    const { error: runningError } = await supabase
      .from("campaigns")
      .update({ status: "running" })
      .eq("organization_id", req.organizationId)
      .eq("id", campaign.id);

    throwIfError(runningError);

    let sent = 0;
    let failed = 0;

    for (const item of queued) {
      try {
        const contact = item.contacts;

        if (!contact) {
          throw new Error("Recipient contact could not be found.");
        }

        if (!contact.opted_in) {
          throw new Error("Recipient has not opted in.");
        }

        if (!contact.phone) {
          throw new Error("Recipient phone number is missing.");
        }

        const components = prepareTemplateComponents(
          mappings,
          savedTemplate.body,
          contact,
          organization
        );

        const result = await sendTemplate({
  to: contact.phone,
  name: campaign.template_name,
  language: campaign.language,
  components,
});

const metaId = result?.messages?.[0]?.id || null;
const sentAt = result.sentAt || new Date().toISOString();

const { error: updateMessageError } = await supabase
  .from("messages")
  .update({
    status: "sent",
    meta_message_id: metaId,
    direction: "outgoing",
    message_type: "template",
    message_body: savedTemplate.body,
    message_timestamp: sentAt,
    sender_phone: config.metaPhoneNumberId || null,
    recipient_phone: contact.phone,
    sent_at: sentAt,
    last_error: null,
  })
  .eq("organization_id", req.organizationId)
  .eq("id", item.id);

throwIfError(updateMessageError);
sent++;
      } catch (sendError) {
        const message = String(
          sendError?.message || sendError
        ).slice(0, 500);

        const { error: updateFailureError } = await supabase
          .from("messages")
          .update({
            status: "failed",
            last_error: message,
          })
          .eq("organization_id", req.organizationId)
          .eq("id", item.id);

        throwIfError(updateFailureError);
        failed++;
      }
    }

    const { count: remainingCount, error: remainingError } =
      await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", req.organizationId)
        .eq("campaign_id", campaign.id)
        .eq("status", "queued");

    throwIfError(remainingError);

    const hasMoreQueued = (remainingCount || 0) > 0;
    const newSentCount = (campaign.sent_count || 0) + sent;
    const newFailedCount = (campaign.failed_count || 0) + failed;

    const finalStatus = hasMoreQueued
      ? "running"
      : newFailedCount > 0
        ? "completed_with_errors"
        : "completed";

    const { error: updateCampaignError } = await supabase
      .from("campaigns")
      .update({
        status: finalStatus,
        sent_count: newSentCount,
        failed_count: newFailedCount,
      })
      .eq("organization_id", req.organizationId)
      .eq("id", campaign.id);

    throwIfError(updateCampaignError);

    res.json({
      success: true,
      processed: queued.length,
      sent,
      failed,
      hasMoreQueued,
      note: hasMoreQueued
        ? "More messages remain queued. Send the campaign again to process the next batch."
        : "All currently queued messages have been processed.",
    });
  } catch (error) {
    next(error);
  }
});

/* GET CAMPAIGN MESSAGES */

router.get("/:id/messages", async (req, res, next) => {
  try {
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("organization_id", req.organizationId)
      .eq("id", req.params.id)
      .maybeSingle();

    throwIfError(campaignError);

    if (!campaign) {
      return res.status(404).json({
        error: "Campaign not found.",
      });
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*, contacts(name, phone)")
      .eq("organization_id", req.organizationId)
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false })
      .limit(1000);

    throwIfError(error);
    res.json({ data: data || [] });
  } catch (error) {
    next(error);
  }
});

export default router;