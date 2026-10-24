

// import { useEffect, useState, useCallback } from "react";

// import {

//   Plus,

//   FileText,

//   X,

//   Pencil,

//   Eye,

//   Trash2,

//   Link as LinkIcon,

//   Phone,

//   MessageSquare,

//   ArrowLeft,

//   Save,

//   Smartphone,

//   RefreshCw,

// } from "lucide-react";



// import useFetch from "../hooks/useFetch";

// import api from "../services/api";

// import { useAuth } from "../hooks/useAuth";



// /* ---------------- Helpers ---------------- */



// function Loader() {

//   return (

//     <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-600">

//       <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />

//       Loading templates...

//     </div>

//   );

// }



// function PageHeader({ title, subtitle, children }) {

//   return (

//     <div className="mb-6 flex flex-wrap items-start justify-between gap-3">

//       <div>

//         <h2 className="text-2xl font-semibold text-brand-900">{title}</h2>

//         {subtitle && (

//           <p className="mt-1 text-sm text-slate-600">{subtitle}</p>

//         )}

//       </div>

//       {children && (

//         <div className="flex flex-wrap items-center gap-2">{children}</div>

//       )}

//     </div>

//   );

// }



// const badgeStyles = {

//   Approved: "bg-emerald-100 text-emerald-700",

//   Pending: "bg-amber-100 text-amber-700",

//   Rejected: "bg-rose-100 text-rose-700",

//   Draft: "bg-slate-100 text-slate-600",

//   Paused: "bg-orange-100 text-orange-700",

//   Disabled: "bg-slate-200 text-slate-700",

//   "In Appeal": "bg-blue-100 text-blue-700",

// };



// function StatusBadge({ status }) {

//   const normalizedStatus = status || "Unknown";



//   return (

//     <span

//       className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${

//         badgeStyles[normalizedStatus] || "bg-slate-100 text-slate-700"

//       }`}

//     >

//       {normalizedStatus}

//     </span>

//   );

// }



// const inputClass =

//   "mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";



// const labelClass = "text-sm font-medium text-slate-700";



// const emptyForm = {

//   name: "",

//   category: "Marketing",

//   language: "English",

//   header: "",

//   body: "",

//   footer: "",

//   buttons: [],
//   variable_mappings: [],
// };



// /* ---------------- Template Editor ---------------- */



// function TemplateEditor({

//   initialTemplate,

//   onClose,

//   onSave,

//   saving,

// }) {

//   const [form, setForm] = useState(() => ({

//     ...emptyForm,

//     ...(initialTemplate || {}),

//     buttons: (initialTemplate?.buttons || []).map((button) => ({

//       id: button.id || `${Date.now()}-${Math.random()}`,

//       type: button.type || "Quick Reply",

//       text: button.text || "",

//       value: button.value || "",

//     })),

//   }));



//   const [previewOpen, setPreviewOpen] = useState(true);

//   const [error, setError] = useState("");



//   const isExistingTemplate =

//     initialTemplate?.id !== undefined &&

//     initialTemplate?.id !== null;



//   function updateField(field, value) {

//     setForm((previous) => ({ ...previous, [field]: value }));

//   }



//   function addButton() {

//     if (form.buttons.length >= 3) {

//       setError("You can add a maximum of 3 buttons in this editor.");

//       return;

//     }



//     setError("");



//     setForm((previous) => ({

//       ...previous,

//       buttons: [

//         ...previous.buttons,

//         {

//           id: `${Date.now()}-${Math.random()}`,

//           type: "Quick Reply",

//           text: "",

//           value: "",

//         },

//       ],

//     }));

//   }



//   function updateButton(id, field, value) {

//     setForm((previous) => ({

//       ...previous,

//       buttons: previous.buttons.map((button) =>

//         button.id === id ? { ...button, [field]: value } : button

//       ),

//     }));

//   }



//   function removeButton(id) {

//     setForm((previous) => ({

//       ...previous,

//       buttons: previous.buttons.filter((button) => button.id !== id),

//     }));



//     setError("");

//   }



//   function handleSave(event) {

//     event.preventDefault();

//     setError("");



//     if (isExistingTemplate) {

//       setError(

//         "This template already exists on Meta. Editing existing Meta templates is not enabled yet. Create a new template to submit it for approval."

//       );

//       return;

//     }



//     const normalizedName = form.name.trim().toLowerCase();



//     if (!normalizedName) {

//       setError("Please enter a template name.");

//       return;

//     }



//     if (!/^[a-z0-9\_]+$/.test(normalizedName)) {

//       setError(

//         "Template name can contain only lowercase letters, numbers, and underscores."

//       );

//       return;

//     }



//     if (!form.body.trim()) {

//       setError("Please enter the message body.");

//       return;

//     }



//     if (form.buttons.some((button) => !button.text.trim())) {

//       setError("Please enter text for every button.");

//       return;

//     }



//     if (

//       form.buttons.some(

//         (button) =>

//           button.type === "URL" &&

//           (!button.value.trim() ||

//             !/^https?:\/\/.+/i.test(button.value.trim()))

//       )

//     ) {

//       setError("URL buttons require a valid http:// or https:// URL.");

//       return;

//     }



//     if (

//       form.buttons.some(

//         (button) =>

//           button.type === "Phone Call" &&

//           !button.value.replace(/\D/g, "")

//       )

//     ) {

//       setError("Phone Call buttons require a phone number.");

//       return;

//     }



//     onSave({

//       name: normalizedName,

//       category: form.category,

//       language: form.language,

//       header: form.header.trim(),

//       body: form.body.trim(),

//       footer: form.footer.trim(),

//       buttons: form.buttons.map(({ id, ...button }) => ({

//         ...button,

//         text: button.text.trim(),

//         value: button.value.trim(),

//       })),
//       variable_mappings: form.variable_mappings || [],

//     });

//   }


//   function handleSave(event) {
//     event.preventDefault();
//     setError("");

//     // Existing Meta templates: save only their variable mappings.
//     if (isExistingTemplate) {
//       const placeholders = [
//         ...new Set(
//           [...String(form.body || "").matchAll(/\{\{(\d+)\}\}/g)].map(
//             (match) => Number(match[1])
//           )
//         ),
//       ].sort((a, b) => a - b);

//       const variable_mappings = placeholders.map((position) => {
//         const existing = (form.variable_mappings || []).find(
//           (mapping) => Number(mapping.position) === position
//         );

