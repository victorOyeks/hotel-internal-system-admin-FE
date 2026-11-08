"use client";

import { MegaphoneIcon, MessageSquareIcon, PlusIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AvatarName } from "@/components/shared/detail-list";
import { EmptyState } from "@/components/shared/empty-state";
import { SelectField, TextareaField, TextField, ToggleField } from "@/components/shared/field";
import { fmtAgo, fmtWhen } from "@/components/shared/format";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { SearchBox } from "@/components/shared/toolbar";
import { btn, input } from "@/components/shared/ui";
import { useDemoAction } from "@/lib/demo/actions";
import type { ConversationRow } from "@/lib/data/types";
import type { OwnerHotelFinance } from "@/lib/demo/fixtures/owner";
import { cn } from "@/lib/utils";
import { useParam } from "./common";

export function OwnerMessaging({ conversations, hotels }: { conversations: ConversationRow[]; hotels: OwnerHotelFinance[] }) {
	const [open, setOpen] = useParam("open");
	const [newOpen, setNewOpen] = useParam("new");
	const [all, setAll] = useState(false);
	const [search, setSearch] = useState("");
	const [reply, setReply] = useState("");
	const { run, pending } = useDemoAction();
	const list = conversations.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));
	const active = conversations.find((c) => c.id === open) ?? list[0] ?? null;

	return (
		<>
			<PageHeader title="Messaging" subtitle="Your managers and teams · guests are messaged by each hotel">
				<Button variant="outline" className={btn.secondary} onClick={() => setAll(true)}><MegaphoneIcon className="size-4" /> Message all managers</Button>
				<Button className={btn.primary} onClick={() => setNewOpen("1")}><PlusIcon className="size-4" /> New message</Button>
			</PageHeader>
			<div className="grid min-h-[560px] gap-4 xl:grid-cols-[360px_1fr]">
				<div className="flex flex-col overflow-hidden rounded-card border border-line bg-card">
					<div className="border-b border-line p-3"><SearchBox value={search} onChange={setSearch} placeholder="Search people" className="w-full" /></div>
					<ul className="flex-1 overflow-y-auto">
						{list.map((c) => (
							<li key={c.id}>
								<button type="button" onClick={() => setOpen(c.id)} className={cn("flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left hover:bg-subtle/60", active?.id === c.id && "bg-brand-soft/30")}>
									<AvatarName name={c.name} size="sm" className="shrink-0" />
									<div className="min-w-0 flex-1 -ml-[10px]">
										<div className="flex items-center justify-between gap-2"><span className="truncate text-[13px] font-semibold text-ink">{c.name}</span><span className="shrink-0 text-[10px] text-ink-3">{fmtAgo(c.lastAt)}</span></div>
										<p className="text-[11px] text-ink-3">{c.contact}</p>
										<p className={cn("truncate text-xs", c.unread ? "font-semibold text-ink" : "text-ink-2")}>{c.preview}</p>
									</div>
									{c.unread > 0 && <span className="rounded-pill bg-brand px-[6px] py-[1px] text-[10px] font-bold text-white">{c.unread}</span>}
								</button>
							</li>
						))}
					</ul>
				</div>
				<div className="flex flex-col overflow-hidden rounded-card border border-line bg-card">
					{!active ? (
						<EmptyState title="Pick a conversation" className="m-4 flex-1" />
					) : (
						<>
							<div className="flex items-center gap-3 border-b border-line px-5 py-3"><AvatarName name={active.name} secondary={`${active.contact} · ${active.subject}`} /></div>
							<div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-subtle/30 p-5">
								{active.messages.map((m) => (
									<div key={m.id} className={cn("max-w-[70%] rounded-2xl px-4 py-[10px] text-[13px]", m.direction === "OUT" ? "self-end rounded-br-md bg-brand text-white" : "self-start rounded-bl-md bg-card text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]")}>
										<p>{m.body}</p>
										<p className={cn("mt-1 text-[10px]", m.direction === "OUT" ? "text-white/70" : "text-ink-3")}>{m.by} · {fmtWhen(m.at)}</p>
									</div>
								))}
							</div>
							<form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); if (reply) run("Message sent", () => setReply("")); }}>
								<input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${active.name}…`} className={cn(input, "flex-1")} />
								<Button type="submit" className={btn.primary} disabled={pending || !reply}><SendIcon className="size-4" /></Button>
							</form>
						</>
					)}
				</div>
			</div>

			<NewMessagePanel open={newOpen === "1"} hotels={hotels} onClose={() => setNewOpen(null)} />
			<MessageAllModal open={all} onClose={() => setAll(false)} hotels={hotels} />
		</>
	);
}

function NewMessagePanel({ open, hotels, onClose }: { open: boolean; hotels: OwnerHotelFinance[]; onClose: () => void }) {
	const [to, setTo] = useState(hotels[0]?.manager ?? "");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const { run, pending } = useDemoAction();
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} title="New message" subtitle="To a manager or a whole team" icon={MessageSquareIcon} footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !body} onClick={() => run(`Message sent to ${to}`, onClose)}>Send</Button></>}>
			<div className="flex flex-col gap-4">
				<SelectField label="To" value={to} onChange={setTo} options={[...hotels.map((h) => ({ value: h.manager, label: h.manager, hint: `Manager · ${h.name}` })), { value: "Finance team", label: "Finance team", hint: "Every finance user" }]} />
				<TextField label="Subject" value={subject} onChange={setSubject} />
				<TextareaField label="Message" value={body} onChange={setBody} rows={6} />
			</div>
		</SidePanel>
	);
}

function MessageAllModal({ open, onClose, hotels }: { open: boolean; onClose: () => void; hotels: OwnerHotelFinance[] }) {
	const [body, setBody] = useState("");
	const [wa, setWa] = useState(true);
	const { run, pending } = useDemoAction();
	return (
		<Modal open={open} onOpenChange={(o) => !o && onClose()} title="Message all managers" subtitle={`${hotels.length} managers · ${hotels.map((h) => h.manager.split(" ")[0]).join(", ")}`} icon={MegaphoneIcon} size="form" footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !body} onClick={() => run(`Sent to ${hotels.length} managers`, () => { setBody(""); onClose(); })}>Send to all</Button></>}>
			<div className="flex flex-col gap-4">
				<TextareaField label="Message" value={body} onChange={setBody} rows={5} placeholder="e.g. December rate proposals by Friday please" />
				<ToggleField label="Also send on WhatsApp" checked={wa} onChange={setWa} />
				<WhatHappens items={["Each manager gets it as a separate conversation", "Replies come back to you one by one"]} />
			</div>
		</Modal>
	);
}
