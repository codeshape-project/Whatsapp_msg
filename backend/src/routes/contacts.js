
// // import { Router } from 'express';
// // import multer from 'multer';
// // import * as XLSX from 'xlsx';

// // import { supabase } from '../db.js';
// // import { config } from '../config.js';
// // import { normalizePhone } from '../utils/phone.js';

// // const router = Router();

// // const upload = multer({
// //   storage: multer.memoryStorage(),
// //   limits: {
// //     fileSize: 8 * 1024 * 1024,
// //     files: 1,
// //   },
// // });

// // /* ================= HELPERS ================= */

// // function throwIfError(error) {
// //   if (error) throw error;
// // }

// // function normalizeConsent(value) {
// //   return ['true', 'yes', '1'].includes(
// //     String(value ?? '').trim().toLowerCase()
// //   );
// // }

// // function normalizeHeaders(row) {
// //   return Object.fromEntries(
// //     Object.entries(row).map(([key, value]) => [
// //       String(key).replace(/^\uFEFF/, '').trim().toLowerCase(),
// //       value,
// //     ])
// //   );
// // }

// // function firstValue(row, keys) {
// //   for (const key of keys) {
// //     const value = row[key];

// //     if (value !== undefined && value !== null && String(value).trim() !== '') {
// //       return value;
// //     }
// //   }

// //   return '';
// // }

// // /* ================= GET CONTACTS ================= */

// // router.get('/', async (req, res, next) => {
// //   try {
// //     const {
// //       q = '',
// //       group = '',
// //       page = '1',
// //       limit = '100',
// //     } = req.query;

// //     let query = supabase
// //       .from('contacts')
// //       .select('*', { count: 'exact' })
// //       .eq('organization_id', req.organizationId)
// //       .order('created_at', { ascending: false });

// //     if (group) {
// //       query = query.eq('group_name', group);
// //     }

// //     if (q) {
// //       const safeQuery = String(q).replace(/[(),]/g, '');

// //       query = query.or(
// //         `name.ilike.%${safeQuery}%,phone.ilike.%${safeQuery}%`
// //       );
// //     }

// //     const currentPage = Math.max(1, Number(page) || 1);
// //     const pageLimit = Math.min(250, Math.max(1, Number(limit) || 100));

// //     const { data, error, count } = await query.range(
// //       (currentPage - 1) * pageLimit,
// //       currentPage * pageLimit - 1
// //     );

// //     throwIfError(error);

// //     res.json({
// //       data: data || [],
// //       total: count || 0,
// //       page: currentPage,
// //       limit: pageLimit,
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // /* ================= CREATE OR UPDATE CONTACT ================= */

// // router.post('/', async (req, res, next) => {
// //   try {
// //     const {
// //       id,
// //       name,
// //       phone,
// //       email = null,
// //       group_name = null,
// //       opted_in = false,
// //     } = req.body || {};

// //     if (typeof opted_in !== 'boolean') {
// //       return res.status(400).json({
// //         error: 'opted_in must be true or false.',
// //       });
// //     }

// //     if (!String(name ?? '').trim()) {
// //       return res.status(400).json({
// //         error: 'Contact name is required.',
// //       });
// //     }

// //     const normalized = normalizePhone(phone);

// //     if (!normalized) {
// //       return res.status(400).json({
// //         error: 'Name and a valid phone number are required.',
// //       });
// //     }

// //     const row = {
// //       organization_id: req.organizationId,
// //       name: String(name).trim(),
// //       phone: normalized,
// //       email: email ? String(email).trim() : null,
// //       group_name: group_name ? String(group_name).trim() : null,
// //       opted_in,
// //       consent_source: opted_in ? 'manual_contact_form' : null,
// //       consent_updated_at: opted_in ? new Date().toISOString() : null,
// //     };

// //     let result;

// //     if (id) {
// //       result = await supabase
// //         .from('contacts')
// //         .update(row)
// //         .eq('organization_id', req.organizationId)
// //         .eq('id', id)
// //         .select()
// //         .single();
// //     } else {
// //       result = await supabase
// //         .from('contacts')
// //         .upsert(row, {
// //           onConflict: 'organization_id,phone',
// //         })
// //         .select()
// //         .single();
// //     }

// //     throwIfError(result.error);

// //     res.status(id ? 200 : 201).json({
// //       data: result.data,
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // /* ================= DELETE CONTACT ================= */

