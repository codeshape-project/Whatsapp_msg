
import { config } from "../config.js";

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
    `https://graph.facebook.com/${config.metaGraphVersion}/${config.metaWabaId}/message_templates`
  );

  url.searchParams.set(
    "fields",
    "id,name,status,language,category,components,rejected_reason"
  );
  url.searchParams.set("limit", "100");

  const allTemplates = [];
  let nextUrl = url.toString();

  // Fetch all pages returned by Meta.
  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${config.metaAccessToken}`,
      },
    });

    const result = await response.json().catch(() => ({}));

 if (!response.ok) {
  console.error(
    "========== META TEMPLATE ERROR =========="
  );
  console.error(JSON.stringify(result, null, 2));
  console.error(
    "========================================="
  );

  const error = new Error(
    result?.error?.message ||
    `Meta template submission failed (${response.status})`
  );

  error.metaDetails = result;
  error.status = response.status;

  throw error;
}

    allTemplates.push(...(result.data || []));
    nextUrl = result.paging?.next || null;
  }

  return allTemplates.map((template) => ({
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
    components: template.components || [],
    
    body:
      template.components?.find((item) => item.type === "BODY")?.text || "",
    header:
      template.components?.find((item) => item.type === "HEADER")?.text || "",
    footer:
      template.components?.find((item) => item.type === "FOOTER")?.text || "",
    buttons:
      template.components?.find((item) => item.type === "BUTTONS")
        ?.buttons?.map((button) => ({
          type:
            button.type === "URL"
              ? "URL"
              : button.type === "PHONE_NUMBER"
                ? "Phone Call"
                : "Quick Reply",
          text: button.text || "",
          value: button.url || button.phone_number || "",
        })) || [],
  }));
}

export async function createMetaTemplate({
  name,
  category,
  language,
  header,
  body,
  footer,
  buttons = [],
}) {
  if (!config.metaWabaId || !config.metaAccessToken) {
    throw new Error(
      "Meta templates are not configured. Check META_WABA_ID and META_ACCESS_TOKEN."
    );
  }

  const normalizedName = name.trim().toLowerCase();

  if (!/^[a-z0-9_]+$/.test(normalizedName)) {
    throw new Error(
      "Template name must contain only lowercase letters, numbers, and underscores."
    );
  }

  if (!body?.trim()) {
    throw new Error("Message body is required.");
  }

  const languageCodes = {
    English: "en",
    "English (US)": "en_US",
    Hindi: "hi",
  };

  const components = [];

  if (header?.trim()) {
    components.push({
      type: "HEADER",
      format: "TEXT",
      text: header.trim(),
    });
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

  const url =
    `https://graph.facebook.com/${config.metaGraphVersion}/${config.metaWabaId}/message_templates`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.metaAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: normalizedName,
      language: languageCodes[language] || language,
      category: category.toUpperCase(),
      components,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.error?.message ||
        `Meta template submission failed (${response.status}).`
    );
  }

  return {
    id: result.id,
    metaId: result.id,
    name: normalizedName,
    status: "Pending",
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

  const url =
    `https://graph.facebook.com/${config.metaGraphVersion}/${config.metaPhoneNumberId}/messages`;

  const response = await fetch(url, {
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
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body?.error?.message ||
        `Meta API request failed (${response.status}).`
    );
  }

  return {
    ...body,
    sentAt: new Date().toISOString(),
    recipient: to,
    messageType: "template",
    templateName: name,
  };
}