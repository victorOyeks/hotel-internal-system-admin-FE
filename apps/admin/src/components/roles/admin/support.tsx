"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangleIcon, HeadsetIcon, PlusIcon, SendIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Timeline } from "@hospio/ui/shared/detail-list";
import { SelectField, TextareaField, TextField } from "@hospio/ui/shared/field";
import { fmtAgo, fmtWhen } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { BusinessRow, TicketRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { AdminUserRow } from "@hospio/api/data/types";
import type { SystemAlertRow } from "@hospio/api/demo/fixtures/platform-extra";
import { cn } from "@hospio/ui/utils";
import { ticketPriority, ticketStatus } from "./shared";

export function SupportScreen({ tickets: initial, alerts, businesses, admins }: { tickets: TicketRow[]; alerts: SystemAlertRow[]; businesses: BusinessRow[]; admins: AdminUserRow[] }) {
	const [tickets, setTickets] = useState(initial);
	const [tab, setTab] = useQueryState("tab");
	const [open, setOpen] = useQueryState("open");
	const [isNew, setNew] = useQueryState("new");
	const [search, setSearch] = useState("");
	const active = tab ?? "OPEN";
	const rows = useMemo(() => tickets.filter((t) => (active === "ALL" ? true : t.status === active)), [tickets, active]);
	const selected = tickets.find((t) => t.id === open) ?? null;

	const columns: ColumnDef<TicketRow, unknown>[] = [
		{ accessorKey: "subject", header: "Ticket", cell: ({ row }) => <TwoLine primary={`${row.original.id.replace("tk-", "T-")} · ${row.original.subject}`} secondary={`${row.original.businessName} · ${row.original.openedBy}`} /> },
		{ accessorKey: "priority", header: "Priority", cell: ({ row }) => <StatusPill tone={ticketPriority[row.original.priority]}>{row.original.priority.toLowerCase()}</StatusPill> },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={ticketStatus[row.original.status].tone}>{ticketStatus[row.original.status].label}</StatusPill> },
		{ accessorKey: "assignedTo", header: "Assigned", cell: ({ row }) => row.original.assignedTo ?? <span className="text-ink-3">Unassigned</span> },
		{ accessorKey: "openedAt", header: "Opened", cell: ({ row }) => <span className="text-ink-3">{fmtAgo(row.original.openedAt)}</span> },
	];

	return (
		<>
			<PageHeader title="Support & alerts" subtitle="Problems hotels told us about, and problems the system found">
				<button type="button" onClick={() => setNew("1")} className={cn(btn.primary, "flex items-center gap-2")}><PlusIcon className="size-4" /> New ticket</button>
			</PageHeader>

			<div className="grid gap-4 xl:grid-cols-[380px_1fr]">
				<SectionCard title="System alerts" count={alerts.length} bodyClassName="pt-1">
					{alerts.map((a, i) => (
						<div key={a.id} className={cn("flex items-start gap-2 py-[10px]", i < alerts.length - 1 && "border-b border-line")}>
							<AlertTriangleIcon className={cn("mt-[2px] size-4 shrink-0", a.tone === "danger" ? "text-danger" : a.tone === "warning" ? "text-warning" : "text-ink-3")} />
							<div className="min-w-0 flex-1">
								<p className="text-[13px] font-semibold text-ink">{a.businessName} · {a.title}</p>
								<p className="text-xs text-ink-3">{a.detail}</p>
							</div>
							<button type="button" onClick={() => { setNew("1"); }} className="text-xs font-semibold text-brand hover:underline">Ticket</button>
						</div>
					))}
				</SectionCard>

				<div className="flex flex-col gap-3">
					<Toolbar
						left={<PillTabs tabs={[{ key: "OPEN", label: "Waiting on us", count: tickets.filter((t) => t.status === "OPEN").length }, { key: "IN_PROGRESS", label: "In progress", count: tickets.filter((t) => t.status === "IN_PROGRESS").length }, { key: "RESOLVED", label: "Resolved", count: tickets.filter((t) => t.status === "RESOLVED").length }, { key: "ALL", label: "All", count: tickets.length }]} value={active} onChange={(k) => void setTab(k === "OPEN" ? null : k)} />}
						right={<SearchBox value={search} onChange={setSearch} placeholder="Search tickets…" />}
					/>
					<DataTable columns={columns} data={rows} search={search} onRowClick={(t) => setOpen(t.id)} emptyTitle="No tickets" />
				</div>
			</div>

			<TicketPanel ticket={selected} admins={admins} onClose={() => void setOpen(null)} onChange={(t) => setTickets((all) => all.map((x) => (x.id === t.id ? t : x)))} />
			<NewTicketModal open={isNew === "1"} onOpenChange={(o) => void setNew(o ? "1" : null)} businesses={businesses} onCreate={(t) => setTickets((all) => [t, ...all])} />
		</>
	);
}

