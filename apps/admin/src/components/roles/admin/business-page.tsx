"use client";

import { ArrowLeftIcon, BanIcon, ExternalLinkIcon, HandshakeIcon, PencilIcon, PlayIcon, ShieldAlertIcon } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, Timeline } from "@hospio/ui/shared/detail-list";
import { SelectField, TextareaField, TextField, ToggleField } from "@hospio/ui/shared/field";
import { fmtAgo, fmtLongDate, fmtWhen, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { BusinessRow, FeeStatementRow, HotelSummary, PlatformChangeRow, TicketRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { AdminRole, BusinessUserRow } from "@hospio/api/demo/fixtures/platform-extra";
import { cn } from "@hospio/ui/utils";
import { BuildingIcon, CoinsIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import { can, HealthBar, ReadOnlyNote, StagePill, ticketPriority, ticketStatus } from "./shared";

type Hotel = Pick<HotelSummary, "name" | "city" | "rooms" | "manager" | "occupancy">;

export function BusinessPage({ role, business, hotels, users, fees, tickets, changes }: { role: AdminRole; business: BusinessRow; hotels: Hotel[]; users: BusinessUserRow[]; fees: FeeStatementRow[]; tickets: TicketRow[]; changes: PlatformChangeRow[] }) {
	const { run, pending } = useDemoAction();
	const [stage, setStage] = useState(business.stage);
	const [action, setAction] = useQueryState("action");
	const close = () => void setAction(null);
	const editable = can.editBusiness(role);
	const tabs = [
		{ key: "overview", label: "Overview" },
		{ key: "hotels", label: "Hotels", count: hotels.length },
		{ key: "users", label: "Users", count: users.length },
		{ key: "fees", label: "Fees", count: fees.length },
		{ key: "tickets", label: "Tickets", count: tickets.filter((t) => t.status !== "RESOLVED").length },
		{ key: "changes", label: "Changes", count: changes.length },
	];
	const [tab, setTab] = useQueryState("tab");
	const current = tab ?? "overview";

	return (
		<>
			<Link href="/dashboard/businesses" className="flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink">
				<ArrowLeftIcon className="size-4" /> Hotel businesses
			</Link>
			<PageHeader title={business.name} subtitle={<span className="flex items-center gap-2">{business.ownerName} · {business.city} · since {fmtLongDate(business.since)} <StagePill stage={stage} /></span>}>
				<button type="button" onClick={() => run(`Opened ${business.name} as ${business.ownerName} · logged`, undefined, { tone: "info" })} className={cn(btn.secondary, "flex items-center gap-2")}>
					<ExternalLinkIcon className="size-4" /> View as owner
				</button>
				{editable && stage === "ONBOARDING" && (
					<button type="button" onClick={() => setAction("handover")} className={cn(btn.primary, "flex items-center gap-2")}>
						<HandshakeIcon className="size-4" /> Hand over
					</button>
				)}
				{editable && (
					<RowActions
						actions={[
							{ label: "Edit as H.M.S", icon: PencilIcon, onClick: () => setAction("edit") },
							...(stage === "SUSPENDED"
								? [{ label: "Reactivate", icon: PlayIcon, onClick: () => setAction("reactivate") }]
								: [{ label: "Suspend business", icon: BanIcon, tone: "danger" as const, separatorBefore: true, onClick: () => setAction("suspend") }]),
						]}
					/>
				)}
			</PageHeader>
			{!editable && <ReadOnlyNote>You can see everything about this business. Edits, suspensions and handover are done by Support or a Super admin.</ReadOnlyNote>}

			<PillTabs tabs={tabs} value={current} onChange={(k) => void setTab(k === "overview" ? null : k)} />

			{current === "overview" && (
				<>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						<KpiCard label="Hotels · rooms" value={`${business.hotels} · ${business.rooms}`} icon={BuildingIcon} />
						<KpiCard label="Monthly fee" value={nairaShort(business.mrr)} icon={CoinsIcon} hint={`${business.feeModel}${business.feeValue ? ` · ${business.feeModel.includes("%") ? `${business.feeValue}%` : naira(business.feeValue)}` : ""}`} />
						<KpiCard label="Adoption" value={`${business.adoption}%`} icon={TrendingUpIcon} hint="Modules in daily use" />
						<KpiCard label="Health" value={<HealthBar value={business.health} />} icon={UsersIcon} hint={business.lastActive ? `Active ${fmtAgo(business.lastActive)}` : "Never active"} />
					</div>
					<div className="grid gap-4 xl:grid-cols-2">
						<SectionCard title="Account">
							<DetailList columns={2} items={[
								{ label: "Owner", value: business.ownerName },
								{ label: "Owner email", value: business.ownerEmail },
								{ label: "Account manager", value: business.accountManager },
								{ label: "Referred by", value: business.marketer ?? "Direct" },
								{ label: "Fee model", value: business.feeModel },
								{ label: "Fees due", value: business.dueFees ? <span className="text-danger">{naira(business.dueFees)}</span> : "Nothing" },
							]} />
						</SectionCard>
						<SectionCard title="What H.M.S can change here" subtitle="Every change is logged with a reason and can be undone for 7 days">
							<ul className="list-disc space-y-1 pl-4 text-[13px] text-ink-2">
								<li>Hotel setup values (times, taxes, approval limits, room types)</li>
								<li>Users: reset passwords, pause access, fix roles</li>
								<li>Payments: re-link POS terminals, fix settlement accounts</li>
								<li>Never: guest data, folios, money already recorded</li>
							</ul>
						</SectionCard>
					</div>
				</>
			)}

			{current === "hotels" && (
				<DataTable
					data={hotels}
					columns={[
						{ accessorKey: "name", header: "Hotel", cell: ({ row }) => <TwoLine primary={row.original.name} secondary={row.original.city} /> },
						{ accessorKey: "rooms", header: "Rooms" },
						{ accessorKey: "manager", header: "Manager" },
						{ accessorKey: "occupancy", header: "Occupancy tonight", cell: ({ row }) => <span>{row.original.occupancy}%</span> },
					]}
					emptyTitle="No hotels yet"
					emptyHint="Hotels are added during onboarding."
				/>
			)}

			{current === "users" && (
				<DataTable
					data={users}
					columns={[
						{ accessorKey: "fullName", header: "User", cell: ({ row }) => <TwoLine primary={row.original.fullName} secondary={row.original.email} /> },
						{ accessorKey: "role", header: "Role", cell: ({ row }) => <span>{row.original.role === "OWNER" ? "Owner" : "Manager"}{row.original.hotel ? ` · ${row.original.hotel}` : ""}</span> },
						{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.status === "ACTIVE" ? "success" : row.original.status === "INVITED" ? "info" : "grey"}>{row.original.status.toLowerCase()}</StatusPill> },
						{ accessorKey: "lastSignIn", header: "Last sign-in", cell: ({ row }) => <span className="text-ink-3">{row.original.lastSignIn ? fmtAgo(row.original.lastSignIn) : "—"}</span> },
						{ id: "actions", header: "", cell: ({ row }) => editable ? <RowActions actions={[
							{ label: "Reset password", onClick: () => run(`Temporary password sent to ${row.original.email} · logged`) },
							{ label: "Resend invite", onClick: () => run(`Invite resent to ${row.original.email}`), disabled: row.original.status !== "INVITED" },
							{ label: row.original.status === "PAUSED" ? "Unpause access" : "Pause access", tone: "danger", separatorBefore: true, onClick: () => run(`${row.original.fullName} ${row.original.status === "PAUSED" ? "unpaused" : "paused"} · logged`) },
						]} /> : null },
					]}
				/>
			)}

			{current === "fees" && (
				<DataTable
					data={fees}
					columns={[
						{ accessorKey: "month", header: "Month" },
						{ accessorKey: "base", header: "Base", cell: ({ row }) => <span>{business.feeModel.includes("%") ? naira(row.original.base) : `${row.original.base} rooms`}</span> },
						{ accessorKey: "fee", header: "Fee", cell: ({ row }) => naira(row.original.fee) },
						{ accessorKey: "paid", header: "Paid", cell: ({ row }) => naira(row.original.paid) },
						{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.status === "PAID" ? "success" : row.original.status === "OVERDUE" ? "danger" : "warning"}>{row.original.status.toLowerCase().replace("_", " ")}</StatusPill> },
					]}
					footer={<Link href="/dashboard/fees" className="text-xs font-semibold text-brand">Fees & billing →</Link>}
					emptyTitle="No statements yet"
				/>
			)}

			{current === "tickets" && (
				<DataTable
					data={tickets}
					columns={[
						{ accessorKey: "subject", header: "Ticket", cell: ({ row }) => <TwoLine primary={`${row.original.id.replace("tk-", "T-")} · ${row.original.subject}`} secondary={`${row.original.openedBy} · ${fmtAgo(row.original.openedAt)}`} /> },
						{ accessorKey: "priority", header: "Priority", cell: ({ row }) => <StatusPill tone={ticketPriority[row.original.priority]}>{row.original.priority.toLowerCase()}</StatusPill> },
						{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={ticketStatus[row.original.status].tone}>{ticketStatus[row.original.status].label}</StatusPill> },
						{ accessorKey: "assignedTo", header: "Assigned", cell: ({ row }) => row.original.assignedTo ?? "—" },
						{ id: "open", header: "", cell: ({ row }) => <Link href={`/dashboard/support?open=${row.original.id}`} className="text-[13px] font-semibold text-brand">Open →</Link> },
					]}
					emptyTitle="No tickets"
				/>
			)}

			{current === "changes" && (
				<SectionCard title="Changes by H.M.S" subtitle="Each one carries the reason given and who made it">
					{changes.length === 0 ? <p className="py-4 text-sm text-ink-3">Nothing changed by H.M.S.</p> : (
						<Timeline items={changes.map((c) => ({ at: fmtWhen(c.at), by: c.madeBy, text: <><span className="font-semibold">{c.area}</span> · {c.description} · <span className="text-ink-3">{c.reason}</span>{c.undone ? <StatusPill tone="grey" className="ml-2">undone</StatusPill> : null}</> }))} />
					)}
				</SectionCard>
			)}

			<EditAsHmsPanel open={action === "edit"} onOpenChange={(o) => (o ? setAction("edit") : close())} business={business} />

			<ConfirmModal open={action === "suspend"} onOpenChange={(o) => (o ? setAction("suspend") : close())} tone="danger" title={`Suspend ${business.name}?`} subtitle="Every user is signed out and nobody can sign in until it is reactivated" confirmLabel="Suspend business" pending={pending}
				alternative={{ label: "Send a payment reminder instead", onClick: () => run(`Reminder sent to ${business.ownerEmail}`, close) }}
				onConfirm={() => run(`${business.name} suspended · owner emailed`, () => { setStage("SUSPENDED"); close(); })}>
				<WhatHappens tone="danger" items={["All owner, manager and staff sessions end now", "Guest data and money records stay intact and read-only for H.M.S", "POS settlements continue to the hotel's account", "The owner gets an email with the reason and how to reactivate"]} />
				<div className="mt-4"><TextareaField label="Reason (goes in the email and the log)" value="" onChange={() => undefined} placeholder="Fees overdue 90 days…" /></div>
			</ConfirmModal>

			<ConfirmModal open={action === "reactivate"} onOpenChange={(o) => (o ? setAction("reactivate") : close())} title={`Reactivate ${business.name}?`} subtitle="Users can sign in again immediately" confirmLabel="Reactivate" pending={pending}
				onConfirm={() => run(`${business.name} reactivated`, () => { setStage("LIVE"); close(); })}>
				<WhatHappens items={["Owner and managers get an email that access is back", `${plural(business.hotels, "hotel")} go back to Live`, "Outstanding fees stay on the account"]} />
			</ConfirmModal>

			<HandoverModal open={action === "handover"} onOpenChange={(o) => (o ? setAction("handover") : close())} business={business} onDone={() => { setStage("HANDED_OVER"); close(); }} />
		</>
	);
}

/** Admin — Phase 3 · Edit as H.M.S: a reason is required; the change is logged and undoable for 7 days. */
export function EditAsHmsPanel({ open, onOpenChange, business }: { open: boolean; onOpenChange: (o: boolean) => void; business: BusinessRow }) {
	const { run, pending } = useDemoAction();
	const [area, setArea] = useState("Hotel setup");
	const [hotel, setHotel] = useState("");
	const [what, setWhat] = useState("");
	const [reason, setReason] = useState("");
	const [notify, setNotify] = useState(true);
	return (
		<SidePanel open={open} onOpenChange={onOpenChange} title="Edit as H.M.S" subtitle={`${business.name} · logged in the hotel's activity log and undoable for 7 days`} icon={ShieldAlertIcon} width="md" tone="danger"
			footerInfo="The owner and managers see this change in their activity log, marked 'by H.M.S'."
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button>
					<button type="button" disabled={!what || reason.length < 8 || pending} className={btn.primary} onClick={() => run("Change saved and logged · undo available for 7 days", () => onOpenChange(false))}>Save change</button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<Note tone="info">Use this for support fixes the hotel can't do itself. A ticket number in the reason is best.</Note>
				<PanelSection title="Where">
					<SelectField label="Area" value={area} onChange={setArea} options={["Hotel setup", "Users & roles", "Payments & POS", "Rooms & prices", "Messaging / WhatsApp"]} />
					<TextField label="Hotel (optional)" value={hotel} onChange={setHotel} placeholder="All hotels" />
				</PanelSection>
				<PanelSection title="Change">
					<TextareaField label="What you are changing" value={what} onChange={setWhat} placeholder="Check-out time 12:00 → 11:00" />
					<TextareaField label="Reason" value={reason} onChange={setReason} placeholder="Ticket #4412 · owner asked" hint="At least 8 characters." error={reason.length > 0 && reason.length < 8 ? "Say a little more" : undefined} />
					<ToggleField label="Tell the owner by email" hint="Also appears in their notifications" checked={notify} onChange={setNotify} />
				</PanelSection>
			</div>
		</SidePanel>
	);
}

/** Phase 2 · Hand over: the back office is done, the owner and managers take over. */
export function HandoverModal({ open, onOpenChange, business, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; business: BusinessRow; onDone: () => void }) {
	const { run, pending } = useDemoAction();
	const [callDone, setCallDone] = useState(false);
	const [training, setTraining] = useState(true);
	return (
		<Modal open={open} onOpenChange={onOpenChange} title={`Hand over ${business.name}`} subtitle="The owner takes control and billing starts next month" icon={HandshakeIcon} size="form"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Not yet</button>
					<button type="button" disabled={!callDone || pending} className={btn.primary} onClick={() => run(`${business.name} handed over · first statement next month`, onDone)}>Hand over</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<WhatHappens items={["Stage moves to Handed over, then Live after the first full month", "The owner's 'Manager's first day' guide is emailed", `Fees start: ${business.feeModel}`, "H.M.S keeps support access with the 7-day undo on every change"]} />
				<ToggleField label="Handover call done with the owner" checked={callDone} onChange={setCallDone} />
				<ToggleField label="Managers trained on tablets" checked={training} onChange={setTraining} />
			</div>
		</Modal>
	);
}
