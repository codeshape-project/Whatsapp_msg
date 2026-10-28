

// // import { Router } from "express";
// // import {
// //   getApprovedTemplates,
// //   createMetaTemplate,
// // } from "../services/metaWhatsApp.js";
// // import { supabase } from "../db.js";

// // const router = Router();

// // const ALLOWED_SOURCES = new Set([
// //   "contact.name",
// //   "contact.email",
// //   "organization.name",
// // ]);

// // function getTemplateBody(template) {
// //   if (typeof template.body === "string") {
// //     return template.body;
// //   }

// //   const bodyComponent = (template.components || []).find(
// //     (component) => component.type?.toUpperCase() === "BODY"
// //   );

// //   return bodyComponent?.text || "";
// // }

// // function validateMappings(mappings, body) {
// //   if (!Array.isArray(mappings)) {
// //     throw new Error("variable_mappings must be an array.");
// //   }

// //   const positions = new Set();

// //   for (const mapping of mappings) {
// //     if (
// //       !Number.isInteger(Number(mapping.position)) ||
// //       Number(mapping.position) < 1 ||
// //       !ALLOWED_SOURCES.has(mapping.source) ||
// //       positions.has(Number(mapping.position))
// //     ) {
// //       throw new Error("Invalid or duplicate template variable mapping.");
// //     }

// //     positions.add(Number(mapping.position));
// //   }

// //   const placeholderPositions = [
// //     ...new Set(
// //       [...String(body || "").matchAll(/\{\{(\d+)\}\}/g)].map(
// //         (match) => Number(match[1])
// //       )
// //     ),
// //   ].sort((a, b) => a - b);

// //   const mappingPositions = [...positions].sort((a, b) => a - b);

// //   if (
// //     placeholderPositions.length !== mappingPositions.length ||
// //     placeholderPositions.some(
// //       (position, index) => position !== mappingPositions[index]
// //     )
// //   ) {
// //     throw new Error(
// //       "Mappings must match every numbered placeholder in the approved template body."
// //     );
// //   }

// //   return mappingPositions.map((position) => ({
// //     position,
// //     source: mappings.find(
// //       (mapping) => Number(mapping.position) === position
// //     ).source,
// //   }));
// // }

// // /* GET TEMPLATES */
// // router.get("/", async (req, res) => {
// //   try {
// //     if (!req.organizationId) {
// //       return res.status(400).json({
// //         error: "Select a valid organization before loading templates.",
// //       });
// //     }

// //     const metaTemplates = await getApprovedTemplates();

// //     const { data: savedTemplates, error } = await supabase
// //       .from("templates")
// //       .select(
// //         "id, meta_name, language, category, status, body, variable_mappings, organization_id"
// //       )
// //       .eq("organization_id", req.organizationId);

// //     if (error) throw error;

// //     const savedByKey = new Map(
// //       (savedTemplates || []).map((template) => [
// //         `${template.meta_name}:${template.language}`,
// //         template,
// //       ])
// //     );

// //     const data = (metaTemplates || []).map((template) => {
// //       const saved = savedByKey.get(
// //         `${template.name}:${template.language}`
// //       );

// //      return {
// //   ...template,
// //   id: saved?.id || null,
// //   meta_id: template.id || null,
// //   variable_mappings: saved?.variable_mappings || [],
// //   mappings_saved: Boolean(saved),
// // };
// //     });

// //     return res.status(200).json({ data });
// //   } catch (error) {
// //     console.error("GET /api/templates failed:", error.message);

// //     return res.status(500).json({
// //       error: "Failed to load WhatsApp templates.",
// //       details: error.message,
// //     });
// //   }
// // });