//         return {
//           position,
//           source: existing?.source || "contact.name",
//         };
//       });

//       onSave(
//         {
//           name: form.name,
//           language: form.language,
//           variable_mappings,
//         },
//         true
//       );
//       return;
//     }

//     // New templates: keep the existing creation validations.
//     const normalizedName = form.name.trim().toLowerCase();

//     if (!normalizedName) {
//       setError("Please enter a template name.");
//       return;
//     }

//     if (!/^[a-z0-9_]+$/.test(normalizedName)) {
//       setError(
//         "Template name can contain only lowercase letters, numbers, and underscores."
//       );
//       return;
//     }

//     if (!form.body.trim()) {
//       setError("Please enter the message body.");
//       return;
//     }

//     if (form.buttons.some((button) => !button.text.trim())) {
//       setError("Please enter text for every button.");
//       return;
//     }

//     if (
//       form.buttons.some(
//         (button) =>
//           button.type === "URL" &&
//           (!button.value.trim() ||
//             !/^https?:\/\/.+/i.test(button.value.trim()))
//       )
//     ) {
//       setError("URL buttons require a valid http:// or https:// URL.");
//       return;
//     }

//     if (
//       form.buttons.some(
//         (button) =>
//           button.type === "Phone Call" &&
//           !button.value.replace(/\D/g, "")
//       )
//     ) {
//       setError("Phone Call buttons require a phone number.");
//       return;
//     }

//     onSave({
//       name: normalizedName,
//       category: form.category,
//       language: form.language,
//       header: form.header.trim(),
//       body: form.body.trim(),
//       footer: form.footer.trim(),
//       buttons: form.buttons.map(({ id, ...button }) => ({
//         ...button,
//         text: button.text.trim(),
//         value: button.value.trim(),
//       })),
//       variable_mappings: form.variable_mappings || [],
//     });
//   }


//   return (

//     <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">

//       <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">

//         <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-white px-5 py-4">

//           <div className="flex items-center gap-3">

//             <button

//               type="button"

//               onClick={onClose}

//               className="rounded-lg p-2 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"

//               aria-label="Back to templates"

//             >

//               <ArrowLeft size={20} />

//             </button>



//             <div>

//               <h2 className="text-lg font-bold text-slate-900">

//                 {initialTemplate ? "Template Details" : "Create Template"}

//               </h2>

//               <p className="text-xs text-slate-500">

//                 {initialTemplate

//                   ? "View the template currently registered with Meta"

//                   : "Create a WhatsApp template and submit it to Meta for review"}

//               </p>

//             </div>

//           </div>



//           <div className="flex items-center gap-2">

//             <button

//               type="button"

//               onClick={() => setPreviewOpen((previous) => !previous)}

//               className="flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 lg:hidden"

//             >

//               <Eye size={16} />

//               {previewOpen ? "Hide Preview" : "Show Preview"}

//             </button>



//             <button

//               type="button"

//               onClick={onClose}

//               className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"

//               aria-label="Close editor"

//             >

//               <X size={20} />

//             </button>

//           </div>

//         </div>



//         <form onSubmit={handleSave}>

//           <div className="grid lg:grid-cols-[1.25fr_0.75fr]">

//             <div className="space-y-6 p-5 sm:p-7">

//               <section>

//                 <h3 className="mb-4 text-base font-semibold text-slate-900">

//                   Template Details

//                 </h3>



//                 <div className="grid gap-4 sm:grid-cols-2">

//                   <label className={labelClass}>

//                     Template Name

//                     <input

//                       className={inputClass}

//                       placeholder="e.g. appointment_reminder"

//                       value={form.name}

//                       onChange={(event) =>

//                         updateField("name", event.target.value)

//                       }

//                       disabled={saving}

//                       required

//                     />

//                   </label>



//                   <label className={labelClass}>

//                     Category

//                     <select

//                       className={inputClass}

//                       value={form.category}

//                       onChange={(event) =>

//                         updateField("category", event.target.value)

//                       }

//                       disabled={isExistingTemplate || saving}

//                     >

//                       <option>Marketing</option>

//                       <option>Utility</option>

//                       <option>Authentication</option>

//                     </select>

//                   </label>



//                   <label className={labelClass}>

//                     Language

//                     <select

//                       className={inputClass}

//                       value={form.language}

//                       onChange={(event) =>

//                         updateField("language", event.target.value)

//                       }

//                       disabled={isExistingTemplate || saving}

//                     >

//                       <option>English</option>

//                       <option>Hindi</option>

//                       <option>English (US)</option>

//                     </select>

//                   </label>

//                 </div>

//               </section>



//               <section className="rounded-2xl border border-emerald-100 p-4 sm:p-5">

//                 <h3 className="mb-4 font-semibold text-slate-900">

//                   Message Content

//                 </h3>



//                 <div className="space-y-4">

//                   <label className={labelClass}>

//                     Header (Optional)

//                     <input

//                       className={inputClass}

//                       placeholder="e.g. Appointment Confirmation"

//                       maxLength={60}

//                       value={form.header || ""}

//                       onChange={(event) =>

//                         updateField("header", event.target.value)

//                       }

//                       disabled={isExistingTemplate || saving}

//                     />

//                   </label>



//                   <label className={labelClass}>

//                     Message Body

//                     <textarea

//                       className={`${inputClass} min-h-36 resize-y`}

//                       placeholder="Hello {{1}}, your appointment is confirmed for {{2}}."

//                       value={form.body || ""}

//                       onChange={(event) =>

//                         updateField("body", event.target.value)

//                       }

//                       maxLength={1024}

//                       disabled={isExistingTemplate || saving}

//                       required

//                     />

//                     <span className="mt-1 block text-right text-xs text-slate-500">

//                       {(form.body || "").length}/1024 characters

//                     </span>

//                   </label>



//                   <div className="rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">

//                     <strong>Personalize your message:</strong> use placeholders

//                     such as {"{{1}}"} and {"{{2}}"} for values you will provide

//                     when sending the campaign.

//                   </div>



//                   <label className={labelClass}>

//                     Footer (Optional)

//                     <input

//                       className={inputClass}

//                       placeholder="e.g. Thank you for choosing us"

//                       maxLength={60}

//                       value={form.footer || ""}

//                       onChange={(event) =>

//                         updateField("footer", event.target.value)

//                       }

//                       disabled={isExistingTemplate || saving}

//                     />

//                   </label>

//                 </div>