// // router.delete('/:id', async (req, res, next) => {
// //   try {
// //     const { data, error } = await supabase
// //       .from('contacts')
// //       .delete()
// //       .eq('organization_id', req.organizationId)
// //       .eq('id', req.params.id)
// //       .select('id');

// //     throwIfError(error);

// //     if (!data?.length) {
// //       return res.status(404).json({
// //         error: 'Contact not found.',
// //       });
// //     }

// //     res.json({ success: true });
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // /* ================= UPDATE CONSENT ================= */

// // router.patch('/:id/consent', async (req, res, next) => {
// //   try {
// //     const { opted_in, source } = req.body || {};

// //     if (typeof opted_in !== 'boolean') {
// //       return res.status(400).json({
// //         error: 'opted_in must be true or false.',
// //       });
// //     }

// //     if (opted_in && !String(source || '').trim()) {
// //       return res.status(400).json({
// //         error: 'A consent source is required when confirming opt-in.',
// //       });
// //     }

// //     const { data, error } = await supabase
// //       .from('contacts')
// //       .update({
// //         opted_in,
// //         consent_source: opted_in ? String(source).trim() : null,
// //         consent_updated_at: new Date().toISOString(),
// //       })
// //       .eq('organization_id', req.organizationId)
// //       .eq('id', req.params.id)
// //       .select()
// //       .single();

// //     throwIfError(error);

// //     res.json({ data });
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // /* ================= IMPORT EXCEL OR CSV ================= */

// // router.post('/import', upload.single('file'), async (req, res, next) => {
// //   try {

// //     const selectedDepartment = String(
// //       req.body?.department_name || ''
// //     ).trim();

// //     if (!req.file) {
// //       return res.status(400).json({
// //         error: 'Choose an Excel or CSV file first.',
// //       });
// //     }

// //     const extension = req.file.originalname
// //       .toLowerCase()
// //       .split('.')
// //       .pop();

// //     if (!['xlsx', 'xls', 'csv'].includes(extension)) {
// //       return res.status(415).json({
// //         error: 'Only .xlsx, .xls and .csv files are supported.',
// //       });
// //     }

// //     const workbook = XLSX.read(req.file.buffer, {
// //       type: 'buffer',
// //     });

// //     const sheet = workbook.Sheets[workbook.SheetNames[0]];

// //     if (!sheet) {
// //       return res.status(400).json({
// //         error: 'The spreadsheet has no readable worksheet.',
// //       });
// //     }

// //     const rows = XLSX.utils.sheet_to_json(sheet, {
// //       defval: '',
// //     });

// //     if (rows.length === 0) {
// //       return res.status(400).json({
// //         error: 'The spreadsheet contains no contact rows.',
// //       });
// //     }

// //     if (rows.length > config.maxImportRows) {
// //       return res.status(413).json({
// //         error: `Maximum ${config.maxImportRows} rows per import.`,
// //       });
// //     }

// //     const accepted = [];
// //     const invalid = [];
// //     const seen = new Set();

// //     for (let index = 0; index < rows.length; index++) {
// //       const lower = normalizeHeaders(rows[index]);

// //       // Supports the existing Excel headers:
// //       // Name, WhatsApp Number, Group, S.No
// //       const name = String(
// //         firstValue(lower, [
// //           'name',
// //           'full_name',
// //           'full name',
// //           'contact',
// //           'contact name',
// //         ])
// //       ).trim();

// //       const rawPhone = firstValue(lower, [
// //         'phone',
// //         'phone number',
// //         'mobile',
// //         'mobile number',
// //         'whatsapp',
// //         'whatsapp number',
// //         'whatsapp_number',
// //         'whatsapp no',
// //         'whatsapp no.',
// //         'contact number',
// //         'number',
// //       ]);

// //       const phone = normalizePhone(rawPhone);

// //       if (!name || !phone) {
// //         invalid.push({
// //           row: index + 2,
// //           reason: !name
// //             ? 'Name is missing'
// //             : 'Phone number is missing or invalid',
// //         });
// //         continue;
// //       }

// //       if (seen.has(phone)) {
// //         invalid.push({
// //           row: index + 2,
// //           reason: 'Duplicate phone number in this file',
// //         });
// //         continue;
// //       }

// //       seen.add(phone);

