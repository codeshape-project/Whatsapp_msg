// // // ============================================================================
// // // CONTACTS PAGE – everything for this page lives in this one file
// // // (summary boxes, search, table, add/edit modal, helpers).
// // // ============================================================================
// // import { useEffect, useMemo, useRef, useState } from "react";
// // import * as XLSX from "xlsx";
// // import {
// //   Plus,
// //   Search,
// //   Upload,
// //   Download,
// //   Trash2,
// //   Pencil,
// //   MessageCircle,
// //   X,
// // } from "lucide-react";

// // import useFetch from "../hooks/useFetch";
// // import api from "../services/api";
// // import { getOrganizationData } from "../data/dummyData";
// // import { useAuth } from "../hooks/useAuth";

// // const PAGE_SIZE = 6;
// // const emptyForm = { name: "", phone: "", email: "", group: "" };

// // /* ---------- small helpers used only on this page ---------- */

// // function Loader() {
// //   return (
// //     <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
// //       <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
// //       Loading...
// //     </div>
// //   );
// // }

// // function PageHeader({ title, subtitle, children }) {
// //   return (
// //     <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
// //       <div>
// //         <h2 className="text-2xl font-semibold text-brand-900">{title}</h2>
// //         {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
// //       </div>
// //       {children && (
// //         <div className="flex flex-wrap items-center gap-2">{children}</div>
// //       )}
// //     </div>
// //   );
// // }

// // const badgeStyles = {
// //   Active: "bg-emerald-100 text-emerald-700",
// //   Inactive: "bg-slate-100 text-slate-600",
// // };

// // function StatusBadge({ status }) {
// //   return (
// //     <span
// //       className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
// //         badgeStyles[status] || "bg-slate-100 text-slate-600"
// //       }`}
// //     >
// //       {status}
// //     </span>
// //   );
// // }

// // function SummaryBox({ label, value, color }) {
// //   return (
// //     <div
// //       className="rounded-2xl p-4 transition duration-200 hover:-translate-y-1"
// //       style={{
// //         border: `1.5px solid ${color}`,
// //         background: `linear-gradient(135deg, ${color}26 0%, #ffffff 70%)`,
// //         boxShadow: `0 0 0 3px ${color}1f, 0 0 22px ${color}66, 0 10px 22px -14px ${color}`,
// //       }}
// //     >
// //       <p className="text-xs font-medium text-slate-600">{label}</p>
// //       <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
// //     </div>
// //   );
// // }

// // function Modal({ isOpen, onClose, title, children, footer }) {
// //   if (!isOpen) return null;

// //   return (
// //     <div
// //       className="fixed inset-0 z-[60] flex items-center justify-center p-4"
// //       role="dialog"
// //       aria-modal="true"
// //     >
// //       <div className="absolute inset-0 bg-black/50" onClick={onClose} />

// //       <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
// //         <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
// //           <h3 className="text-lg font-semibold text-brand-900">{title}</h3>

// //           <button
// //             onClick={onClose}
// //             className="rounded p-1 text-slate-500 hover:bg-slate-100"
// //             aria-label="Close"
// //           >
// //             <X size={18} />
// //           </button>
// //         </div>

// //         <div className="px-5 py-4">{children}</div>

// //         {footer && (
// //           <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
// //             {footer}
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // function DataTable({ columns, rows, empty = "No records found." }) {
// //   const safeRows = Array.isArray(rows) ? rows : [];

// //   return (
// //     <div className="overflow-x-auto">
// //       <table className="w-full min-w-[640px] text-left text-sm">
// //         <thead>
// //           <tr className="bg-brand-50 text-xs font-semibold text-brand-900">
// //             {columns.map((column) => (
// //               <th key={column.key} className="px-4 py-3.5">
// //                 {column.label}
// //               </th>
// //             ))}
// //           </tr>
// //         </thead>

// //         <tbody className="divide-y divide-slate-100">
// //           {safeRows.length === 0 && (
// //             <tr>
// //               <td
// //                 colSpan={columns.length}
// //                 className="px-4 py-10 text-center text-slate-500"
// //               >
// //                 {empty}
// //               </td>
// //             </tr>
// //           )}

// //           {safeRows.map((row, index) => (
// //             <tr key={row.id ?? index} className="hover:bg-brand-50/60">
// //               {columns.map((column) => (
// //                 <td key={column.key} className="px-4 py-3.5 text-slate-700">
// //                   {column.render ? column.render(row) : row[column.key]}
// //                 </td>
// //               ))}
// //             </tr>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   );
// // }

// // /* ---------- response normalization ---------- */

// // // Supports APIs returning an array, { data: [...] }, or null.
// // function getContactArray(response) {
// //   if (Array.isArray(response)) return response;
// //   if (Array.isArray(response?.data)) return response.data;
// //   if (Array.isArray(response?.contacts)) return response.contacts;
// //   return [];
// // }

// // function normalizeContact(contact) {
// //   return {
// //     ...contact,
// //     group: contact.group || contact.group_name || "",
// //     email: contact.email || "",
// //     status: contact.status || "Active",
// //     lastMessage: contact.lastMessage || contact.last_message || "—",
// //   };
// // }

// // /* ---------- the page ---------- */

// // export default function Contacts() {
// //   const { organization } = useAuth();

// //   const organizationData = getOrganizationData(organization);
// //   const contactGroups = Array.isArray(organizationData?.contactGroups)
// //     ? organizationData.contactGroups
// //     : [];

// //   const isHospital = organization?.type === "Hospital";

// //   const {
// //     data: contacts,
// //     setData: setContacts,
// //     loading,
// //   } = useFetch(api.getContacts);

// //   // Always work with an array, even when the API initially returns null.
// //   const safeContacts = useMemo(
// //     () => getContactArray(contacts).map(normalizeContact),
// //     [contacts]
// //   );

// //   const [query, setQuery] = useState("");
// //   const [group, setGroup] = useState("All");
// //   const [page, setPage] = useState(1);
// //   const [form, setForm] = useState(emptyForm);
// //   const [editingId, setEditingId] = useState(null);
// //   const [modalOpen, setModalOpen] = useState(false);
// //   const fileRef = useRef(null);
// //   const [notice, setNotice] = useState(null);
// //   const [busy, setBusy] = useState(false);

// //   useEffect(() => {
// //     setQuery("");
// //     setGroup("All");
// //     setPage(1);
// //     setForm({ ...emptyForm, group: contactGroups[0] || "" });
// //   }, [organization?.id]);

// //   const filtered = useMemo(() => {
// //     const q = query.trim().toLowerCase();
// //     const normalizedQuery = q.replace(/\s/g, "");

// //     return safeContacts.filter((contact) => {
// //       const name = String(contact.name || "").toLowerCase();
// //       const phone = String(contact.phone || "").replace(/\s/g, "");
// //       const email = String(contact.email || "").toLowerCase();

// //       return (
// //         (group === "All" || contact.group === group) &&
// //         (!q ||
// //           name.includes(q) ||
// //           phone.includes(normalizedQuery) ||
// //           (!isHospital && email.includes(q)))
// //       );
// //     });
// //   }, [safeContacts, query, group, isHospital]);

// //   const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
// //   const current = Math.min(page, pages);
// //   const rows = filtered.slice(
// //     (current - 1) * PAGE_SIZE,
// //     current * PAGE_SIZE
// //   );

// //   const openAdd = () => {
// //     setEditingId(null);
// //     setForm({ ...emptyForm, group: contactGroups[0] || "" });
// //     setModalOpen(true);
// //   };

// //   const openEdit = (contact) => {
// //     setEditingId(contact.id);
// //     setForm({
// //       name: contact.name || "",
// //       phone: contact.phone || "",
// //       email: contact.email || "",
// //       group: contact.group || "",
// //     });
// //     setModalOpen(true);
// //   };

