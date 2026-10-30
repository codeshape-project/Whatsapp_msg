
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

//     const row = {
//       organization_id: req.organizationId,
//       name: String(name).trim(),
//       phone: normalized,
//       email: email ? String(email).trim() : null,
//       group_name: group_name ? String(group_name).trim() : null,
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

//     const selectedDepartment = String(
//       req.body?.department_name || ''
//     ).trim();

//     if (!req.file) {
//       return res.status(400).json({
//         error: 'Choose an Excel or CSV file first.',
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
//         firstValue(lower, [
//           'consent_source',
//           'consent source',
//         ])
//       ).trim();

//       const consentConfirmed = optedIn && Boolean(consentSource);

//      const group = selectedDepartment ||
//   String(
//     firstValue(lower, ['group', 'group_name', 'group name'])
//   ).trim();

//       const email = String(
//         firstValue(lower, ['email', 'email address'])
//       ).trim();

//       accepted.push({
//         organization_id: req.organizationId,
//         name,
//         phone,
//         email: email || null,
//         group_name: group || null,
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
//           'Group',
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
//       invalidCount: invalid.length,
//       invalid: invalid.slice(0, 100),
//     });
//   } catch (error) {
//     next(error);
//   }
// });
// // Confirm phone-number format for all contacts in the organization.
// // This does NOT automatically confirm WhatsApp consent.
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
//       let digits = String(contact.phone || '').trim().replace(/\D/g, '');

//       if (String(contact.phone || '').trim().startsWith('00')) {
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
//         .update({
//   phone_valid: isValid,
//   ...(isValid
//     ? {
//         opted_in: true,
//         consent_source: "verified_existing_consent",
//         consent_updated_at: new Date().toISOString(),
//       }
//     : {}),
// })
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

// router.get("/:contactId/messages", async (req, res, next) => {
//   try {
//     const { contactId } = req.params;

//     const { data: contact, error: contactError } = await supabase
//       .from("contacts")
//       .select("id, name, phone")
//       .eq("organization_id", req.organizationId)
//       .eq("id", contactId)
//       .maybeSingle();

//     if (contactError) throw contactError;

//     if (!contact) {
//       return res.status(404).json({
//         error: "Contact not found for this organization.",
//       });
//     }

//     const { data: messages, error: messagesError } = await supabase
//       .from("messages")
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
//       .eq("organization_id", req.organizationId)
//       .eq("contact_id", contact.id)
//       .order("message_timestamp", { ascending: false, nullsFirst: false })
//       .order("created_at", { ascending: false })
//       .limit(500);

//     if (messagesError) throw messagesError;

//     return res.json({
//       data: messages || [],
//       contact,
//     });
//   } catch (error) {
//     next(error);
//   }
// });
// export default router;

import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';

import { supabase } from '../db.js';
import { config } from '../config.js';
import { normalizePhone } from '../utils/phone.js';
import { parseContactSheet } from '../utils/contactSheet.js';
const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
});

/* ================= HELPERS ================= */

function throwIfError(error) {
  if (error) throw error;
}

function normalizeConsent(value) {
  return ['true', 'yes', '1'].includes(
    String(value ?? '').trim().toLowerCase()
  );
}

function normalizeHeaders(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      String(key).replace(/^\uFEFF/, '').trim().toLowerCase(),
      value,
    ])
  );
}

function firstValue(row, keys) {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return '';
}

// Looks up an active department that belongs to this organization.
// Returns null when no id is given or the department does not exist.
async function findDepartment(organizationId, departmentId) {
  const id = String(departmentId ?? '').trim();

  if (!id) return null;

  const { data, error } = await supabase
    .from('departments')
    .select('id, name, branch_id')
    .eq('organization_id', organizationId)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  throwIfError(error);

  return data || null;
}

/* ================= GET CONTACTS ================= */

router.get('/', async (req, res, next) => {
  try {
    const {
      q = '',
      group = '',
      page = '1',
      limit = '100',
    } = req.query;

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('organization_id', req.organizationId)
      .order('created_at', { ascending: false });

    if (group) {
      query = query.eq('group_name', group);
    }

    if (q) {
      const safeQuery = String(q).replace(/[(),]/g, '');

      query = query.or(
        `name.ilike.%${safeQuery}%,phone.ilike.%${safeQuery}%`
      );
    }

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(250, Math.max(1, Number(limit) || 100));

    const { data, error, count } = await query.range(
      (currentPage - 1) * pageLimit,
      currentPage * pageLimit - 1
    );

    throwIfError(error);

    res.json({
      data: data || [],
      total: count || 0,
      page: currentPage,
      limit: pageLimit,
    });
  } catch (error) {
    next(error);
  }
});

/* ================= CREATE OR UPDATE CONTACT ================= */