// //       // A phone number alone is not evidence of WhatsApp consent.
// //       // Opt-in requires an explicit value and a consent source.
// //       const optedIn = normalizeConsent(
// //         firstValue(lower, [
// //           'opted_in',
// //           'opted in',
// //           'whatsapp_consent',
// //           'whatsapp consent',
// //         ])
// //       );

// //       const consentSource = String(
// //         firstValue(lower, [
// //           'consent_source',
// //           'consent source',
// //         ])
// //       ).trim();

// //       const consentConfirmed = optedIn && Boolean(consentSource);

// //      const group = selectedDepartment ||
// //   String(
// //     firstValue(lower, ['group', 'group_name', 'group name'])
// //   ).trim();

// //       const email = String(
// //         firstValue(lower, ['email', 'email address'])
// //       ).trim();

// //       accepted.push({
// //         organization_id: req.organizationId,
// //         name,
// //         phone,
// //         email: email || null,
// //         group_name: group || null,
// //         opted_in: consentConfirmed,
// //         consent_source: consentConfirmed ? consentSource : null,
// //         consent_updated_at: consentConfirmed
// //           ? new Date().toISOString()
// //           : null,
// //       });
// //     }

// //     if (accepted.length === 0) {
// //       return res.status(400).json({
// //         error: 'No valid contacts were found.',
// //         received: rows.length,
// //         invalidCount: invalid.length,
// //         invalid: invalid.slice(0, 100),
// //         supportedColumns: [
// //           'Name',
// //           'WhatsApp Number',
// //           'Group',
// //           'Email',
// //           'opted_in',
// //           'consent_source',
// //         ],
// //       });
// //     }

// //     const { data, error } = await supabase
// //       .from('contacts')
// //       .upsert(accepted, {
// //         onConflict: 'organization_id,phone',
// //       })
// //       .select('id');

// //     throwIfError(error);

// //     res.json({
// //       success: true,
// //       received: rows.length,
// //       imported: data?.length || 0,
// //       invalidCount: invalid.length,
// //       invalid: invalid.slice(0, 100),
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // });
// // // Confirm phone-number format for all contacts in the organization.
// // // This does NOT automatically confirm WhatsApp consent.
// // router.post('/validate-all', async (req, res, next) => {
// //   try {
// //     const { data: contacts, error } = await supabase
// //       .from('contacts')
// //       .select('id, phone')
// //       .eq('organization_id', req.organizationId);

// //     throwIfError(error);

// //     let validCount = 0;
// //     let invalidCount = 0;

// //     for (const contact of contacts || []) {
// //       let digits = String(contact.phone || '').trim().replace(/\D/g, '');

// //       if (String(contact.phone || '').trim().startsWith('00')) {
// //         digits = digits.slice(2);
// //       }

// //       const isValid =
// //         digits.length === 10
// //           ? /^[6-9]\d{9}$/.test(digits)
// //           : digits.startsWith('91')
// //             ? /^91[6-9]\d{9}$/.test(digits)
// //             : digits.length >= 8 &&
// //               digits.length <= 15 &&
// //               !digits.startsWith('0');

// //       const { error: updateError } = await supabase
// //         .from('contacts')
// //         .update({
// //   phone_valid: isValid,
// //   ...(isValid
// //     ? {
// //         opted_in: true,
// //         consent_source: "verified_existing_consent",
// //         consent_updated_at: new Date().toISOString(),
// //       }
// //     : {}),
// // })
// //         .eq('organization_id', req.organizationId)
// //         .eq('id', contact.id);

// //       throwIfError(updateError);

// //       if (isValid) validCount++;
// //       else invalidCount++;
// //     }

// //     res.json({
// //       success: true,
// //       total: (contacts || []).length,
// //       validCount,
// //       invalidCount,
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // /* ================= GET CONTACT WHATSAPP HISTORY ================= */

// // router.get("/:contactId/messages", async (req, res, next) => {
// //   try {
// //     const { contactId } = req.params;

// //     const { data: contact, error: contactError } = await supabase
// //       .from("contacts")
// //       .select("id, name, phone")
// //       .eq("organization_id", req.organizationId)
// //       .eq("id", contactId)
// //       .maybeSingle();

// //     if (contactError) throw contactError;

// //     if (!contact) {
// //       return res.status(404).json({
// //         error: "Contact not found for this organization.",
// //       });
// //     }

