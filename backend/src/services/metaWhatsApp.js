

// import { config } from "../config.js";

// export function metaConfigured() {
//   return Boolean(
//     config.metaPhoneNumberId &&
//     config.metaAccessToken
//   );
// }

// export async function getApprovedTemplates() {
//   if (!config.metaWabaId || !config.metaAccessToken) {
//     throw new Error(
//       "Meta templates are not configured. Add META_WABA_ID and META_ACCESS_TOKEN."
//     );
//   }

//   const url = new URL(
//     `https://graph.facebook.com/${config.metaGraphVersion}/${config.metaWabaId}/message_templates`
//   );

//   url.searchParams.set(
//     "fields",
//     "id,name,status,language,category,components,rejected_reason"
//   );
//   url.searchParams.set("limit", "100");

//   const allTemplates = [];
//   let nextUrl = url.toString();

//   // Fetch all pages returned by Meta.
//   while (nextUrl) {
//     const response = await fetch(nextUrl, {
//       headers: {
//         Authorization: `Bearer ${config.metaAccessToken}`,
//       },
//     });

//     const result = await response.json().catch(() => ({}));

//     if (!response.ok) {
//       console.error("META TEMPLATE ERROR");
//       console.error(JSON.stringify(result, null, 2));

//       const error = new Error(
//         result?.error?.message ||
//           `Meta template request failed (${response.status})`
//       );

//       error.metaDetails = result;
//       error.status = response.status;

//       throw error;
//     }

//     allTemplates.push(...(result.data || []));
//     nextUrl = result.paging?.next || null;
//   }

//   return allTemplates.map((template) => {
//     const components = template.components || [];

//     const headerComponent = components.find(
//       (item) => item.type?.toUpperCase() === "HEADER"
//     );

//     const bodyComponent = components.find(
//       (item) => item.type?.toUpperCase() === "BODY"
//     );

//     const footerComponent = components.find(
//       (item) => item.type?.toUpperCase() === "FOOTER"
//     );

//     const buttonsComponent = components.find(
//       (item) => item.type?.toUpperCase() === "BUTTONS"
//     );

//     const headerFormat =
//       headerComponent?.format?.toUpperCase() || "NONE";

//     const headerHandle = headerComponent?.example?.header_handle;

//     return {
//       id: template.id,
//       metaId: template.id,
//       name: template.name,

//       status: {
//         APPROVED: "Approved",
//         PENDING: "Pending",
//         REJECTED: "Rejected",
//         PAUSED: "Paused",
//         DISABLED: "Disabled",
//         IN_APPEAL: "In Appeal",
//       }[template.status] || template.status || "Unknown",

//       rejectedReason: template.rejected_reason || null,
//       language: template.language,
//       category: template.category,
//       components,

//       // TEXT, IMAGE, VIDEO, DOCUMENT, or NONE
//       headerFormat,
//       header_format: headerFormat,

//       // Keep text headers separate from media headers.
//       header:
//         headerFormat === "TEXT"
//           ? headerComponent?.text || ""
//           : "",

//       // A Meta media handle is not a browser image URL.
//       headerMediaHandle:
//         headerFormat === "IMAGE"
//           ? Array.isArray(headerHandle)
//             ? headerHandle[0] || null
//             : headerHandle || null
//           : null,

//       body: bodyComponent?.text || "",
//       footer: footerComponent?.text || "",

//       buttons:
//         buttonsComponent?.buttons?.map((button) => ({
//           type:
//             button.type === "URL"
//               ? "URL"
//               : button.type === "PHONE_NUMBER"
//                 ? "Phone Call"
//                 : "Quick Reply",
//           text: button.text || "",
//           value: button.url || button.phone_number || "",
//         })) || [],
//     };
//   });
// }

// export async function createMetaTemplate({
//   name,
//   category,
//   language,
//   header,
//   body,
//   footer,
//   buttons = [],
// }) {
//   if (!config.metaWabaId || !config.metaAccessToken) {
//     throw new Error(
//       "Meta templates are not configured. Check META_WABA_ID and META_ACCESS_TOKEN."
//     );
//   }

//   const normalizedName = name.trim().toLowerCase();

//   if (!/^[a-z0-9_]+$/.test(normalizedName)) {
//     throw new Error(
//       "Template name must contain only lowercase letters, numbers, and underscores."
//     );
//   }

//   if (!body?.trim()) {
//     throw new Error("Message body is required.");
//   }