//               </section>              {/* Database Variable Mapping */}
//               <section className="rounded-2xl border border-emerald-100 p-4 sm:p-5">
//                 <h3 className="mb-2 font-semibold text-slate-900">Database Variable Mapping</h3>
//                 <p className="mb-4 text-sm text-slate-600">
//                   Choose which database field supplies each placeholder in your message.
//                 </p>
//                 {Array.from(new Set(form.body.match(/\{\{\d+\}\}/g) || []))
//                   .sort((a, b) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")))
//                   .map((placeholder) => {
//                     const position = Number(placeholder.replace(/\D/g, ""));
//                     const currentMapping = (form.variable_mappings || []).find(
//                       (item) => item.position === position
//                     );
//                     return (
//                       <div key={placeholder} className="mb-4 grid gap-2 sm:grid-cols-2">
//                         <label className={labelClass}>
//                           Placeholder
//                           <input className={inputClass} value={placeholder} readOnly />
//                         </label>
//                         <label className={labelClass}>
//                           Database Field
//                           <select
//                             className={inputClass}
//                             value={currentMapping?.source || "contact.name"}
//                             disabled={isExistingTemplate || saving}
//                             onChange={(event) => {
//                               const source = event.target.value;
//                               setForm((previous) => ({
//                                 ...previous,
//                                 variable_mappings: [
//                                   ...(previous.variable_mappings || []).filter((item) => item.position !== position),
//                                   { position, source },
//                                 ].sort((a, b) => a.position - b.position),
//                               }));
//                             }}
//                           >
//                             <option value="contact.name">Contact Name</option>
//                             <option value="contact.email">Contact Email</option>
//                             <option value="organization.name">Organization Name</option>
//                           </select>
//                         </label>
//                       </div>
//                     );
//                   })}
//                 {!/\{\{\d+\}\}/.test(form.body) && (
//                   <p className="text-sm text-slate-500">
//                     Add placeholders such as {"{{1}}"} or {"{{2}}"} to your message body to configure mappings.
//                   </p>
//                 )}
//               </section>





//               <section className="rounded-2xl border border-emerald-100 p-4 sm:p-5">

//                 <div className="mb-4 flex flex-wrap items-center justify-between gap-2">

//                   <div>

//                     <h3 className="font-semibold text-slate-900">

//                       Interactive Buttons

//                     </h3>

//                     <p className="mt-1 text-xs text-slate-500">

//                       Add a quick reply, website link, or phone button.

//                     </p>

//                   </div>



//                   <button

//                     type="button"

//                     onClick={addButton}

//                     disabled={

//                       form.buttons.length >= 3 ||

//                       isExistingTemplate ||

//                       saving

//                     }

//                     className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"

//                   >

//                     <Plus size={16} />

//                     Add Button

//                   </button>

//                 </div>



//                 {form.buttons.length === 0 && (

//                   <div className="rounded-xl border border-dashed border-emerald-200 py-8 text-center">

//                     <MessageSquare

//                       size={24}

//                       className="mx-auto mb-2 text-emerald-600"

//                     />

//                     <p className="text-sm font-medium text-slate-700">

//                       No buttons added

//                     </p>

//                     <p className="mt-1 text-xs text-slate-500">

//                       You can add buttons when creating a template.

//                     </p>

//                   </div>

//                 )}



//                 <div className="space-y-4">

//                   {form.buttons.map((button, index) => (

//                     <div

//                       key={button.id}

//                       className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4"

//                     >

//                       <div className="mb-3 flex items-center justify-between">

//                         <span className="text-sm font-semibold text-slate-800">

//                           Button {index + 1}

//                         </span>



//                         {true && (

//                           <button

//                             type="button"

//                             onClick={() => removeButton(button.id)}

//                             disabled={saving}

//                             className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"

//                           >

//                             <Trash2 size={14} />

//                             Remove

//                           </button>

//                         )}

//                       </div>



//                       <label className={labelClass}>

//                         Button Type

//                         <select

//                           className={inputClass}

//                           value={button.type}

//                           disabled={saving}

//                           onChange={(event) =>

//                             updateButton(

//                               button.id,

//                               "type",

//                               event.target.value

//                             )

//                           }

//                         >

//                           <option value="Quick Reply">

//                             Quick Reply / Keyword

//                           </option>

//                           <option value="URL">CTA - URL</option>

//                           <option value="Phone Call">Phone Call</option>

//                         </select>

//                       </label>



//                       <label className={`${labelClass} mt-3 block`}>

//                         Button Text

//                         <input

//                           className={inputClass}

//                           placeholder="e.g. Contact Us"

//                           maxLength={25}

//                           value={button.text}

//                           disabled={saving}

//                           onChange={(event) =>

//                             updateButton(

//                               button.id,

//                               "text",

//                               event.target.value

//                             )

//                           }

//                           required

//                         />

//                       </label>



//                       {button.type === "URL" && (

//                         <label className={`${labelClass} mt-3 block`}>

//                           Website URL

//                           <input

//                             className={inputClass}

//                             type="url"

//                             placeholder="https://example.com"

//                             value={button.value || ""}

//                             disabled={isExistingTemplate || saving}

//                             onChange={(event) =>

//                               updateButton(

//                                 button.id,

//                                 "value",

//                                 event.target.value

//                               )

//                             }

//                             required

//                           />

//                         </label>

//                       )}



//                       {button.type === "Phone Call" && (

//                         <label className={`${labelClass} mt-3 block`}>

//                           Phone Number

//                           <input

//                             className={inputClass}

//                             type="tel"

//                             placeholder="+91 9876543210"

//                             value={button.value || ""}

//                             disabled={isExistingTemplate || saving}

//                             onChange={(event) =>

//                               updateButton(

//                                 button.id,

//                                 "value",

//                                 event.target.value

//                               )

//                             }

//                             required

//                           />

//                         </label>

//                       )}

//                     </div>

//                   ))}

//                 </div>

//               </section>



//               {error && (

//                 <p

//                   role="alert"

//                   className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"

//                 >

//                   {error}

//                 </p>

//               )}



//               <div className="flex flex-wrap justify-end gap-3 border-t border-emerald-100 pt-5">

//                 <button

//                   type="button"

//                   onClick={onClose}

//                   className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"

//                 >

//                   Close

//                 </button>



//                 {!isExistingTemplate && (

//                   <button

//                     type="submit"

//                     disabled={saving}

//                     className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"

//                   >

//                     {saving ? (