// // /*
// //  * SAVE MAPPINGS FOR AN EXISTING META TEMPLATE
// //  * PUT /api/templates/mappings
// //  *
// //  * Body:
// //  * {
// //  *   "name": "approved_template_name",
// //  *   "language": "en_US",
// //  *   "variable_mappings": [
// //  *     { "position": 1, "source": "contact.name" }
// //  *   ]
// //  * }
// //  */
// // router.put("/mappings", async (req, res) => {
// //   try {
// //     if (!req.organizationId) {
// //       return res.status(400).json({
// //         error: "Select a valid organization before saving mappings.",
// //       });
// //     }

// //     const { name, language, variable_mappings = [] } = req.body || {};

// //     if (!name?.trim() || !language?.trim()) {
// //       return res.status(400).json({
// //         error: "Template name and language are required.",
// //       });
// //     }

// //     // Verify that the selected template actually exists in Meta.
// //     const metaTemplates = await getApprovedTemplates();

// //     const metaTemplate = (metaTemplates || []).find(
// //       (template) =>
// //         template.name === name.trim() &&
// //         template.language === language.trim()
// //     );

// //     if (!metaTemplate) {
// //       return res.status(404).json({
// //         error:
// //           "The template was not found in Meta with this exact name and language. Refresh the templates list and try again.",
// //       });
// //     }

// //     const body = getTemplateBody(metaTemplate);

// //     if (!body && variable_mappings.length > 0) {
// //       return res.status(400).json({
// //         error:
// //           "The approved template body could not be read, so its mappings cannot be verified.",
// //       });
// //     }

// //     const validatedMappings = validateMappings(
// //       variable_mappings,
// //       body
// //     );

// //     const { data, error } = await supabase
// //       .from("templates")
// //       .upsert(
// //         {
// //           organization_id: req.organizationId,
// //           meta_name: name.trim(),
// //           language: language.trim(),
// //           category: metaTemplate.category || "Marketing",
// //           status: metaTemplate.status || "approved",
// //           body,
// //           variable_mappings: validatedMappings,
// //         },
// //         {
// //           onConflict: "organization_id,meta_name,language",
// //         }
// //       )
// //       .select()
// //       .single();

// //     if (error) throw error;

// //     return res.status(200).json({
// //       success: true,
// //       message: "Template mappings saved successfully.",
// //       data,
// //     });
// //  } catch (error) {
// //   console.error("POST /api/templates failed:", error.message);
// //   console.error("HTTP STATUS:", error.status);
// //   console.error(
// //     "META DETAILS:",
// //     JSON.stringify(error.metaDetails, null, 2)
// //   );

// //   return res.status(400).json({
// //     error: error.message || "Failed to submit template",
// //     details: error.metaDetails || null,
// //   });
// // }
// // });

// // /* CREATE AND SUBMIT A NEW TEMPLATE TO META */
// // router.post("/", async (req, res) => {
// //   try {
// //     if (!req.organizationId) {
// //       return res.status(400).json({
// //         error: "Select a valid organization before submitting a template.",
// //       });
// //     }

// //     const {
// //       name,
// //       category,
// //       language,
// //       header,
// //       body,
// //       footer,
// //       buttons,
// //       variable_mappings = [],
// //     } = req.body || {};

// //     if (!name?.trim() || !body?.trim() || !category || !language) {
// //       return res.status(400).json({
// //         error: "Name, category, language and message body are required.",
// //       });
// //     }

// //     const validatedMappings = [];

// //     const metaData = await createMetaTemplate({
// //       name: name.trim(),
// //       category,
// //       language,
// //       header,
// //       body: body.trim(),
// //       footer,
// //       buttons,
// //     });

// //     const { data, error } = await supabase
// //       .from("templates")
// //       .upsert(
// //         {
// //           organization_id: req.organizationId,
// //           meta_name: name.trim(),
// //           language,
// //           category,
// //           status: metaData.status || "pending",
// //           body: body.trim(),
// //           variable_mappings: validatedMappings,
// //         },
// //         {
// //           onConflict: "organization_id,meta_name,language",
// //         }
// //       )
// //       .select()
// //       .single();

