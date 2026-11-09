"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	AlertTriangleIcon,
	BanIcon,
	CameraIcon,
	CheckIcon,
	DoorClosedIcon,
	DoorOpenIcon,
	MessageSquarePlusIcon,
	PauseIcon,
	PlayIcon,
	PlusIcon,
	RotateCcwIcon,
	UserRoundIcon,
	WrenchIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, Timeline } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	MoneyField,
	SelectField,
	TextField,
	TextareaField,
} from "@hospio/ui/shared/field";
import { fmtAgo, fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import {
	addWorkOrderUpdate,
	assignWorkOrder,
	completeWorkOrder,
	raiseWorkOrder,
	takeRoomOutOfOrder,
	uploadWorkOrderPhoto,
	workOrderStep,
	workOrderWithReason,
} from "@hospio/api/actions/maintenance";
import { useAction } from "@hospio/api/actions/use-action";
import type { StockItemRow, WorkOrderRow } from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { BigButton, BoardCard, Stepper } from "../shared-staff/tablet";

export const CATEGORIES = [
	"PLUMBING",
	"ELECTRICAL",
	"AC",
	"CARPENTRY",
	"APPLIANCE",
	"PAINTING",
	"CLEANING_EQUIPMENT",
	"IT",
	"OTHER",
] as const;
export const categoryLabel = (c: string) =>
	c === "AC"
		? "AC / cooling"
		: c === "IT"
			? "IT / TV / Wi-Fi"
			: c.charAt(0) + c.slice(1).toLowerCase().replace("_", " ");
export const priorityTone = {
	URGENT: "danger",
	HIGH: "warning",
	NORMAL: "info",
	LOW: "grey",
} as const;
export const priorityLabel = {
	URGENT: "Urgent",
	HIGH: "High",
	NORMAL: "Normal",
	LOW: "Low",
} as const;
export const statusInfo: Record<
	WorkOrderRow["status"],
	{ label: string; tone: "grey" | "info" | "warning" | "success" | "danger" }
> = {
	OPEN: { label: "Open", tone: "grey" },
	ASSIGNED: { label: "Assigned", tone: "grey" },
	IN_PROGRESS: { label: "In progress", tone: "info" },
	ON_HOLD: { label: "On hold", tone: "warning" },
	DONE: { label: "Done", tone: "success" },
	CANCELLED: { label: "Cancelled", tone: "grey" },
};
const isOpen = (w: WorkOrderRow) =>
	w.status !== "DONE" && w.status !== "CANCELLED";
const minutes = (m?: number) =>
	m == null
		? "—"
		: m < 60
			? `${m} min`
			: `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}`.trim();
const lagosToday = () =>
	new Date(Date.now() + 3600_000).toISOString().slice(0, 10);

export type Person = { id: string; name: string };
type Mode = "maintenance" | "manager" | "desk";
type Sub =
	| "raise"
	| "assign"
	| "hold"
	| "complete"
	| "reopen"
	| "cancel"
	| "ooo"
	| "update"
	| "photo"
	| null;

/**
 * Work orders (Maintenance 1.x "My repairs", Manager · Tasks, and the desk's / housekeeping's Repairs): the list with
 * overdue first, the detail with every step the caller may take, raising a new one, and the room out of order.
 * `mode` decides the tabs and the layout; the service decides what each person may do and says so when it refuses.
 */
export function WorkOrdersScreen({
	rows: initial,
	me,
	mode,
	supervisor,
	technicians,
	rooms,
	parts = [],
	title,
	subtitle,
}: {
	rows: WorkOrderRow[];
	me: Person;
	mode: Mode;
	/** Maintenance Full or a manager: may assign others, cancel at any stage. */
	supervisor: boolean;
	technicians: Person[];
	rooms: { id: string; number: string }[];
	/** Maintenance store items, for parts used on completion. */
	parts?: StockItemRow[];
	title: string;
	subtitle?: string;
}) {
	const [rows, setRows] = useState(initial);
	useEffect(() => setRows(initial), [initial]);
	const [openId, setOpenId] = useQueryState("open");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [sub, setSub] = useState<Sub>(null);
	const { run, pending } = useAction();

	const current = rows.find((r) => r.id === openId) ?? null;
	const open = rows.filter(isOpen);
	const mine = open.filter((r) => r.assignedTo === me.id);
	const overdue = open.filter((r) => r.overdue);
	const held = open.filter((r) => r.status === "ON_HOLD");
	const unassigned = open.filter((r) => !r.assignedTo);
	const done = rows.filter((r) => !isOpen(r));
	const tabs =
		mode === "maintenance"
			? [
					{ key: "mine", label: "Mine", count: mine.length },
					{ key: "open", label: "All open", count: open.length },
					{ key: "overdue", label: "Overdue", count: overdue.length },
					{ key: "held", label: "On hold", count: held.length },
					{ key: "done", label: "Done", count: done.length },
				]
			: mode === "manager"
				? [
						{ key: "open", label: "Open", count: open.length },
						{ key: "overdue", label: "Overdue", count: overdue.length },
						{
							key: "unassigned",
							label: "Unassigned",
							count: unassigned.length,
						},
						{ key: "held", label: "On hold", count: held.length },
						{ key: "done", label: "Done", count: done.length },
					]
				: [
						{ key: "open", label: "Open", count: open.length },
						{
							key: "mine",
							label: "Raised by me",
							count: open.filter((r) => r.reportedBy === me.id).length,
						},
						{ key: "done", label: "Done", count: done.length },
					];
	const active = tabs.some((t) => t.key === tab)
		? (tab as string)
		: tabs[0].key;
	const list = useMemo(() => {
		const base =
			active === "mine"
				? mode === "desk"
					? open.filter((r) => r.reportedBy === me.id)
					: mine
				: active === "overdue"
					? overdue
					: active === "held"
						? held
						: active === "unassigned"
							? unassigned
							: active === "done"
								? done
								: open;
		const q = search.trim().toLowerCase();
		return q
			? base.filter((r) =>
					[
						r.number,
						r.title,
						r.where,
						r.assignedToName,
						r.reportedByName,
						categoryLabel(r.category),
					]
						.filter(Boolean)
						.some((v) => String(v).toLowerCase().includes(q)),
				)
			: base;
	}, [
		active,
		mode,
		open,
		mine,
		overdue,
		held,
		unassigned,
		done,
		search,
		me.id,
	]);

	const patch = (w: WorkOrderRow) =>
		setRows((rs) =>
			rs.some((r) => r.id === w.id)
				? rs.map((r) => (r.id === w.id ? w : r))
				: [w, ...rs],
		);
	const done$ = (w: WorkOrderRow) => {
		patch(w);
		setSub(null);
	};

	const canRun = (w: WorkOrderRow) =>
		supervisor || (mode === "maintenance" && w.assignedTo === me.id);
	const canTake = (w: WorkOrderRow) => mode === "maintenance" && !w.assignedTo;
	const canCancel = (w: WorkOrderRow) =>
		isOpen(w) &&
		(supervisor ||
			(w.reportedBy === me.id &&
				(w.status === "OPEN" || w.status === "ASSIGNED")));
	const canReopen = (w: WorkOrderRow) =>
		w.status === "DONE" && (mode === "manager" || w.reportedBy === me.id);
	const canOoo = (w: WorkOrderRow) =>
		isOpen(w) && !!w.roomId && mode !== "desk";

	const columns: ColumnDef<WorkOrderRow, unknown>[] = [
		{
			id: "wo",
			header: "Work order",
			cell: ({ row: { original: r } }) => (
				<TwoLine
					primary={r.title}
					secondary={`${r.number} · ${categoryLabel(r.category)}`}
				/>
			),
		},
		{
			id: "where",
			header: "Where",
			cell: ({ row: { original: r } }) => r.where,
		},
		{
			id: "priority",
			header: "Priority",
			cell: ({ row: { original: r } }) => (
				<StatusPill tone={priorityTone[r.priority]} dot={false}>
					{priorityLabel[r.priority]}
				</StatusPill>
			),
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row: { original: r } }) => (
				<span className="flex flex-wrap items-center gap-1">
					<StatusPill tone={statusInfo[r.status].tone}>
						{statusInfo[r.status].label}
					</StatusPill>
					{r.overdue && <StatusPill tone="danger">Overdue</StatusPill>}
					{r.roomOutOfOrder && (
						<StatusPill tone="danger" dot={false}>
							Out of order
						</StatusPill>
					)}
				</span>
			),
		},
		{
			id: "who",
			header: "Assigned",
			cell: ({ row: { original: r } }) =>
				r.assignedToName ?? <span className="text-ink-3">Nobody yet</span>,
		},
		{
			id: "due",
			header: active === "done" ? "Finished" : "Due",
			cell: ({ row: { original: r } }) =>
				active === "done" ? (
					fmtWhen(r.doneAt ?? r.createdAt)
				) : r.dueAt ? (
					<span className={cn(r.overdue && "font-semibold text-danger")}>
						{fmtWhen(r.dueAt)}
					</span>
				) : (
					"—"
				),
		},
		{
			id: "cost",
			header: "Cost",
			cell: ({ row: { original: r } }) =>
				r.totalCost ? naira(r.totalCost) : "—",
		},
	];

	return (
		<>
			<PageHeader
				title={title}
				subtitle={
					subtitle ??
					`${plural(open.length, "open work order")} · ${overdue.length} overdue · ${open.filter((r) => r.priority === "URGENT").length} urgent`
				}
			>
				<BigButton onClick={() => setSub("raise")}>
					<PlusIcon className="size-5" /> Report a fault
				</BigButton>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{mode === "maintenance" ? (
					<KpiCard label="On me" value={mine.length} icon={WrenchIcon} />
				) : (
					<KpiCard label="Open" value={open.length} icon={WrenchIcon} />
				)}
				<KpiCard
					label="Overdue"
					value={overdue.length}
					icon={AlertTriangleIcon}
					hint="Past their due time"
				/>
				<KpiCard label="On hold" value={held.length} icon={PauseIcon} />
				<KpiCard
					label="Rooms out of order"
					value={open.filter((r) => r.roomOutOfOrder).length}
					icon={DoorClosedIcon}
					hint={
						open
							.filter((r) => r.roomOutOfOrder)
							.map((r) => r.roomNumber)
							.join(", ") || "None"
					}
				/>
			</div>
			<PillTabs
				tabs={tabs}
				value={active}
				onChange={(k) => void setTab(k === tabs[0].key ? null : k)}
			/>
			{mode === "maintenance" ? (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
					{list.length === 0 && (
						<Note tone="success" className="col-span-full">
							Nothing here.
						</Note>
					)}
					{list.map((r) => (
						<BoardCard
							key={r.id}
							onClick={() => void setOpenId(r.id)}
							accent={r.overdue || r.priority === "URGENT" ? "warning" : "none"}
						>
							<div className="flex items-center justify-between gap-2">
								<span className="text-[15px] font-bold text-ink">
									{r.where}
								</span>
								<StatusPill tone={priorityTone[r.priority]} dot={false}>
									{priorityLabel[r.priority]}
								</StatusPill>
							</div>
							<p className="text-[15px] font-medium text-ink">{r.title}</p>
							<p className="text-[13px] text-ink-3">
								{r.number} · {r.reportedByName} · {fmtAgo(r.createdAt)} ·{" "}
								{r.assignedTo
									? r.assignedTo === me.id
										? "you"
										: r.assignedToName
									: "unassigned"}
							</p>
							<div className="flex flex-wrap items-center gap-1">
								<StatusPill tone={statusInfo[r.status].tone}>
									{statusInfo[r.status].label}
								</StatusPill>
								{r.overdue && <StatusPill tone="danger">Overdue</StatusPill>}
								{r.roomOutOfOrder && (
									<span className="text-xs font-semibold text-danger">
										Room out of order
									</span>
								)}
							</div>
						</BoardCard>
					))}
				</div>
			) : (
				<>
					<Toolbar
						left={
							<SearchBox
								value={search}
								onChange={setSearch}
								placeholder="Search number, title, room, person"
							/>
						}
					/>
					<DataTable
						columns={columns}
						data={list}
						onRowClick={(r) => void setOpenId(r.id)}
						emptyTitle={
							active === "done" ? "Nothing finished yet" : "No work orders here"
						}
						rowClassName={(r) => (r.overdue ? "bg-danger-soft/30" : undefined)}
					/>
				</>
			)}

			<SidePanel
				open={!!current && sub === null}
				onOpenChange={(o) => {
					if (!o) void setOpenId(null);
				}}
				title={current ? `${current.number} · ${current.title}` : ""}
				subtitle={
					current
						? `${current.where} · raised by ${current.reportedByName} · ${fmtWhen(current.createdAt)}`
						: undefined
				}
				icon={WrenchIcon}
				width="lg"
				footer={current ? <Footer w={current} /> : undefined}
			>
				{current && (
					<div className="flex flex-col gap-5">
						{current.roomOutOfOrder && (
							<Note tone="danger">
								Room {current.roomNumber} is out of order
								{current.oooUntil ? ` until ${current.oooUntil}` : ""} until
								this work order is done. The front desk can't sell or give it
								out.
							</Note>
						)}
						{current.overdue && (
							<Note tone="danger">
								Overdue · it was due {fmtWhen(current.dueAt)}.
							</Note>
						)}
						{current.status === "ON_HOLD" && current.holdReason && (
							<Note tone="warning">On hold: {current.holdReason}</Note>
						)}
						{current.reopenReason && current.status !== "DONE" && (
							<Note tone="warning">Reopened: {current.reopenReason}</Note>
						)}
						{current.cancelReason && current.status === "CANCELLED" && (
							<Note tone="info">Cancelled: {current.cancelReason}</Note>
						)}
						<DetailList
							columns={2}
							items={[
								{
									label: "Status",
									value: (
										<StatusPill tone={statusInfo[current.status].tone}>
											{statusInfo[current.status].label}
										</StatusPill>
									),
								},
								{
									label: "Priority",
									value: (
										<StatusPill
											tone={priorityTone[current.priority]}
											dot={false}
										>
											{priorityLabel[current.priority]}
										</StatusPill>
									),
								},
								{ label: "Category", value: categoryLabel(current.category) },
								{
									label: "Where",
									value: current.assetName
										? `${current.where} · ${current.assetName}`
										: current.where,
								},
								{
									label: "Assigned to",
									value: current.assignedToName ?? "Nobody yet",
								},
								{
									label: "Due",
									value: current.dueAt ? fmtWhen(current.dueAt) : "—",
								},
								{
									label: "Raised by",
									value: `${current.reportedByName}${current.reportedByRole ? ` · ${roleName(current.reportedByRole)}` : ""}`,
								},
								{
									label: "Started",
									value: current.startedAt
										? fmtWhen(current.startedAt)
										: "Not yet",
								},
							]}
						/>
						{current.description && (
							<p className="rounded-control bg-subtle px-4 py-3 text-[15px] text-ink">
								{current.description}
							</p>
						)}
						{current.hasPhoto && (
							<PanelSection title="Photo">
								{/* biome-ignore lint/performance/noImgElement: served by the app's own photo route */}
								<img
									src={`/api/work-orders/${current.id}/photo`}
									alt={`What was reported on ${current.number}`}
									className="max-h-72 rounded-control border border-line object-contain"
								/>
							</PanelSection>
						)}
						{current.status === "DONE" && (
							<PanelSection title="Done">
								<p className="text-[15px] text-ink">{current.completionNote}</p>
								<DetailList
									columns={2}
									items={[
										{ label: "Finished", value: fmtWhen(current.doneAt) },
										{ label: "Labour", value: minutes(current.labourMinutes) },
										{ label: "Parts", value: naira(current.partsCost) },
										{
											label: "Vendor",
											value: current.vendorName
												? `${current.vendorName} · ${naira(current.vendorCost)}`
												: "—",
										},
										{
											label: "Total cost",
											value: <strong>{naira(current.totalCost)}</strong>,
										},
									]}
								/>
							</PanelSection>
						)}
						{current.parts.length > 0 && (
							<PanelSection title="Parts from the Maintenance store">
								<ul className="divide-y divide-line rounded-control border border-line">
									{current.parts.map((p, i) => (
										<li
											key={`${p.itemId}-${i}`}
											className="flex items-center justify-between px-4 py-2 text-[13px]"
										>
											<span className="text-ink">
												{p.quantity} {p.unit} {p.name}
											</span>
											<span className="text-ink-2">{naira(p.value)}</span>
										</li>
									))}
								</ul>
							</PanelSection>
						)}
						<PanelSection title="Updates">
							{current.updates.length === 0 ? (
								<p className="text-[13px] text-ink-3">No updates yet.</p>
							) : (
								<Timeline
									items={[...current.updates].reverse().map((u) => ({
										at: fmtWhen(u.at),
										by: u.by,
										text: u.note,
									}))}
								/>
							)}
							{isOpen(current) && (
								<div className="flex flex-wrap gap-2">
									<BigButton tone="secondary" onClick={() => setSub("update")}>
										<MessageSquarePlusIcon className="size-5" /> Add an update
									</BigButton>
									<BigButton tone="secondary" onClick={() => setSub("photo")}>
										<CameraIcon className="size-5" />{" "}
										{current.hasPhoto ? "Replace photo" : "Add a photo"}
									</BigButton>
								</div>
							)}
						</PanelSection>
						{canOoo(current) && (
							<PanelSection title="Room">
								{current.roomOutOfOrder ? (
									<BigButton
										tone="secondary"
										pending={pending}
										onClick={() =>
											run(
												() => workOrderStep(current.id, "back-in-service"),
												`Room ${current.roomNumber} back in service · housekeeping will clean it`,
												patch,
											)
										}
									>
										<DoorOpenIcon className="size-5" /> Put room{" "}
										{current.roomNumber} back in service
									</BigButton>
								) : (
									<BigButton tone="dangerSoft" onClick={() => setSub("ooo")}>
										<DoorClosedIcon className="size-5" /> Take room{" "}
										{current.roomNumber} out of order
									</BigButton>
								)}
							</PanelSection>
						)}
					</div>
				)}
			</SidePanel>

			{current && (
				<>
					<AssignModal
						open={sub === "assign"}
						onClose={() => setSub(null)}
						w={current}
						me={me}
						supervisor={supervisor}
						technicians={technicians}
						onDone={done$}
					/>
					<ReasonModal
						open={sub === "hold" || sub === "reopen" || sub === "cancel"}
						kind={
							sub === "hold" ? "hold" : sub === "reopen" ? "reopen" : "cancel"
						}
						w={current}
						onClose={() => setSub(null)}
						onDone={done$}
					/>
					<CompleteModal
						open={sub === "complete"}
						w={current}
						parts={parts}
						onClose={() => setSub(null)}
						onDone={done$}
					/>
					<OooModal
						open={sub === "ooo"}
						w={current}
						onClose={() => setSub(null)}
						onDone={done$}
					/>
					<UpdateModal
						open={sub === "update"}
						w={current}
						onClose={() => setSub(null)}
						onDone={done$}
					/>
					<PhotoModal
						open={sub === "photo"}
						w={current}
						onClose={() => setSub(null)}
						onDone={done$}
					/>
				</>
			)}
			<RaiseModal
				open={sub === "raise"}
				onClose={() => setSub(null)}
				rooms={rooms}
				technicians={technicians}
				supervisor={supervisor}
				onDone={(w) => {
					patch(w);
					setSub(null);
				}}
			/>
		</>
	);

	function Footer({ w }: { w: WorkOrderRow }) {
		if (!isOpen(w)) {
			return (
				<>
					{canReopen(w) && (
						<BigButton tone="secondary" onClick={() => setSub("reopen")}>
							<RotateCcwIcon className="size-5" /> Reopen
						</BigButton>
					)}
					<BigButton tone="secondary" onClick={() => void setOpenId(null)}>
						Close
					</BigButton>
				</>
			);
		}
		const run$ = canRun(w) || canTake(w);
		return (
			<>
				{canCancel(w) && (
					<BigButton tone="ghost" onClick={() => setSub("cancel")}>
						<BanIcon className="size-5" /> Cancel
					</BigButton>
				)}
				{(supervisor || canTake(w)) && w.status !== "IN_PROGRESS" && (
					<BigButton tone="secondary" onClick={() => setSub("assign")}>
						<UserRoundIcon className="size-5" />{" "}
						{w.assignedTo ? "Reassign" : supervisor ? "Assign" : "Take it"}
					</BigButton>
				)}
				{run$ && (w.status === "OPEN" || w.status === "ASSIGNED") && (
					<BigButton
						pending={pending}
						onClick={() =>
							run(
								() => workOrderStep(w.id, "start"),
								`${w.number} started`,
								patch,
							)
						}
					>
						<PlayIcon className="size-5" /> Start
					</BigButton>
				)}
				{canRun(w) && w.status === "IN_PROGRESS" && (
					<BigButton tone="secondary" onClick={() => setSub("hold")}>
						<PauseIcon className="size-5" /> Put on hold
					</BigButton>
				)}
				{canRun(w) && w.status === "ON_HOLD" && (
					<BigButton
						tone="secondary"
						pending={pending}
						onClick={() =>
							run(
								() => workOrderStep(w.id, "resume"),
								`${w.number} back in progress`,
								patch,
							)
						}
					>
						<PlayIcon className="size-5" /> Resume
					</BigButton>
				)}
				{canRun(w) &&
					(w.status === "IN_PROGRESS" || w.status === "ON_HOLD") && (
						<BigButton onClick={() => setSub("complete")}>
							<CheckIcon className="size-5" /> Complete
						</BigButton>
					)}
				{!run$ && !canCancel(w) && (
					<BigButton tone="secondary" onClick={() => void setOpenId(null)}>
						Close
					</BigButton>
				)}
			</>
		);
	}
}