//                       <>

//                         <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

//                         Submitting to Meta...

//                       </>

//                     ) : (

//                       <>

//                         <Save size={16} />

//                         Submit for Approval

//                       </>

//                     )}

//                   </button>

//                 )}

//               </div>

//             </div>



//             {/* WhatsApp preview */}

//             <div

//               className={`border-t border-emerald-100 bg-[#e9e2d8] p-5 sm:p-7 lg:block lg:border-l lg:border-t-0 ${

//                 previewOpen ? "block" : "hidden lg:block"

//               }`}

//             >

//               <div className="sticky top-5">

//                 <div className="mb-4 flex items-center gap-3 rounded-t-2xl bg-emerald-800 p-4 text-white">

//                   <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600">

//                     <Smartphone size={21} />

//                   </span>

//                   <div>

//                     <h3 className="font-semibold">Preview</h3>

//                     <p className="text-xs text-emerald-100">

//                       Live template preview

//                     </p>

//                   </div>

//                 </div>



//                 <div className="min-h-80 rounded-b-2xl bg-[#efe7dc] p-4">

//                   <div className="ml-auto max-w-sm overflow-hidden rounded-xl rounded-tr-none bg-[#d9fdd3] shadow-sm">

//                     {form.header && (

//                       <div className="px-3 pt-3 text-sm font-bold text-slate-900">

//                         {form.header}

//                       </div>

//                     )}



//                     <div className="whitespace-pre-wrap break-words px-3 py-3 text-sm leading-6 text-slate-800">

//                       {form.body || "Your message will appear here..."}

//                     </div>



//                     {form.footer && (

//                       <div className="px-3 pb-2 text-xs text-slate-500">

//                         {form.footer}

//                       </div>

//                     )}



//                     <div className="px-3 pb-2 text-right text-[10px] text-slate-500">

//                       12:00 ✓✓

//                     </div>



//                     {form.buttons.map((button, index) => (

//                       <div

//                         key={button.id}

//                         className="flex items-center justify-center gap-2 border-t border-emerald-200 bg-white/90 px-3 py-3 text-sm font-medium text-emerald-700"

//                       >

//                         {button.type === "URL" ? (

//                           <LinkIcon size={15} />

//                         ) : button.type === "Phone Call" ? (

//                           <Phone size={15} />

//                         ) : (

//                           <MessageSquare size={15} />

//                         )}

//                         <span>{button.text || `Button ${index + 1}`}</span>

//                       </div>

//                     ))}

//                   </div>



//                   <p className="mx-auto mt-5 max-w-xs text-center text-xs leading-5 text-slate-600">

//                     This is a visual preview. Actual layout and button

//                     availability depend on the WhatsApp template format and

//                     Meta approval.

//                   </p>

//                 </div>



//                 <div className="mt-4 rounded-xl border border-white/70 bg-white/80 p-3 text-xs leading-5 text-slate-700">

//                   <strong className="text-slate-900">Template status:</strong>{" "}

//                   {initialTemplate?.status || "Not submitted"}

//                   <br />

//                   New templates are sent to Meta for review. Approval is not

//                   immediate.

//                 </div>

//               </div>

//             </div>

//           </div>

//         </form>

//       </div>

//     </div>

//   );

// }



// /* ---------------- Templates Page ---------------- */



// export default function Templates() {

//   const { organization } = useAuth();

//   const { data: fetchedTemplates, loading } = useFetch(api.getTemplates);



//   const [templates, setTemplates] = useState([]);

//   const [editorOpen, setEditorOpen] = useState(false);

//   const [editingTemplate, setEditingTemplate] = useState(null);

//   const [notice, setNotice] = useState("");

//   const [error, setError] = useState("");

//   const [saving, setSaving] = useState(false);

//   const [refreshing, setRefreshing] = useState(false);



//   useEffect(() => {

//     if (!Array.isArray(fetchedTemplates)) return;

//     setTemplates(fetchedTemplates);

//   }, [fetchedTemplates, organization.id]);



//   const refreshTemplates = useCallback(async () => {

//     setRefreshing(true);

//     setError("");



//     try {

//       const data = await api.getTemplates();

//       setTemplates(Array.isArray(data) ? data : []);

//     } catch (err) {

//       setError(err.message || "Unable to refresh templates from Meta.");

//     } finally {

//       setRefreshing(false);

//     }

//   }, []);



//   function openNewEditor() {

//     setEditingTemplate(null);

//     setEditorOpen(true);

//     setNotice("");

//     setError("");

//   }



//   function openEditEditor(template) {

//     setEditingTemplate(template);

//     setEditorOpen(true);

//     setNotice("");

//     setError("");

//   }



  
//   async function saveTemplate(template, saveMappingsOnly = false) {
//     setSaving(true);
//     setError("");
//     setNotice("");

//     try {
//       let result;

//       if (saveMappingsOnly) {
//         result = await api.request("/templates/mappings", {
//           method: "PUT",
//           body: JSON.stringify({
//             name: template.name,
//             language: template.language,
//             variable_mappings: template.variable_mappings,
//           }),
//         });
//       } else {
//         result = await api.createTemplate(template);
//       }

//       setEditorOpen(false);
//       setEditingTemplate(null);

//       setNotice(
//         result?.message ||
//           (saveMappingsOnly
//             ? "Template mappings saved successfully."
//             : "Template submitted to Meta. Refresh the list to check its review status.")
//       );

//       await refreshTemplates();
//     } catch (err) {
//       setError(err.message || "Failed to save the template.");
//     } finally {
//       setSaving(false);
//     }
//   }




//   function deleteTemplate(template) {

//     setNotice(

//       `“${template.name}” was not deleted from Meta. This page only displays templates registered with Meta; deleting a template requires a separate backend endpoint.`

//     );

//   }



//   if (loading) return <Loader />;



//   return (

//     <>

//       <PageHeader

//         title="Templates"

//         subtitle={`Create and manage WhatsApp templates for ${

//           organization?.name || "your organization"

//         }`}

//       >

//         <button

//           type="button"

//           onClick={refreshTemplates}

//           disabled={refreshing}

//           className="flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-60"

//         >

//           <RefreshCw

//             size={16}

//             className={refreshing ? "animate-spin" : ""}

//           />

//           Refresh Status

//         </button>



//         <button

//           type="button"

//           onClick={openNewEditor}

//           className="btn-primary flex items-center gap-2"

//         >

//           <Plus size={16} />