//   const languageCodes = {
//     English: "en",
//     "English (US)": "en_US",
//     Hindi: "hi",
//   };

//   const components = [];

//   if (header?.trim()) {
//     components.push({
//       type: "HEADER",
//       format: "TEXT",
//       text: header.trim(),
//     });
//   }

//   components.push({
//     type: "BODY",
//     text: body.trim(),
//   });

//   if (footer?.trim()) {
//     components.push({
//       type: "FOOTER",
//       text: footer.trim(),
//     });
//   }

//   if (buttons.length) {
//     components.push({
//       type: "BUTTONS",
//       buttons: buttons.map((button) => {
//         if (button.type === "URL") {
//           return {
//             type: "URL",
//             text: button.text,
//             url: button.value,
//           };
//         }

//         if (button.type === "Phone Call") {
//           return {
//             type: "PHONE_NUMBER",
//             text: button.text,
//             phone_number: button.value,
//           };
//         }

//         return {
//           type: "QUICK_REPLY",
//           text: button.text,
//         };
//       }),
//     });
//   }

//   const url =
//     `https://graph.facebook.com/${config.metaGraphVersion}/${config.metaWabaId}/message_templates`;

//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${config.metaAccessToken}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       name: normalizedName,
//       language: languageCodes[language] || language,
//       category: category.toUpperCase(),
//       components,
//     }),
//   });

//   const result = await response.json().catch(() => ({}));

//   if (!response.ok) {
//     const error = new Error(
//       result?.error?.message ||
//         `Meta template submission failed (${response.status}).`
//     );

//     error.metaDetails = result;
//     error.status = response.status;

//     throw error;
//   }

//   return {
//     id: result.id,
//     metaId: result.id,
//     name: normalizedName,
//     status: "Pending",
//     message: "Template submitted to Meta for review.",
//   };
// }

// export async function sendTemplate({
//   to,
//   name,
//   language = "en_US",
//   components = [],
// }) {
//   if (!metaConfigured()) {
//     throw new Error(
//       "Meta WhatsApp API is not configured. Check META_PHONE_NUMBER_ID and META_ACCESS_TOKEN."
//     );
//   }

//   const url =
//     `https://graph.facebook.com/${config.metaGraphVersion}/${config.metaPhoneNumberId}/messages`;

//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${config.metaAccessToken}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       messaging_product: "whatsapp",
//       to,
//       type: "template",
//       template: {
//         name,
//         language: { code: language },
//         ...(components.length ? { components } : {}),
//       },
//     }),
//   });

//   const result = await response.json().catch(() => ({}));

//   if (!response.ok) {
//     throw new Error(
//       result?.error?.message ||
//         `Meta API request failed (${response.status}).`
//     );
//   }

//   return {
//     ...result,
//     sentAt: new Date().toISOString(),
//     recipient: to,
//     messageType: "template",
//     templateName: name,
//   };
// }

// backend/src/services/metaWhatsApp.js

import { config } from "../config.js";

function graphUrl(path) {
  return `https://graph.facebook.com/${config.metaGraphVersion}/${path}`;
}