const roleName = (r: string) =>
	({
		FRONT_OFFICE: "Front desk",
		HOUSEKEEPING: "Housekeeping",
		MAINTENANCE: "Maintenance",
		MANAGER: "Manager",
		OWNER: "Owner",
		SYSTEM: "Schedule",
	})[r] ?? r;

function RaiseModal({
	open,
	onClose,
	rooms,
	technicians,
	supervisor,
	onDone,
}: {
	open: boolean;
	onClose: () => void;
	rooms: { id: string; number: string }[];
	technicians: Person[];
	supervisor: boolean;
	onDone: (w: WorkOrderRow) => void;
}) {
	const [kind, setKind] = useState<"ROOM" | "AREA">("ROOM");
	const [roomId, setRoomId] = useState("");
	const [area, setArea] = useState("");
	const [category, setCategory] = useState("");
	const [priority, setPriority] = useState<
		"LOW" | "NORMAL" | "HIGH" | "URGENT"
	>("NORMAL");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [assignee, setAssignee] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) {
			setKind("ROOM");
			setRoomId("");
			setArea("");
			setCategory("");
			setPriority("NORMAL");
			setTitle("");
			setDescription("");
			setAssignee("");
		}
	}, [open]);
	const ready =
		!!title.trim() &&
		!!category &&
		(kind === "ROOM" ? !!roomId : !!area.trim());
	const tech = technicians.find((t) => t.id === assignee);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Report a fault"
			subtitle="Raises a work order for maintenance"
			icon={WrenchIcon}
			size="large"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Cancel
					</BigButton>
					<BigButton
						pending={pending}
						disabled={!ready}
						onClick={() =>
							run(
								() =>
									raiseWorkOrder({
										roomId: kind === "ROOM" ? roomId : null,
										area: kind === "AREA" ? area : null,
										category,
										priority,
										title,
										description,
										assignedTo: tech?.id ?? null,
										assignedToName: tech?.name ?? null,
									}),
								(w) => `${w.number} raised · maintenance told`,
								onDone,
							)
						}
					>
						Raise work order
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<ChoiceCards
					label="Where"
					columns={2}
					value={kind}
					onChange={setKind}
					options={[
						{ value: "ROOM", label: "A guest room" },
						{
							value: "AREA",
							label: "Somewhere else",
							hint: "Lobby, pool, kitchen, generator …",
						},
					]}
				/>
				{kind === "ROOM" ? (
					<SelectField
						label="Room"
						value={roomId}
						onChange={setRoomId}
						options={rooms.map((r) => ({
							value: r.id,
							label: `Room ${r.number}`,
						}))}
						placeholder="Pick the room"
						required
					/>
				) : (
					<TextField
						label="Where exactly"
						value={area}
						onChange={setArea}
						placeholder="e.g. Pool pump room"
						required
					/>
				)}
				<div className="grid grid-cols-2 gap-3">
					<SelectField
						label="Category"
						value={category}
						onChange={setCategory}
						options={CATEGORIES.map((c) => ({
							value: c,
							label: categoryLabel(c),
						}))}
						placeholder="Pick one"
						required
					/>
					<SelectField
						label="Priority"
						value={priority}
						onChange={(v) => setPriority(v as typeof priority)}
						options={[
							{ value: "URGENT", label: "Urgent", hint: "Due in 4 hours" },
							{ value: "HIGH", label: "High", hint: "Due in 24 hours" },
							{ value: "NORMAL", label: "Normal", hint: "Due in 3 days" },
							{ value: "LOW", label: "Low", hint: "Due in 7 days" },
						]}
					/>
				</div>
				<TextField
					label="What is wrong"
					value={title}
					onChange={setTitle}
					placeholder="e.g. AC not cooling"
					required
				/>
				<TextareaField
					label="Details (optional)"
					value={description}
					onChange={setDescription}
					rows={3}
					placeholder="What you saw, when it started"
				/>
				{supervisor && technicians.length > 0 && (
					<SelectField
						label="Give it to (optional)"
						value={assignee}
						onChange={setAssignee}
						options={technicians.map((t) => ({ value: t.id, label: t.name }))}
						placeholder="Leave it on the board"
					/>
				)}
				<WhatHappens
					items={[
						"Maintenance gets an alert; urgent ones also go to the manager",
						"You can add a photo once it is raised",
						"You are told when it is on hold or done",
					]}
				/>
			</div>
		</Modal>
	);
}