// //   const closeModal = () => setModalOpen(false);

// //   const save = async (event) => {
// //     event.preventDefault();

// //     if (!form.name.trim() || !form.phone.trim()) {
// //       setNotice({
// //         type: "error",
// //         text: "Name and WhatsApp number are required.",
// //       });
// //       return;
// //     }

// //     if (api.isBackendEnabled) {
// //       setBusy(true);

// //       try {
// //         const result = await api.createContact({
// //           name: form.name.trim(),
// //           phone: form.phone.trim(),
// //           email: isHospital ? null : form.email.trim(),
// //           group_name: form.group,
// //           opted_in: false,
// //         });

// //         const saved = result?.data ?? result;

// //         if (!saved || !saved.id) {
// //           throw new Error("The server did not return the saved contact.");
// //         }

// //         setContacts((previous) => [
// //           normalizeContact(saved),
// //           ...getContactArray(previous).filter(
// //             (contact) => contact.id !== saved.id
// //           ),
// //         ]);

// //         setNotice({
// //           type: "success",
// //           text: "Contact saved successfully.",
// //         });

// //         closeModal();
// //       } catch (error) {
// //         setNotice({
// //           type: "error",
// //           text: error.message || "Could not save contact.",
// //         });
// //       } finally {
// //         setBusy(false);
// //       }

// //       return;
// //     }

// //     if (editingId) {
// //       setContacts((previous) =>
// //         getContactArray(previous).map((contact) =>
// //           contact.id === editingId
// //             ? {
// //                 ...contact,
// //                 ...form,
// //                 email: isHospital ? "" : form.email,
// //               }
// //             : contact
// //         )
// //       );
// //     } else {
// //       setContacts((previous) => [
// //         {
// //           id: Date.now(),
// //           ...form,
// //           email: isHospital ? "" : form.email,
// //           status: "Active",
// //           lastMessage: "—",
// //         },
// //         ...getContactArray(previous),
// //       ]);
// //     }

// //     setNotice({
// //       type: "success",
// //       text: editingId
// //         ? "Contact updated successfully."
// //         : "Contact added successfully.",
// //     });

// //     closeModal();
// //   };

// //   const remove = async (id) => {
// //     if (api.isBackendEnabled) {
// //       try {
// //         await api.deleteContact(id);

// //         setContacts((previous) =>
// //           getContactArray(previous).filter((contact) => contact.id !== id)
// //         );

// //         setNotice({ type: "success", text: "Contact deleted." });
// //       } catch (error) {
// //         setNotice({
// //           type: "error",
// //           text: error.message || "Could not delete contact.",
// //         });
// //       }
// //     } else {
// //       setContacts((previous) =>
// //         getContactArray(previous).filter((contact) => contact.id !== id)
// //       );

// //       setNotice({ type: "success", text: "Contact deleted." });
// //     }
// //   };

// //   const importFile = async (file) => {
// //     if (!file) return;

// //     setBusy(true);

// //     try {
// //       if (api.isBackendEnabled) {
// //         const result = await api.importContacts(file);

// //         const freshResponse = await api.getContacts();
// //         const freshContacts = getContactArray(freshResponse);

// //         setContacts(freshContacts.map(normalizeContact));

// //         setNotice({
// //           type: "success",
// //           text: `Import complete: ${result?.imported ?? 0} contacts imported; ${
// //             result?.invalidCount ?? 0
// //           } rows need correction.`,
// //         });

// //         return;
// //       }

// //       const workbook = XLSX.read(await file.arrayBuffer());
// //       const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

// //       if (!firstSheet) {
// //         throw new Error("The spreadsheet has no readable worksheet.");
// //       }

// //       const importedRows = XLSX.utils.sheet_to_json(firstSheet, {
// //         defval: "",
// //       });

// //       const incoming = importedRows
// //         .map((row, index) =>
// //           normalizeContact({
// //             id: Date.now() + index,
// //             name: String(
// //               row.name || row.Name || row.full_name || ""
// //             ).trim(),
// //             phone: String(
// //               row.phone || row.Phone || row.mobile || ""
// //             ).trim(),
// //             email: isHospital
// //               ? ""
// //               : String(row.email || row.Email || "").trim(),
// //             group: String(
// //               row.group || row.Group || contactGroups[0] || ""
// //             ).trim(),
// //             status: "Active",
// //             lastMessage: "—",
// //           })
// //         )
// //         .filter((contact) => contact.name && contact.phone);

// //       setContacts((previous) => {
// //         const existing = getContactArray(previous);
// //         const existingPhones = new Set(
// //           existing.map((contact) =>
// //             String(contact.phone || "").replace(/\D/g, "")
// //           )
// //         );

// //         const uniqueIncoming = incoming.filter((contact) => {
// //           const phone = String(contact.phone).replace(/\D/g, "");

// //           if (!phone || existingPhones.has(phone)) return false;

// //           existingPhones.add(phone);
// //           return true;
// //         });

// //         return [...uniqueIncoming, ...existing];
// //       });

// //       setNotice({
// //         type: "success",
// //         text: `Imported ${incoming.length} valid contact rows in demo mode.`,
// //       });
// //     } catch (error) {
// //       setNotice({
// //         type: "error",
// //         text:
// //           error.message ||
// //           "Could not read this file. Use .xlsx, .xls or .csv.",
// //       });
// //     } finally {
// //       setBusy(false);
// //     }
// //   };

// //   const exportContacts = () => {
// //     const exportRows = filtered.map((contact) =>
// //       isHospital
// //         ? {
// //             name: contact.name,
// //             phone: contact.phone,
// //             group: contact.group,
// //             status: contact.status,
// //           }
// //         : {
// //             name: contact.name,
// //             phone: contact.phone,
// //             email: contact.email || "",
// //             group: contact.group,
// //             status: contact.status,
// //           }
// //     );

// //     const workbook = XLSX.utils.book_new();

// //     XLSX.utils.book_append_sheet(
// //       workbook,
// //       XLSX.utils.json_to_sheet(exportRows),
// //       "Contacts"
// //     );

// //     XLSX.writeFile(
// //       workbook,
// //       `${(organization?.name || "Organization").replace(
// //         /\W+/g,
// //         "_"
// //       )}_contacts.xlsx`
// //     );
// //   };

// //   const columns = [
// //     {
// //       key: "name",
// //       label: "Name",
// //       render: (contact) => (
// //         <div className="flex items-center gap-3">
// //           <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-wa to-brand-700 text-xs font-semibold text-white">
// //             {String(contact.name || "")
// //               .split(" ")
// //               .map((word) => word[0])
// //               .slice(0, 2)
// //               .join("")}
// //           </span>

// //           <div>
// //             <p className="font-medium text-slate-900">
// //               {contact.name || "Unnamed contact"}
// //             </p>

// //             {!isHospital && (
// //               <p className="text-xs text-slate-500">
// //                 {contact.email}
// //               </p>
// //             )}
// //           </div>
// //         </div>
// //       ),
// //     },
// //     { key: "phone", label: "WhatsApp Number" },
// //     { key: "group", label: "Group" },
// //     {
// //       key: "status",
// //       label: "Status",
// //       render: (contact) => <StatusBadge status={contact.status} />,
// //     },
// //     { key: "lastMessage", label: "Last Message" },
// //     {
// //       key: "actions",
// //       label: "Actions",
// //       render: (contact) => (
// //         <div className="flex items-center gap-1">
// //           <button
// //             className="rounded p-1.5 text-brand-700 hover:bg-brand-50"
// //             aria-label={`Message ${contact.name}`}
// //           >
// //             <MessageCircle size={16} />
// //           </button>

// //           <button
// //             onClick={() => openEdit(contact)}
// //             className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
// //             aria-label={`Edit ${contact.name}`}
// //           >
// //             <Pencil size={16} />
// //           </button>

