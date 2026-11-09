"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	AlertTriangleIcon,
	HeadsetIcon,
	LockIcon,
	PlusIcon,
	RotateCcwIcon,
	SendIcon,
	XIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import {
	assignTicket,
	commentTicket,
	dismissAlert,
	loadBusinessHotels,
	loadTicket,
	openTicketForBusiness,
	reopenTicket,
	resolveTicket,
	setTicketPriority,
} from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	AlertRow,
	Paged,
	TeamMemberRow,
	TicketItem,
	TicketPriority,
} from "@hospio/api/data/admin-types";
import type { BusinessRow } from "@hospio/api/data/types";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import {
	SelectField,
	TextareaField,
	TextField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtAgo, fmtWhen } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	Loading,
	ServerPager,
	useFilterParam,
	useLoaded,
	usePageParam,
	useRefresh,
} from "./live";
import { ticketPriority, ticketStatus } from "./shared";

const shortId = (id: string) =>
	`T-${id.replace(/^tk-/, "").slice(0, 6).toUpperCase()}`;
const PRIORITIES: { value: TicketPriority; label: string }[] = [
	{ value: "LOW", label: "Low" },
	{ value: "NORMAL", label: "Normal" },
	{ value: "HIGH", label: "High" },
	{ value: "URGENT", label: "Urgent · money or guests affected" },
];

/**
 * Admin — G1 · Support & alerts, G2 · Ticket: tickets paged and filtered on the server
 * (GET /platform/admin/support/tickets), alerts from GET /platform/admin/alerts; the panel loads the
 * ticket with its comments and every action writes to platform-service.
 */