function AssignModal({
	open,
	onClose,
	w,
	me,
	supervisor,
	technicians,
	onDone,
}: {
	open: boolean;
	onClose: () => void;
	w: WorkOrderRow;
	me: Person;
	supervisor: boolean;
	technicians: Person[];
	onDone: (w: WorkOrderRow) => void;
}) {
	const [to, setTo] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) setTo(supervisor ? (w.assignedTo ?? "") : me.id);
	}, [open, supervisor, w.assignedTo, me.id]);
	const options = supervisor
		? technicians
		: technicians.filter((t) => t.id === me.id);
	const pick =
		options.find((t) => t.id === to) ?? (to === me.id ? me : undefined);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={supervisor ? "Assign" : "Take it"}
			subtitle={`${w.number} · ${w.title}`}
			icon={UserRoundIcon}
			size="confirm"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Cancel
					</BigButton>
					<BigButton
						pending={pending}
						disabled={!pick}
						onClick={() =>
							pick &&
							run(
								() => assignWorkOrder(w.id, pick.id, pick.name),
								pick.id === me.id
									? `${w.number} is on you`
									: `${w.number} given to ${pick.name} · they're told`,
								onDone,
							)
						}
					>
						{supervisor ? "Assign" : "Take it"}
					</BigButton>
				</>
			}
		>
			{supervisor ? (
				<SelectField
					label="Technician"
					value={to}
					onChange={setTo}
					options={options.map((t) => ({ value: t.id, label: t.name }))}
					placeholder="Pick a technician"
				/>
			) : (
				<p className="text-[15px] text-ink">
					It goes on your list and nobody else picks it up.
				</p>
			)}
		</Modal>
	);
}