// //     const { data: messages, error: messagesError } = await supabase
// //       .from("messages")
// //       .select(`
// //         id,
// //         campaign_id,
// //         contact_id,
// //         status,
// //         meta_message_id,
// //         direction,
// //         message_type,
// //         message_body,
// //         message_timestamp,
// //         sender_phone,
// //         recipient_phone,
// //         sent_at,
// //         delivered_at,
// //         read_at,
// //         last_error,
// //         created_at,
// //         updated_at
// //       `)
// //       .eq("organization_id", req.organizationId)
// //       .eq("contact_id", contact.id)
// //       .order("message_timestamp", { ascending: false, nullsFirst: false })
// //       .order("created_at", { ascending: false })
// //       .limit(500);

// //     if (messagesError) throw messagesError;

// //     return res.json({
// //       data: messages || [],
// //       contact,
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // });
// // export default router;

// import { Router } from 'express';
// import multer from 'multer';
// import * as XLSX from 'xlsx';

// import { supabase } from '../db.js';
// import { config } from '../config.js';
// import { normalizePhone } from '../utils/phone.js';

// const router = Router();

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 8 * 1024 * 1024,
//     files: 1,
//   },
// });

// /* ================= HELPERS ================= */

// function throwIfError(error) {
//   if (error) throw error;
// }

// function normalizeConsent(value) {
//   return ['true', 'yes', '1'].includes(
//     String(value ?? '').trim().toLowerCase()
//   );
// }

// function normalizeHeaders(row) {
//   return Object.fromEntries(
//     Object.entries(row).map(([key, value]) => [
//       String(key).replace(/^\uFEFF/, '').trim().toLowerCase(),
//       value,
//     ])
//   );
// }

// function firstValue(row, keys) {
//   for (const key of keys) {
//     const value = row[key];

//     if (value !== undefined && value !== null && String(value).trim() !== '') {
//       return value;
//     }
//   }

//   return '';
// }

// // Looks up an active department that belongs to this organization.
// // Returns null when no id is given or the department does not exist.
// async function findDepartment(organizationId, departmentId) {
//   const id = String(departmentId ?? '').trim();

//   if (!id) return null;

//   const { data, error } = await supabase
//     .from('departments')
//     .select('id, name, branch_id')
//     .eq('organization_id', organizationId)
//     .eq('id', id)
//     .eq('is_active', true)
//     .maybeSingle();

//   throwIfError(error);

//   return data || null;
// }

// /* ================= GET CONTACTS ================= */

// router.get('/', async (req, res, next) => {
//   try {
//     const {
//       q = '',
//       group = '',
//       page = '1',
//       limit = '100',
//     } = req.query;

//     let query = supabase
//       .from('contacts')
//       .select('*', { count: 'exact' })
//       .eq('organization_id', req.organizationId)
//       .order('created_at', { ascending: false });

//     if (group) {
//       query = query.eq('group_name', group);
//     }

//     if (q) {
//       const safeQuery = String(q).replace(/[(),]/g, '');

//       query = query.or(
//         `name.ilike.%${safeQuery}%,phone.ilike.%${safeQuery}%`
//       );
//     }

//     const currentPage = Math.max(1, Number(page) || 1);
//     const pageLimit = Math.min(250, Math.max(1, Number(limit) || 100));

//     const { data, error, count } = await query.range(
//       (currentPage - 1) * pageLimit,
//       currentPage * pageLimit - 1
//     );

//     throwIfError(error);

//     res.json({
//       data: data || [],
//       total: count || 0,
//       page: currentPage,
//       limit: pageLimit,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// /* ================= CREATE OR UPDATE CONTACT ================= */

// router.post('/', async (req, res, next) => {
//   try {
//     const {
//       id,
//       name,
//       phone,
//       email = null,
//       group_name = null,
//       department_id = null,
//       opted_in = false,
//     } = req.body || {};

//     if (typeof opted_in !== 'boolean') {
//       return res.status(400).json({
//         error: 'opted_in must be true or false.',
//       });
//     }

//     if (!String(name ?? '').trim()) {
//       return res.status(400).json({
//         error: 'Contact name is required.',
//       });
//     }

//     const normalized = normalizePhone(phone);

//     if (!normalized) {
//       return res.status(400).json({
//         error: 'Name and a valid phone number are required.',
//       });
//     }