// //           <button
// //             onClick={() => remove(contact.id)}
// //             className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
// //             aria-label={`Delete ${contact.name}`}
// //           >
// //             <Trash2 size={16} />
// //           </button>
// //         </div>
// //       ),
// //     },
// //   ];

// //   if (loading) return <Loader />;

// //   return (
// //     <>
// //       <PageHeader
// //         title="Contacts"
// //         subtitle={`Manage the ${
// //           organization?.type === "Hospital"
// //             ? "patients"
// //             : organization?.type === "School"
// //               ? "parents and students"
// //               : organization?.type === "Hotel"
// //                 ? "guests"
// //                 : "customers"
// //         } you send WhatsApp messages to`}
// //       >
// //         <input
// //           ref={fileRef}
// //           type="file"
// //           accept=".xlsx,.xls,.csv"
// //           className="hidden"
// //           onChange={(event) => {
// //             importFile(event.target.files?.[0]);
// //             event.target.value = "";
// //           }}
// //         />

// //         <button
// //           onClick={() => fileRef.current?.click()}
// //           disabled={busy}
// //           className="btn-ghost"
// //         >
// //           <Upload size={16} />
// //           {busy ? "Processing..." : "Import"}
// //         </button>

// //         <button onClick={exportContacts} className="btn-ghost">
// //           <Download size={16} />
// //           Export Excel
// //         </button>

// //         <button onClick={openAdd} className="btn-primary">
// //           <Plus size={16} />
// //           Add Contact
// //         </button>
// //       </PageHeader>

// //       {notice && (
// //         <div
// //           role="status"
// //           className={`mb-4 flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${
// //             notice.type === "error"
// //               ? "border-rose-200 bg-rose-50 text-rose-800"
// //               : "border-emerald-200 bg-emerald-50 text-emerald-900"
// //           }`}
// //         >
// //           <span>{notice.text}</span>

// //           <button
// //             onClick={() => setNotice(null)}
// //             aria-label="Dismiss notification"
// //           >
// //             <X size={16} />
// //           </button>
// //         </div>
// //       )}

// //       {/* Summary boxes */}
// //       <div className="mb-6 grid grid-cols-2 gap-5 md:grid-cols-4">
// //         <SummaryBox
// //           label="Total Contacts"
// //           value={safeContacts.length}
// //           color="#8b5cf6"
// //         />

// //         <SummaryBox
// //           label="Active"
// //           value={
// //             safeContacts.filter((contact) => contact.status === "Active")
// //               .length
// //           }
// //           color="#25d366"
// //         />

// //         <SummaryBox
// //           label="Inactive"
// //           value={
// //             safeContacts.filter((contact) => contact.status === "Inactive")
// //               .length
// //           }
// //           color="#f59e0b"
// //         />

// //         <SummaryBox
// //           label="Groups"
// //           value={contactGroups.length}
// //           color="#34b7f1"
// //         />
// //       </div>

// //       <section className="card">
// //         <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
// //           <div className="relative min-w-[220px] flex-1">
// //             <Search
// //               size={16}
// //               className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
// //             />

// //             <input
// //               value={query}
// //               onChange={(event) => {
// //                 setQuery(event.target.value);
// //                 setPage(1);
// //               }}
// //               placeholder={
// //                 isHospital
// //                   ? "Search by name or phone"
// //                   : "Search by name, phone or email"
// //               }
// //               className="input pl-9"
// //             />
// //           </div>

// //           <select
// //             value={group}
// //             onChange={(event) => {
// //               setGroup(event.target.value);
// //               setPage(1);
// //             }}
// //             className="input w-auto"
// //           >
// //             <option>All</option>
// //             {contactGroups.map((contactGroup) => (
// //               <option key={contactGroup}>{contactGroup}</option>
// //             ))}
// //           </select>
// //         </div>

// //         <DataTable
// //           columns={columns}
// //           rows={rows}
// //           empty="No contacts match your search."
// //         />

// //         <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
// //           <span>
// //             Showing{" "}
// //             {filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}
// //             –{Math.min(current * PAGE_SIZE, filtered.length)} of{" "}
// //             {filtered.length}
// //           </span>

// //           <div className="flex items-center gap-2">
// //             <button
// //               disabled={current === 1}
// //               onClick={() => setPage(current - 1)}
// //               className="btn-ghost px-3 py-1.5 disabled:opacity-40"
// //             >
// //               Previous
// //             </button>

// //             <span>
// //               Page {current} of {pages}
// //             </span>

// //             <button
// //               disabled={current === pages}
// //               onClick={() => setPage(current + 1)}
// //               className="btn-ghost px-3 py-1.5 disabled:opacity-40"
// //             >
// //               Next
// //             </button>
// //           </div>
// //         </div>
// //       </section>

// //       <Modal
// //         isOpen={modalOpen}
// //         onClose={closeModal}
// //         title={editingId ? "Edit Contact" : "Add Contact"}
// //         footer={
// //           <>
// //             <button onClick={closeModal} className="btn-ghost">
// //               Cancel
// //             </button>

// //             <button
// //               form="contact-form"
// //               type="submit"
// //               disabled={busy}
// //               className="btn-primary disabled:opacity-50"
// //             >
// //               {busy ? "Saving..." : "Save Contact"}
// //             </button>
// //           </>
// //         }
// //       >
// //         <form id="contact-form" onSubmit={save} className="space-y-3">
// //           <div>
// //             <label className="mb-1 block text-sm font-medium">
// //               Full name
// //             </label>

// //             <input
// //               className="input"
// //               value={form.name}
// //               onChange={(event) =>
// //                 setForm({ ...form, name: event.target.value })
// //               }
// //               required
// //             />
// //           </div>

// //           <div>
// //             <label className="mb-1 block text-sm font-medium">
// //               WhatsApp number
// //             </label>

// //             <input
// //               className="input"
// //               placeholder="+91 98765 43210"
// //               value={form.phone}
// //               onChange={(event) =>
// //                 setForm({ ...form, phone: event.target.value })
// //               }
// //               required
// //             />
// //           </div>

// //           {!isHospital && (
// //             <div>
// //               <label className="mb-1 block text-sm font-medium">
// //                 Email
// //               </label>

// //               <input
// //                 type="email"
// //                 className="input"
// //                 value={form.email}
// //                 onChange={(event) =>
// //                   setForm({ ...form, email: event.target.value })
// //                 }
// //               />
// //             </div>
// //           )}

// //           <div>
// //             <label className="mb-1 block text-sm font-medium">
// //               Group
// //             </label>

// //             <select
// //               className="input"
// //               value={form.group}
// //               onChange={(event) =>
// //                 setForm({ ...form, group: event.target.value })
// //               }
// //             >
// //               {contactGroups.map((contactGroup) => (
// //                 <option key={contactGroup}>{contactGroup}</option>
// //               ))}
// //             </select>
// //           </div>
// //         </form>
// //       </Modal>
// //     </>
// //   );
// // }


// import { useEffect, useMemo, useRef, useState } from "react";
// import * as XLSX from "xlsx";
// import {
//   Plus,
//   Search,
//   Upload,
//   Download,
//   Trash2,
//   Pencil,
//   MessageCircle,
//   X,
// } from "lucide-react";

// import useFetch from "../hooks/useFetch";
// import api from "../services/api";
// import { getOrganizationData } from "../data/dummyData";
// import { useAuth } from "../hooks/useAuth";

// const PAGE_SIZE = 6;

// const emptyForm = {
//   name: "",
//   phone: "",
//   email: "",
//   group: "",
//   opted_in: false,
// };

// function Loader() {
//   return (
//     <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
//       <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
//       Loading...
//     </div>
//   );
// }