function ReasonModal({
	open,
	kind,
	w,
	onClose,
	onDone,
}: {
	open: boolean;
	kind: "hold" | "reopen" | "cancel";
	w: WorkOrderRow;
	onClose: () => void;
	onDone: (w: WorkOrderRow) => void;
}) {
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) setReason("");
	}, [open]);
	const t = {
		hold: {
			title: "Put on hold",
			label: "Why is it on hold",
			ph: "e.g. Waiting for a compressor from the supplier",
			done: `${w.number} on hold · ${w.reportedByName} told`,
			icon: PauseIcon,
		},
		reopen: {
			title: "Reopen",
			label: "What is still wrong",
			ph: "e.g. AC stopped cooling again overnight",
			done: `${w.number} reopened`,
			icon: RotateCcwIcon,
		},
		cancel: {
			title: "Cancel work order",
			label: "Why is it cancelled",
			ph: "e.g. Raised twice, see the other one",
			done: `${w.number} cancelled`,
			icon: BanIcon,
		},
	}[kind];
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={t.title}
			subtitle={`${w.number} · ${w.title}`}
			icon={t.icon}
			tone={kind === "cancel" ? "danger" : "default"}
			size="confirm"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Back
					</BigButton>
					<BigButton
						tone={kind === "cancel" ? "danger" : "primary"}
						pending={pending}
						disabled={!reason.trim()}
						onClick={() =>
							run(() => workOrderWithReason(w.id, kind, reason), t.done, onDone)
						}
					>
						{t.title}
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-3">
				<TextareaField
					label={t.label}
					value={reason}
					onChange={setReason}
					rows={3}
					placeholder={t.ph}
				/>
				{kind === "cancel" && w.roomOutOfOrder && (
					<Note tone="info">Room {w.roomNumber} goes back in service.</Note>
				)}
			</div>
		</Modal>
	);
}