// //     if (error) throw error;

// //     return res.status(201).json({
// //       data: {
// //         ...metaData,
// //         variable_mappings: data.variable_mappings,
// //         mappings_saved: true,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("POST /api/templates failed:", error.message);

// //     return res.status(400).json({
// //       error: error.message || "Failed to submit the template to Meta.",
// //     });
// //   }
// // });


// // /* DELETE A SAVED TEMPLATE */

// // router.delete("/:id", async (req, res) => {
// //   try {
// //     if (!req.organizationId) {
// //       return res.status(400).json({
// //         error: "Organization not selected.",
// //       });
// //     }

// //     const { data, error } = await supabase
// //       .from("templates")
// //       .delete()
// //       .eq("id", req.params.id)
// //       .eq("organization_id", req.organizationId)
// //       .select("id")
// //       .maybeSingle();

// //     if (error) throw error;

// //     if (!data) {
// //       return res.status(404).json({
// //         error: "Template not found in your organization's database.",
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       message: "Template deleted from database successfully.",
// //     });
// //   } catch (error) {
// //     console.error("Delete template error:", error);

// //     return res.status(500).json({
// //       error: "Failed to delete template from database.",
// //       details: error.message,
// //     });
// //   }
// // });


// // export default router;


// import { Router } from "express";
// import {
//   getApprovedTemplates,
//   createMetaTemplate,
//   uploadWhatsAppMedia,
// } from "../services/metaWhatsApp.js";
// import { supabase } from "../db.js";

// const router = Router();

// const ALLOWED_SOURCES = new Set([
//   "contact.name",
//   "contact.email",
//   "organization.name",
// ]);

// function getTemplateBody(template) {
//   if (typeof template.body === "string") {
//     return template.body;
//   }

//   const bodyComponent = (template.components || []).find(
//     (component) => component.type?.toUpperCase() === "BODY"
//   );

//   return bodyComponent?.text || "";
// }

// function validateMappings(mappings, body) {
//   if (!Array.isArray(mappings)) {
//     throw new Error("variable_mappings must be an array.");
//   }

//   const positions = new Set();

//   for (const mapping of mappings) {
//     const position = Number(mapping.position);

//     if (
//       !Number.isInteger(position) ||
//       position < 1 ||
//       !ALLOWED_SOURCES.has(mapping.source) ||
//       positions.has(position)
//     ) {
//       throw new Error("Invalid or duplicate template variable mapping.");
//     }

//     positions.add(position);
//   }

//   const placeholderPositions = [
//     ...new Set(
//       [...String(body || "").matchAll(/\{\{(\d+)\}\}/g)].map(
//         (match) => Number(match[1])
//       )
//     ),
//   ].sort((a, b) => a - b);

//   const mappingPositions = [...positions].sort((a, b) => a - b);

//   if (
//     placeholderPositions.length !== mappingPositions.length ||
//     placeholderPositions.some(
//       (position, index) => position !== mappingPositions[index]
//     )
//   ) {
//     throw new Error(
//       "Mappings must match every numbered placeholder in the approved template body."
//     );
//   }

//   return mappingPositions.map((position) => ({
//     position,
//     source: mappings.find(
//       (mapping) => Number(mapping.position) === position
//     ).source,
//   }));
// }

// // GET TEMPLATES
// router.get("/", async (req, res) => {
//   try {
//     if (!req.organizationId) {
//       return res.status(400).json({
//         error: "Select a valid organization before loading templates.",
//       });
//     }

//     const metaTemplates = await getApprovedTemplates();

//     const { data: savedTemplates, error } = await supabase
//   .from("templates")
//   .select(`
//     id,
//     meta_name,
//     language,
//     category,
//     status,
//     body,
//     variable_mappings,
//     organization_id,
//     header_format,
//     header_text,
//     header_media_id,
//     header_media_url,
//     header_media_handle,
//     header_storage_path
//   `)
//   .eq("organization_id", req.organizationId);
//     if (error) throw error;