//     // Department decides group_name and branch_id. The values come from the
//     // database, not from whatever the browser sent.
//     let department = null;

//     if (department_id) {
//       department = await findDepartment(req.organizationId, department_id);

//       if (!department) {
//         return res.status(400).json({
//           error: 'Selected department was not found.',
//         });
//       }
//     }

//     const row = {
//       organization_id: req.organizationId,
//       name: String(name).trim(),
//       phone: normalized,
//       email: email ? String(email).trim() : null,
//       group_name: department
//         ? department.name
//         : group_name
//           ? String(group_name).trim()
//           : null,
//       department_id: department ? department.id : null,
//       branch_id: department ? department.branch_id ?? null : null,
//       opted_in,
//       consent_source: opted_in ? 'manual_contact_form' : null,
//       consent_updated_at: opted_in ? new Date().toISOString() : null,
//     };

//     let result;

//     if (id) {
//       result = await supabase
//         .from('contacts')
//         .update(row)
//         .eq('organization_id', req.organizationId)
//         .eq('id', id)
//         .select()
//         .single();
//     } else {
//       result = await supabase
//         .from('contacts')
//         .upsert(row, {
//           onConflict: 'organization_id,phone',
//         })
//         .select()
//         .single();
//     }

//     throwIfError(result.error);

//     res.status(id ? 200 : 201).json({
//       data: result.data,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// /* ================= DELETE CONTACT ================= */

// router.delete('/:id', async (req, res, next) => {
//   try {
//     const { data, error } = await supabase
//       .from('contacts')
//       .delete()
//       .eq('organization_id', req.organizationId)
//       .eq('id', req.params.id)
//       .select('id');

//     throwIfError(error);

//     if (!data?.length) {
//       return res.status(404).json({
//         error: 'Contact not found.',
//       });
//     }

//     res.json({ success: true });
//   } catch (error) {
//     next(error);
//   }
// });

// /* ================= UPDATE CONSENT ================= */

// router.patch('/:id/consent', async (req, res, next) => {
//   try {
//     const { opted_in, source } = req.body || {};

//     if (typeof opted_in !== 'boolean') {
//       return res.status(400).json({
//         error: 'opted_in must be true or false.',
//       });
//     }

//     if (opted_in && !String(source || '').trim()) {
//       return res.status(400).json({
//         error: 'A consent source is required when confirming opt-in.',
//       });
//     }

//     const { data, error } = await supabase
//       .from('contacts')
//       .update({
//         opted_in,
//         consent_source: opted_in ? String(source).trim() : null,
//         consent_updated_at: new Date().toISOString(),
//       })
//       .eq('organization_id', req.organizationId)
//       .eq('id', req.params.id)
//       .select()
//       .single();

//     throwIfError(error);

//     res.json({ data });
//   } catch (error) {
//     next(error);
//   }
// });

// /* ================= IMPORT EXCEL OR CSV ================= */

// router.post('/import', upload.single('file'), async (req, res, next) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         error: 'Choose an Excel or CSV file first.',
//       });
//     }

//     // The department chosen in the import popup is required.
//     const departmentId = String(req.body?.department_id || '').trim();

//     if (!departmentId) {
//       return res.status(400).json({
//         error: 'Select a department before importing.',
//       });
//     }

//     const department = await findDepartment(req.organizationId, departmentId);

//     if (!department) {
//       return res.status(400).json({
//         error: 'Selected department was not found.',
//       });
//     }

//     const extension = req.file.originalname
//       .toLowerCase()
//       .split('.')
//       .pop();

//     if (!['xlsx', 'xls', 'csv'].includes(extension)) {
//       return res.status(415).json({
//         error: 'Only .xlsx, .xls and .csv files are supported.',
//       });
//     }

//     const workbook = XLSX.read(req.file.buffer, {
//       type: 'buffer',
//     });

//     const sheet = workbook.Sheets[workbook.SheetNames[0]];

//     if (!sheet) {
//       return res.status(400).json({
//         error: 'The spreadsheet has no readable worksheet.',
//       });
//     }

//     const rows = XLSX.utils.sheet_to_json(sheet, {
//       defval: '',
//     });

//     if (rows.length === 0) {
//       return res.status(400).json({
//         error: 'The spreadsheet contains no contact rows.',
//       });
//     }

//     if (rows.length > config.maxImportRows) {
//       return res.status(413).json({
//         error: `Maximum ${config.maxImportRows} rows per import.`,
//       });
//     }

