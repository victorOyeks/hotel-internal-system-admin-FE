"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckIcon, FileTextIcon, MegaphoneIcon, MessageSquareIcon, PlusIcon, SendIcon, UserRoundIcon, UsersIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName, Note } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, SelectField, TextField, TextareaField, ToggleField } from "@hospio/ui/shared/field";
import { fmtWhen, humanize } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox } from "@hospio/ui/shared/toolbar";
import { btn, textarea as textareaCls } from "@hospio/ui/shared/ui";
import { useNotConnectedAction } from "@hospio/api/demo/actions";
import type { ConversationRow, StaffRow, TemplateRow } from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";

type Tab = "unanswered" | "guests" | "staff" | "all" | "templates";

const channelLabel = (c: ConversationRow["channel"]) => (c === "IN_APP" ? "In app" : c === "WHATSAPP" ? "WhatsApp" : c);

/** Manager · Messaging: shared inbox for guests and staff, with templates. */
export function MessagingScreen({ conversations, templates, staff, hotelName }: { conversations: ConversationRow[]; templates: TemplateRow[]; staff: StaffRow[]; hotelName: string }) {
	const [tab, setTab] = useQueryState("tab");
	const active = (tab ?? "unanswered") as Tab;
	const [selected, setSelected] = useQueryState("open");
	const [newOpen, setNewOpen] = useQueryState("new");
	const [search, setSearch] = useState("");
	const [draft, setDraft] = useState("");
	const [reassign, setReassign] = useState(false);
	const [assignee, setAssignee] = useState("");
	const [shiftPanel, setShiftPanel] = useState(false);
	const [templatePick, setTemplatePick] = useState(false);
	const [editTemplate, setEditTemplate] = useState<TemplateRow | null>(null);
	const { run, pending } = useNotConnectedAction();

	const unanswered = conversations.filter((c) => c.unread > 0 && c.messages[c.messages.length - 1]?.direction === "IN");
	const lists: Record<Exclude<Tab, "templates">, ConversationRow[]> = {
		unanswered,
		guests: conversations.filter((c) => c.kind === "GUEST"),
		staff: conversations.filter((c) => c.kind === "STAFF"),
		all: conversations,
	};
	const list = (active === "templates" ? [] : lists[active]).filter((c) => !search || JSON.stringify(c).toLowerCase().includes(search.toLowerCase()));
	const current = conversations.find((c) => c.id === selected) ?? (active !== "templates" ? list[0] : undefined) ?? null;
	const onShift = useMemo(() => staff.filter((s) => s.status === "ACTIVE" && s.shift !== "—"), [staff]);

	// ---- new message state ----
	const [to, setTo] = useState<"GUEST" | "STAFF" | "TEAM">("GUEST");
	const [recipient, setRecipient] = useState("");
	const [channel, setChannel] = useState("WHATSAPP");
	const [body, setBody] = useState("");
	const closeNew = () => {
		void setNewOpen(null);
		setRecipient("");
		setBody("");
	};

	const templateColumns: ColumnDef<TemplateRow, unknown>[] = [
		{ accessorKey: "key", header: "Template", cell: ({ row }) => <TwoLine primary={row.original.subject ?? row.original.key} secondary={row.original.key} /> },
		{ accessorKey: "channel", header: "Channel", cell: ({ row }) => <span className="text-ink-2">{row.original.channel}</span> },
		{ accessorKey: "body", header: "Message", cell: ({ row }) => <span className="line-clamp-1 max-w-[420px] text-ink-2">{row.original.body}</span> },
		{ accessorKey: "active", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.active ? "success" : "grey"}>{row.original.active ? "Sends automatically" : "Off"}</StatusPill> },
		{ id: "edit", header: "", cell: () => <span className="text-[13px] font-semibold text-brand">Edit →</span>, size: 70 },
	];

	return (
		<>
			<PageHeader title="Messages" subtitle={`${hotelName} · guests on WhatsApp, SMS and email, and your staff`}>
				<Button variant="outline" className={btn.secondary} onClick={() => setShiftPanel(true)}><MegaphoneIcon className="size-4" /> Message staff on shift</Button>
				<Button className={btn.primary} onClick={() => void setNewOpen("1")}><PlusIcon className="size-4" /> New message</Button>
			</PageHeader>

			<div className="flex items-center justify-between gap-3">
				<PillTabs
					tabs={[{ key: "unanswered", label: "Unanswered", count: unanswered.length }, { key: "guests", label: "Guests", count: lists.guests.length }, { key: "staff", label: "Staff", count: lists.staff.length }, { key: "all", label: "All" }, { key: "templates", label: "Templates", count: templates.length }]}
					value={active}
					onChange={(k) => void setTab(k === "unanswered" ? null : k)}
				/>
				{active !== "templates" && <SearchBox value={search} onChange={setSearch} placeholder="Search conversations…" />}
			</div>

			{active === "templates" ? (
				<DataTable columns={templateColumns} data={templates} onRowClick={(t) => setEditTemplate(t)} emptyTitle="No templates yet" />
			) : (
				<div className="grid min-h-[560px] overflow-hidden rounded-card border border-line bg-card xl:grid-cols-[320px_1fr]">
					<div className="flex flex-col divide-y divide-line overflow-y-auto border-r border-line">
						{list.length === 0 && <p className="p-6 text-center text-sm text-ink-3">No conversations here.</p>}
						{list.map((c) => {
							const last = c.messages[c.messages.length - 1];
							const waiting = last?.direction === "IN";
							return (
								<button key={c.id} type="button" onClick={() => void setSelected(c.id)} className={cn("flex flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-subtle/60", current?.id === c.id && "bg-brand-soft/40")}>
									<div className="flex items-center gap-2">
										<span className="flex-1 truncate text-[13px] font-semibold text-ink">{c.name}</span>
										<span className="text-[11px] text-ink-3">{fmtWhen(c.lastAt).replace("Today ", "")}</span>
									</div>
									<p className="truncate text-[11px] text-ink-3">{c.contact} · {channelLabel(c.channel)}{c.subject ? ` · ${c.subject}` : ""}</p>
									<p className="truncate text-xs text-ink-2">{c.preview}</p>
									<StatusPill tone={waiting ? "warning" : "grey"} className="mt-[2px] w-fit">{waiting ? "Not answered" : c.assignedTo ? `${c.assignedTo.split(" ")[0]} replied` : c.kind === "STAFF" ? "Team chat" : "Replied"}</StatusPill>
								</button>
							);
						})}
					</div>

					{current ? (
						<div className="flex min-w-0 flex-col">
							<header className="flex items-center gap-3 border-b border-line px-5 py-4">
								<div className="min-w-0 flex-1">
									<h2 className="text-base font-bold text-ink">{current.name}</h2>
									<p className="text-xs text-ink-3">{channelLabel(current.channel)} · {current.contact}{current.assignedTo ? ` · assigned to ${current.assignedTo}` : " · unassigned"}</p>
								</div>
								<Button variant="outline" className={btn.secondary} onClick={() => setReassign(true)}><UserRoundIcon className="size-4" /> Reassign</Button>
								<Button variant="outline" className={btn.secondary} disabled={pending} onClick={() => run("Marked done", undefined, { tone: "info" })}><CheckIcon className="size-4" /> Mark done</Button>
							</header>
							<div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
								{current.messages.map((m) => (
									<div key={m.id} className={cn("flex max-w-[70%] flex-col gap-1", m.direction === "OUT" ? "self-end items-end" : "self-start")}>
										<p className={cn("rounded-2xl px-4 py-[10px] text-[13px]", m.direction === "OUT" ? "bg-brand text-white" : "border border-line bg-card text-ink")}>{m.body}</p>
										<span className="text-[11px] text-ink-3">{m.direction === "OUT" ? m.by : channelLabel(current.channel)} · {fmtWhen(m.at)}</span>
									</div>
								))}
								{current.unread > 0 && <Note tone="danger">Not answered for a while · the guest is waiting. Replying assigns it to you.</Note>}
							</div>
							<footer className="flex items-end gap-3 border-t border-line px-5 py-4">
								<div className="flex flex-1 flex-col gap-2">
									<textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder={`Reply to ${current.name.split(" ")[0]}…`} className={cn(textareaCls, "min-h-[56px]")} />
									<button type="button" onClick={() => setTemplatePick(true)} className="flex w-fit items-center gap-1 text-xs font-semibold text-brand hover:underline"><FileTextIcon className="size-[14px]" /> Use a template</button>
								</div>
								<Button className={btn.primary} disabled={pending || draft.trim().length === 0} onClick={() => run(`Sent by ${channelLabel(current.channel)}`, () => setDraft(""))}><SendIcon className="size-4" /> Send by {channelLabel(current.channel)}</Button>
							</footer>
						</div>
					) : (
						<div className="flex items-center justify-center p-10 text-sm text-ink-3">Pick a conversation</div>
					)}
				</div>
			)}

			{/* Reassign */}
			<Modal open={reassign} onOpenChange={setReassign} title="Reassign conversation" subtitle="They get a notification and it leaves your list" size="confirm" icon={UserRoundIcon}
				footer={<><Button variant="outline" className={btn.secondary} onClick={() => setReassign(false)}>Cancel</Button><Button className={btn.primary} disabled={pending || !assignee} onClick={() => run(`Reassigned to ${assignee}`, () => setReassign(false))}>Reassign</Button></>}>
				<SelectField label="Assign to" value={assignee} onChange={setAssignee} options={onShift.map((s) => ({ value: s.fullName, label: s.fullName, hint: `${s.jobTitle} · ${s.shift} shift` }))} placeholder="Someone on shift" />
			</Modal>

			{/* Template picker */}
			<Modal open={templatePick} onOpenChange={setTemplatePick} title="Use a template" subtitle="Placeholders are filled from the booking" size="form" icon={FileTextIcon}>
				<ul className="flex flex-col divide-y divide-line">
					{templates.map((t) => (
						<li key={t.id}>
							<button type="button" className="flex w-full flex-col gap-1 px-1 py-3 text-left hover:bg-subtle/60" onClick={() => { setDraft(t.body); setTemplatePick(false); }}>
								<span className="text-[13px] font-semibold text-ink">{t.subject ?? t.key}</span>
								<span className="line-clamp-2 text-xs text-ink-2">{t.body}</span>
							</button>
						</li>
					))}
				</ul>
			</Modal>

			{/* New message */}
			<SidePanel open={!!newOpen} onOpenChange={(o) => !o && closeNew()} title="New message" subtitle="To a guest, a person or a whole team" icon={MessageSquareIcon}
				footerInfo="Guests get it on the channel you pick · staff see it in their app"
				footer={<><Button variant="outline" className={btn.secondary} onClick={closeNew}>Cancel</Button><Button className={btn.primary} disabled={pending || !recipient || body.trim().length === 0} onClick={() => run("Message sent", closeNew)}><SendIcon className="size-4" /> Send</Button></>}>
				<div className="flex flex-col gap-5">
					<ChoiceCards label="Send to" value={to} onChange={setTo} columns={3} options={[{ value: "GUEST", label: "A guest" }, { value: "STAFF", label: "A person" }, { value: "TEAM", label: "A team" }]} />
					{to === "GUEST" ? (
						<TextField label="Guest" value={recipient} onChange={setRecipient} placeholder="Name, room or phone" hint="Guests in house and arriving today come first" />
					) : to === "STAFF" ? (
						<SelectField label="Person" value={recipient} onChange={setRecipient} options={staff.map((s) => ({ value: s.fullName, label: s.fullName, hint: s.jobTitle }))} />
					) : (
						<SelectField label="Team" value={recipient} onChange={setRecipient} options={["Front office", "Housekeeping", "Laundry", "Maintenance", "Kitchen", "Bar", "Store", "Finance", "Everyone on shift"]} />
					)}
					{to === "GUEST" && <SelectField label="Channel" value={channel} onChange={setChannel} options={[{ value: "WHATSAPP", label: "WhatsApp" }, { value: "SMS", label: "SMS" }, { value: "EMAIL", label: "Email" }]} />}
					<TextareaField label="Message" value={body} onChange={setBody} rows={5} placeholder="Type your message…" />
					<button type="button" onClick={() => setTemplatePick(true)} className="flex w-fit items-center gap-1 text-xs font-semibold text-brand hover:underline"><FileTextIcon className="size-[14px]" /> Start from a template</button>
				</div>
			</SidePanel>

			{/* Staff on shift */}
			<SidePanel open={shiftPanel} onOpenChange={setShiftPanel} title="Message staff on shift" subtitle={`${onShift.length} people are on shift now`} icon={UsersIcon}
				footer={<><Button variant="outline" className={btn.secondary} onClick={() => setShiftPanel(false)}>Cancel</Button><Button className={btn.primary} disabled={pending || body.trim().length === 0} onClick={() => run(`Sent to ${onShift.length} people`, () => { setShiftPanel(false); setBody(""); })}><SendIcon className="size-4" /> Send to everyone</Button></>}>
				<div className="flex flex-col gap-5">
					<TextareaField label="Message" value={body} onChange={setBody} rows={4} placeholder="e.g. Fire drill at 3pm · meet at the car park" />
					<PanelSection title="Goes to">
						<ul className="flex flex-col gap-2">
							{onShift.map((s) => <li key={s.id}><AvatarName name={s.fullName} secondary={`${humanize(s.role)} · ${s.shift}`} size="sm" /></li>)}
						</ul>
					</PanelSection>
				</div>
			</SidePanel>

			{/* Edit template */}
			<SidePanel open={!!editTemplate} onOpenChange={(o) => !o && setEditTemplate(null)} title={editTemplate?.subject ?? "Template"} subtitle={editTemplate ? `${editTemplate.key} · ${editTemplate.channel}` : undefined} icon={FileTextIcon}
				footerInfo="Placeholders: {{guest}} {{hotel}} {{room}} {{check_in}} {{check_out}} {{reference}} {{amount}} {{balance}}"
				footer={<><Button variant="outline" className={btn.secondary} onClick={() => setEditTemplate(null)}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run("Template saved", () => setEditTemplate(null))}>Save template</Button></>}>
				{editTemplate && <TemplateForm template={editTemplate} />}
			</SidePanel>
		</>
	);
}