router.post('/', async (req, res, next) => {
  try {
    const {
      id,
      name,
      phone,
      email = null,
      group_name = null,
      department_id = null,
      opted_in = false,
    } = req.body || {};

    if (typeof opted_in !== 'boolean') {
      return res.status(400).json({
        error: 'opted_in must be true or false.',
      });
    }

    if (!String(name ?? '').trim()) {
      return res.status(400).json({
        error: 'Contact name is required.',
      });
    }

    const normalized = normalizePhone(phone);

    if (!normalized) {
      return res.status(400).json({
        error: 'Name and a valid phone number are required.',
      });
    }

    // Department decides group_name and branch_id. The values come from the
    // database, not from whatever the browser sent.
    let department = null;

    if (department_id) {
      department = await findDepartment(req.organizationId, department_id);

      if (!department) {
        return res.status(400).json({
          error: 'Selected department was not found.',
        });
      }
    }

    const row = {
      organization_id: req.organizationId,
      name: String(name).trim(),
      phone: normalized,
      email: email ? String(email).trim() : null,
      group_name: department
        ? department.name
        : group_name
          ? String(group_name).trim()
          : null,
      department_id: department ? department.id : null,
      branch_id: department ? department.branch_id ?? null : null,
      opted_in,
      consent_source: opted_in ? 'manual_contact_form' : null,
      consent_updated_at: opted_in ? new Date().toISOString() : null,
    };

    let result;

    if (id) {
      result = await supabase
        .from('contacts')
        .update(row)
        .eq('organization_id', req.organizationId)
        .eq('id', id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('contacts')
        .upsert(row, {
          onConflict: 'organization_id,phone',
        })
        .select()
        .single();
    }

    throwIfError(result.error);

    res.status(id ? 200 : 201).json({
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
});

/* ================= DELETE CONTACT ================= */

router.delete('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .delete()
      .eq('organization_id', req.organizationId)
      .eq('id', req.params.id)
      .select('id');

    throwIfError(error);

    if (!data?.length) {
      return res.status(404).json({
        error: 'Contact not found.',
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ================= UPDATE CONSENT ================= */

router.patch('/:id/consent', async (req, res, next) => {
  try {
    const { opted_in, source } = req.body || {};

    if (typeof opted_in !== 'boolean') {
      return res.status(400).json({
        error: 'opted_in must be true or false.',
      });
    }

    if (opted_in && !String(source || '').trim()) {
      return res.status(400).json({
        error: 'A consent source is required when confirming opt-in.',
      });
    }

    const { data, error } = await supabase
      .from('contacts')
      .update({
        opted_in,
        consent_source: opted_in ? String(source).trim() : null,
        consent_updated_at: new Date().toISOString(),
      })
      .eq('organization_id', req.organizationId)
      .eq('id', req.params.id)
      .select()
      .single();

    throwIfError(error);

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/* ================= IMPORT EXCEL OR CSV ================= */

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
//      // Read consent information from the Excel row.
// const optedIn = normalizeConsent(
//   firstValue(lower, [
//     'opted_in',
//     'opted in',
//     'whatsapp_consent',
//     'whatsapp consent',
//   ])
// );

// const consentSource = String(
//   firstValue(lower, [
//     'consent_source',
//     'consent source',
//   ])
// ).trim();

// // Consent is confirmed only when the Excel row explicitly
// // indicates opt-in.
// const consentConfirmed = optedIn;

//       const email = String(
//         firstValue(lower, ['email', 'email address'])
//       ).trim();

//       accepted.push({
//   organization_id: req.organizationId,
//   name,
//   phone,
//   email: email || null,

//   // Use the department selected in the import popup.
//   group_name: department.name,
//   department_id: department.id,
//   branch_id: department.branch_id ?? null,

//   // Save consent status.
//   opted_in: consentConfirmed,
//   consent_source: consentConfirmed
//     ? consentSource || 'excel_import'
//     : null,
//   consent_updated_at: consentConfirmed
//     ? new Date().toISOString()
//     : null,
// });
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
router.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Choose an Excel or CSV file first.',
      });
    }

    // The department chosen in the import popup is required.
    const departmentId = String(req.body?.department_id || '').trim();

    if (!departmentId) {
      return res.status(400).json({
        error: 'Select a department before importing.',
      });
    }

    const department = await findDepartment(req.organizationId, departmentId);

    if (!department) {
      return res.status(400).json({
        error: 'Selected department was not found.',
      });
    }

    const extension = req.file.originalname
      .toLowerCase()
      .split('.')
      .pop();

    if (!['xlsx', 'xls', 'csv'].includes(extension)) {
      return res.status(415).json({
        error: 'Only .xlsx, .xls and .csv files are supported.',
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: 'buffer',
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      return res.status(400).json({
        error: 'The spreadsheet has no readable worksheet.',
      });
    }

    // Read as plain rows. The parser decides whether row 1 is a heading
    // and finds the phone / name / email columns.
    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
    });

    const parsed = parseContactSheet(matrix);

    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const rows = parsed.contacts;

    if (rows.length > config.maxImportRows) {
      return res.status(413).json({
        error: `Maximum ${config.maxImportRows} rows per import.`,
      });
    }

    const accepted = [];
    const invalid = [];
    const seen = new Set();

    for (const row of rows) {
      const phone = normalizePhone(row.rawPhone);

      if (!phone) {
        invalid.push({
          row: row.rowNumber,
          reason: 'Phone number is missing or invalid',
        });
        continue;
      }

      if (seen.has(phone)) {
        invalid.push({
          row: row.rowNumber,
          reason: 'Duplicate phone number in this file',
        });
        continue;
      }

      seen.add(phone);

      // If the file has no name, use the phone number as the name.
      const name = row.name || phone;

      // Consent is confirmed only when the file explicitly says so.
      const consentConfirmed = normalizeConsent(row.optedInValue);

      accepted.push({
        organization_id: req.organizationId,
        name,
        phone,
        email: row.email || null,

        // Use the department selected in the import popup.
        group_name: department.name,
        department_id: department.id,
        branch_id: department.branch_id ?? null,

        opted_in: consentConfirmed,
        consent_source: consentConfirmed
          ? row.consentSource || 'excel_import'
          : null,
        consent_updated_at: consentConfirmed
          ? new Date().toISOString()
          : null,
      });
    }

    if (accepted.length === 0) {
      return res.status(400).json({
        error: 'No valid contacts were found.',
        received: rows.length,
        invalidCount: invalid.length,
        invalid: invalid.slice(0, 100),
      });
    }

    const { data, error } = await supabase
      .from('contacts')
      .upsert(accepted, {
        onConflict: 'organization_id,phone',
      })
      .select('id');

    throwIfError(error);

    res.json({
      success: true,
      received: rows.length,
      imported: data?.length || 0,
      department: department.name,
      invalidCount: invalid.length,
      invalid: invalid.slice(0, 100),
    });
  } catch (error) {
    next(error);
  }
});
/* ================= VALIDATE PHONE FORMAT ================= */

// Checks the phone-number format for all contacts in the organization.
// This only updates phone_valid. It never changes WhatsApp consent.
router.post('/validate-all', async (req, res, next) => {
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, phone')
      .eq('organization_id', req.organizationId);

    throwIfError(error);

    let validCount = 0;
    let invalidCount = 0;

    for (const contact of contacts || []) {
      const rawPhone = String(contact.phone || '').trim();
      let digits = rawPhone.replace(/\D/g, '');

      if (rawPhone.startsWith('00')) {
        digits = digits.slice(2);
      }

      const isValid =
        digits.length === 10
          ? /^[6-9]\d{9}$/.test(digits)
          : digits.startsWith('91')
            ? /^91[6-9]\d{9}$/.test(digits)
            : digits.length >= 8 &&
              digits.length <= 15 &&
              !digits.startsWith('0');

      const { error: updateError } = await supabase
        .from('contacts')
        .update({ phone_valid: isValid })
        .eq('organization_id', req.organizationId)
        .eq('id', contact.id);

      throwIfError(updateError);

      if (isValid) validCount++;
      else invalidCount++;
    }

    res.json({
      success: true,
      total: (contacts || []).length,
      validCount,
      invalidCount,
    });
  } catch (error) {
    next(error);
  }
});

/* ================= OPT IN ALL CONTACTS ================= */

// Marks every contact in the organization that is not opted in as opted in.
// Use only when you hold real consent for these contacts.
router.post('/opt-in-all', async (req, res, next) => {
  try {
    const { confirm, source } = req.body || {};

    if (confirm !== true) {
      return res.status(400).json({
        error: 'Please confirm that you have consent from these contacts.',
      });
    }

    const consentSource =
      String(source || '').trim() || 'bulk_opt_in_by_admin';

    const { data, error } = await supabase
      .from('contacts')
      .update({
        opted_in: true,
        consent_source: consentSource,
        consent_updated_at: new Date().toISOString(),
      })
      .eq('organization_id', req.organizationId)
      .eq('opted_in', false)
      .select('id');

    throwIfError(error);

    res.json({
      success: true,
      updated: (data || []).length,
    });
  } catch (error) {
    next(error);
  }
});

/* ================= GET CONTACT WHATSAPP HISTORY ================= */

router.get('/:contactId/messages', async (req, res, next) => {
  try {
    const { contactId } = req.params;

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, name, phone')
      .eq('organization_id', req.organizationId)
      .eq('id', contactId)
      .maybeSingle();

    throwIfError(contactError);

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found for this organization.',
      });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        campaign_id,
        contact_id,
        status,
        meta_message_id,
        direction,
        message_type,
        message_body,
        message_timestamp,
        sender_phone,
        recipient_phone,
        sent_at,
        delivered_at,
        read_at,
        last_error,
        created_at,
        updated_at
      `)
      .eq('organization_id', req.organizationId)
      .eq('contact_id', contact.id)
      .order('message_timestamp', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(500);

    throwIfError(messagesError);

    return res.json({
      data: messages || [],
      contact,
    });
  } catch (error) {
    next(error);
  }
});

export default router;