// function PageHeader({ title, subtitle, children }) {
//   return (
//     <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
//       <div>
//         <h2 className="text-2xl font-semibold text-brand-900">{title}</h2>
//         {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
//       </div>
//       {children && (
//         <div className="flex flex-wrap items-center gap-2">{children}</div>
//       )}
//     </div>
//   );
// }

// const badgeStyles = {
//   Active: "bg-emerald-100 text-emerald-700",
//   Inactive: "bg-slate-100 text-slate-600",
// };

// function StatusBadge({ status }) {
//   return (
//     <span
//       className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
//         badgeStyles[status] || "bg-slate-100 text-slate-600"
//       }`}
//     >
//       {status}
//     </span>
//   );
// }

// function SummaryBox({ label, value, color }) {
//   return (
//     <div
//       className="rounded-2xl p-4 transition duration-200 hover:-translate-y-1"
//       style={{
//         border: `1.5px solid ${color}`,
//         background: `linear-gradient(135deg, ${color}26 0%, #ffffff 70%)`,
//         boxShadow: `0 0 0 3px ${color}1f, 0 0 22px ${color}66, 0 10px 22px -14px ${color}`,
//       }}
//     >
//       <p className="text-xs font-medium text-slate-600">{label}</p>
//       <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
//     </div>
//   );
// }

// function Modal({ isOpen, onClose, title, children, footer }) {
//   if (!isOpen) return null;

//   return (
//     <div
//       className="fixed inset-0 z-[60] flex items-center justify-center p-4"
//       role="dialog"
//       aria-modal="true"
//     >
//       <div className="absolute inset-0 bg-black/50" onClick={onClose} />

//       <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
//         <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
//           <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
//           <button
//             onClick={onClose}
//             className="rounded p-1 text-slate-500 hover:bg-slate-100"
//             aria-label="Close"
//           >
//             <X size={18} />
//           </button>
//         </div>

//         <div className="px-5 py-4">{children}</div>

//         {footer && (
//           <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
//             {footer}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function DataTable({ columns, rows, empty = "No records found." }) {
//   const safeRows = Array.isArray(rows) ? rows : [];

//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full min-w-[640px] text-left text-sm">
//         <thead>
//           <tr className="bg-brand-50 text-xs font-semibold text-brand-900">
//             {columns.map((column) => (
//               <th key={column.key} className="px-4 py-3.5">
//                 {column.label}
//               </th>
//             ))}
//           </tr>
//         </thead>

//         <tbody className="divide-y divide-slate-100">
//           {safeRows.length === 0 && (
//             <tr>
//               <td
//                 colSpan={columns.length}
//                 className="px-4 py-10 text-center text-slate-500"
//               >
//                 {empty}
//               </td>
//             </tr>
//           )}

//           {safeRows.map((row, index) => (
//             <tr key={row.id ?? index} className="hover:bg-brand-50/60">
//               {columns.map((column) => (
//                 <td key={column.key} className="px-4 py-3.5 text-slate-700">
//                   {column.render ? column.render(row) : row[column.key]}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// /* ================= HELPERS ================= */

// function getContactArray(response) {
//   if (Array.isArray(response)) return response;
//   if (Array.isArray(response?.data)) return response.data;
//   if (Array.isArray(response?.contacts)) return response.contacts;
//   return [];
// }

// function normalizeContact(contact) {
//   return {
//     ...contact,
//     group: contact.group || contact.group_name || "",
//     email: contact.email || "",
//     opted_in: contact.opted_in === true,
//     status: contact.status || "Active",
//     lastMessage: contact.lastMessage || contact.last_message || "—",
//   };
// }

// function validatePhone(value) {
//   const raw = String(value ?? "").trim();
//   let digits = raw.replace(/\D/g, "");

//   if (raw.startsWith("00")) {
//     digits = digits.slice(2);
//   }

//   // India mobile numbers entered without country code.
//   if (digits.length === 10) {
//     return /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : null;
//   }

//   // E.164-style international number length.
//   if (digits.length < 8 || digits.length > 15) {
//     return null;
//   }

//   // An international number must include a country code.
//   if (digits.startsWith("0")) {
//     return null;
//   }

//   return digits;
// }

// /* ================= CONTACTS PAGE ================= */

// export default function Contacts() {
//   const { organization } = useAuth();

//   const organizationData = getOrganizationData(organization);
//   const contactGroups = Array.isArray(organizationData?.contactGroups)
//     ? organizationData.contactGroups
//     : [];

//   const isHospital = organization?.type === "Hospital";

//   const {
//     data: contacts,
//     setData: setContacts,
//     loading,
//   } = useFetch(api.getContacts);

//   const safeContacts = useMemo(
//     () => getContactArray(contacts).map(normalizeContact),
//     [contacts]
//   );

//   const [query, setQuery] = useState("");
//   const [group, setGroup] = useState("All");
//   const [page, setPage] = useState(1);
//   const [form, setForm] = useState(emptyForm);
//   const [editingId, setEditingId] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const fileRef = useRef(null);
//   const [notice, setNotice] = useState(null);
//   const [busy, setBusy] = useState(false);

//   useEffect(() => {
//     setQuery("");
//     setGroup("All");
//     setPage(1);
//     setForm({ ...emptyForm, group: contactGroups[0] || "" });
//     // Reset the form when the active organization changes.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [organization?.id]);

//   const filtered = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     const normalizedQuery = q.replace(/\s/g, "");

//     return safeContacts.filter((contact) => {
//       const name = String(contact.name || "").toLowerCase();
//       const phone = String(contact.phone || "").replace(/\s/g, "");
//       const email = String(contact.email || "").toLowerCase();

//       return (
//         (group === "All" || contact.group === group) &&
//         (!q ||
//           name.includes(q) ||
//           phone.includes(normalizedQuery) ||
//           (!isHospital && email.includes(q)))
//       );
//     });
//   }, [safeContacts, query, group, isHospital]);

//   const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
//   const current = Math.min(page, pages);
//   const rows = filtered.slice(
//     (current - 1) * PAGE_SIZE,
//     current * PAGE_SIZE
//   );

//   const openAdd = () => {
//     setEditingId(null);
//     setForm({ ...emptyForm, group: contactGroups[0] || "" });
//     setModalOpen(true);
//   };

//   const openEdit = (contact) => {
//     setEditingId(contact.id);
//     setForm({
//       name: contact.name || "",
//       phone: contact.phone || "",
//       email: contact.email || "",
//       group: contact.group || "",
//       opted_in: contact.opted_in === true,
//     });
//     setModalOpen(true);
//   };

//   const closeModal = () => setModalOpen(false);

//   /* ================= SAVE CONTACT ================= */

//   const save = async (event) => {
//     event.preventDefault();

//     if (!form.name.trim() || !form.phone.trim()) {
//       setNotice({
//         type: "error",
//         text: "Name and WhatsApp number are required.",
//       });
//       return;
//     }

//     const normalizedPhone = validatePhone(form.phone);

//     if (!normalizedPhone) {
//       setNotice({
//         type: "error",
//         text: "Enter a valid phone number, including the country code for international numbers.",
//       });
//       return;
//     }

//     if (api.isBackendEnabled) {
//       setBusy(true);

//       try {
//         const payload = {
//           name: form.name.trim(),
//           phone: normalizedPhone,
//           email: isHospital ? null : form.email.trim(),
//           group_name: form.group || null,
//           opted_in: form.opted_in === true,
//         };

//         // The backend supports updating when an ID is provided.
//         if (editingId) {
//           payload.id = editingId;
//         }

//         const result = await api.createContact(payload);
//         const saved = result?.data ?? result;

//         if (!saved?.id) {
//           throw new Error("The server did not return the saved contact.");
//         }