function CompleteModal({
	open,
	w,
	parts,
	onClose,
	onDone,
}: {
	open: boolean;
	w: WorkOrderRow;
	parts: StockItemRow[];
	onClose: () => void;
	onDone: (w: WorkOrderRow) => void;
}) {
	const [note, setNote] = useState("");
	const [labour, setLabour] = useState("");
	const [used, setUsed] = useState<Record<string, number>>({});
	const [vendor, setVendor] = useState("");
	const [vendorCost, setVendorCost] = useState<number | "">("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) {
			setNote("");
			setLabour("");
			setUsed({});
			setVendor("");
			setVendorCost("");
		}
	}, [open]);
	const lines = Object.entries(used).filter(([, q]) => q > 0);
	const partsCost = lines.reduce(
		(s, [id, q]) => s + q * (parts.find((p) => p.id === id)?.unitCost ?? 0),
		0,
	);
	const short = lines.filter(
		([id, q]) => q > (parts.find((p) => p.id === id)?.quantity ?? 0),
	);
	const labourOk = labour === "" || /^\d+$/.test(labour);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Complete"
			subtitle={`${w.number} · ${w.title}`}
			icon={CheckIcon}
			size="large"
			footerInfo={
				partsCost > 0 || vendorCost
					? `Cost ${naira(partsCost + (vendorCost || 0))}`
					: undefined
			}
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Back
					</BigButton>
					<BigButton
						pending={pending}
						disabled={
							!note.trim() ||
							!labourOk ||
							short.length > 0 ||
							(!!vendorCost && !vendor.trim())
						}
						onClick={() =>
							run(
								() =>
									completeWorkOrder(w.id, {
										note,
										labourMinutes: labour === "" ? null : Number(labour),
										parts: lines.map(([itemId, quantity]) => ({
											itemId,
											quantity,
										})),
										vendorName: vendor,
										vendorCost: vendorCost === "" ? null : vendorCost,
									}),
								(r) =>
									`${r.number} done${w.roomOutOfOrder ? ` · room ${w.roomNumber} back in service` : ""} · ${r.reportedByName} told`,
								onDone,
							)
						}
					>
						Mark done
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextareaField
					label="What was done"
					value={note}
					onChange={setNote}
					rows={3}
					placeholder="e.g. Replaced the AC filter, regassed, tested cold"
				/>
				<TextField
					label="Labour time (minutes)"
					value={labour}
					onChange={setLabour}
					placeholder="e.g. 45"
					error={labourOk ? undefined : "Whole minutes, like 45"}
				/>
				<PanelSection title="Parts used from the Maintenance store">
					{parts.length === 0 ? (
						<Note tone="info">
							The Maintenance store has nothing in it yet. Ask the store from
							the Maintenance store screen.
						</Note>
					) : (
						<ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-control border border-line">
							{parts.map((p) => (
								<li key={p.id} className="flex items-center gap-3 px-4 py-2">
									<span className="min-w-0 flex-1">
										<span className="block text-[15px] font-medium text-ink">
											{p.name}
										</span>
										<span
											className={cn(
												"block text-xs",
												(used[p.id] ?? 0) > p.quantity
													? "text-danger"
													: "text-ink-3",
											)}
										>
											{p.quantity} {p.unit} in store · {naira(p.unitCost)} each
										</span>
									</span>
									<Stepper
										value={used[p.id] ?? 0}
										onChange={(v) => setUsed({ ...used, [p.id]: v })}
									/>
								</li>
							))}
						</ul>
					)}
					{short.length > 0 && (
						<Note tone="danger">
							More than the store holds · ask the store first or use fewer.
						</Note>
					)}
				</PanelSection>
				<div className="grid grid-cols-2 gap-3">
					<TextField
						label="Outside vendor (optional)"
						value={vendor}
						onChange={setVendor}
						placeholder="e.g. CoolAir Services"
					/>
					<MoneyField
						label="Vendor cost"
						value={vendorCost}
						onChange={setVendorCost}
					/>
				</div>
				<WhatHappens
					items={[
						"Parts come out of the Maintenance store at their cost now",
						...(w.roomOutOfOrder
							? [
									`Room ${w.roomNumber} goes back in service and housekeeping cleans it`,
								]
							: []),
						`${w.reportedByName} is told it is done`,
					]}
				/>
			</div>
		</Modal>
	);
}