export function SupportScreen({
	tickets,
	alerts: initialAlerts,
	businesses,
	admins,
	currentUserName,
}: {
	tickets: Paged<TicketItem>;
	alerts: AlertRow[];
	businesses: BusinessRow[];
	admins: TeamMemberRow[];
	currentUserName: string;
}) {
	const [tab, setTab] = useFilterParam("status");
	const [priority, setPriority] = useFilterParam("priority");
	const [biz, setBiz] = useFilterParam("businessId");
	const [assignee, setAssignee] = useFilterParam("assignedTo");
	const [q, setQ] = useFilterParam("q");
	const [, setPage] = usePageParam();
	const [open, setOpen] = useQueryState("open");
	const [isNew, setNew] = useQueryState("new");
	const [alerts, setAlerts] = useState(initialAlerts);
	const [search, setSearch] = useState(q);
	const { run, pending } = useAction();
	const { refresh } = useRefresh();
	const active = tab || "OPEN";
	useEffect(() => {
		const t = window.setTimeout(() => {
			if (search !== q) {
				setQ(search);
				setPage(0);
			}
		}, 400);
		return () => window.clearTimeout(t);
	}, [search, q, setQ, setPage]);

	const columns: ColumnDef<TicketItem, unknown>[] = [
		{
			accessorKey: "subject",
			header: "Ticket",
			cell: ({ row }) => (
				<TwoLine
					primary={`${shortId(row.original.id)} · ${row.original.subject}`}
					secondary={`${row.original.businessName} · ${row.original.openedByName}`}
				/>
			),
		},
		{
			accessorKey: "priority",
			header: "Priority",
			cell: ({ row }) => (
				<StatusPill tone={ticketPriority[row.original.priority]}>
					{row.original.priority.toLowerCase()}
				</StatusPill>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={ticketStatus[row.original.status].tone}>
					{ticketStatus[row.original.status].label}
				</StatusPill>
			),
		},
		{
			accessorKey: "assignedToName",
			header: "Assigned",
			cell: ({ row }) =>
				row.original.assignedToName ?? (
					<span className="text-ink-3">Unassigned</span>
				),
		},
		{
			accessorKey: "lastActivityAt",
			header: "Last activity",
			cell: ({ row }) => (
				<span className="text-ink-3">
					{fmtAgo(row.original.lastActivityAt ?? row.original.openedAt)}
				</span>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Support & alerts"
				subtitle="Problems hotels told us about, and problems the system found"
			>
				<button
					type="button"
					onClick={() => setNew("1")}
					className={cn(btn.primary, "flex items-center gap-2")}
				>
					<PlusIcon className="size-4" /> New ticket
				</button>
			</PageHeader>

			<div className="grid gap-4 xl:grid-cols-[380px_1fr]">
				<SectionCard
					title="System alerts"
					count={alerts.length}
					bodyClassName="pt-1"
				>
					{alerts.length === 0 && (
						<p className="py-3 text-sm text-ink-3">
							Nothing open. Alerts clear themselves when the cause ends.
						</p>
					)}
					{alerts.map((a, i) => (
						<div
							key={a.id}
							className={cn(
								"flex items-start gap-2 py-[10px]",
								i < alerts.length - 1 && "border-b border-line",
							)}
						>
							<AlertTriangleIcon
								className={cn(
									"mt-[2px] size-4 shrink-0",
									a.tone === "danger"
										? "text-danger"
										: a.tone === "warning"
											? "text-warning"
											: "text-ink-3",
								)}
							/>
							<div className="min-w-0 flex-1">
								<p className="text-[13px] font-semibold text-ink">
									{a.businessName} · {a.title}
								</p>
								<p className="text-xs text-ink-3">
									{a.detail}
									{a.detail ? " · " : ""}
									{fmtAgo(a.at)}
								</p>
							</div>
							<button
								type="button"
								onClick={() =>
									void setNew(
										a.businessId
											? `biz:${a.businessId}:${encodeURIComponent(a.title)}`
											: "1",
									)
								}
								className="text-xs font-semibold text-brand hover:underline"
							>
								Ticket
							</button>
							<button
								type="button"
								disabled={pending}
								onClick={() =>
									run(
										() => dismissAlert(a.id, a),
										"Alert dismissed",
										() => setAlerts((all) => all.filter((x) => x.id !== a.id)),
									)
								}
								className="text-ink-3 hover:text-ink"
								aria-label="Dismiss"
							>
								<XIcon className="size-4" />
							</button>
						</div>
					))}
				</SectionCard>

				<div className="flex flex-col gap-3">
					<Toolbar
						left={
							<PillTabs
								tabs={[
									{ key: "OPEN", label: "Waiting on us" },
									{ key: "IN_PROGRESS", label: "In progress" },
									{ key: "RESOLVED", label: "Resolved" },
									{ key: "ALL", label: "All" },
								]}
								value={active}
								onChange={(k) => {
									setTab(k === "OPEN" ? null : k);
									setPage(0);
								}}
							/>
						}
						right={
							<>
								<FilterSelect
									value={priority}
									onChange={(v) => {
										setPriority(v);
										setPage(0);
									}}
									all="Any priority"
									options={PRIORITIES.map((p) => ({
										value: p.value,
										label: p.label.split(" ·")[0],
									}))}
								/>
								<FilterSelect
									value={biz}
									onChange={(v) => {
										setBiz(v);
										setPage(0);
									}}
									all="All businesses"
									options={businesses.map((b) => ({
										value: b.id,
										label: b.name,
									}))}
								/>
								<FilterSelect
									value={assignee}
									onChange={(v) => {
										setAssignee(v);
										setPage(0);
									}}
									all="Anyone"
									options={admins.map((a) => ({
										value: a.userId,
										label: a.fullName,
									}))}
								/>
								<SearchBox
									value={search}
									onChange={setSearch}
									placeholder="Search tickets…"
								/>
							</>
						}
					/>
					<DataTable
						columns={columns}
						data={tickets.content}
						pageSize={tickets.size}
						onRowClick={(t) => setOpen(t.id)}
						emptyTitle="No tickets"
						footer={<ServerPager page={tickets} onPage={setPage} />}
					/>
				</div>
			</div>

			<TicketPanel
				id={open}
				admins={admins}
				currentUserName={currentUserName}
				onClose={() => void setOpen(null)}
				onChanged={refresh}
			/>
			<NewTicketModal
				open={!!isNew}
				preset={isNew}
				onOpenChange={(o) => void setNew(o ? "1" : null)}
				businesses={businesses}
				onCreated={(t) => {
					void setNew(null);
					refresh();
					void setOpen(t.id);
				}}
			/>
		</>
	);
}

function TicketPanel({
	id,
	admins,
	currentUserName,
	onClose,
	onChanged,
}: {
	id: string | null;
	admins: TeamMemberRow[];
	currentUserName: string;
	onClose: () => void;
	onChanged: () => void;
}) {
	const { data, setData, loading, error } = useLoaded(id, loadTicket);
	const { run, pending } = useAction();
	const [reply, setReply] = useState("");
	const [internal, setInternal] = useState(false);
	const [resolution, setResolution] = useState("");
	const ticket = data?.ticket ?? null;
	const patch = (t: TicketItem) => {
		setData(data ? { ...data, ticket: t } : { ticket: t, comments: [] });
		onChanged();
	};
	const st = ticket ? ticketStatus[ticket.status] : null;
	return (
		<SidePanel
			open={!!id}
			onOpenChange={(o) => !o && onClose()}
			title={ticket ? `${shortId(ticket.id)} · ${ticket.subject}` : "Ticket"}
			subtitle={
				ticket && st ? (
					<span className="flex items-center gap-2">
						{ticket.businessName} · {ticket.openedByName} ·{" "}
						{fmtWhen(ticket.openedAt)}{" "}
						<StatusPill tone={st.tone}>{st.label}</StatusPill>
					</span>
				) : undefined
			}
			icon={HeadsetIcon}
			width="lg"
			footerInfo={
				ticket?.status === "RESOLVED"
					? `Resolved${ticket.resolvedAt ? ` ${fmtWhen(ticket.resolvedAt)}` : ""}: ${ticket.resolution ?? ""}`
					: "Replies go to the person who opened the ticket; internal notes stay inside H.M.S."
			}
			footer={
				ticket ? (
					ticket.status !== "RESOLVED" ? (
						<>
							<button
								type="button"
								className={cn(btn.secondary, "flex items-center gap-2")}
								disabled={!reply || pending}
								onClick={() =>
									run(
										() =>
											withDeliveries(
												commentTicket(
													ticket.id,
													{ body: reply, internal },
													currentUserName,
												),
												`Reply on ${shortId(ticket.id)}`,
											),
										internal ? "Note added" : "Reply sent",
										(r) => {
											setData(
												data
													? { ...data, comments: [...data.comments, r.comment] }
													: null,
											);
											setReply("");
											onChanged();
										},
									)
								}
							>
								<SendIcon className="size-4" />{" "}
								{internal ? "Add note" : "Send reply"}
							</button>
							<button
								type="button"
								className={btn.primary}
								disabled={!resolution || pending}
								onClick={() =>
									run(
										() =>
											withDeliveries(
												resolveTicket(ticket.id, resolution, ticket),
												`${shortId(ticket.id)} resolved`,
											),
										`${shortId(ticket.id)} resolved`,
										(r) => {
											patch(r.ticket);
											setResolution("");
										},
									)
								}
							>
								Resolve
							</button>
						</>
					) : (
						<button
							type="button"
							className={cn(btn.secondary, "flex items-center gap-2")}
							disabled={pending}
							onClick={() =>
								run(
									() => reopenTicket(ticket.id, ticket),
									`${shortId(ticket.id)} reopened`,
									patch,
								)
							}
						>
							<RotateCcwIcon className="size-4" /> Reopen
						</button>
					)
				) : undefined
			}
		>
			{loading && <Loading />}
			{error && <Note tone="danger">{error}</Note>}
			{ticket && data && (
				<div className="flex flex-col gap-5">
					<div className="grid grid-cols-2 gap-3">
						<SelectField
							label="Priority"
							value={ticket.priority}
							onChange={(v) =>
								run(
									() =>
										setTicketPriority(ticket.id, v as TicketPriority, ticket),
									"Priority changed",
									patch,
								)
							}
							options={PRIORITIES}
							disabled={ticket.status === "RESOLVED" || pending}
						/>
						<SelectField
							label="Assigned to"
							value={ticket.assignedTo ?? ""}
							onChange={(v) =>
								run(
									() =>
										assignTicket(
											ticket.id,
											v,
											ticket,
											admins.find((a) => a.userId === v)?.fullName,
										),
									"Ticket assigned",
									patch,
								)
							}
							placeholder="Unassigned"
							options={admins
								.filter((a) => a.status === "ACTIVE")
								.map((a) => ({
									value: a.userId,
									label: a.fullName,
									hint: a.role.toLowerCase().replace("_", " "),
								}))}
							disabled={ticket.status === "RESOLVED" || pending}
						/>
					</div>
					<DetailList
						columns={2}
						items={[
							{ label: "Business", value: ticket.businessName },
							{ label: "Opened by", value: ticket.openedByName },
						]}
					/>
					<PanelSection title="What they said">
						<p className="whitespace-pre-wrap rounded-xl bg-subtle px-4 py-3 text-[13px] text-ink">
							{ticket.body || "—"}
						</p>
					</PanelSection>
					<PanelSection title={`Conversation · ${data.comments.length}`}>
						{data.comments.length === 0 ? (
							<p className="text-sm text-ink-3">No replies yet.</p>
						) : (
							<ol className="flex flex-col gap-2">
								{data.comments.map((c) => (
									<li
										key={c.id}
										className={cn(
											"rounded-xl px-4 py-3",
											c.internal
												? "border border-dashed border-warning/50 bg-warning-soft/40"
												: "bg-brand-soft/40",
										)}
									>
										<p className="flex items-center gap-2 text-xs text-ink-3">
											<span className="font-semibold text-ink">
												{c.authorName}
											</span>{" "}
											· {fmtWhen(c.createdAt)}
											{c.internal && (
												<StatusPill
													tone="warning"
													dot={false}
													className="gap-1"
												>
													<LockIcon className="size-3" /> internal
												</StatusPill>
											)}
										</p>
										<p className="mt-1 whitespace-pre-wrap text-[13px] text-ink">
											{c.body}
										</p>
									</li>
								))}
							</ol>
						)}
					</PanelSection>
					{ticket.status !== "RESOLVED" && (
						<>
							<PanelSection title="Reply">
								<TextareaField
									label={internal ? "Internal note" : "Message to the hotel"}
									value={reply}
									onChange={setReply}
									placeholder={
										internal
											? "For the team only…"
											: "Hi, we've re-linked the bar terminal…"
									}
								/>
								<ToggleField
									label="Internal note"
									hint="Stays inside H.M.S; the hotel does not see it"
									checked={internal}
									onChange={setInternal}
								/>
							</PanelSection>
							<PanelSection title="Resolve">
								<TextareaField
									label="What fixed it"
									value={resolution}
									onChange={setResolution}
									placeholder="Re-linked MP-0091 · payments now showing"
									rows={2}
								/>
							</PanelSection>
						</>
					)}
				</div>
			)}
		</SidePanel>
	);
}

function NewTicketModal({
	open,
	preset,
	onOpenChange,
	businesses,
	onCreated,
}: {
	open: boolean;
	preset: string | null;
	onOpenChange: (o: boolean) => void;
	businesses: BusinessRow[];
	onCreated: (t: TicketItem) => void;
}) {
	const { run, pending } = useAction();
	const [business, setBusiness] = useState("");
	const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);
	const [hotelId, setHotelId] = useState("");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [priority, setPriority] = useState<TicketPriority>("NORMAL");
	useEffect(() => {
		if (!open || !preset || !preset.startsWith("biz:")) return;
		const [, bizId, title] = preset.split(":");
		if (bizId) setBusiness(bizId);
		if (title) setSubject(decodeURIComponent(title));
	}, [open, preset]);
	useEffect(() => {
		setHotelId("");
		setHotels([]);
		if (!business) return;
		loadBusinessHotels(business).then((r) => r.ok && setHotels(r.data));
	}, [business]);
	const reset = () => {
		setBusiness("");
		setHotelId("");
		setSubject("");
		setBody("");
		setPriority("NORMAL");
	};
	return (
		<Modal
			open={open}
			onOpenChange={(o) => {
				if (!o) reset();
				onOpenChange(o);
			}}
			title="New ticket"
			subtitle="Log something a hotel told you on the phone or WhatsApp"
			icon={HeadsetIcon}
			size="form"
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!business || !subject || pending}
						onClick={() =>
							run(
								() =>
									openTicketForBusiness(
										{
											businessId: business,
											hotelId: hotelId || undefined,
											subject,
											body: body || undefined,
											priority,
										},
										businesses.find((b) => b.id === business)?.name,
									),
								"Ticket created",
								(t) => {
									reset();
									onCreated(t);
								},
							)
						}
					>
						Create ticket
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Business"
					value={business}
					onChange={setBusiness}
					options={businesses.map((b) => ({
						value: b.id,
						label: b.name,
						hint: b.city,
					}))}
					required
				/>
				{hotels.length > 0 && (
					<SelectField
						label="Hotel (optional)"
						value={hotelId}
						onChange={setHotelId}
						placeholder="Whole business"
						options={hotels.map((h) => ({ value: h.id, label: h.name }))}
					/>
				)}
				<TextField
					label="Subject"
					value={subject}
					onChange={setSubject}
					placeholder="POS payments not showing"
					required
				/>
				<TextareaField
					label="Details"
					value={body}
					onChange={setBody}
					placeholder="What the hotel said, which hotel, since when…"
				/>
				<SelectField
					label="Priority"
					value={priority}
					onChange={(v) => setPriority(v as TicketPriority)}
					options={PRIORITIES}
				/>
			</div>
		</Modal>
	);
}