//         setContacts((previous) => [
//           normalizeContact(saved),
//           ...getContactArray(previous).filter(
//             (contact) => contact.id !== saved.id
//           ),
//         ]);

//         setNotice({
//           type: "success",
//           text: editingId
//             ? "Contact updated successfully."
//             : "Contact saved successfully.",
//         });

//         closeModal();
//       } catch (error) {
//         setNotice({
//           type: "error",
//           text: error.message || "Could not save contact.",
//         });
//       } finally {
//         setBusy(false);
//       }

//       return;
//     }

//     const updatedContact = normalizeContact({
//       id: editingId || Date.now(),
//       ...form,
//       phone: normalizedPhone,
//       email: isHospital ? "" : form.email.trim(),
//       group: form.group,
//       opted_in: form.opted_in === true,
//       status: "Active",
//       lastMessage: "—",
//     });

//     if (editingId) {
//       setContacts((previous) =>
//         getContactArray(previous).map((contact) =>
//           contact.id === editingId ? updatedContact : contact
//         )
//       );
//     } else {
//       setContacts((previous) => [
//         updatedContact,
//         ...getContactArray(previous),
//       ]);
//     }

//     setNotice({
//       type: "success",
//       text: editingId
//         ? "Contact updated successfully."
//         : "Contact added successfully.",
//     });

//     closeModal();
//   };

//   /* ================= DELETE CONTACT ================= */

//   const remove = async (id) => {
//     if (api.isBackendEnabled) {
//       try {
//         await api.deleteContact(id);

//         setContacts((previous) =>
//           getContactArray(previous).filter((contact) => contact.id !== id)
//         );

//         setNotice({ type: "success", text: "Contact deleted." });
//       } catch (error) {
//         setNotice({
//           type: "error",
//           text: error.message || "Could not delete contact.",
//         });
//       }
//     } else {
//       setContacts((previous) =>
//         getContactArray(previous).filter((contact) => contact.id !== id)
//       );

//       setNotice({ type: "success", text: "Contact deleted." });
//     }
//   };

//   /* ================= IMPORT EXCEL ================= */

//   const importFile = async (file) => {
//     if (!file) return;

//     setBusy(true);

//     try {
//       if (api.isBackendEnabled) {
//         const result = await api.importContacts(file);

//         const freshResponse = await api.getContacts();
//         const freshContacts = getContactArray(freshResponse);

//         setContacts(freshContacts.map(normalizeContact));

//         setNotice({
//           type: "success",
//           text: `Import complete: ${result?.imported ?? 0} contacts imported; ${
//             result?.invalidCount ?? 0
//           } rows need correction.`,
//         });

//         return;
//       }

//       const workbook = XLSX.read(await file.arrayBuffer());
//       const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

//       if (!firstSheet) {
//         throw new Error("The spreadsheet has no readable worksheet.");
//       }

//       const importedRows = XLSX.utils.sheet_to_json(firstSheet, {
//         defval: "",
//       });

//       const incoming = [];
//       const invalidRows = [];
//       const seen = new Set(
//         safeContacts.map((contact) =>
//           String(contact.phone || "").replace(/\D/g, "")
//         )
//       );

//       importedRows.forEach((row, index) => {
//         const lower = Object.fromEntries(
//           Object.entries(row).map(([key, value]) => [
//             String(key).trim().toLowerCase(),
//             value,
//           ])
//         );

//         const name = String(
//           lower.name || lower.full_name || lower.contact || ""
//         ).trim();

//         const normalizedPhone = validatePhone(
//           lower.phone ||
//             lower.mobile ||
//             lower.whatsapp ||
//             lower.whatsapp_number
//         );

//         if (!name || !normalizedPhone) {
//           invalidRows.push(index + 2);
//           return;
//         }

//         if (seen.has(normalizedPhone)) {
//           return;
//         }

//         seen.add(normalizedPhone);

//         // Consent is accepted only when the spreadsheet explicitly
//         // marks opt-in as true and provides a consent source.
//         const source = String(lower.consent_source || "").trim();
//         const consentConfirmed =
//           String(lower.opted_in || "").trim().toLowerCase() === "true" &&
//           Boolean(source);

//         incoming.push(
//           normalizeContact({
//             id: Date.now() + index,
//             name,
//             phone: normalizedPhone,
//             email: isHospital
//               ? ""
//               : String(lower.email || "").trim(),
//             group: String(
//               lower.group || lower.group_name || contactGroups[0] || ""
//             ).trim(),
//             opted_in: consentConfirmed,
//             consent_source: consentConfirmed ? source : null,
//             status: "Active",
//             lastMessage: "—",
//           })
//         );
//       });

//       setContacts((previous) => [
//         ...incoming,
//         ...getContactArray(previous),
//       ]);

//       setNotice({
//         type: "success",
//         text: `Imported ${incoming.length} contacts. ${
//           invalidRows.length
//         } rows had an invalid name or phone number. Contacts without confirmed consent remain ineligible for campaigns.`,
//       });
//     } catch (error) {
//       setNotice({
//         type: "error",
//         text:
//           error.message ||
//           "Could not read this file. Use .xlsx, .xls or .csv.",
//       });
//     } finally {
//       setBusy(false);
//     }
//   };

//   /* ================= EXPORT CONTACTS ================= */

//   const exportContacts = () => {
//     const exportRows = filtered.map((contact) =>
//       isHospital
//         ? {
//             name: contact.name,
//             phone: contact.phone,
//             group: contact.group,
//             opted_in: contact.opted_in,
//             status: contact.status,
//           }
//         : {
//             name: contact.name,
//             phone: contact.phone,
//             email: contact.email || "",
//             group: contact.group,
//             opted_in: contact.opted_in,
//             status: contact.status,
//           }
//     );

//     const workbook = XLSX.utils.book_new();

//     XLSX.utils.book_append_sheet(
//       workbook,
//       XLSX.utils.json_to_sheet(exportRows),
//       "Contacts"
//     );

//     XLSX.writeFile(
//       workbook,
//       `${(organization?.name || "Organization").replace(
//         /\W+/g,
//         "_"
//       )}_contacts.xlsx`
//     );
//   };

//   /* ================= TABLE COLUMNS ================= */

//   const columns = [
//     {
//       key: "name",
//       label: "Name",
//       render: (contact) => (
//         <div className="flex items-center gap-3">
//           <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-wa to-brand-700 text-xs font-semibold text-white">
//             {String(contact.name || "")
//               .split(" ")
//               .map((word) => word[0])
//               .slice(0, 2)
//               .join("")}
//           </span>

//           <div>
//             <p className="font-medium text-slate-900">
//               {contact.name || "Unnamed contact"}
//             </p>

//             {!isHospital && (
//               <p className="text-xs text-slate-500">{contact.email}</p>
//             )}
//           </div>
//         </div>
//       ),
//     },
//     { key: "phone", label: "WhatsApp Number" },
//     { key: "group", label: "Group" },
//     {
//       key: "status",
//       label: "Status",
//       render: (contact) => <StatusBadge status={contact.status} />,
//     },
//     {
//       key: "opted_in",
//       label: "WhatsApp Consent",
//       render: (contact) => (
//         <span
//           className={`rounded-full px-2.5 py-1 text-xs font-medium ${
//             contact.opted_in
//               ? "bg-emerald-100 text-emerald-700"
//               : "bg-amber-100 text-amber-800"
//           }`}
//         >
//           {contact.opted_in ? "Confirmed" : "Not confirmed"}
//         </span>
//       ),
//     },
//     { key: "lastMessage", label: "Last Message" },
//     {
//       key: "actions",
//       label: "Actions",
//       render: (contact) => (
//         <div className="flex items-center gap-1">
//           <button
//             className="rounded p-1.5 text-brand-700 hover:bg-brand-50"
//             aria-label={`Message ${contact.name}`}
//           >
//             <MessageCircle size={16} />
//           </button>

