"use client";

import { MessageCircleIcon, SendIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtTime, fmtWhen } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox } from "@hospio/ui/shared/toolbar";
import { btn, textarea } from "@hospio/ui/shared/ui";
import type { ConversationRow, TemplateRow } from "@hospio/api/data/types";
import { useNotConnectedAction } from "@hospio/api/demo/actions";
import { cn } from "@hospio/ui/utils";

const channelTone = { WHATSAPP: "success", SMS: "info", EMAIL: "grey", IN_APP: "brand" } as const;

/** Front office 5.2 · Messages (two-pane inbox) — shared by Finance/Inventory via props when needed. */
export function MessagesScreen({ conversations: initial, templates, title = "Messages", kinds = ["GUEST", "STAFF"] }: { conversations: ConversationRow[]; templates: TemplateRow[]; title?: string; kinds?: ("GUEST" | "STAFF")[] }) {
	const [convs, setConvs] = useState(initial.filter((c) => kinds.includes(c.kind)));
	const [openId, setOpenId] = useQueryState("open");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [draft, setDraft] = useState("");
	const { run, pending } = useNotConnectedAction();
	const active = tab ?? "all";
	const shown = convs.filter((c) => (active === "all" || (active === "unread" ? c.unread > 0 : c.kind === active.toUpperCase())) && (!search || `${c.name} ${c.subject} ${c.preview}`.toLowerCase().includes(search.toLowerCase())));
	const conv = convs.find((c) => c.id === openId) ?? shown[0] ?? null;

	function send() {
		if (!conv || !draft) return;
		void run("Sent", () => {
			setConvs((xs) => xs.map((c) => (c.id === conv.id ? { ...c, unread: 0, lastAt: new Date().toISOString(), preview: draft, messages: [...c.messages, { id: `m-${Date.now()}`, direction: "OUT", by: "You", at: new Date().toISOString(), body: draft }] } : c)));
			setDraft("");
		});
	}

	return (
		<>
			<PageHeader title={title} subtitle={`${convs.reduce((s, c) => s + c.unread, 0)} unread · WhatsApp, SMS and in-app in one place`} />
			<div className="grid min-h-[560px] gap-0 overflow-hidden rounded-card border border-line bg-card xl:grid-cols-[360px_1fr]">
				<aside className="flex flex-col border-r border-line">
					<div className="flex flex-col gap-2 border-b border-line p-3">
						<SearchBox value={search} onChange={setSearch} placeholder="Search messages…" className="w-full" />
						<PillTabs value={active} onChange={(k) => void setTab(k === "all" ? null : k)} tabs={[{ key: "all", label: "All", count: convs.length }, { key: "unread", label: "Unread", count: convs.filter((c) => c.unread > 0).length }, ...(kinds.length > 1 ? [{ key: "guest", label: "Guests" }, { key: "staff", label: "Team" }] : [])]} />
					</div>
					<ul className="flex-1 divide-y divide-line overflow-y-auto">
						{shown.map((c) => (
							<li key={c.id}>
								<button type="button" onClick={() => { void setOpenId(c.id); setConvs((xs) => xs.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x))); }} className={cn("flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-subtle/60", conv?.id === c.id && "bg-brand-soft/40")}>
									<div className="flex items-center gap-2"><span className="flex-1 truncate text-[13px] font-semibold text-ink">{c.name}</span><span className="text-[11px] text-ink-3">{fmtTime(c.lastAt)}</span></div>
									<div className="flex items-center gap-2"><span className="flex-1 truncate text-xs text-ink-2">{c.preview}</span>{c.unread > 0 && <span className="rounded-pill bg-brand px-[6px] text-[10px] font-bold text-white">{c.unread}</span>}</div>
									<div className="flex gap-1"><StatusPill dot={false} tone={channelTone[c.channel]}>{c.channel === "IN_APP" ? "In-app" : c.channel}</StatusPill><span className="text-[11px] text-ink-3">{c.subject}</span></div>
								</button>
							</li>
						))}
						{shown.length === 0 && <li className="p-4"><EmptyState title="No conversations" /></li>}
					</ul>
				</aside>
				<section className="flex flex-col">
					{!conv ? (
						<EmptyState title="Pick a conversation" className="m-6 flex-1" />
					) : (
						<>
							<header className="flex items-center gap-3 border-b border-line px-5 py-3">
								<div className="min-w-0 flex-1"><p className="text-sm font-bold text-ink">{conv.name}</p><p className="text-xs text-ink-3">{conv.contact} · {conv.subject}{conv.assignedTo ? ` · with ${conv.assignedTo}` : ""}</p></div>
								<StatusPill dot={false} tone={channelTone[conv.channel]}>{conv.channel === "IN_APP" ? "In-app" : conv.channel}</StatusPill>
							</header>
							<div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-page/60 p-5">
								{conv.messages.map((m) => (
									<div key={m.id} className={cn("flex flex-col gap-1", m.direction === "OUT" ? "items-end" : "items-start")}>
										<div className={cn("max-w-[70%] rounded-2xl px-4 py-2 text-[13px]", m.direction === "OUT" ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm bg-card text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]")}>{m.body}</div>
										<span className="text-[11px] text-ink-3">{m.by} · {fmtWhen(m.at)}</span>
									</div>
								))}
							</div>
							<footer className="flex flex-col gap-2 border-t border-line p-3">
								<div className="flex flex-wrap gap-1">
									{templates.filter((t) => t.active).slice(0, 4).map((t) => (
										<button key={t.id} type="button" onClick={() => setDraft(t.body.replace(/\{\{guest\}\}/g, conv.name.split(" ")[0]).replace(/\{\{hotel\}\}/g, "Simpas Ikeja").replace(/\{\{[a-z_]+\}\}/g, "…"))} className="rounded-pill border border-line px-2 py-[3px] text-[11px] font-medium text-ink-2 hover:bg-subtle">{t.subject ?? t.key}</button>
									))}
								</div>
								<div className="flex items-end gap-2">
									<textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder={`Reply to ${conv.name.split(" ")[0]}…`} className={cn(textarea, "min-h-0 flex-1")} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} />
									<button type="button" className={btn.primary} disabled={!draft || pending} onClick={send}><SendIcon className="mr-1 inline size-4" /> Send</button>
								</div>
							</footer>
						</>
					)}
				</section>
			</div>
			<MessageCircleIcon className="hidden" />
		</>
	);
}