function throwMetaError(result, status, fallback) {
  const error = new Error(
    result?.error?.message || `${fallback} (${status})`
  );
  error.metaDetails = result;
  error.status = status;
  throw error;
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

function getLanguageCode(language) {
  const codes = {
    English: "en",
    "English (US)": "en_US",
    Hindi: "hi",
  };
  return codes[language] || language || "en_US";
}

function decodeImage(imageBase64, mimeType) {
  if (!config.metaAppId) {
    throw new Error("META_APP_ID is required for template image uploads.");
  }

  if (!config.metaPhoneNumberId) {
    throw new Error("META_PHONE_NUMBER_ID is required for WhatsApp media uploads.");
  }

  if (!imageBase64 || typeof imageBase64 !== "string") {
    throw new Error("Please select an image to upload.");
  }

  const allowedTypes = ["image/jpeg", "image/png"];
  if (!allowedTypes.includes(mimeType)) {
    throw new Error("Only JPEG and PNG images are supported.");
  }

  // Accept either raw base64 or a data URL from the browser.
  const base64 = imageBase64.replace(
    /^data:image\/(?:jpeg|png);base64,/i,
    ""
  );

  const buffer = Buffer.from(base64, "base64");

  if (!buffer.length) {
    throw new Error("The selected image is empty or invalid.");
  }

  // Keep uploads within a reasonable size.
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  return buffer;
}

/**
 * Upload an image for the HEADER example used when submitting
 * a WhatsApp template for Meta approval.
 *
 * Returns a Meta example header handle. This is NOT the send-time media ID.
 */
async function uploadTemplateExampleImage(buffer, mimeType) {
  const createUrl = new URL(
    graphUrl(`${config.metaAppId}/uploads`)
  );
  createUrl.searchParams.set("file_length", String(buffer.length));
  createUrl.searchParams.set("file_type", mimeType);
  createUrl.searchParams.set("access_token", config.metaAccessToken);

  const createResponse = await fetch(createUrl, { method: "POST" });
  const createResult = await readJson(createResponse);

  if (!createResponse.ok || !createResult.id) {
    throwMetaError(
      createResult,
      createResponse.status,
      "Could not start template image upload"
    );
  }

  const uploadResponse = await fetch(
    graphUrl(createResult.id),
    {
      method: "POST",
      headers: {
        Authorization: `OAuth ${config.metaAccessToken}`,
        file_offset: "0",
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
    }
  );

  const uploadResult = await readJson(uploadResponse);

  if (!uploadResponse.ok || !uploadResult.h) {
    throwMetaError(
      uploadResult,
      uploadResponse.status,
      "Could not upload template example image"
    );
  }

  return uploadResult.h;
}

/**
 * Upload an image as WhatsApp media for actual outgoing messages.
 * Returns the media ID used in the template's send-time header component.
 */
export async function uploadWhatsAppMedia({
  imageBase64,
  mimeType = "image/jpeg",
}) {
  if (!config.metaPhoneNumberId || !config.metaAccessToken) {
    throw new Error(
      "Set META_PHONE_NUMBER_ID and META_ACCESS_TOKEN before uploading media."
    );
  }

  const buffer = decodeImage(imageBase64, mimeType);
  const form = new FormData();

  form.append(
    "messaging_product",
    "whatsapp"
  );
  form.append(
    "file",
    new Blob([buffer], { type: mimeType }),
    mimeType === "image/png" ? "header.png" : "header.jpg"
  );

  const response = await fetch(
    graphUrl(`${config.metaPhoneNumberId}/media`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.metaAccessToken}`,
      },
      body: form,
    }
  );

  const result = await readJson(response);

  if (!response.ok || !result.id) {
    throwMetaError(result, response.status, "WhatsApp media upload failed");
  }

  return result.id;
}

export function metaConfigured() {
  return Boolean(
    config.metaPhoneNumberId &&
    config.metaAccessToken
  );
}

export async function getApprovedTemplates() {
  if (!config.metaWabaId || !config.metaAccessToken) {
    throw new Error(
      "Meta templates are not configured. Add META_WABA_ID and META_ACCESS_TOKEN."
    );
  }

  const url = new URL(
    graphUrl(`${config.metaWabaId}/message_templates`)
  );
  url.searchParams.set(
    "fields",
    "id,name,status,language,category,components,rejected_reason"
  );
  url.searchParams.set("limit", "100");

  const allTemplates = [];
  let nextUrl = url.toString();

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${config.metaAccessToken}`,
      },
    });
    const result = await readJson(response);

    if (!response.ok) {
      throwMetaError(result, response.status, "Meta template request failed");
    }

    allTemplates.push(...(result.data || []));
    nextUrl = result.paging?.next || null;
  }

  return allTemplates.map((template) => {
    const components = template.components || [];
    const header = components.find(
      (item) => item.type?.toUpperCase() === "HEADER"
    );
    const body = components.find(
      (item) => item.type?.toUpperCase() === "BODY"
    );
    const footer = components.find(
      (item) => item.type?.toUpperCase() === "FOOTER"
    );
    const buttons = components.find(
      (item) => item.type?.toUpperCase() === "BUTTONS"
    );

    const headerFormat = header?.format?.toUpperCase() || "NONE";
    const headerHandle = header?.example?.header_handle;

    return {
      id: template.id,
      metaId: template.id,
      name: template.name,
      status: {
        APPROVED: "Approved",
        PENDING: "Pending",
        REJECTED: "Rejected",
        PAUSED: "Paused",
        DISABLED: "Disabled",
        IN_APPEAL: "In Appeal",
      }[template.status] || template.status || "Unknown",
      rejectedReason: template.rejected_reason || null,
      language: template.language,
      category: template.category,
      components,
      headerFormat,
      header_format: headerFormat,
      header: headerFormat === "TEXT" ? header?.text || "" : "",
      // This handle is only the template example handle.
      headerMediaHandle:
        headerFormat === "IMAGE"
          ? Array.isArray(headerHandle)
            ? headerHandle[0] || null
            : headerHandle || null
          : null,
      body: body?.text || "",
      footer: footer?.text || "",
      buttons:
        buttons?.buttons?.map((button) => ({
          type:
            button.type === "URL"
              ? "URL"
              : button.type === "PHONE_NUMBER"
                ? "Phone Call"
                : "Quick Reply",
          text: button.text || "",
          value: button.url || button.phone_number || "",
        })) || [],
    };
  });
}