//     const savedByKey = new Map(
//       (savedTemplates || []).map((template) => [
//         `${template.meta_name}:${template.language}`,
//         template,
//       ])
//     );

//        // Prefer saved organization-specific header configuration.
//     header_format:
//       saved?.header_format || template.header_format || template.headerFormat || "NONE",

//     header_text:
//       saved?.header_text || template.header || "",

//     header_media_id:
//       saved?.header_media_id || null,

//     header_media_url:
//       saved?.header_media_url || null,

//     header_media_handle:
//       saved?.header_media_handle || template.headerMediaHandle || null,

//     header_storage_path:
//       saved?.header_storage_path || null,

//     return res.status(200).json({ data });
//   } catch (error) {
//     console.error("GET /api/templates failed:", error.message);

//     return res.status(500).json({
//       error: "Failed to load WhatsApp templates.",
//       details: error.message,
//     });
//   }
// });

// // SAVE MAPPINGS FOR AN EXISTING META TEMPLATE
// // PUT /api/templates/mappings
// router.put("/mappings", async (req, res) => {
//   try {
//     if (!req.organizationId) {
//       return res.status(400).json({
//         error: "Select a valid organization before saving mappings.",
//       });
//     }

//     const {
//       name,
//       language,
//       variable_mappings = [],
//     } = req.body || {};

//     if (!name?.trim() || !language?.trim()) {
//       return res.status(400).json({
//         error: "Template name and language are required.",
//       });
//     }

//     const metaTemplates = await getApprovedTemplates();

//     const metaTemplate = (metaTemplates || []).find(
//       (template) =>
//         template.name === name.trim() &&
//         template.language === language.trim()
//     );

//     if (!metaTemplate) {
//       return res.status(404).json({
//         error:
//           "The template was not found in Meta with this exact name and language. Refresh the templates list and try again.",
//       });
//     }

//     const body = getTemplateBody(metaTemplate);

//     if (!body && variable_mappings.length > 0) {
//       return res.status(400).json({
//         error:
//           "The approved template body could not be read, so its mappings cannot be verified.",
//       });
//     }

//     const validatedMappings = validateMappings(
//       variable_mappings,
//       body
//     );

//     const { data, error } = await supabase
//       .from("templates")
//       .upsert(
//         {
//           organization_id: req.organizationId,
//           meta_name: name.trim(),
//           language: language.trim(),
//           category: metaTemplate.category || "Marketing",
//           status: metaTemplate.status || "Approved",
//           body,
//           variable_mappings: validatedMappings,
//         },
//         {
//           onConflict: "organization_id,meta_name,language",
//         }
//       )
//       .select()
//       .single();

//     if (error) throw error;

//     return res.status(200).json({
//       success: true,
//       message: "Template mappings saved successfully.",
//       data,
//     });
//   } catch (error) {
//     console.error("Save template mappings failed:", error.message);

//     return res.status(400).json({
//       error: error.message || "Failed to save template mappings.",
//       details: error.metaDetails || null,
//     });
//   }
// });

// // CREATE AND SUBMIT A NEW TEMPLATE TO META
// router.post("/", async (req, res, next) => {
//   try {
//     const {
//       name,
//       category,
//       language,
//       header = "",
//       headerFormat = "TEXT",
//       imageBase64,
//       imageMimeType = "image/jpeg",
//       body,
//       footer,
//       buttons = [],
//     } = req.body || {};

//     const result = await createMetaTemplate({
//       name,
//       category,
//       language,
//       header,
//       headerFormat,
//       imageBase64,
//       imageMimeType,
//       body,
//       footer,
//       buttons,
//     });

