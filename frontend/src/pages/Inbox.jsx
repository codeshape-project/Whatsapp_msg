import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCheck,
  Inbox as InboxIcon,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const REFRESH_MS = 15000;

/* ================= HELPERS ================= */

function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);

  return (
    (parts[0]?.[0] || "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
}

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function listTime(value) {
  const date = toDate(value);
  if (!date) return "";

  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (sameDay(date, now)) {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function bubbleTime(value) {
  const date = toDate(value);
  return date
    ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";
}

function dayLabel(value) {
  const date = toDate(value);
  if (!date) return "";

  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (sameDay(date, now)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function notifyUnreadChanged() {
  window.dispatchEvent(new Event("inbox-unread-changed"));
}

/* ================= PIECES ================= */

function Avatar({ name, size = "h-11 w-11" }) {
  return (
    <span
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-sm font-semibold text-white`}
    >
      {initials(name)}
    </span>
  );
}

function ConversationItem({ conversation, active, onSelect }) {
  const unread = conversation.unread_count > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.contact_id)}
      className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${
        active ? "bg-brand-50" : "hover:bg-slate-50"
      }`}
    >
      <Avatar name={conversation.name} />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-sm ${
              unread ? "font-semibold text-slate-900" : "font-medium text-slate-800"
            }`}
          >
            {conversation.name}
          </span>

          <span
            className={`shrink-0 text-[11px] ${
              unread ? "font-semibold text-brand-700" : "text-slate-500"
            }`}
          >
            {listTime(conversation.last_message_at)}
          </span>
        </span>

        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span
            className={`truncate text-[13px] ${
              unread ? "font-medium text-slate-800" : "text-slate-500"
            }`}
          >
            {conversation.last_message || "—"}
          </span>

          {unread && (
            <span className="min-w-[20px] shrink-0 rounded-full bg-wa px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-brand-950">
              {conversation.unread_count}
            </span>
          )}
        </span>

        {conversation.last_campaign && (
          <span className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-800">
            <Send size={10} className="shrink-0" />
            <span className="truncate">{conversation.last_campaign}</span>
          </span>
        )}
      </span>
    </button>
  );
}

function MessageBubble({ message }) {
  const outgoing = message.direction === "outgoing";
  const failed = message.status === "failed";

  return (
    <div className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%] ${
          outgoing
            ? "rounded-br-sm bg-[#d9fdd3] text-slate-800"
            : "rounded-bl-sm bg-white text-slate-800"
        }`}
      >
        {outgoing && message.campaign_name && (
          <p className="mb-1 text-[11px] font-semibold text-brand-800">
            Campaign: {message.campaign_name}
          </p>
        )}

        <p className="whitespace-pre-wrap break-words">
          {message.message_body || `[${message.message_type || "message"}]`}
        </p>

        <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
          {bubbleTime(message.at)}

          {outgoing && !failed && (
            <CheckCheck
              size={13}
              className={
                message.status === "read" ? "text-sky-500" : "text-slate-400"
              }
            />
          )}

          {outgoing && failed && (
            <span className="font-semibold text-rose-600">Failed</span>
          )}
        </p>
      </div>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <MessageSquare size={30} />
      </span>
      <p className="text-base font-semibold text-slate-700">
        Select a conversation
      </p>
      <p className="max-w-xs text-sm">
        Customer replies to your campaigns appear here. Pick a contact on the
        left to read the full conversation.
      </p>
    </div>
  );
}

/* ================= PAGE ================= */

export default function Inbox() {
  const { organization } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState(
    searchParams.get("contact_id") || null
  );
  const [thread, setThread] = useState([]);
  const [threadContact, setThreadContact] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState("");

  const bottomRef = useRef(null);
  const lastThreadSize = useRef(0);

  const loadConversations = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setListLoading(true);

      try {
        const rows = await api.getInboxConversations(filter);
        setConversations(rows);
        setListError("");
      } catch (error) {
        if (!silent) {
          setListError(error?.message || "Unable to load conversations.");
        }
      } finally {
        if (!silent) setListLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    loadConversations();

    const timer = setInterval(
      () => loadConversations({ silent: true }),
      REFRESH_MS
    );
    const onOrganizationChange = () => {
      setSelectedId(null);
      setThread([]);
      loadConversations();
    };

    window.addEventListener("organization-changed", onOrganizationChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener("organization-changed", onOrganizationChange);
    };
  }, [loadConversations]);

  const markRead = useCallback(async (contactId) => {
    try {
      await api.markInboxRead(contactId);

      setConversations((current) =>
        current.map((item) =>
          item.contact_id === contactId ? { ...item, unread_count: 0 } : item
        )
      );

      notifyUnreadChanged();
    } catch {
      // Marking as read is best-effort.
    }
  }, []);

  const loadThread = useCallback(
    async (contactId, { silent = false } = {}) => {
      if (!contactId) return;

      if (!silent) {
        setThreadLoading(true);
        setThreadError("");
      }

      try {
        const result = await api.getInboxMessages(contactId);
        setThread(result.messages);
        setThreadContact(result.contact);
        setThreadError("");
      } catch (error) {
        if (!silent) {
          setThreadError(error?.message || "Unable to load this conversation.");
        }
      } finally {
        if (!silent) setThreadLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedId) return undefined;

    lastThreadSize.current = 0;
    setThread([]);
    loadThread(selectedId);
    markRead(selectedId);

    const timer = setInterval(() => {
      loadThread(selectedId, { silent: true });
    }, REFRESH_MS);

    return () => clearInterval(timer);
  }, [selectedId, loadThread, markRead]);

  useEffect(() => {
    if (thread.length !== lastThreadSize.current) {
      lastThreadSize.current = thread.length;
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [thread]);

  useEffect(() => {
    if (!selectedId) return;

    const open = conversations.find((item) => item.contact_id === selectedId);

    if (open && open.unread_count > 0) {
      markRead(selectedId);
    }
  }, [conversations, selectedId, markRead]);

  const selectConversation = (contactId) => {
    setSelectedId(contactId);
    setSearchParams(contactId ? { contact_id: contactId } : {}, {
      replace: true,
    });
  };

  const closeConversation = () => selectConversation(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return conversations;

    return conversations.filter(
      (item) =>
        String(item.name || "").toLowerCase().includes(term) ||
        String(item.phone || "").includes(term.replace(/\s+/g, "")) ||
        String(item.last_message || "").toLowerCase().includes(term)
    );
  }, [conversations, search]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, item) => sum + item.unread_count, 0),
    [conversations]
  );

  const selectedSummary = conversations.find(
    (item) => item.contact_id === selectedId
  );
  const header = threadContact || selectedSummary;

  const threadWithDays = useMemo(() => {
    const rows = [];
    let previousDay = "";

    for (const message of thread) {
      const date = toDate(message.at);
      const key = date ? date.toDateString() : "";

      if (key && key !== previousDay) {
        rows.push({ type: "day", id: `day-${key}`, label: dayLabel(message.at) });
        previousDay = key;
      }

      rows.push({ type: "message", id: message.id, message });
    }

    return rows;
  }, [thread]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-brand-900">
            {organization?.name ?? "Organization"} Inbox
          </h2>
          <p className="text-sm text-slate-600">
            Replies from customers who received your WhatsApp campaigns
          </p>
        </div>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            loadConversations();
            if (selectedId) loadThread(selectedId);
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <section className="card flex h-[calc(100vh-11rem)] min-h-[480px] overflow-hidden">
        {/* Left: conversation list */}
        <aside
          className={`${
            selectedId ? "hidden md:flex" : "flex"
          } w-full flex-col border-r border-slate-100 md:w-[340px] md:shrink-0`}
        >
          <div className="space-y-3 border-b border-slate-100 p-3">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, number or message"
                className="input pl-9"
              />
            </div>

            <div className="flex gap-2">
              {[
                { key: "all", label: "All" },
                {
                  key: "unread",
                  label: totalUnread > 0 ? `Unread (${totalUnread})` : "Unread",
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    filter === tab.key
                      ? "bg-brand-800 text-white"
                      : "bg-brand-50 text-brand-800 hover:bg-brand-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {listLoading && (
              <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
                Loading replies...
              </div>
            )}

            {!listLoading && listError && (
              <div className="p-6 text-center text-sm text-rose-600">
                <p>{listError}</p>
                <button
                  type="button"
                  className="btn-ghost mt-3"
                  onClick={() => loadConversations()}
                >
                  Try again
                </button>
              </div>
            )}

            {!listLoading && !listError && filtered.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center text-slate-500">
                <InboxIcon size={30} className="text-brand-700" />
                <p className="text-sm font-semibold text-slate-700">
                  {search
                    ? "No matching conversations"
                    : filter === "unread"
                      ? "You're all caught up"
                      : "No replies yet"}
                </p>
                {!search && filter === "all" && (
                  <p className="text-xs">
                    When a customer replies to a campaign, it will show up here.
                  </p>
                )}
              </div>
            )}

            {!listLoading &&
              !listError &&
              filtered.map((conversation) => (
                <ConversationItem
                  key={conversation.contact_id}
                  conversation={conversation}
                  active={conversation.contact_id === selectedId}
                  onSelect={selectConversation}
                />
              ))}
          </div>
        </aside>

        {/* Right: conversation */}
        <div
          className={`${
            selectedId ? "flex" : "hidden md:flex"
          } min-w-0 flex-1 flex-col bg-[#efeae2]`}
        >
          {!selectedId && <EmptyThread />}

          {selectedId && (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
                <button
                  type="button"
                  onClick={closeConversation}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={20} />
                </button>

                <Avatar name={header?.name} size="h-10 w-10" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {header?.name || "Contact"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    +{String(header?.phone || "").replace(/^\+/, "")}
                    {header?.group_name ? ` · ${header.group_name}` : ""}
                  </p>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-6">
                {threadLoading && (
                  <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
                    Loading conversation...
                  </div>
                )}

                {!threadLoading && threadError && (
                  <div className="py-10 text-center text-sm text-rose-600">
                    <p>{threadError}</p>
                    <button
                      type="button"
                      className="btn-ghost mt-3"
                      onClick={() => loadThread(selectedId)}
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!threadLoading &&
                  !threadError &&
                  threadWithDays.map((row) =>
                    row.type === "day" ? (
                      <div key={row.id} className="flex justify-center py-1">
                        <span className="rounded-lg bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                          {row.label}
                        </span>
                      </div>
                    ) : (
                      <MessageBubble key={row.id} message={row.message} />
                    )
                  )}

                <div ref={bottomRef} />
              </div>

              <footer className="border-t border-slate-200 bg-white px-4 py-2.5 text-center text-xs text-slate-500">
                Read-only view. Customers' replies are saved here automatically.
              </footer>
            </>
          )}
        </div>
      </section>
    </>
  );
}