function OooModal({
	open,
	w,
	onClose,
	onDone,
}: {
	open: boolean;
	w: WorkOrderRow;
	onClose: () => void;
	onDone: (w: WorkOrderRow) => void;
}) {
	const [until, setUntil] = useState("");
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) {
			setUntil("");
			setReason(w.title);
		}
	}, [open, w.title]);
	const past = !!until && until < lagosToday();
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={`Take room ${w.roomNumber} out of order`}
			subtitle={`${w.number} · ${w.title}`}
			icon={DoorClosedIcon}
			tone="danger"
			size="confirm"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Back
					</BigButton>
					<BigButton
						tone="danger"
						pending={pending}
						disabled={past}
						onClick={() =>
							run(
								() => takeRoomOutOfOrder(w.id, { reason, until }),
								`Room ${w.roomNumber} out of order · front desk told`,
								onDone,
							)
						}
					>
						Take out of order
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Reason the desk sees"
					value={reason}
					onChange={setReason}
				/>
				<TextField
					label="Expected back (optional)"
					type="date"
					value={until}
					onChange={setUntil}
					error={past ? "Pick today or later" : undefined}
				/>
				<WhatHappens
					tone="warning"
					items={[
						"The room can't be booked, given out or checked into",
						"It comes back when this work order is done or cancelled",
						"Refused while a guest is checked in · move them first",
					]}
				/>
			</div>
		</Modal>
	);
}