//     const { data, error } = await supabase
//       .from("templates")
//       .upsert(
//         {
//           organization_id: req.organizationId,
//           meta_name: result.name,
//           language: result.language,
//           category,
//           status: result.status,
//           body: body.trim(),
//           variable_mappings: [],
//           header_format: result.headerFormat,
//           header_text: headerFormat === "TEXT" ? header.trim() : null,
//           header_media_id: result.headerMediaId,
//           header_media_handle: result.headerMediaHandle,
//         },
//         {
//           onConflict: "organization_id,meta_name,language",
//         }
//       )
//       .select()
//       .single();

//     if (error) throw error;

//     res.status(201).json({
//       data: {
//         ...result,
//         template: data,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // DELETE A SAVED TEMPLATE
// router.delete("/:id", async (req, res) => {
//   try {
//     if (!req.organizationId) {
//       return res.status(400).json({
//         error: "Organization not selected.",
//       });
//     }

//     const { data, error } = await supabase
//       .from("templates")
//       .delete()
//       .eq("id", req.params.id)
//       .eq("organization_id", req.organizationId)
//       .select("id")
//       .maybeSingle();

//     if (error) throw error;

//     if (!data) {
//       return res.status(404).json({
//         error: "Template not found in your organization's database.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Template deleted from database successfully.",
//     });
//   } catch (error) {
//     console.error("Delete template error:", error);

//     return res.status(500).json({
//       error: "Failed to delete template from database.",
//       details: error.message,
//     });
//   }
// });
// router.put("/:name/image", async (req, res, next) => {
//   try {
//     const name = String(req.params.name || "").trim();
//     const language = String(req.body?.language || "en_US");
//     const { imageBase64, imageMimeType = "image/jpeg" } = req.body || {};

//     if (!name) {
//       return res.status(400).json({ error: "Template name is required." });
//     }

//     // Confirm this template exists and has an IMAGE header in Meta.
//     const templates = await getApprovedTemplates();
//     const template = templates.find(
//       (item) =>
//         item.name === name &&
//         item.language === language &&
//         item.headerFormat === "IMAGE"
//     );

//     if (!template) {
//       return res.status(404).json({
//         error: "An IMAGE-header template with that name and language was not found in Meta.",
//       });
//     }

//     const headerMediaId = await uploadWhatsAppMedia({
//       imageBase64,
//       mimeType: imageMimeType,
//     });

//     const { data, error } = await supabase
//       .from("templates")
//       .upsert(
//         {
//           organization_id: req.organizationId,
//           meta_name: template.name,
//           language: template.language,
//           category: template.category,
//           status: template.status,
//           body: template.body || "",
//           header_format: "IMAGE",
//           header_media_id: headerMediaId,
//           header_media_handle: template.headerMediaHandle || null,
//           variable_mappings: [],
//         },
//         {
//           onConflict: "organization_id,meta_name,language",
//         }
//       )
//       .select()
//       .single();

//     if (error) throw error;

//     res.json({
//       message: "Template image saved. Campaigns can now reuse it.",
//       data,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// export default router;



import { Router } from "express";
import {
  getApprovedTemplates,
  createMetaTemplate,
  uploadWhatsAppMedia,
} from "../services/metaWhatsApp.js";
import { supabase } from "../db.js";

const router = Router();

const ALLOWED_SOURCES = new Set([
  "contact.name",
  "contact.email",
  "organization.name",
]);

function getTemplateBody(template) {
  if (typeof template.body === "string") {
    return template.body;
  }

  const bodyComponent = (template.components || []).find(
    (component) => component.type?.toUpperCase() === "BODY"
  );

  return bodyComponent?.text || "";
}