function TicketPanel({ ticket, admins, onClose, onChange }: { ticket: TicketRow | null; admins: AdminUserRow[]; onClose: () => void; onChange: (t: TicketRow) => void }) {
	const { run, pending } = useDemoAction();
	const [reply, setReply] = useState("");
	const [resolution, setResolution] = useState("");
	const [replies, setReplies] = useState<{ at: string; by: string; text: string }[]>([]);
	if (!ticket) return <SidePanel open={false} onOpenChange={() => undefined} title="">{null}</SidePanel>;
	const st = ticketStatus[ticket.status];
	return (
		<SidePanel open onOpenChange={(o) => !o && onClose()} title={`${ticket.id.replace("tk-", "T-")} · ${ticket.subject}`} subtitle={<span className="flex items-center gap-2">{ticket.businessName} · {ticket.openedBy} · {fmtWhen(ticket.openedAt)} <StatusPill tone={st.tone}>{st.label}</StatusPill></span>} icon={HeadsetIcon} width="lg"
			footerInfo={ticket.status === "RESOLVED" ? `Resolved: ${ticket.resolution}` : "Replies go to the person who opened the ticket, on WhatsApp and email."}
			footer={ticket.status !== "RESOLVED" ? (
				<>
					<button type="button" className={btn.secondary} disabled={!reply || pending} onClick={() => run("Reply sent", () => { setReplies((r) => [...r, { at: new Date().toISOString(), by: "You", text: reply }]); setReply(""); if (ticket.status === "OPEN") onChange({ ...ticket, status: "IN_PROGRESS" }); })}><SendIcon className="mr-1 inline size-4" />Send reply</button>
					<button type="button" className={btn.primary} disabled={!resolution || pending} onClick={() => run(`${ticket.id.replace("tk-", "T-")} resolved`, () => { onChange({ ...ticket, status: "RESOLVED", resolution }); onClose(); })}>Resolve</button>
				</>
			) : undefined}
		>
			<div className="flex flex-col gap-5">
				<DetailList columns={2} items={[
					{ label: "Priority", value: <StatusPill tone={ticketPriority[ticket.priority]}>{ticket.priority.toLowerCase()}</StatusPill> },
					{ label: "Assigned to", value: ticket.assignedTo ?? "Unassigned" },
				]} />
				<PanelSection title="What they said">
					<p className="rounded-xl bg-subtle px-4 py-3 text-[13px] text-ink">{ticket.body}</p>
				</PanelSection>
				{replies.length > 0 && <PanelSection title="Replies"><Timeline items={replies.map((r) => ({ at: fmtWhen(r.at), by: r.by, text: r.text }))} /></PanelSection>}
				{ticket.status !== "RESOLVED" && (
					<>
						<PanelSection title="Assign">
							<SelectField label="Team member" value={ticket.assignedTo ?? ""} onChange={(v) => onChange({ ...ticket, assignedTo: v, status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status })} placeholder="Choose who handles this" options={admins.filter((a) => a.status === "ACTIVE").map((a) => ({ value: a.fullName, label: a.fullName, hint: a.role.toLowerCase().replace("_", " ") }))} />
						</PanelSection>
						<PanelSection title="Reply">
							<TextareaField label="Message to the hotel" value={reply} onChange={setReply} placeholder="Hi Funmi, we've re-linked the bar terminal…" />
						</PanelSection>
						<PanelSection title="Resolve">
							<TextareaField label="What fixed it" value={resolution} onChange={setResolution} placeholder="Re-linked MP-0091 · payments now showing" rows={2} />
						</PanelSection>
					</>
				)}
			</div>
		</SidePanel>
	);
}

function NewTicketModal({ open, onOpenChange, businesses, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; businesses: BusinessRow[]; onCreate: (t: TicketRow) => void }) {
	const { run, pending } = useDemoAction();
	const [business, setBusiness] = useState("");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [priority, setPriority] = useState("NORMAL");
	return (
		<Modal open={open} onOpenChange={onOpenChange} title="New ticket" subtitle="Log something a hotel told you on the phone or WhatsApp" icon={HeadsetIcon} size="form"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button>
					<button type="button" className={btn.primary} disabled={!business || !subject || pending} onClick={() => run("Ticket created", () => { onCreate({ id: `tk-${Math.floor(4421 + Math.random() * 500)}`, businessName: businesses.find((b) => b.id === business)?.name ?? business, subject, body, priority: priority as TicketRow["priority"], status: "OPEN", openedBy: "H.M.S (phone)", openedAt: new Date().toISOString() }); onOpenChange(false); setSubject(""); setBody(""); })}>Create ticket</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField label="Business" value={business} onChange={setBusiness} options={businesses.map((b) => ({ value: b.id, label: b.name, hint: b.city }))} required />
				<TextField label="Subject" value={subject} onChange={setSubject} placeholder="POS payments not showing" required />
				<TextareaField label="Details" value={body} onChange={setBody} placeholder="What the hotel said, which hotel, since when…" />
				<SelectField label="Priority" value={priority} onChange={setPriority} options={[{ value: "LOW", label: "Low" }, { value: "NORMAL", label: "Normal" }, { value: "HIGH", label: "High" }, { value: "URGENT", label: "Urgent · money or guests affected" }]} />
			</div>
		</Modal>
	);
}