//           New Template

//         </button>

//       </PageHeader>



//       {notice && (

//         <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">

//           <span>{notice}</span>

//           <button

//             type="button"

//             onClick={() => setNotice("")}

//             aria-label="Dismiss notification"

//           >

//             <X size={16} />

//           </button>

//         </div>

//       )}



//       {error && (

//         <div

//           role="alert"

//           className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"

//         >

//           <span>{error}</span>

//           <button

//             type="button"

//             onClick={() => setError("")}

//             aria-label="Dismiss error"

//           >

//             <X size={16} />

//           </button>

//         </div>

//       )}



//       {templates.length === 0 ? (

//         <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-10 text-center">

//           <FileText size={36} className="mx-auto mb-3 text-emerald-600" />

//           <h3 className="font-semibold text-slate-900">

//             No Meta templates found

//           </h3>

//           <p className="mt-1 text-sm text-slate-600">

//             Create your first WhatsApp template and submit it for approval.

//           </p>

//           <button

//             type="button"

//             onClick={openNewEditor}

//             className="btn-primary mt-4 inline-flex items-center gap-2"

//           >

//             <Plus size={16} />

//             Create Template

//           </button>

//         </div>

//       ) : (

//         <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

//           {templates.map((template) => (

//             <article

//               key={template.id || template.name}

//               className="card flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-[0_14px_30px\_-12px_rgba(18,140,126,0.35)]"

//             >

//               <div className="flex items-start justify-between gap-3">

//                 <div className="flex min-w-0 items-center gap-3">

//                   <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-wa to-brand-700 text-white shadow-[0_0_12px_rgba(37,211,102,0.35)]">

//                     <FileText size={20} />

//                   </span>



//                   <div className="min-w-0">

//                     <h3 className="break-words text-sm font-semibold text-slate-900">

//                       {template.name}

//                     </h3>

//                     <p className="mt-1 text-xs text-slate-600">

//                       {template.category || "Marketing"} •{" "}

//                       {template.language || "English"}

//                     </p>

//                   </div>

//                 </div>



//                <StatusBadge status={template.status} />

// {template.status?.toLowerCase() === "rejected" &&
//   template.rejectedReason && (
//     <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
//       <p className="font-semibold text-red-700">
//         Rejection reason
//       </p>
//       <p className="mt-1 text-sm text-red-800">
//         {template.rejectedReason.replaceAll("_", " ")}
//       </p>
//     </div>
//   )}

//               </div>



//               <div className="mt-4 flex-1 overflow-hidden rounded-lg rounded-tl-none bg-[#d9fdd3] p-3 text-sm leading-6 text-slate-800">

//                 {template.header && (

//                   <p className="mb-2 font-bold">{template.header}</p>

//                 )}



//                 <p className="whitespace-pre-wrap break-words">

//                   {template.body || "No message content"}

//                 </p>



//                 {template.footer && (

//                   <p className="mt-2 text-xs text-slate-600">

//                     {template.footer}

//                   </p>

//                 )}



//                 {template.buttons?.length > 0 && (

//                   <div className="mt-3 space-y-2 border-t border-emerald-200 pt-3">

//                     {template.buttons.map((button, index) => (

//                       <div

//                         key={`${template.id}-button-${index}`}

//                         className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-700"

//                       >

//                         {button.type === "URL" ? (

//                           <LinkIcon size={13} />

//                         ) : button.type === "Phone Call" ? (

//                           <Phone size={13} />

//                         ) : (

//                           <MessageSquare size={13} />

//                         )}

//                         {button.text}

//                       </div>

//                     ))}

//                   </div>

//                 )}

//               </div>



//               <div className="mt-4 flex gap-2">

//                 <button

//                   type="button"

//                   onClick={() => openEditEditor(template)}

//                   className="btn-ghost flex flex-1 items-center justify-center gap-2 py-2"

//                 >

//                   <Pencil size={14} />

//                   Details

//                 </button>



//                 <button

//                   type="button"

//                   onClick={() => openEditEditor(template)}

//                   className="btn-primary flex flex-1 items-center justify-center gap-2 py-2"

//                 >

//                   <Eye size={14} />

//                   Preview

//                 </button>



//                 <button

//                   type="button"

//                   onClick={() => deleteTemplate(template)}

//                   className="rounded-xl border border-rose-100 px-3 text-rose-600 transition hover:bg-rose-50"

//                   title="Meta deletion is not configured"

//                   aria-label={`Delete ${template.name}`}

//                 >

//                   <Trash2 size={15} />

//                 </button>

//               </div>

//             </article>

//           ))}

//         </div>

//       )}



//       {editorOpen && (

//         <TemplateEditor

//           initialTemplate={editingTemplate}

//           saving={saving}

//           onClose={() => {

//             if (saving) return;

//             setEditorOpen(false);

//             setEditingTemplate(null);

//           }}

//           onSave={saveTemplate}

//         />

//       )}

//     </>

//   );

// }



import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  FileText,
  X,
  Pencil,
  Eye,
  Trash2,
  Link as LinkIcon,
  Phone,
  MessageSquare,
  ArrowLeft,
  Save,
  Smartphone,
  RefreshCw,
} from "lucide-react";

import useFetch from "../hooks/useFetch";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

/* ---------------- Helpers ---------------- */

function Loader() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
      Loading templates...
    </div>
  );
}

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold text-brand-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}

const badgeStyles = {
  Approved: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Rejected: "bg-rose-100 text-rose-700",
  Draft: "bg-slate-100 text-slate-600",
  Paused: "bg-orange-100 text-orange-700",
  Disabled: "bg-slate-200 text-slate-700",
  "In Appeal": "bg-blue-100 text-blue-700",
};