//     const accepted = [];
//     const invalid = [];
//     const seen = new Set();

//     for (let index = 0; index < rows.length; index++) {
//       const lower = normalizeHeaders(rows[index]);

//       // Supports the existing Excel headers:
//       // Name, WhatsApp Number, Group, S.No
//       const name = String(
//         firstValue(lower, [
//           'name',
//           'full_name',
//           'full name',
//           'contact',
//           'contact name',
//         ])
//       ).trim();

//       const rawPhone = firstValue(lower, [
//         'phone',
//         'phone number',
//         'mobile',
//         'mobile number',
//         'whatsapp',
//         'whatsapp number',
//         'whatsapp_number',
//         'whatsapp no',
//         'whatsapp no.',
//         'contact number',
//         'number',
//       ]);

//       const phone = normalizePhone(rawPhone);

//       if (!name || !phone) {
//         invalid.push({
//           row: index + 2,
//           reason: !name
//             ? 'Name is missing'
//             : 'Phone number is missing or invalid',
//         });
//         continue;
//       }

//       if (seen.has(phone)) {
//         invalid.push({
//           row: index + 2,
//           reason: 'Duplicate phone number in this file',
//         });
//         continue;
//       }

//       seen.add(phone);

//       // A phone number alone is not evidence of WhatsApp consent.
//       // Opt-in requires an explicit value and a consent source.
//       const optedIn = normalizeConsent(
//         firstValue(lower, [
//           'opted_in',
//           'opted in',
//           'whatsapp_consent',
//           'whatsapp consent',
//         ])
//       );

//       const consentSource = String(
//         firstValue(lower, ['consent_source', 'consent source'])
//       ).trim();

//       const consentConfirmed = optedIn && Boolean(consentSource);

//       const email = String(
//         firstValue(lower, ['email', 'email address'])
//       ).trim();

//       accepted.push({
//         organization_id: req.organizationId,
//         name,
//         phone,
//         email: email || null,
//         // The selected department is the group for every row in this file.
//         // The Excel "Group" column is ignored on purpose.
//         group_name: department.name,
//         department_id: department.id,
//         branch_id: department.branch_id ?? null,
//         opted_in: consentConfirmed,
//         consent_source: consentConfirmed ? consentSource : null,
//         consent_updated_at: consentConfirmed
//           ? new Date().toISOString()
//           : null,
//       });
//     }

//     if (accepted.length === 0) {
//       return res.status(400).json({
//         error: 'No valid contacts were found.',
//         received: rows.length,
//         invalidCount: invalid.length,
//         invalid: invalid.slice(0, 100),
//         supportedColumns: [
//           'Name',
//           'WhatsApp Number',
//           'Email',
//           'opted_in',
//           'consent_source',
//         ],
//       });
//     }

//     const { data, error } = await supabase
//       .from('contacts')
//       .upsert(accepted, {
//         onConflict: 'organization_id,phone',
//       })
//       .select('id');

//     throwIfError(error);

//     res.json({
//       success: true,
//       received: rows.length,
//       imported: data?.length || 0,
//       department: department.name,
//       invalidCount: invalid.length,
//       invalid: invalid.slice(0, 100),
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// /* ================= VALIDATE PHONE FORMAT ================= */

// // Checks the phone-number format for all contacts in the organization.
// // This only updates phone_valid. It never changes WhatsApp consent.
// router.post('/validate-all', async (req, res, next) => {
//   try {
//     const { data: contacts, error } = await supabase
//       .from('contacts')
//       .select('id, phone')
//       .eq('organization_id', req.organizationId);

//     throwIfError(error);

//     let validCount = 0;
//     let invalidCount = 0;

//     for (const contact of contacts || []) {
//       const rawPhone = String(contact.phone || '').trim();
//       let digits = rawPhone.replace(/\D/g, '');

//       if (rawPhone.startsWith('00')) {
//         digits = digits.slice(2);
//       }

//       const isValid =
//         digits.length === 10
//           ? /^[6-9]\d{9}$/.test(digits)
//           : digits.startsWith('91')
//             ? /^91[6-9]\d{9}$/.test(digits)
//             : digits.length >= 8 &&
//               digits.length <= 15 &&
//               !digits.startsWith('0');