function validateMappings(mappings, body) {
  if (!Array.isArray(mappings)) {
    throw new Error("variable_mappings must be an array.");
  }

  const positions = new Set();

  for (const mapping of mappings) {
    const position = Number(mapping.position);

    if (
      !Number.isInteger(position) ||
      position < 1 ||
      !ALLOWED_SOURCES.has(mapping.source) ||
      positions.has(position)
    ) {
      throw new Error("Invalid or duplicate template variable mapping.");
    }

    positions.add(position);
  }

  const placeholderPositions = [
    ...new Set(
      [...String(body || "").matchAll(/\{\{(\d+)\}\}/g)].map(
        (match) => Number(match[1])
      )
    ),
  ].sort((a, b) => a - b);

  const mappingPositions = [...positions].sort((a, b) => a - b);

  if (
    placeholderPositions.length !== mappingPositions.length ||
    placeholderPositions.some(
      (position, index) => position !== mappingPositions[index]
    )
  ) {
    throw new Error(
      "Mappings must match every numbered placeholder in the approved template body."
    );
  }

  return mappingPositions.map((position) => ({
    position,
    source: mappings.find(
      (mapping) => Number(mapping.position) === position
    ).source,
  }));
}

// GET TEMPLATES
router.get("/", async (req, res) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({
        error: "Select a valid organization before loading templates.",
      });
    }

    const metaTemplates = await getApprovedTemplates();

    const { data: savedTemplates, error } = await supabase
      .from("templates")
      .select(`
        id,
        meta_name,
        language,
        category,
        status,
        body,
        variable_mappings,
        organization_id,
        header_format,
        header_text,
        header_media_id,
        header_media_url,
        header_media_handle,
        header_storage_path
      `)
      .eq("organization_id", req.organizationId);

    if (error) throw error;

    const savedByKey = new Map(
      (savedTemplates || []).map((item) => [
        `${item.meta_name}:${item.language}`,
        item,
      ])
    );

    const data = (metaTemplates || []).map((template) => {
      const saved = savedByKey.get(
        `${template.name}:${template.language}`
      );

      return {
        ...template,

        id: saved?.id || null,
        meta_id: template.id || null,

        // Prefer the saved organization-specific header configuration.
        header_format:
          saved?.header_format ||
          template.header_format ||
          template.headerFormat ||
          "NONE",

        header_text:
          saved?.header_text || template.header || "",

        header_media_id: saved?.header_media_id || null,

        header_media_url: saved?.header_media_url || null,

        header_media_handle:
          saved?.header_media_handle ||
          template.headerMediaHandle ||
          null,

        header_storage_path: saved?.header_storage_path || null,

        variable_mappings: saved?.variable_mappings || [],
        mappings_saved: Boolean(saved),
      };
    });

    return res.status(200).json({ data });
  } catch (error) {
    console.error("GET /api/templates failed:", error.message);

    return res.status(500).json({
      error: "Failed to load WhatsApp templates.",
      details: error.message,
    });
  }
});

// SAVE MAPPINGS FOR AN EXISTING META TEMPLATE
router.put("/mappings", async (req, res) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({
        error: "Select a valid organization before saving mappings.",
      });
    }

    const {
      name,
      language,
      variable_mappings = [],
    } = req.body || {};

    if (!name?.trim() || !language?.trim()) {
      return res.status(400).json({
        error: "Template name and language are required.",
      });
    }

    const metaTemplates = await getApprovedTemplates();

    const metaTemplate = (metaTemplates || []).find(
      (template) =>
        template.name === name.trim() &&
        template.language === language.trim()
    );

    if (!metaTemplate) {
      return res.status(404).json({
        error:
          "The template was not found in Meta with this exact name and language. Refresh the templates list and try again.",
      });
    }

    const body = getTemplateBody(metaTemplate);

    if (!body && variable_mappings.length > 0) {
      return res.status(400).json({
        error:
          "The approved template body could not be read, so its mappings cannot be verified.",
      });
    }

    const validatedMappings = validateMappings(
      variable_mappings,
      body
    );

    const { data, error } = await supabase
      .from("templates")
      .upsert(
        {
          organization_id: req.organizationId,
          meta_name: name.trim(),
          language: language.trim(),
          category: metaTemplate.category || "Marketing",
          status: metaTemplate.status || "Approved",
          body,
          variable_mappings: validatedMappings,
        },
        {
          onConflict: "organization_id,meta_name,language",
        }
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Template mappings saved successfully.",
      data,
    });
  } catch (error) {
    console.error("Save template mappings failed:", error.message);

    return res.status(400).json({
      error: error.message || "Failed to save template mappings.",
      details: error.metaDetails || null,
    });
  }
});