function StatusBadge({ status }) {
  const normalizedStatus = status || "Unknown";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
        badgeStyles[normalizedStatus] || "bg-slate-100 text-slate-700"
      }`}
    >
      {normalizedStatus}
    </span>
  );
}

const inputClass =
  "mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

const labelClass = "text-sm font-medium text-slate-700";

const emptyForm = {
  name: "",
  category: "Marketing",
  language: "English",
  header: "",
  body: "",
  footer: "",
  buttons: [],
  variable_mappings: [],
};

/* ---------------- Template Editor ---------------- */

function TemplateEditor({ initialTemplate, onClose, onSave, saving }) {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...(initialTemplate || {}),
    variable_mappings: (initialTemplate?.variable_mappings || []).map(
      (mapping) => ({
        ...mapping,
        position: Number(mapping.position),
      })
    ),
    buttons: (initialTemplate?.buttons || []).map((button) => ({
      id: button.id || `${Date.now()}-${Math.random()}`,
      type: button.type || "Quick Reply",
      text: button.text || "",
      value: button.value || "",
    })),
  }));

  const [previewOpen, setPreviewOpen] = useState(true);
  const [error, setError] = useState("");

  const isExistingTemplate =
    initialTemplate?.id !== undefined && initialTemplate?.id !== null;

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function addButton() {
    if (form.buttons.length >= 3) {
      setError("You can add a maximum of 3 buttons in this editor.");
      return;
    }

    setError("");

    setForm((previous) => ({
      ...previous,
      buttons: [
        ...previous.buttons,
        {
          id: `${Date.now()}-${Math.random()}`,
          type: "Quick Reply",
          text: "",
          value: "",
        },
      ],
    }));
  }

  function updateButton(id, field, value) {
    setForm((previous) => ({
      ...previous,
      buttons: previous.buttons.map((button) =>
        button.id === id ? { ...button, [field]: value } : button
      ),
    }));
  }

  function removeButton(id) {
    setForm((previous) => ({
      ...previous,
      buttons: previous.buttons.filter((button) => button.id !== id),
    }));

    setError("");
  }

  function handleSave(event) {
    event.preventDefault();
    setError("");

    // Existing Meta templates: save only their variable mappings.
    if (isExistingTemplate) {
      const placeholders = [
        ...new Set(
          [
            ...String(form.body || "").matchAll(/\{\{(\d+)\}\}/g),
          ].map((match) => Number(match[1]))
        ),
      ].sort((a, b) => a - b);

      if (placeholders.length === 0) {
        setError("This template has no body placeholders to map.");
        return;
      }

      const variable_mappings = placeholders.map((position) => {
        const existing = (form.variable_mappings || []).find(
          (mapping) => Number(mapping.position) === position
        );

        return {
          position,
          source: existing?.source || "contact.name",
        };
      });

      onSave(
        {
          name: form.name,
          language: form.language,
          variable_mappings,
        },
        true
      );
      return;
    }

    // New templates: preserve existing creation validations.
    const normalizedName = form.name.trim().toLowerCase();

    if (!normalizedName) {
      setError("Please enter a template name.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(normalizedName)) {
      setError(
        "Template name can contain only lowercase letters, numbers, and underscores."
      );
      return;
    }

    if (!form.body.trim()) {
      setError("Please enter the message body.");
      return;
    }

    if (form.buttons.some((button) => !button.text.trim())) {
      setError("Please enter text for every button.");
      return;
    }

    if (
      form.buttons.some(
        (button) =>
          button.type === "URL" &&
          (!button.value.trim() ||
            !/^https?:\/\/.+/i.test(button.value.trim()))
      )
    ) {
      setError("URL buttons require a valid http:// or https:// URL.");
      return;
    }

    if (
      form.buttons.some(
        (button) =>
          button.type === "Phone Call" &&
          !button.value.replace(/\D/g, "")
      )
    ) {
      setError("Phone Call buttons require a phone number.");
      return;
    }

    onSave({
      name: normalizedName,
      category: form.category,
      language: form.language,
      header: form.header.trim(),
      body: form.body.trim(),
      footer: form.footer.trim(),
      buttons: form.buttons.map(({ id, ...button }) => ({
        ...button,
        text: button.text.trim(),
        value: button.value.trim(),
      })),
      variable_mappings: form.variable_mappings || [],
    });
  }

  const placeholders = [
    ...new Set(
      [...String(form.body || "").matchAll(/\{\{(\d+)\}\}/g)].map(
        (match) => Number(match[1])
      )
    ),
  ].sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
              aria-label="Back to templates"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialTemplate ? "Template Details" : "Create Template"}
              </h2>
              <p className="text-xs text-slate-500">
                {initialTemplate
                  ? "View the template currently registered with Meta and configure its variable mappings"
                  : "Create a WhatsApp template and submit it to Meta for review"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen((previous) => !previous)}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 lg:hidden"
            >
              <Eye size={16} />
              {previewOpen ? "Hide Preview" : "Show Preview"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Close editor"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-6 p-5 sm:p-7">
              <section>
                <h3 className="mb-4 text-base font-semibold text-slate-900">
                  Template Details
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    Template Name
                    <input
                      className={inputClass}
                      placeholder="e.g. appointment_reminder"
                      value={form.name || ""}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      disabled={isExistingTemplate || saving}
                      required
                    />
                  </label>

                  <label className={labelClass}>
                    Category
                    <select
                      className={inputClass}
                      value={form.category || "Marketing"}
                      onChange={(event) =>
                        updateField("category", event.target.value)
                      }
                      disabled={isExistingTemplate || saving}
                    >
                      <option>Marketing</option>
                      <option>Utility</option>
                      <option>Authentication</option>
                    </select>
                  </label>

                  <label className={labelClass}>
                    Language
                    <input
                      className={inputClass}
                      value={form.language || ""}
                      disabled={isExistingTemplate || saving}
                      onChange={(event) =>
                        updateField("language", event.target.value)
                      }
                      required
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-emerald-100 p-4 sm:p-5">
                <h3 className="mb-4 font-semibold text-slate-900">
                  Message Content
                </h3>

                <div className="space-y-4">
                  <label className={labelClass}>
                    Header (Optional)
                    <input
                      className={inputClass}
                      placeholder="e.g. Appointment Confirmation"
                      maxLength={60}
                      value={form.header || ""}
                      onChange={(event) =>
                        updateField("header", event.target.value)
                      }
                      disabled={isExistingTemplate || saving}
                    />
                  </label>

                  <label className={labelClass}>
                    Message Body
                    <textarea
                      className={`${inputClass} min-h-36 resize-y`}
                      placeholder="Hello {{1}}, your appointment is confirmed for {{2}}."
                      value={form.body || ""}
                      onChange={(event) =>
                        updateField("body", event.target.value)
                      }
                      maxLength={1024}
                      disabled={isExistingTemplate || saving}
                      required
                    />
                    <span className="mt-1 block text-right text-xs text-slate-500">
                      {(form.body || "").length}/1024 characters
                    </span>
                  </label>

                  <div className="rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
                    <strong>Personalize your message:</strong> use placeholders
                    such as {"{{1}}"} and {"{{2}}"} for values you will provide
                    when sending the campaign.
                  </div>

                  <label className={labelClass}>
                    Footer (Optional)
                    <input
                      className={inputClass}
                      placeholder="e.g. Thank you for choosing us"
                      maxLength={60}
                      value={form.footer || ""}
                      onChange={(event) =>
                        updateField("footer", event.target.value)
                      }
                      disabled={isExistingTemplate || saving}
                    />
                  </label>
                </div>
              </section>

              {/* Database Variable Mapping */}
              <section className="rounded-2xl border border-emerald-100 p-4 sm:p-5">
                <h3 className="mb-2 font-semibold text-slate-900">
                  Database Variable Mapping
                </h3>
                <p className="mb-4 text-sm text-slate-600">
                  Choose which database field supplies each placeholder in your
                  message.
                </p>

                {placeholders.map((position) => {
                  const placeholder = `{{${position}}}`;
                  const currentMapping = (form.variable_mappings || []).find(
                    (item) => Number(item.position) === position
                  );

                  return (
                    <div
                      key={placeholder}
                      className="mb-4 grid gap-2 sm:grid-cols-2"
                    >
                      <label className={labelClass}>
                        Placeholder
                        <input
                          className={inputClass}
                          value={placeholder}
                          readOnly
                        />
                      </label>

                      <label className={labelClass}>
                        Database Field
                        <select
                          className={inputClass}
                          value={currentMapping?.source || "contact.name"}
                          disabled={saving}
                          onChange={(event) => {
                            const source = event.target.value;

                            setForm((previous) => ({
                              ...previous,
                              variable_mappings: [
                                ...(previous.variable_mappings || []).filter(
                                  (item) =>
                                    Number(item.position) !== position
                                ),
                                { position, source },
                              ].sort(
                                (a, b) => a.position - b.position
                              ),
                            }));
                          }}
                        >
                          <option value="contact.name">Contact Name</option>
                          <option value="contact.email">Contact Email</option>
                          <option value="organization.name">
                            Organization Name
                          </option>
                        </select>
                      </label>
                    </div>
                  );
                })}

                {!/\{\{\d+\}\}/.test(form.body || "") && (
                  <p className="text-sm text-slate-500">
                    This template has no body placeholders to configure.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-emerald-100 p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Interactive Buttons
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Add a quick reply, website link, or phone button.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addButton}
                    disabled={
                      form.buttons.length >= 3 ||
                      isExistingTemplate ||
                      saving
                    }
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={16} />
                    Add Button
                  </button>
                </div>

                {form.buttons.length === 0 && (
                  <div className="rounded-xl border border-dashed border-emerald-200 py-8 text-center">
                    <MessageSquare
                      size={24}
                      className="mx-auto mb-2 text-emerald-600"
                    />
                    <p className="text-sm font-medium text-slate-700">
                      No buttons added
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      You can add buttons when creating a template.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {form.buttons.map((button, index) => (
                    <div
                      key={button.id}
                      className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">
                          Button {index + 1}
                        </span>

                        {!isExistingTemplate && (
                          <button
                            type="button"
                            onClick={() => removeButton(button.id)}
                            disabled={saving}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        )}
                      </div>

                      <label className={labelClass}>
                        Button Type
                        <select
                          className={inputClass}
                          value={button.type}
                          disabled={isExistingTemplate || saving}
                          onChange={(event) =>
                            updateButton(
                              button.id,
                              "type",
                              event.target.value
                            )
                          }
                        >
                          <option value="Quick Reply">
                            Quick Reply / Keyword
                          </option>
                          <option value="URL">CTA - URL</option>
                          <option value="Phone Call">Phone Call</option>
                        </select>
                      </label>

                      <label className={`${labelClass} mt-3 block`}>
                        Button Text
                        <input
                          className={inputClass}
                          placeholder="e.g. Contact Us"
                          maxLength={25}
                          value={button.text}
                          disabled={isExistingTemplate || saving}
                          onChange={(event) =>
                            updateButton(
                              button.id,
                              "text",
                              event.target.value
                            )
                          }
                          required={!isExistingTemplate}
                        />
                      </label>

                      {button.type === "URL" && (
                        <label className={`${labelClass} mt-3 block`}>
                          Website URL
                          <input
                            className={inputClass}
                            type="url"
                            placeholder="https://example.com"
                            value={button.value || ""}
                            disabled={isExistingTemplate || saving}
                            onChange={(event) =>
                              updateButton(
                                button.id,
                                "value",
                                event.target.value
                              )
                            }
                            required={!isExistingTemplate}
                          />
                        </label>
                      )}

                      {button.type === "Phone Call" && (
                        <label className={`${labelClass} mt-3 block`}>
                          Phone Number
                          <input
                            className={inputClass}
                            type="tel"
                            placeholder="+91 9876543210"
                            value={button.value || ""}
                            disabled={isExistingTemplate || saving}
                            onChange={(event) =>
                              updateButton(
                                button.id,
                                "value",
                                event.target.value
                              )
                            }
                            required={!isExistingTemplate}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-3 border-t border-emerald-100 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      {isExistingTemplate
                        ? "Saving Mappings..."
                        : "Submitting to Meta..."}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {isExistingTemplate
                        ? "Save Mappings"
                        : "Submit for Approval"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* WhatsApp preview */}
            <div
              className={`border-t border-emerald-100 bg-[#e9e2d8] p-5 sm:p-7 lg:block lg:border-l lg:border-t-0 ${
                previewOpen ? "block" : "hidden lg:block"
              }`}
            >
              <div className="sticky top-5">
                <div className="mb-4 flex items-center gap-3 rounded-t-2xl bg-emerald-800 p-4 text-white">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600">
                    <Smartphone size={21} />
                  </span>
                  <div>
                    <h3 className="font-semibold">Preview</h3>
                    <p className="text-xs text-emerald-100">
                      Live template preview
                    </p>
                  </div>
                </div>

                <div className="min-h-80 rounded-b-2xl bg-[#efe7dc] p-4">
                  <div className="ml-auto max-w-sm overflow-hidden rounded-xl rounded-tr-none bg-[#d9fdd3] shadow-sm">
                    {form.header && (
                      <div className="px-3 pt-3 text-sm font-bold text-slate-900">
                        {form.header}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap break-words px-3 py-3 text-sm leading-6 text-slate-800">
                      {form.body || "Your message will appear here..."}
                    </div>

                    {form.footer && (
                      <div className="px-3 pb-2 text-xs text-slate-500">
                        {form.footer}
                      </div>
                    )}

                    <div className="px-3 pb-2 text-right text-[10px] text-slate-500">
                      12:00 ✓✓
                    </div>

                    {form.buttons.map((button, index) => (
                      <div
                        key={button.id}
                        className="flex items-center justify-center gap-2 border-t border-emerald-200 bg-white/90 px-3 py-3 text-sm font-medium text-emerald-700"
                      >
                        {button.type === "URL" ? (
                          <LinkIcon size={15} />
                        ) : button.type === "Phone Call" ? (
                          <Phone size={15} />
                        ) : (
                          <MessageSquare size={15} />
                        )}
                        <span>{button.text || `Button ${index + 1}`}</span>
                      </div>
                    ))}
                  </div>

                  <p className="mx-auto mt-5 max-w-xs text-center text-xs leading-5 text-slate-600">
                    This is a visual preview. Actual layout and button
                    availability depend on the WhatsApp template format and
                    Meta approval.
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-white/70 bg-white/80 p-3 text-xs leading-5 text-slate-700">
                  <strong className="text-slate-900">Template status:</strong>{" "}
                  {initialTemplate?.status || "Not submitted"}
                  <br />
                  New templates are sent to Meta for review. Approval is not
                  immediate.
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Templates Page ---------------- */

export default function Templates() {
  const { organization } = useAuth();
  const { data: fetchedTemplates, loading } = useFetch(api.getTemplates);

  const [templates, setTemplates] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!Array.isArray(fetchedTemplates)) return;
    setTemplates(fetchedTemplates);
  }, [fetchedTemplates, organization?.id]);

  const refreshTemplates = useCallback(async () => {
    setRefreshing(true);
    setError("");

    try {
      const data = await api.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to refresh templates from Meta.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  function openNewEditor() {
    setEditingTemplate(null);
    setEditorOpen(true);
    setNotice("");
    setError("");
  }

  function openEditEditor(template) {
    setEditingTemplate(template);
    setEditorOpen(true);
    setNotice("");
    setError("");
  }

  async function saveTemplate(template, saveMappingsOnly = false) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      let result;

      if (saveMappingsOnly) {
        result = await api.request("/templates/mappings", {
          method: "PUT",
          body: JSON.stringify({
            name: template.name,
            language: template.language,
            variable_mappings: template.variable_mappings,
          }),
        });
      } else {
        result = await api.createTemplate(template);
      }

      setEditorOpen(false);
      setEditingTemplate(null);

      setNotice(
        result?.message ||
          (saveMappingsOnly
            ? "Template mappings saved successfully."
            : "Template submitted to Meta. Refresh the list to check its review status.")
      );

      await refreshTemplates();
    } catch (err) {
      setError(err.message || "Failed to save the template.");
    } finally {
      setSaving(false);
    }
  }

  function deleteTemplate(template) {
    setNotice(
      `“${template.name}” was not deleted from Meta. This page only displays templates registered with Meta; deleting a template requires a separate backend endpoint.`
    );
  }

  if (loading) return <Loader />;

  return (
    <>
      <PageHeader
        title="Templates"
        subtitle={`Create and manage WhatsApp templates for ${
          organization?.name || "your organization"
        }`}
      >
        <button
          type="button"
          onClick={refreshTemplates}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh Status
        </button>

        <button
          type="button"
          onClick={openNewEditor}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          New Template
        </button>
      </PageHeader>

      {notice && (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-10 text-center">
          <FileText size={36} className="mx-auto mb-3 text-emerald-600" />
          <h3 className="font-semibold text-slate-900">
            No Meta templates found
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Create your first WhatsApp template and submit it for approval.
          </p>
          <button
            type="button"
            onClick={openNewEditor}
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <article
              key={template.id || template.name}
              className="card flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-[0_14px_30px_-12px_rgba(18,140,126,0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-wa to-brand-700 text-white shadow-[0_0_12px_rgba(37,211,102,0.35)]">
                    <FileText size={20} />
                  </span>

                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-slate-900">
                      {template.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">
                      {template.category || "Marketing"} •{" "}
                      {template.language || "English"}
                    </p>
                  </div>
                </div>

                <StatusBadge status={template.status} />
              </div>

              {template.status?.toLowerCase() === "rejected" &&
                template.rejectedReason && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="font-semibold text-red-700">
                      Rejection reason
                    </p>
                    <p className="mt-1 text-sm text-red-800">
                      {template.rejectedReason.replaceAll("_", " ")}
                    </p>
                  </div>
                )}

              <div className="mt-4 flex-1 overflow-hidden rounded-lg rounded-tl-none bg-[#d9fdd3] p-3 text-sm leading-6 text-slate-800">
                {template.header && (
                  <p className="mb-2 font-bold">{template.header}</p>
                )}

                <p className="whitespace-pre-wrap break-words">
                  {template.body || "No message content"}
                </p>

                {template.footer && (
                  <p className="mt-2 text-xs text-slate-600">
                    {template.footer}
                  </p>
                )}

                {template.buttons?.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-emerald-200 pt-3">
                    {template.buttons.map((button, index) => (
                      <div
                        key={`${template.id}-button-${index}`}
                        className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-700"
                      >
                        {button.type === "URL" ? (
                          <LinkIcon size={13} />
                        ) : button.type === "Phone Call" ? (
                          <Phone size={13} />
                        ) : (
                          <MessageSquare size={13} />
                        )}
                        {button.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditEditor(template)}
                  className="btn-ghost flex flex-1 items-center justify-center gap-2 py-2"
                >
                  <Pencil size={14} />
                  Details
                </button>

                <button
                  type="button"
                  onClick={() => openEditEditor(template)}
                  className="btn-primary flex flex-1 items-center justify-center gap-2 py-2"
                >
                  <Eye size={14} />
                  Preview
                </button>

                <button
                  type="button"
                  onClick={() => deleteTemplate(template)}
                  className="rounded-xl border border-rose-100 px-3 text-rose-600 transition hover:bg-rose-50"
                  title="Meta deletion is not configured"
                  aria-label={`Delete ${template.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editorOpen && (
        <TemplateEditor
          initialTemplate={editingTemplate}
          saving={saving}
          onClose={() => {
            if (saving) return;
            setEditorOpen(false);
            setEditingTemplate(null);
          }}
          onSave={saveTemplate}
        />
      )}
    </>
  );
}