function TemplateForm({ template }: { template: TemplateRow }) {
	const [subject, setSubject] = useState(template.subject ?? "");
	const [body, setBody] = useState(template.body);
	const [active, setActive] = useState(template.active);
	return (
		<div className="flex flex-col gap-4">
			<TextField label="Subject" value={subject} onChange={setSubject} hint="Used on email; WhatsApp and SMS send the message only" />
			<TextareaField label="Message" value={body} onChange={setBody} rows={6} />
			<ToggleField label="Send automatically" hint="When the event happens, without anyone pressing send" checked={active} onChange={setActive} />
			<PanelSection title="Preview">
				<p className="rounded-2xl border border-line bg-subtle/60 px-4 py-3 text-[13px] text-ink">{body.replace(/{{guest}}/g, "Ifeoma").replace(/{{hotel}}/g, "Simpas Ikeja").replace(/{{room}}/g, "Suite A325").replace(/{{room_type}}/g, "Suite").replace(/{{check_in}}/g, "Sat 8 Nov").replace(/{{check_out}}/g, "Mon 10 Nov").replace(/{{reference}}/g, "HB6980XK").replace(/{{amount}}/g, "₦480,000").replace(/{{balance}}/g, "₦46,000").replace(/{{[a-z_]+}}/g, "…")}</p>
			</PanelSection>
		</div>
	);
}