//           <button
//             onClick={() => openEdit(contact)}
//             className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
//             aria-label={`Edit ${contact.name}`}
//           >
//             <Pencil size={16} />
//           </button>

//           <button
//             onClick={() => remove(contact.id)}
//             className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
//             aria-label={`Delete ${contact.name}`}
//           >
//             <Trash2 size={16} />
//           </button>
//         </div>
//       ),
//     },
//   ];

//   if (loading) return <Loader />;

//   return (
//     <>
//       <PageHeader
//         title="Contacts"
//         subtitle={`Manage the ${
//           organization?.type === "Hospital"
//             ? "patients"
//             : organization?.type === "School"
//               ? "parents and students"
//               : organization?.type === "Hotel"
//                 ? "guests"
//                 : "customers"
//         } you send WhatsApp messages to`}
//       >
//         <input
//           ref={fileRef}
//           type="file"
//           accept=".xlsx,.xls,.csv"
//           className="hidden"
//           onChange={(event) => {
//             importFile(event.target.files?.[0]);
//             event.target.value = "";
//           }}
//         />

//         <button
//           onClick={() => fileRef.current?.click()}
//           disabled={busy}
//           className="btn-ghost"
//         >
//           <Upload size={16} />
//           {busy ? "Processing..." : "Import"}
//         </button>

//         <button onClick={exportContacts} className="btn-ghost">
//           <Download size={16} />
//           Export Excel
//         </button>

//         <button onClick={openAdd} className="btn-primary">
//           <Plus size={16} />
//           Add Contact
//         </button>
//       </PageHeader>

//       {notice && (
//         <div
//           role="status"
//           className={`mb-4 flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${
//             notice.type === "error"
//               ? "border-rose-200 bg-rose-50 text-rose-800"
//               : "border-emerald-200 bg-emerald-50 text-emerald-900"
//           }`}
//         >
//           <span>{notice.text}</span>
//           <button
//             onClick={() => setNotice(null)}
//             aria-label="Dismiss notification"
//           >
//             <X size={16} />
//           </button>
//         </div>
//       )}

//       <div className="mb-6 grid grid-cols-2 gap-5 md:grid-cols-4">
//         <SummaryBox
//           label="Total Contacts"
//           value={safeContacts.length}
//           color="#8b5cf6"
//         />

//         <SummaryBox
//           label="Active"
//           value={
//             safeContacts.filter((contact) => contact.status === "Active")
//               .length
//           }
//           color="#25d366"
//         />

//         <SummaryBox
//           label="Inactive"
//           value={
//             safeContacts.filter((contact) => contact.status === "Inactive")
//               .length
//           }
//           color="#f59e0b"
//         />

//         <SummaryBox
//           label="Groups"
//           value={contactGroups.length}
//           color="#34b7f1"
//         />
//       </div>

//       <section className="card">
//         <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
//           <div className="relative min-w-[220px] flex-1">
//             <Search
//               size={16}
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//             />

//             <input
//               value={query}
//               onChange={(event) => {
//                 setQuery(event.target.value);
//                 setPage(1);
//               }}
//               placeholder={
//                 isHospital
//                   ? "Search by name or phone"
//                   : "Search by name, phone or email"
//               }
//               className="input pl-9"
//             />
//           </div>

//           <select
//             value={group}
//             onChange={(event) => {
//               setGroup(event.target.value);
//               setPage(1);
//             }}
//             className="input w-auto"
//           >
//             <option>All</option>
//             {contactGroups.map((contactGroup) => (
//               <option key={contactGroup}>{contactGroup}</option>
//             ))}
//           </select>
//         </div>

//         <DataTable
//           columns={columns}
//           rows={rows}
//           empty="No contacts match your search."
//         />

//         <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
//           <span>
//             Showing{" "}
//             {filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}
//             –{Math.min(current * PAGE_SIZE, filtered.length)} of{" "}
//             {filtered.length}
//           </span>

//           <div className="flex items-center gap-2">
//             <button
//               disabled={current === 1}
//               onClick={() => setPage(current - 1)}
//               className="btn-ghost px-3 py-1.5 disabled:opacity-40"
//             >
//               Previous
//             </button>

//             <span>
//               Page {current} of {pages}
//             </span>

//             <button
//               disabled={current === pages}
//               onClick={() => setPage(current + 1)}
//               className="btn-ghost px-3 py-1.5 disabled:opacity-40"
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </section>

//       <Modal
//         isOpen={modalOpen}
//         onClose={closeModal}
//         title={editingId ? "Edit Contact" : "Add Contact"}
//         footer={
//           <>
//             <button onClick={closeModal} className="btn-ghost">
//               Cancel
//             </button>

//             <button
//               form="contact-form"
//               type="submit"
//               disabled={busy}
//               className="btn-primary disabled:opacity-50"
//             >
//               {busy ? "Saving..." : "Save Contact"}
//             </button>
//           </>
//         }
//       >
//         <form id="contact-form" onSubmit={save} className="space-y-3">
//           <div>
//             <label className="mb-1 block text-sm font-medium">
//               Full name
//             </label>

//             <input
//               className="input"
//               value={form.name}
//               onChange={(event) =>
//                 setForm({ ...form, name: event.target.value })
//               }
//               required
//             />
//           </div>

//           <div>
//             <label className="mb-1 block text-sm font-medium">
//               WhatsApp number
//             </label>

//             <input
//               className="input"
//               placeholder="+91 98765 43210"
//               value={form.phone}
//               onChange={(event) =>
//                 setForm({ ...form, phone: event.target.value })
//               }
//               required
//             />
//             <p className="mt-1 text-xs text-slate-500">
//               Indian 10-digit mobile numbers are saved with country code 91.
//             </p>
//           </div>

//           <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
//             <label className="flex items-start gap-2 text-sm text-slate-800">
//               <input
//                 type="checkbox"
//                 checked={form.opted_in}
//                 onChange={(event) =>
//                   setForm({
//                     ...form,
//                     opted_in: event.target.checked,
//                   })
//                 }
//                 className="mt-1"
//               />

//               <span>
//                 <span className="font-semibold">
//                   WhatsApp consent confirmed
//                 </span>
//                 <span className="mt-1 block text-xs text-slate-600">
//                   Check this only if the contact has explicitly agreed to
//                   receive WhatsApp messages.
//                 </span>
//               </span>
//             </label>
//           </div>

//           {!isHospital && (
//             <div>
//               <label className="mb-1 block text-sm font-medium">
//                 Email
//               </label>

//               <input
//                 type="email"
//                 className="input"
//                 value={form.email}
//                 onChange={(event) =>
//                   setForm({ ...form, email: event.target.value })
//                 }
//               />
//             </div>
//           )}

//           <div>
//             <label className="mb-1 block text-sm font-medium">
//               Group
//             </label>

//             <select
//               className="input"
//               value={form.group}
//               onChange={(event) =>
//                 setForm({ ...form, group: event.target.value })
//               }
//             >
//               {contactGroups.map((contactGroup) => (
//                 <option key={contactGroup} value={contactGroup}>
//                   {contactGroup}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </form>
//       </Modal>
//     </>
//   );
// }



import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Pencil,
  MessageCircle,
  X,
  CheckCircle,
} from "lucide-react";

import useFetch from "../hooks/useFetch";
import api from "../services/api";
import { getOrganizationData } from "../data/dummyData";
import { useAuth } from "../hooks/useAuth";

const PAGE_SIZE = 6;

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  group: "",
  opted_in: false,
};

function Loader() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      Loading...
    </div>
  );
}

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold text-brand-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}