export async function createMetaTemplate({
  name,
  category,
  language,
  header,
  headerFormat = "TEXT",
  imageBase64,
  imageMimeType = "image/jpeg",
  body,
  footer,
  buttons = [],
}) {
  if (!config.metaWabaId || !config.metaAccessToken) {
    throw new Error(
      "Meta templates are not configured. Check META_WABA_ID and META_ACCESS_TOKEN."
    );
  }

  const normalizedName = String(name || "").trim().toLowerCase();

  if (!/^[a-z0-9_]+$/.test(normalizedName)) {
    throw new Error(
      "Template name must contain only lowercase letters, numbers, and underscores."
    );
  }

  if (!body?.trim()) {
    throw new Error("Message body is required.");
  }

  const format = String(headerFormat || "NONE").toUpperCase();
  const components = [];
  let headerMediaId = null;
  let headerMediaHandle = null;

  if (format === "TEXT") {
    if (header?.trim()) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: header.trim(),
      });
    }
  } else if (format === "IMAGE") {
    const buffer = decodeImage(imageBase64, imageMimeType);

    // Separate identifiers are required for template approval and sending.
    headerMediaHandle = await uploadTemplateExampleImage(
      buffer,
      imageMimeType
    );

    headerMediaId = await uploadWhatsAppMedia({
      imageBase64,
      mimeType: imageMimeType,
    });

    components.push({
      type: "HEADER",
      format: "IMAGE",
      example: {
        header_handle: [headerMediaHandle],
      },
    });
  } else if (format !== "NONE") {
    throw new Error("Header format must be None, Text, or Image.");
  }

  components.push({
    type: "BODY",
    text: body.trim(),
  });

  if (footer?.trim()) {
    components.push({
      type: "FOOTER",
      text: footer.trim(),
    });
  }

  if (buttons.length) {
    components.push({
      type: "BUTTONS",
      buttons: buttons.map((button) => {
        if (button.type === "URL") {
          return {
            type: "URL",
            text: button.text,
            url: button.value,
          };
        }
        if (button.type === "Phone Call") {
          return {
            type: "PHONE_NUMBER",
            text: button.text,
            phone_number: button.value,
          };
        }
        return {
          type: "QUICK_REPLY",
          text: button.text,
        };
      }),
    });
  }

  const response = await fetch(
    graphUrl(`${config.metaWabaId}/message_templates`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.metaAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: normalizedName,
        language: getLanguageCode(language),
        category: String(category || "MARKETING").toUpperCase(),
        components,
      }),
    }
  );

  const result = await readJson(response);

  if (!response.ok) {
    throwMetaError(result, response.status, "Meta template submission failed");
  }

  return {
    id: result.id,
    metaId: result.id,
    name: normalizedName,
    language: getLanguageCode(language),
    status: "Pending",
    headerFormat: format,
    headerMediaId,
    headerMediaHandle,
    message: "Template submitted to Meta for review.",
  };
}

export async function sendTemplate({
  to,
  name,
  language = "en_US",
  components = [],
}) {
  if (!metaConfigured()) {
    throw new Error(
      "Meta WhatsApp API is not configured. Check META_PHONE_NUMBER_ID and META_ACCESS_TOKEN."
    );
  }

  const response = await fetch(
    graphUrl(`${config.metaPhoneNumberId}/messages`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.metaAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name,
          language: { code: language },
          ...(components.length ? { components } : {}),
        },
      }),
    }
  );

  const result = await readJson(response);

  if (!response.ok) {
    throwMetaError(result, response.status, "Meta API request failed");
  }

  return {
    ...result,
    sentAt: new Date().toISOString(),
    recipient: to,
    messageType: "template",
    templateName: name,
  };
}