//       const { error: updateError } = await supabase
//         .from('contacts')
//         .update({ phone_valid: isValid })
//         .eq('organization_id', req.organizationId)
//         .eq('id', contact.id);

//       throwIfError(updateError);

//       if (isValid) validCount++;
//       else invalidCount++;
//     }

//     res.json({
//       success: true,
//       total: (contacts || []).length,
//       validCount,
//       invalidCount,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// /* ================= GET CONTACT WHATSAPP HISTORY ================= */

// router.get('/:contactId/messages', async (req, res, next) => {
//   try {
//     const { contactId } = req.params;

//     const { data: contact, error: contactError } = await supabase
//       .from('contacts')
//       .select('id, name, phone')
//       .eq('organization_id', req.organizationId)
//       .eq('id', contactId)
//       .maybeSingle();

//     throwIfError(contactError);

//     if (!contact) {
//       return res.status(404).json({
//         error: 'Contact not found for this organization.',
//       });
//     }

//     const { data: messages, error: messagesError } = await supabase
//       .from('messages')
//       .select(`
//         id,
//         campaign_id,
//         contact_id,
//         status,
//         meta_message_id,
//         direction,
//         message_type,
//         message_body,
//         message_timestamp,
//         sender_phone,
//         recipient_phone,
//         sent_at,
//         delivered_at,
//         read_at,
//         last_error,
//         created_at,
//         updated_at
//       `)
//       .eq('organization_id', req.organizationId)
//       .eq('contact_id', contact.id)
//       .order('message_timestamp', { ascending: false, nullsFirst: false })
//       .order('created_at', { ascending: false })
//       .limit(500);

//     throwIfError(messagesError);

//     return res.json({
//       data: messages || [],
//       contact,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// export default router;


import { Router } from "express";
import { supabase } from "../db.js";
import {
  sendTemplate,
  getApprovedTemplates,
} from "../services/metaWhatsApp.js";
import { config } from "../config.js";

const router = Router();

const MAX_RECIPIENTS_PER_BATCH = 500;
const MAX_CONTACT_IDS = 5000;

/* ================= HELPERS ================= */

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

/*
 * Build the correct Meta header component.
 * Supports IMAGE, VIDEO and DOCUMENT template headers.
 */
function buildHeaderComponent(headerFormat, mediaUrl, mediaId) {
  const format = String(headerFormat || "").toUpperCase();

  const mediaTypes = {
    IMAGE: "image",
    VIDEO: "video",
    DOCUMENT: "document",
  };

  const mediaType = mediaTypes[format];

  if (!mediaType) return null;

  if (!mediaUrl && !mediaId) {
    throw new Error(
      `This template has a ${format} header. Provide header_media_url or header_media_id.`
    );
  }

  if (mediaUrl && !/^https:\/\//i.test(String(mediaUrl))) {
    throw new Error("Header media URL must use HTTPS.");
  }

  const mediaObject = mediaId
    ? { id: String(mediaId) }
    : { link: String(mediaUrl) };

  return {
    type: "header",
    parameters: [
      {
        type: mediaType,
        [mediaType]: mediaObject,
      },
    ],
  };
}

/* ================= GET CAMPAIGNS ================= */