const badgeStyles = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-slate-100 text-slate-600",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        badgeStyles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function SummaryBox({ label, value, color }) {
  return (
    <div
      className="rounded-2xl p-4 transition duration-200 hover:-translate-y-1"
      style={{
        border: `1.5px solid ${color}`,
        background: `linear-gradient(135deg, ${color}26 0%, #ffffff 70%)`,
        boxShadow: `0 0 0 3px ${color}1f, 0 0 22px ${color}66, 0 10px 22px -14px ${color}`,
      }}
    >
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function DataTable({ columns, rows, empty = "No records found." }) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="bg-brand-50 text-xs font-semibold text-brand-900">
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3.5">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {safeRows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-slate-500"
              >
                {empty}
              </td>
            </tr>
          )}

          {safeRows.map((row, index) => (
            <tr key={row.id ?? index} className="hover:bg-brand-50/60">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3.5 text-slate-700">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================= HELPERS ================= */

function getContactArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.contacts)) return response.contacts;
  return [];
}

function normalizeContact(contact) {
  return {
    ...contact,
    group: contact.group || contact.group_name || "",
    email: contact.email || "",
    opted_in: contact.opted_in === true,
    phone_valid: contact.phone_valid === true,
    status: contact.status || "Active",
    lastMessage: contact.lastMessage || contact.last_message || "—",
  };
}

