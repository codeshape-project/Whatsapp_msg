
// import { Router } from "express";
// import {
//   getApprovedTemplates,
//   createMetaTemplate,
// } from "../services/metaWhatsApp.js";
// import { supabase } from "../db.js";
// const router = Router();

// router.get("/", async (req, res) => {
//   try {
//     if (!req.organizationId) {
//       return res.status(400).json({
//         error: "Select a valid organization before loading templates.",
//       });
//     }

//    const metaTemplates = await getApprovedTemplates();

// const { data: savedTemplates, error } = await supabase
//   .from("templates")
//   .select("meta_name, language, variable_mappings, organization_id")
//   .eq("organization_id", req.organizationId);

// if (error) throw error;

// const savedByKey = new Map(
//   (savedTemplates || []).map((template) => [
//     `${template.meta_name}:${template.language}`,
//     template,
//   ])
// );

// const data = metaTemplates.map((template) => {
//   const saved = savedByKey.get(
//     `${template.name}:${template.language}`
//   );

//   return {
//     ...template,
//     variable_mappings: saved?.variable_mappings || [],
//   };
// });

//     return res.status(200).json({ data });
//   } catch (error) {
//     console.error("GET /api/templates failed:", error.message);

//     return res.status(500).json({
//       error: "Failed to load WhatsApp templates.",
//       details: error.message,
//     });
//   }
// });



// router.post("/", async (req, res) => {
//   try {
//     if (!req.organizationId) {
//       return res.status(400).json({
//         error: "Select a valid organization before submitting a template.",
//       });
//     }

//     const {
//       name,
//       category,
//       language,
//       header,
//       body,
//       footer,
//       buttons,
//       variable_mappings = [],
//     } = req.body;

//     if (!name?.trim() || !body?.trim() || !category || !language) {
//       return res.status(400).json({
//         error: "Name, category, language and message body are required.",
//       });
//     }

//     if (!Array.isArray(variable_mappings)) {
//       return res.status(400).json({
//         error: "variable_mappings must be an array.",
//       });
//     }

//     // Only allow known database fields as variable sources.
//     const allowedSources = new Set([
//       "contact.name",
//       "contact.email",
//       "organization.name",
//     ]);

//     const positions = new Set();

//     for (const mapping of variable_mappings) {
//       if (
//         !Number.isInteger(mapping.position) ||
//         mapping.position < 1 ||
//         !allowedSources.has(mapping.source) ||
//         positions.has(mapping.position)
//       ) {
//         return res.status(400).json({
//           error: "Invalid or duplicate template variable mapping.",
//         });
//       }

//       positions.add(mapping.position);
//     }

//     // Submit the template to Meta first.
//     const metaData = await createMetaTemplate({
//       name,
//       category,
//       language,
//       header,
//       body,
//       footer,
//       buttons,
//     });

//     // Save template and mappings for this organization.
//     const { data, error } = await supabase
//       .from("templates")
//       .upsert(
//         {
//           organization_id: req.organizationId,
//           meta_name: name.trim(),
//           language,
//           category,
//           status: metaData.status || "pending",
//           body: body.trim(),
//           variable_mappings,
//         },
//         {
//           onConflict: "organization_id,meta_name,language",
//         }
//       )
//       .select()
//       .single();

//     if (error) {
//       throw error;
//     }

//     return res.status(201).json({
//       data: {
//         ...metaData,
//         variable_mappings: data.variable_mappings,
//       },
//     });
//   } catch (error) {
//     console.error("POST /api/templates failed:", error.message);

//     return res.status(400).json({
//       error: error.message || "Failed to submit template to Meta.",
//     });
//   }
// });


// export default router;



import { Router } from "express";
import {
  getApprovedTemplates,
  createMetaTemplate,
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
    if (
      !Number.isInteger(Number(mapping.position)) ||
      Number(mapping.position) < 1 ||
      !ALLOWED_SOURCES.has(mapping.source) ||
      positions.has(Number(mapping.position))
    ) {
      throw new Error("Invalid or duplicate template variable mapping.");
    }

    positions.add(Number(mapping.position));
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

/* GET TEMPLATES */
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
      .select(
        "id, meta_name, language, category, status, body, variable_mappings, organization_id"
      )
      .eq("organization_id", req.organizationId);

    if (error) throw error;

    const savedByKey = new Map(
      (savedTemplates || []).map((template) => [
        `${template.meta_name}:${template.language}`,
        template,
      ])
    );

    const data = (metaTemplates || []).map((template) => {
      const saved = savedByKey.get(
        `${template.name}:${template.language}`
      );

      return {
        ...template,
        id: saved?.id || template.id,
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

/*
 * SAVE MAPPINGS FOR AN EXISTING META TEMPLATE
 * PUT /api/templates/mappings
 *
 * Body:
 * {
 *   "name": "approved_template_name",
 *   "language": "en_US",
 *   "variable_mappings": [
 *     { "position": 1, "source": "contact.name" }
 *   ]
 * }
 */
router.put("/mappings", async (req, res) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({
        error: "Select a valid organization before saving mappings.",
      });
    }

    const { name, language, variable_mappings = [] } = req.body || {};

    if (!name?.trim() || !language?.trim()) {
      return res.status(400).json({
        error: "Template name and language are required.",
      });
    }

    // Verify that the selected template actually exists in Meta.
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
          status: metaTemplate.status || "approved",
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
  console.error("POST /api/templates failed:", error.message);
  console.error("HTTP STATUS:", error.status);
  console.error(
    "META DETAILS:",
    JSON.stringify(error.metaDetails, null, 2)
  );

  return res.status(400).json({
    error: error.message || "Failed to submit template",
    details: error.metaDetails || null,
  });
}
});

/* CREATE AND SUBMIT A NEW TEMPLATE TO META */
router.post("/", async (req, res) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({
        error: "Select a valid organization before submitting a template.",
      });
    }

    const {
      name,
      category,
      language,
      header,
      body,
      footer,
      buttons,
      variable_mappings = [],
    } = req.body || {};

    if (!name?.trim() || !body?.trim() || !category || !language) {
      return res.status(400).json({
        error: "Name, category, language and message body are required.",
      });
    }

    const validatedMappings = [];

    const metaData = await createMetaTemplate({
      name: name.trim(),
      category,
      language,
      header,
      body: body.trim(),
      footer,
      buttons,
    });

    const { data, error } = await supabase
      .from("templates")
      .upsert(
        {
          organization_id: req.organizationId,
          meta_name: name.trim(),
          language,
          category,
          status: metaData.status || "pending",
          body: body.trim(),
          variable_mappings: validatedMappings,
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
        ...metaData,
        variable_mappings: data.variable_mappings,
        mappings_saved: true,
      },
    });
  } catch (error) {
    console.error("POST /api/templates failed:", error.message);

    return res.status(400).json({
      error: error.message || "Failed to submit the template to Meta.",
    });
  }
});

export default router;
