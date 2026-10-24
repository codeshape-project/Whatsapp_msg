
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

import { useEffect, useState } from "react";
import {
  Plus,
  X,
  Send,
  CalendarClock,
  Save,
  Eye,
  Users,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const initialForm = {
  name: "",
  template: "",
  group: "All Contacts",
  scheduledAt: "",
};

function Button({
  children,
  onClick,
  variant = "secondary",
  type = "button",
  disabled = false,
}) {
  const styles = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800",
    secondary:
      "border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50",
    schedule: "bg-blue-700 text-white hover:bg-blue-800",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export default function Campaigns() {
  const { organization } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [allContacts, setAllContacts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [action, setAction] = useState("draft");

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [dataError, setDataError] = useState("");

  const [branches, setBranches] = useState([]);
const [departments, setDepartments] = useState([]);
const [selectedBranch, setSelectedBranch] = useState("");

  // Load real templates, contacts and campaign history.
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setDataError("");

      try {
        if (!api.isBackendEnabled) {
          throw new Error(
            "Backend mode is disabled. Configure Supabase authentication and the backend before using real campaigns."
          );
        }

        if (!organization?.id) {
          throw new Error("Select a valid organization before continuing.");
        }

       const [templates, contacts, campaignData] = await Promise.all([
  api.getTemplates(),
  api.getContacts(),
  api.getCampaigns(),
]);

if (cancelled) return;

console.log("Templates loaded:", templates);
console.log("Contacts loaded:", contacts);
console.log("Campaigns loaded:", campaignData);

setAllTemplates(Array.isArray(templates) ? templates : []);
setAllContacts(Array.isArray(contacts) ? contacts : []);
setCampaigns(Array.isArray(campaignData) ? campaignData : []);
      } catch (err) {
        if (!cancelled) {
          setDataError(
            err.message || "Could not load campaign data from the backend."
          );
          setAllTemplates([]);
          setAllContacts([]);
          setCampaigns([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setForm(initialForm);
    setNotice("");
    setError("");

    loadData();

    return () => {
      cancelled = true;
    };
  }, [organization?.id]);

  const approvedTemplates = allTemplates.filter(
    (template) =>
      template.status === "Approved" ||
      template.status === "APPROVED"
  );

  const selectedTemplate = approvedTemplates.find(
    (template) => template.name === form.template
  );

  // Only contacts with recorded opt-in consent are eligible.
  const optedInContacts = allContacts.filter(
    (contact) => contact.opted_in === true
     
  );
  console.log("All contacts:", allContacts);
console.log("Total contacts:", allContacts.length);
console.log(
  "Opted-in contacts:",
  allContacts.filter((contact) => contact.opted_in === true).length
);

  const contactGroups = [
    ...new Set([
      "All Contacts",
      ...optedInContacts
        .map((contact) => contact.group_name || contact.group)
        .filter(Boolean),
    ]),
  ];

  const recipients =
    form.group === "All Contacts"
      ? optedInContacts
      : optedInContacts.filter(
          (contact) =>
            (contact.group_name || contact.group) === form.group
        );

  const update = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const openModal = () => {
    setForm({
      ...initialForm,
      template: approvedTemplates[0]?.name || "",
    });

    setAction("draft");
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setModalOpen(false);
    setForm(initialForm);
    setAction("draft");
    setError("");
  };

  // Pass the requested action directly to avoid stale React state.
  const submitCampaign = async (requestedAction) => {
    if (submitting) return;

    setError("");
    setNotice("");

    if (!api.isBackendEnabled) {
      setError("Backend mode is disabled. Real sending is unavailable.");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter a campaign name.");
      return;
    }

    if (!selectedTemplate) {
      setError("Please select an approved Meta template.");
      return;
    }

    if (requestedAction === "schedule") {
      if (!form.scheduledAt) {
        setAction("schedule");
        setError("Please select the date and time for scheduling.");
        return;
      }

      if (new Date(form.scheduledAt).getTime() <= Date.now()) {
        setAction("schedule");
        setError("Please select a future date and time.");
        return;
      }
    }

    if (!recipients.length) {
      setError(
        "No opted-in contacts were found in this group. Check your contact group and consent records."
      );
      return;
    }

    setSubmitting(true);

    try {
      // Refresh contacts before creating the campaign.
      const backendContacts = await api.getContacts();

      const eligible = (backendContacts || []).filter(
        (contact) =>
          contact.opted_in === true &&
          (requestedAction === "send" ||
            requestedAction === "draft" ||
            requestedAction === "schedule") &&
          (form.group === "All Contacts" ||
            (contact.group_name || contact.group) === form.group)
      );

      if (!eligible.length) {
        throw new Error(
          "No opted-in contacts found for this group in the database."
        );
      }

      const created = await api.createCampaign({
        name: form.name.trim(),
        template_name: selectedTemplate.name,
        language: selectedTemplate.language || "en_US",
        group_name: form.group,
        scheduled_at:
          requestedAction === "schedule"
            ? new Date(form.scheduledAt).toISOString()
            : null,
        contact_ids: eligible.map((contact) => contact.id),
      });

      if (!created?.data?.id) {
        throw new Error(
          "The backend did not return a campaign ID."
        );
      }

      let sendResult = null;

      if (requestedAction === "send") {
        sendResult = await api.sendCampaign(created.data.id);
      }

      // Always refresh from the database; do not guess message counts.
      const refreshedCampaigns = await api.getCampaigns();
      setCampaigns(
        Array.isArray(refreshedCampaigns) ? refreshedCampaigns : []
      );

      setModalOpen(false);
      setForm(initialForm);
      setAction("draft");

      if (requestedAction === "send") {
        const sent = Number(sendResult?.sent ?? 0);
        const failed = Number(sendResult?.failed ?? 0);
        const processed = Number(sendResult?.processed ?? sent + failed);
        const hasMore = Boolean(sendResult?.hasMoreQueued);

        if (hasMore) {
          setNotice(
            `This batch processed ${processed} recipient(s): ${sent} accepted by Meta and ${failed} failed. More recipients may still be queued.`
          );
        } else if (failed > 0) {
          setNotice(
            `Campaign processed: ${sent} message(s) accepted by Meta and ${failed} failed. Check the backend message records for failure details.`
          );
        } else {
          setNotice(
            `${sent} message(s) accepted by Meta for processing. Actual delivery and read status depend on webhook updates.`
          );
        }
      } else if (requestedAction === "schedule") {
        setNotice(
          "Campaign schedule saved to the database. Automatic sending requires a configured backend scheduler."
        );
      } else {
        setNotice("Campaign draft saved to the database.");
      }
    } catch (err) {
      setError(err.message || "Could not process the campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-emerald-800">
        Loading campaigns...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-emerald-950">
            Campaigns
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Create, send, schedule, and manage WhatsApp campaigns.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openModal}
          disabled={Boolean(dataError)}
        >
          <Plus size={17} /> New Campaign
        </Button>
      </div>

      {dataError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-semibold">Could not load campaign data</p>
          <p className="mt-1">{dataError}</p>
        </div>
      )}

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>{notice}</p>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100 px-5 py-4">
          <h3 className="font-semibold text-emerald-950">
            Campaign History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-emerald-50 text-emerald-950">
              <tr>
                {[
                  "Campaign",
                  "Template",
                  "Recipients",
                  "Sent",
                  "Delivered",
                  "Read",
                  "Failed",
                  "Status",
                  "Schedule",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-emerald-50">
              {campaigns.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No campaigns yet. Click New Campaign to begin.
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign, index) => (
                  <tr
                    key={campaign.id || index}
                    className="hover:bg-emerald-50/40"
                  >
                    <td className="px-4 py-3 font-medium text-emerald-950">
                      {campaign.name}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.template || campaign.template_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.recipients ?? campaign.recipient_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.sent ?? campaign.sent_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.delivered ?? campaign.delivered_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.read ?? campaign.read_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.failed ?? campaign.failed_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        {campaign.status || "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {campaign.scheduledAt || campaign.scheduled_at
                        ? new Date(
                            campaign.scheduledAt || campaign.scheduled_at
                          ).toLocaleString("en-IN")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="my-auto max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-emerald-950">
                  New Campaign
                </h3>
                <p className="text-xs text-slate-500">
                  Configure your message and delivery time
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 disabled:opacity-50"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitCampaign(action);
              }}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Campaign Name *
                </label>
                <input
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  placeholder="e.g. Festival Offer"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  WhatsApp Template *
                </label>
                <select
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600"
                  value={form.template}
                  onChange={(event) => update("template", event.target.value)}
                  required
                >
                  <option value="">Choose approved template</option>
                  {approvedTemplates.map((template) => (
                    <option
                      key={template.id || template.name}
                      value={template.name}
                    >
                      {template.name}
                    </option>
                  ))}
                </select>

                {selectedTemplate && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-950">
                      <Eye size={16} /> Message Preview
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {selectedTemplate.body ||
                        selectedTemplate.content ||
                        "Template body is not available."}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {selectedTemplate.category || "Template"} ·{" "}
                      {selectedTemplate.language || "Language not specified"}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Contact Group *
                </label>
                <select
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600"
                  value={form.group}
                  onChange={(event) => update("group", event.target.value)}
                >
                  {contactGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>

                <div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
                  <Users className="text-emerald-800" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">
                      {recipients.length} opted-in recipient(s)
                    </p>
                    <p className="text-xs text-slate-500">
                      Based on contacts loaded from your backend
                    </p>
                  </div>
                </div>
              </div>

              {action === "schedule" && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                    Schedule Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 outline-none focus:border-emerald-600"
                    min={new Date(
                      Date.now() - new Date().getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16)}
                    value={form.scheduledAt}
                    onChange={(event) =>
                      update("scheduledAt", event.target.value)
                    }
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Choose a future date and time.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  {error}
                </div>
              )}

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                Messages are submitted through your configured backend and Meta
                WhatsApp Cloud API. Scheduled campaigns require a working
                backend scheduler. Only send messages to contacts who have
                consented to receive them.
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-emerald-100 pt-4">
                <Button onClick={closeModal} disabled={submitting}>
                  Cancel
                </Button>

                <Button
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => submitCampaign("draft")}
                >
                  <Save size={16} />
                  {submitting && action === "draft"
                    ? "Saving..."
                    : "Save Draft"}
                </Button>

                <Button
                  variant="schedule"
                  disabled={submitting}
                  onClick={() => {
                    setAction("schedule");

                    if (!form.scheduledAt) {
                      setError("Select a future date and time.");
                      return;
                    }

                    submitCampaign("schedule");
                  }}
                >
                  <CalendarClock size={16} />
                  Schedule Message
                </Button>

                <Button
                  variant="primary"
                  disabled={submitting}
                  onClick={() => submitCampaign("send")}
                >
                  <Send size={16} />
                  {submitting ? "Processing..." : "Send Now"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