function validatePhone(value) {
  const raw = String(value ?? "").trim();
  let digits = raw.replace(/\D/g, "");

  if (raw.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Indian mobile number without country code.
  if (digits.length === 10) {
    return /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : null;
  }

  // International number: basic length and country-code format check.
  if (digits.length < 8 || digits.length > 15) {
    return null;
  }

  if (digits.startsWith("0")) {
    return null;
  }

  return digits;
}

/* ================= CONTACTS PAGE ================= */

export default function Contacts() {
  const { organization } = useAuth();

  const organizationData = getOrganizationData(organization);
  const contactGroups = Array.isArray(organizationData?.contactGroups)
    ? organizationData.contactGroups
    : [];

  const isHospital = organization?.type === "Hospital";

  const {
    data: contacts,
    setData: setContacts,
    loading,
  } = useFetch(api.getContacts);

  const safeContacts = useMemo(
    () => getContactArray(contacts).map(normalizeContact),
    [contacts]
  );

  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [validating, setValidating] = useState(false);

  const fileRef = useRef(null);

  useEffect(() => {
    setQuery("");
    setGroup("All");
    setPage(1);
    setForm({ ...emptyForm, group: contactGroups[0] || "" });
    // Reset form when the organization changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const normalizedQuery = q.replace(/\s/g, "");

    return safeContacts.filter((contact) => {
      const name = String(contact.name || "").toLowerCase();
      const phone = String(contact.phone || "").replace(/\s/g, "");
      const email = String(contact.email || "").toLowerCase();

      return (
        (group === "All" || contact.group === group) &&
        (!q ||
          name.includes(q) ||
          phone.includes(normalizedQuery) ||
          (!isHospital && email.includes(q)))
      );
    });
  }, [safeContacts, query, group, isHospital]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE
  );

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, group: contactGroups[0] || "" });
    setModalOpen(true);
  };

  const openEdit = (contact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name || "",
      phone: contact.phone || "",
      email: contact.email || "",
      group: contact.group || "",
      opted_in: contact.opted_in === true,
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  /* ================= VALIDATE ALL NUMBERS ================= */

  const validateAllNumbers = async () => {
    if (!api.isBackendEnabled) {
      setNotice({
        type: "error",
        text: "Connect the backend to validate saved contacts.",
      });
      return;
    }

    setValidating(true);
    setNotice(null);

    try {
      // This endpoint must be implemented in the backend.
      // It updates phone_valid only; it must not automatically grant consent.
      const result = await api.post("/contacts/validate-all", {});

      const freshResponse = await api.getContacts();
      setContacts(getContactArray(freshResponse).map(normalizeContact));

      const total = result?.total ?? result?.data?.total ?? 0;
      const validCount =
        result?.validCount ?? result?.data?.validCount ?? 0;
      const invalidCount =
        result?.invalidCount ?? result?.data?.invalidCount ?? 0;

      setNotice({
        type: "success",
        text: `Validation complete. Checked ${total} contacts: ${validCount} passed basic format checks and ${invalidCount} failed. This does not confirm WhatsApp registration or consent.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.message ||
          "Could not validate contacts. Check the backend endpoint and API configuration.",
      });
    } finally {
      setValidating(false);
    }
  };

  /* ================= SAVE CONTACT ================= */

  const save = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      setNotice({
        type: "error",
        text: "Name and WhatsApp number are required.",
      });
      return;
    }

    const normalizedPhone = validatePhone(form.phone);

    if (!normalizedPhone) {
      setNotice({
        type: "error",
        text: "Enter a valid phone number, including the country code for international numbers.",
      });
      return;
    }

    if (api.isBackendEnabled) {
      setBusy(true);

      try {
        const payload = {
          name: form.name.trim(),
          phone: normalizedPhone,
          email: isHospital ? null : form.email.trim(),
          group_name: form.group || null,
          opted_in: form.opted_in === true,
        };

        if (editingId) {
          payload.id = editingId;
        }

        const result = await api.createContact(payload);
        const saved = result?.data ?? result;

        if (!saved?.id) {
          throw new Error("The server did not return the saved contact.");
        }

        setContacts((previous) => [
          normalizeContact(saved),
          ...getContactArray(previous).filter(
            (contact) => contact.id !== saved.id
          ),
        ]);

        setNotice({
          type: "success",
          text: editingId
            ? "Contact updated successfully."
            : "Contact saved successfully.",
        });

        closeModal();
      } catch (error) {
        setNotice({
          type: "error",
          text: error.message || "Could not save contact.",
        });
      } finally {
        setBusy(false);
      }

      return;
    }

    const updatedContact = normalizeContact({
      id: editingId || Date.now(),
      ...form,
      phone: normalizedPhone,
      email: isHospital ? "" : form.email.trim(),
      group: form.group,
      opted_in: form.opted_in === true,
      status: "Active",
      lastMessage: "—",
    });

    if (editingId) {
      setContacts((previous) =>
        getContactArray(previous).map((contact) =>
          contact.id === editingId ? updatedContact : contact
        )
      );
    } else {
      setContacts((previous) => [
        updatedContact,
        ...getContactArray(previous),
      ]);
    }

    setNotice({
      type: "success",
      text: editingId
        ? "Contact updated successfully."
        : "Contact added successfully.",
    });

    closeModal();
  };

  /* ================= DELETE CONTACT ================= */

  const remove = async (id) => {
    if (api.isBackendEnabled) {
      try {
        await api.deleteContact(id);

        setContacts((previous) =>
          getContactArray(previous).filter((contact) => contact.id !== id)
        );

        setNotice({ type: "success", text: "Contact deleted." });
      } catch (error) {
        setNotice({
          type: "error",
          text: error.message || "Could not delete contact.",
        });
      }
    } else {
      setContacts((previous) =>
        getContactArray(previous).filter((contact) => contact.id !== id)
      );

      setNotice({ type: "success", text: "Contact deleted." });
    }
  };

  /* ================= IMPORT EXCEL ================= */

  const importFile = async (file) => {
    if (!file) return;

    setBusy(true);

    try {
      if (api.isBackendEnabled) {
        const result = await api.importContacts(file);

        const freshResponse = await api.getContacts();
        const freshContacts = getContactArray(freshResponse);

        setContacts(freshContacts.map(normalizeContact));

        setNotice({
          type: "success",
          text: `Import complete: ${result?.imported ?? 0} contacts imported; ${
            result?.invalidCount ?? 0
          } rows need correction.`,
        });

        return;
      }

      const workbook = XLSX.read(await file.arrayBuffer());
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!firstSheet) {
        throw new Error("The spreadsheet has no readable worksheet.");
      }

      const importedRows = XLSX.utils.sheet_to_json(firstSheet, {
        defval: "",
      });

      const incoming = [];
      const invalidRows = [];
      const seen = new Set(
        safeContacts.map((contact) =>
          String(contact.phone || "").replace(/\D/g, "")
        )
      );

      importedRows.forEach((row, index) => {
        const lower = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            String(key).trim().toLowerCase(),
            value,
          ])
        );

        const name = String(
          lower.name || lower.full_name || lower.contact || ""
        ).trim();

        const normalizedPhone = validatePhone(
          lower.phone ||
            lower.mobile ||
            lower.whatsapp ||
            lower.whatsapp_number
        );

        if (!name || !normalizedPhone) {
          invalidRows.push(index + 2);
          return;
        }

        if (seen.has(normalizedPhone)) {
          return;
        }

        seen.add(normalizedPhone);

        const source = String(lower.consent_source || "").trim();
        const consentConfirmed =
          String(lower.opted_in || "").trim().toLowerCase() === "true" &&
          Boolean(source);

        incoming.push(
          normalizeContact({
            id: Date.now() + index,
            name,
            phone: normalizedPhone,
            email: isHospital ? "" : String(lower.email || "").trim(),
            group: String(
              lower.group || lower.group_name || contactGroups[0] || ""
            ).trim(),
            opted_in: consentConfirmed,
            consent_source: consentConfirmed ? source : null,
            status: "Active",
            lastMessage: "—",
          })
        );
      });

      setContacts((previous) => [
        ...incoming,
        ...getContactArray(previous),
      ]);

      setNotice({
        type: "success",
        text: `Imported ${incoming.length} contacts. ${
          invalidRows.length
        } rows had an invalid name or phone number. Contacts without confirmed consent remain ineligible for campaigns.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.message ||
          "Could not read this file. Use .xlsx, .xls or .csv.",
      });
    } finally {
      setBusy(false);
    }
  };

  /* ================= EXPORT CONTACTS ================= */

  const exportContacts = () => {
    const exportRows = filtered.map((contact) =>
      isHospital
        ? {
            name: contact.name,
            phone: contact.phone,
            group: contact.group,
            opted_in: contact.opted_in,
            status: contact.status,
          }
        : {
            name: contact.name,
            phone: contact.phone,
            email: contact.email || "",
            group: contact.group,
            opted_in: contact.opted_in,
            status: contact.status,
          }
    );

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(exportRows),
      "Contacts"
    );

    XLSX.writeFile(
      workbook,
      `${(organization?.name || "Organization").replace(
        /\W+/g,
        "_"
      )}_contacts.xlsx`
    );
  };

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (contact) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-wa to-brand-700 text-xs font-semibold text-white">
            {String(contact.name || "")
              .split(" ")
              .map((word) => word[0])
              .slice(0, 2)
              .join("")}
          </span>

          <div>
            <p className="font-medium text-slate-900">
              {contact.name || "Unnamed contact"}
            </p>

            {!isHospital && (
              <p className="text-xs text-slate-500">{contact.email}</p>
            )}
          </div>
        </div>
      ),
    },
    { key: "phone", label: "WhatsApp Number" },
    {
      key: "phone_valid",
      label: "Phone Validation",
      render: (contact) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            contact.phone_valid
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {contact.phone_valid ? "Format valid" : "Not checked"}
        </span>
      ),
    },
    { key: "group", label: "Group" },
    {
      key: "status",
      label: "Status",
      render: (contact) => <StatusBadge status={contact.status} />,
    },
    {
      key: "opted_in",
      label: "WhatsApp Consent",
      render: (contact) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            contact.opted_in
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {contact.opted_in ? "Confirmed" : "Not confirmed"}
        </span>
      ),
    },
    { key: "lastMessage", label: "Last Message" },
    {
      key: "actions",
      label: "Actions",
      render: (contact) => (
        <div className="flex items-center gap-1">
          <button
            className="rounded p-1.5 text-brand-700 hover:bg-brand-50"
            aria-label={`Message ${contact.name}`}
          >
            <MessageCircle size={16} />
          </button>

          <button
            onClick={() => openEdit(contact)}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
            aria-label={`Edit ${contact.name}`}
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={() => remove(contact.id)}
            className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
            aria-label={`Delete ${contact.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Loader />;

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle={`Manage the ${
          organization?.type === "Hospital"
            ? "patients"
            : organization?.type === "School"
              ? "parents and students"
              : organization?.type === "Hotel"
                ? "guests"
                : "customers"
        } you send WhatsApp messages to`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(event) => {
            importFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy || validating}
          className="btn-ghost disabled:opacity-50"
        >
          <Upload size={16} />
          {busy ? "Processing..." : "Import"}
        </button>

        <button onClick={exportContacts} className="btn-ghost">
          <Download size={16} />
          Export Excel
        </button>

        <button
          onClick={validateAllNumbers}
          disabled={validating || busy}
          className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle size={16} />
          {validating ? "Checking Numbers..." : "Validate All Numbers"}
        </button>

        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} />
          Add Contact
        </button>
      </PageHeader>

      {notice && (
        <div
          role="status"
          className={`mb-4 flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${
            notice.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-5 md:grid-cols-4">
        <SummaryBox
          label="Total Contacts"
          value={safeContacts.length}
          color="#8b5cf6"
        />

        <SummaryBox
          label="Active"
          value={
            safeContacts.filter((contact) => contact.status === "Active")
              .length
          }
          color="#25d366"
        />

        <SummaryBox
          label="Inactive"
          value={
            safeContacts.filter((contact) => contact.status === "Inactive")
              .length
          }
          color="#f59e0b"
        />

        <SummaryBox
          label="Groups"
          value={contactGroups.length}
          color="#34b7f1"
        />
      </div>

      <section className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={
                isHospital
                  ? "Search by name or phone"
                  : "Search by name, phone or email"
              }
              className="input pl-9"
            />
          </div>

          <select
            value={group}
            onChange={(event) => {
              setGroup(event.target.value);
              setPage(1);
            }}
            className="input w-auto"
          >
            <option>All</option>
            {contactGroups.map((contactGroup) => (
              <option key={contactGroup}>{contactGroup}</option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          empty="No contacts match your search."
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <span>
            Showing{" "}
            {filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}
            –{Math.min(current * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
              className="btn-ghost px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>

            <span>
              Page {current} of {pages}
            </span>

            <button
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
              className="btn-ghost px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit Contact" : "Add Contact"}
        footer={
          <>
            <button onClick={closeModal} className="btn-ghost">
              Cancel
            </button>

            <button
              form="contact-form"
              type="submit"
              disabled={busy}
              className="btn-primary disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save Contact"}
            </button>
          </>
        }
      >
        <form id="contact-form" onSubmit={save} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Full name
            </label>

            <input
              className="input"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              WhatsApp number
            </label>

            <input
              className="input"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Indian 10-digit mobile numbers are saved with country code 91.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <label className="flex items-start gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={form.opted_in}
                onChange={(event) =>
                  setForm({
                    ...form,
                    opted_in: event.target.checked,
                  })
                }
                className="mt-1"
              />

              <span>
                <span className="font-semibold">
                  WhatsApp consent confirmed
                </span>
                <span className="mt-1 block text-xs text-slate-600">
                  Check this only if the contact has explicitly agreed to
                  receive WhatsApp messages.
                </span>
              </span>
            </label>
          </div>

          {!isHospital && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Group
            </label>

            <select
              className="input"
              value={form.group}
              onChange={(event) =>
                setForm({ ...form, group: event.target.value })
              }
            >
              {contactGroups.map((contactGroup) => (
                <option key={contactGroup} value={contactGroup}>
                  {contactGroup}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </>
  );
}