function UpdateModal({
	open,
	w,
	onClose,
	onDone,
}: {
	open: boolean;
	w: WorkOrderRow;
	onClose: () => void;
	onDone: (w: WorkOrderRow) => void;
}) {
	const [note, setNote] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) setNote("");
	}, [open]);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Add an update"
			subtitle={`${w.number} · ${w.title}`}
			icon={MessageSquarePlusIcon}
			size="confirm"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Back
					</BigButton>
					<BigButton
						pending={pending}
						disabled={!note.trim()}
						onClick={() =>
							run(() => addWorkOrderUpdate(w.id, note), "Update added", onDone)
						}
					>
						Add update
					</BigButton>
				</>
			}
		>
			<TextareaField
				label="What's the situation"
				value={note}
				onChange={setNote}
				placeholder="e.g. Compressor is dead, getting a quote"
			/>
		</Modal>
	);
}

function PhotoModal({
	open,
	w,
	onClose,
	onDone,
}: {
	open: boolean;
	w: WorkOrderRow;
	onClose: () => void;
	onDone: (w: WorkOrderRow) => void;
}) {
	const [file, setFile] = useState<File | null>(null);
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) setFile(null);
	}, [open]);
	const big = !!file && file.size > 2 * 1024 * 1024;
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={w.hasPhoto ? "Replace photo" : "Add a photo"}
			subtitle={`${w.number} · ${w.title}`}
			icon={CameraIcon}
			size="confirm"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Back
					</BigButton>
					<BigButton
						pending={pending}
						disabled={!file || big}
						onClick={() => {
							if (!file) return;
							const form = new FormData();
							form.set("file", file);
							run(
								() => uploadWorkOrderPhoto(w.id, form),
								"Photo added",
								onDone,
							);
						}}
					>
						Upload
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-3">
				<input
					type="file"
					accept="image/jpeg,image/png,image/webp"
					aria-label="Photo"
					onChange={(e) => setFile(e.target.files?.[0] ?? null)}
					className="block w-full text-[13px] text-ink file:mr-3 file:rounded-control file:border file:border-line file:bg-card file:px-3 file:py-2 file:font-semibold"
				/>
				{big ? (
					<Note tone="danger">
						That photo is over 2 MB · take a smaller one.
					</Note>
				) : (
					<p className="text-xs text-ink-3">JPEG, PNG or WebP, up to 2 MB.</p>
				)}
			</div>
		</Modal>
	);
}