// CREATE AND SUBMIT A NEW TEMPLATE TO META
router.post("/", async (req, res, next) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({
        error: "Select a valid organization before creating a template.",
      });
    }

    const {
      name,
      category,
      language,
      header = "",
      headerFormat = "NONE",
      imageBase64,
      imageMimeType = "image/jpeg",
      body,
      footer,
      buttons = [],
    } = req.body || {};

    if (!name?.trim() || !category || !language || !body?.trim()) {
      return res.status(400).json({
        error: "Name, category, language, and body are required.",
      });
    }

    const result = await createMetaTemplate({
      name,
      category,
      language,
      header,
      headerFormat,
      imageBase64,
      imageMimeType,
      body,
      footer,
      buttons,
    });

    const { data, error } = await supabase
      .from("templates")
      .upsert(
        {
          organization_id: req.organizationId,
          meta_name: result.name,
          language: result.language,
          category,
          status: result.status,
          body: body.trim(),
          variable_mappings: [],
          header_format: result.headerFormat || headerFormat,
          header_text:
            headerFormat === "TEXT" ? header.trim() : null,
          header_media_id: result.headerMediaId || null,
          header_media_handle: result.headerMediaHandle || null,
        },
        {
          onConflict: "organization_id,meta_name,language",
        }
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      data: {
        ...result,
        template: data,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE A SAVED TEMPLATE
router.delete("/:id", async (req, res) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({
        error: "Organization not selected.",
      });
    }

    const { data, error } = await supabase
      .from("templates")
      .delete()
      .eq("id", req.params.id)
      .eq("organization_id", req.organizationId)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: "Template not found in your organization's database.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Template deleted from database successfully.",
    });
  } catch (error) {
    console.error("Delete template error:", error);

    return res.status(500).json({
      error: "Failed to delete template from database.",
      details: error.message,
    });
  }
});

// SAVE AN IMAGE FOR AN EXISTING META IMAGE-HEADER TEMPLATE
router.put("/:name/image", async (req, res, next) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({
        error: "Select a valid organization before saving the image.",
      });
    }

    const name = String(req.params.name || "").trim();
    const language = String(req.body?.language || "en_US");
    const { imageBase64, imageMimeType = "image/jpeg" } =
      req.body || {};

    if (!name) {
      return res.status(400).json({
        error: "Template name is required.",
      });
    }

    if (!imageBase64) {
      return res.status(400).json({
        error: "Template image is required.",
      });
    }

    const templates = await getApprovedTemplates();

    const template = templates.find(
      (item) =>
        item.name === name &&
        item.language === language &&
        (item.headerFormat || item.header_format) === "IMAGE"
    );

    if (!template) {
      return res.status(404).json({
        error:
          "An IMAGE-header template with that name and language was not found in Meta.",
      });
    }

    const headerMediaId = await uploadWhatsAppMedia({
      imageBase64,
      mimeType: imageMimeType,
    });

    const { data, error } = await supabase
      .from("templates")
      .upsert(
        {
          organization_id: req.organizationId,
          meta_name: template.name,
          language: template.language,
          category: template.category,
          status: template.status,
          body: getTemplateBody(template),
          header_format: "IMAGE",
          header_media_id: headerMediaId,
          header_media_handle:
            template.headerMediaHandle || null,
          variable_mappings: [],
        },
        {
          onConflict: "organization_id,meta_name,language",
        }
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      message: "Template image saved. Campaigns can now reuse it.",
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