router.get("/", async (req, res, next) => {
  try {
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("organization_id", req.organizationId)
      .order("created_at", { ascending: false });

    throwIfError(error);

    const campaignRows = campaigns || [];

    if (campaignRows.length === 0) {
      return res.json({ data: [] });
    }

    const campaignIds = campaignRows.map((campaign) => campaign.id);

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("campaign_id, status")
      .eq("organization_id", req.organizationId)
      .in("campaign_id", campaignIds);

    throwIfError(messagesError);

    const counts = {};

    for (const message of messages || []) {
      const id = message.campaign_id;

      if (!counts[id]) {
        counts[id] = {
          queued: 0,
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0,
        };
      }

      const status = String(message.status || "").toLowerCase();

      if (Object.prototype.hasOwnProperty.call(counts[id], status)) {
        counts[id][status]++;
      }
    }

    const result = campaignRows.map((campaign) => ({
      ...campaign,
      queued_count: counts[campaign.id]?.queued || 0,
      sent_count: counts[campaign.id]?.sent ?? campaign.sent_count ?? 0,
      delivered_count: counts[campaign.id]?.delivered || 0,
      read_count: counts[campaign.id]?.read || 0,
      failed_count: counts[campaign.id]?.failed ?? campaign.failed_count ?? 0,
    }));

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

/* ================= CREATE CAMPAIGN ================= */

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

/* ================= SEND CAMPAIGN ================= */

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

    const { data: savedTemplate, error: templateError } = await supabase
      .from("templates")
      .select("*")
      .eq("organization_id", req.organizationId)
      .eq("meta_name", campaign.template_name)
      .eq("language", campaign.language)
      .maybeSingle();

    throwIfError(templateError);

    let templateBody = savedTemplate?.body;
    let mappings = savedTemplate?.variable_mappings;
    let metaTemplate = null;

    const approvedTemplates = await getApprovedTemplates();

    metaTemplate = (approvedTemplates || []).find(
      (template) =>
        template.name === campaign.template_name &&
        template.language === campaign.language &&
        String(template.status).toLowerCase() === "approved"
    );

    if (!metaTemplate) {
      return res.status(400).json({
        error:
          `Approved Meta template "${campaign.template_name}" with language ` +
          `"${campaign.language}" was not found. Check the exact name and language code.`,
      });
    }

    if (!savedTemplate) {
      templateBody = metaTemplate.body || "";
      mappings = [];

      if (getPlaceholderPositions(templateBody).length > 0) {
        return res.status(400).json({
          error:
            `Template "${campaign.template_name}" contains body parameters. ` +
            "Save its variable mappings before sending.",
        });
      }

      const { error: saveError } = await supabase
        .from("templates")
        .upsert(
          {
            organization_id: req.organizationId,
            meta_name: metaTemplate.name,
            language: metaTemplate.language,
            body: templateBody,
            variable_mappings: [],
          },
          { onConflict: "organization_id,meta_name,language" }
        );

      throwIfError(saveError);
    }

    if (!Array.isArray(mappings)) {
      return res.status(400).json({
        error: "Saved template variable mappings must be an array.",
      });
    }

    if (typeof templateBody !== "string") {
      return res.status(400).json({
        error:
          "The saved template body is missing. Refresh the template and save it again.",
      });
    }

    const actualPositions = getPlaceholderPositions(templateBody);

    if (actualPositions.length === 0 && mappings.length > 0) {
      mappings = [];
    }

    if (actualPositions.length > 0 && mappings.length === 0) {
      return res.status(400).json({
        error:
          `Template "${campaign.template_name}" contains body parameters. ` +
          "Save its variable mappings before sending.",
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

    const headerFormat = String(
      metaTemplate.headerFormat ||
      metaTemplate.header_format ||
      "NONE"
    ).toUpperCase();

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
          templateBody,
          contact,
          organization
        );

        if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)) {
          const mediaUrl =
            req.body?.header_media_url ||
            req.body?.header_image_url ||
            campaign.header_media_url ||
            campaign.header_image_url ||
            savedTemplate?.header_media_url ||
            savedTemplate?.header_image_url ||
            null;

          const mediaId =
            req.body?.header_media_id ||
            campaign.header_media_id ||
            savedTemplate?.header_media_id ||
            null;

          const headerComponent = buildHeaderComponent(
            headerFormat,
            mediaUrl,
            mediaId
          );

          // Header first, then body parameters.
          components.unshift(headerComponent);
        }

        const result = await sendTemplate({
          to: contact.phone,
          name: campaign.template_name,
          language: campaign.language,
          components,
        });

        const metaId = result?.messages?.[0]?.id || null;
        const sentAt = result?.sentAt || new Date().toISOString();

        const { error: updateMessageError } = await supabase
          .from("messages")
          .update({
            status: "sent",
            meta_message_id: metaId,
            direction: "outgoing",
            message_type: "template",
            message_body: templateBody,
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

/* ================= GET CAMPAIGN MESSAGES ================= */

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

/* ================= CANCEL SCHEDULED CAMPAIGN ================= */

router.patch("/:id/cancel", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .eq("organization_id", req.organizationId)
      .eq("status", "scheduled")
      .select("id, status")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(409).json({
        error: "Campaign not found or is no longer scheduled.",
      });
    }

    return res.json({
      message: "Scheduled campaign cancelled successfully.",
      data,
    });
  } catch (error) {
    console.error("[Cancel scheduled campaign]", error);

    return res.status(500).json({
      error: "Failed to cancel scheduled campaign.",
    });
  }
});

export default router;
