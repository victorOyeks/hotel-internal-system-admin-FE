import {
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	BedDoubleIcon,
	CalendarIcon,
	ClipboardListIcon,
	CreditCardIcon,
	FlagIcon,
	PlusIcon,
	ReceiptIcon,
	TrendingUpIcon,
	TruckIcon,
	UserCheckIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@hospio/ui/primitives/button";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { Hotel, Me } from "@hospio/api/api/schema";
import type { bookingBuckets } from "@hospio/api/data";
import type {
	ApprovalRow,
	FolioRow,
	OutletSalesDayRow,
	RoomRow,
	ShiftRow,
	StockItemRow,
	WorkOrderRow,
} from "@hospio/api/data/types";
import { GuestsTable } from "./guests-table";
import { OutletSalesCard } from "./outlet-sales";

export type DashboardData = {
	buckets: ReturnType<typeof bookingBuckets>;
	rooms: RoomRow[];
	money: {
		revenue: number;
		byMethod: Record<string, number>;
		paymentsCount: number;
		expenses: number;
		openTills: number;
		cashInTills: number;
	};
	approvals: ApprovalRow[];
	repairs: WorkOrderRow[];
	items: StockItemRow[];
	folios: FolioRow[];
	shifts: ShiftRow[];
	/** What the restaurant and bar sold today (null when it cannot be read). */
	outletSales?: OutletSalesDayRow | null;
};

function greeting() {
	const h = new Date().getHours();
	return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const quickActions = [
	{
		label: "Check in",
		href: "/dashboard/bookings?tab=arrivals",
		icon: ArrowRightToLineIcon,
	},
	{
		label: "Check out",
		href: "/dashboard/bookings?tab=departures",
		icon: ArrowLeftToLineIcon,
	},
	{
		label: "Record payment",
		href: "/dashboard/payments?new=1",
		icon: CreditCardIcon,
	},
	{
		label: "Add expense",
		href: "/dashboard/financials?new=expense",
		icon: ReceiptIcon,
	},
	{
		label: "Assign task",
		href: "/dashboard/tasks?new=1",
		icon: ClipboardListIcon,
	},
	{ label: "Report issue", href: "/dashboard/tasks?new=issue", icon: FlagIcon },
];

export function ManagerDashboard({
	user,
	hotel,
	data,
}: {
	user: Me;
	hotel: Hotel | null;
	data: DashboardData;
}) {
	const firstName = user.fullName.split(" ")[0];
	const now = new Date();
	const {
		buckets,
		rooms,
		money,
		approvals,
		repairs,
		items,
		folios,
		shifts,
		outletSales,
	} = data;

	// ---- derived numbers --------------------------------------------------------------------------
	const totalRooms = rooms.length || hotel?.roomCount || 0;
	const count = (state: RoomRow["state"]) =>
		rooms.filter((r) => r.state === state).length;
	const occupied = count("occupied");
	const ready = count("ready");
	const dirty = count("dirty") + count("inspecting");
	const held = count("held");
	const outOfOrder = count("out_of_order");
	const occupancy =
		totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;
	const arrivedToday = buckets.arrivals.filter(
		(b) => b.status === "CHECKED_IN",
	).length;
	const stillToArrive = buckets.arrivals.filter(
		(b) => b.status === "BOOKED",
	).length;
	const unpaid = folios.filter((f) => f.status !== "CLOSED" && f.balance > 0);
	const unpaidTotal = unpaid.reduce((sum, f) => sum + f.balance, 0);
	const openRepairs = repairs.filter(
		(r) => !["DONE", "CANCELLED"].includes(r.status),
	);
	const urgent = openRepairs.filter(
		(r) => r.priority === "URGENT" || r.priority === "HIGH",
	).length;
	const lowStock = items
		.filter((i) => i.minLevel > 0 && i.quantity <= i.minLevel)
		.sort((a, b) => a.quantity / a.minLevel - b.quantity / b.minLevel)
		.slice(0, 3);
	const shiftsByRole = shifts.reduce<Record<string, number>>((acc, s) => {
		acc[s.role] = (acc[s.role] ?? 0) + 1;
		return acc;
	}, {});
	const pendingApprovals = approvals.filter(
		(a) => a.status === "PENDING" && a.approverLevel === "MANAGER",
	);

	// ---- "needs your action": approvals first, then urgent repairs, then overdue balances ----------
	const actions: {
		key: string;
		title: string;
		detail: string;
		tone: "danger" | "warning" | "info" | "grey";
		cta: string;
		href: string;
		primary?: boolean;
	}[] = [
		...pendingApprovals.slice(0, 3).map((a) => ({
			key: `a-${a.id}`,
			title: a.description,
			detail: `${a.requesterName} · ${a.sourceModule.toLowerCase()}${a.amount ? ` · ${naira(a.amount)}` : ""}`,
			tone: "info" as const,
			cta: "Review",
			href: `/dashboard/approvals?open=${a.id}`,
			primary: true,
		})),
		...openRepairs
			.filter((r) => r.priority === "URGENT")
			.slice(0, 2)
			.map((r) => ({
				key: `r-${r.id}`,
				title: r.title,
				detail: `${r.number} · ${r.where} · ${r.assignedToName ?? "unassigned"}${r.overdue ? " · overdue" : ""}`,
				tone: "warning" as const,
				cta: r.assignedTo ? "Open" : "Assign technician",
				href: `/dashboard/tasks?open=${r.id}`,
			})),
		...unpaid
			.filter((f) => f.status === "CLOSED_WITH_BALANCE")
			.slice(0, 2)
			.map((f) => ({
				key: `f-${f.id}`,
				title: `${f.roomNumber ? `Room ${f.roomNumber} ` : ""}balance outstanding`,
				detail: `${f.guestName} · ${naira(f.balance)}`,
				tone: "warning" as const,
				cta: "Collect",
				href: `/dashboard/folios?open=${f.id}`,
			})),
	];
	const toneBg = {
		danger: "bg-danger-soft text-danger",
		warning: "bg-warning-soft text-warning",
		info: "bg-info-soft text-info",
		grey: "bg-subtle text-ink-2",
	};

	return (
		<>
			<PageHeader
				title={`${greeting()}, ${firstName}`}
				subtitle={[
					hotel?.name,
					hotel?.city,
					totalRooms ? `${totalRooms} rooms` : null,
					format(now, "EEEE, d MMM yyyy"),
				]
					.filter(Boolean)
					.join(" · ")}
			>
				<span className="flex items-center gap-2 rounded-control border border-line bg-card px-3 py-[10px] text-[13px] font-medium text-ink">
					<CalendarIcon className="size-4 text-ink-2" /> Today ·{" "}
					{format(now, "EEE d MMM")}
				</span>
				<Button asChild className={btn.primary}>
					<Link href="/dashboard/bookings?new=1">
						<PlusIcon className="size-[15px]" /> New booking
					</Link>
				</Button>
			</PageHeader>

			{/* Quick actions */}
			<div className="grid grid-cols-2 gap-[10px] md:grid-cols-3 xl:grid-cols-6">
				{quickActions.map(({ label, href, icon: Icon }) => (
					<Link
						key={label}
						href={href}
						className="flex items-center gap-[10px] rounded-xl border border-line bg-card px-[14px] py-3 text-[13px] font-semibold text-ink transition-colors hover:bg-brand-soft/40"
					>
						<span className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-brand-soft text-brand">
							<Icon className="size-[15px]" />
						</span>
						{label}
					</Link>
				))}
			</div>

			{/* KPI row */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
				<KpiCard
					label="Occupancy tonight"
					value={`${occupancy}%`}
					icon={BedDoubleIcon}
					hint={`${occupied} of ${totalRooms} rooms`}
				/>
				<KpiCard
					label="Arrivals today"
					value={buckets.arrivals.length}
					icon={ArrowRightToLineIcon}
					pill={
						arrivedToday > 0 ? (
							<StatusPill tone="success">{arrivedToday} in</StatusPill>
						) : undefined
					}
					hint={`${stillToArrive} still to arrive`}
				/>
				<KpiCard
					label="Departures today"
					value={buckets.departures.length}
					icon={ArrowLeftToLineIcon}
					hint={`${buckets.departures.length} still to check out`}
				/>
				<KpiCard
					label="Revenue today"
					value={nairaShort(money.revenue)}
					icon={TrendingUpIcon}
					hint={`${money.paymentsCount} payments · ${naira(money.expenses)} spent`}
				/>
				<KpiCard
					label="Unpaid balances"
					value={nairaShort(unpaidTotal)}
					icon={WalletIcon}
					pill={
						unpaid.length > 0 ? (
							<StatusPill tone="warning">
								{plural(unpaid.length, "guest")}
							</StatusPill>
						) : undefined
					}
					hint={
						unpaid.length === 0
							? "Everyone is paid up"
							: "Open folios with a balance"
					}
				/>
			</div>

			{/* Needs your action + Room status */}
			<div className="grid gap-4 xl:grid-cols-[1fr_420px]">
				<SectionCard
					title="Needs your action"
					subtitle={`${hotel?.name ?? "This hotel"} · sorted by urgency`}
					count={actions.length}
					action={{ label: "All approvals", href: "/dashboard/approvals" }}
				>
					{actions.length === 0 ? (
						<EmptyState
							title="Nothing waiting on you"
							hint="Approvals, urgent repairs and overdue balances will appear here."
						/>
					) : (
						<ul>
							{actions.map((a, i) => (
								<li
									key={a.key}
									className={`flex items-center gap-3 py-[10px] ${i < actions.length - 1 ? "border-b border-line" : ""}`}
								>
									<span
										className={`flex size-8 shrink-0 items-center justify-center rounded-[10px] ${toneBg[a.tone]}`}
									>
										<FlagIcon className="size-4" />
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-[13px] font-semibold text-ink">
											{a.title}
										</p>
										<p className="truncate text-xs text-ink-3">{a.detail}</p>
									</div>
									<Button
										asChild
										size="sm"
										variant={a.primary ? "default" : "outline"}
										className={a.primary ? btn.primary : btn.secondary}
									>
										<Link href={a.href}>{a.cta}</Link>
									</Button>
								</li>
							))}
						</ul>
					)}
				</SectionCard>

				<SectionCard
					title="Room status"
					subtitle={`Live · ${totalRooms} rooms`}
					action={{ label: "Open rooms", href: "/dashboard/rooms" }}
					bodyClassName="gap-[14px] pt-2"
				>
					{totalRooms === 0 ? (
						<EmptyState
							title="No rooms yet"
							hint="Add room types and rooms in Hotel setup → Rooms & areas."
						/>
					) : (
						<>
							<div className="flex h-[14px] gap-[2px]">
								{[
									["bg-brand", occupied],
									["bg-success", ready],
									["bg-[#dbab00]", dirty],
									["bg-info", held],
									["bg-line-strong", outOfOrder],
								].map(([cls, n], i) =>
									(n as number) > 0 ? (
										<div
											key={i}
											className={`${cls} rounded-[3px]`}
											style={{
												width: `${((n as number) / totalRooms) * 100}%`,
											}}
										/>
									) : null,
								)}
							</div>
							<ul className="flex flex-col">
								{[
									["Occupied", "bg-brand", occupied],
									["Ready", "bg-success", ready],
									["Needs cleaning", "bg-[#dbab00]", dirty],
									["Arriving · held", "bg-info", held],
									["Out of order", "bg-line-strong", outOfOrder],
								].map(([label, cls, n]) => (
									<li
										key={label as string}
										className="flex items-center gap-[10px] py-1"
									>
										<span className={`size-[10px] rounded-[3px] ${cls}`} />
										<span className="flex-1 text-[13px] font-medium text-[#424242]">
											{label}
										</span>
										<span className="text-sm font-bold text-ink">{n}</span>
									</li>
								))}
							</ul>
							{dirty > 0 && (
								<p className="rounded-[10px] bg-warning-soft px-3 py-[10px] text-xs font-medium text-warning">
									{plural(dirty, "room")} to clean
									{stillToArrive > 0
										? ` · ${Math.min(stillToArrive, dirty)} needed for arrivals`
										: ""}
								</p>
							)}
						</>
					)}
				</SectionCard>
			</div>

			{/* Today's guests + Staff on shift */}
			<div className="grid gap-4 xl:grid-cols-[1fr_420px]">
				<GuestsTable buckets={buckets} />

				<SectionCard
					title="Staff on shift"
					subtitle={`${shifts.length} scheduled today`}
					action={{ label: "Open staff", href: "/dashboard/staff" }}
					bodyClassName="gap-[10px] pt-2"
				>
					{Object.keys(shiftsByRole).length === 0 ? (
						<EmptyState
							title="No shifts today"
							hint="Build the rota in Staff → Rota so everyone knows who is in."
						/>
					) : (
						Object.entries(shiftsByRole).map(([role, n]) => (
							<div key={role} className="flex flex-col gap-[6px]">
								<div className="flex items-center gap-2 text-[13px]">
									<span className="flex-1 font-medium capitalize text-ink">
										{role.toLowerCase().replace(/_/g, " ")}
									</span>
									<span className="font-bold text-ink">{n}</span>
								</div>
								<ProgressBar
									value={n}
									max={Math.max(...Object.values(shiftsByRole))}
								/>
							</div>
						))
					)}
				</SectionCard>
			</div>

			{/* Tasks, money, stock */}
			<div className="grid gap-4 md:grid-cols-3">
				<SectionCard
					title="Tasks & maintenance"
					subtitle={`${openRepairs.length} open · ${urgent} urgent`}
					action={{ label: "Tasks", href: "/dashboard/tasks" }}
					bodyClassName="gap-[10px] pt-2"
				>
					{openRepairs.length === 0 ? (
						<EmptyState title="No open repairs" />
					) : (
						openRepairs.slice(0, 4).map((r) => (
							<Link
								key={r.id}
								href={`/dashboard/tasks?open=${r.id}`}
								className="flex items-center gap-[10px] rounded-lg py-1 hover:bg-subtle/60"
							>
								<UserCheckIcon className="size-4 shrink-0 text-ink-3" />
								<div className="min-w-0 flex-1">
									<p className="truncate text-[13px] font-semibold text-ink">
										{r.title}
										{r.roomNumber ? ` · Room ${r.roomNumber}` : ""}
									</p>
									<p
										className={`truncate text-[11px] ${r.assignedTo && !r.overdue ? "text-ink-3" : "text-danger"}`}
									>
										{r.assignedToName ?? "Unassigned"}
										{r.overdue ? " · overdue" : ""}
									</p>
								</div>
								<StatusPill
									dot={false}
									tone={
										r.priority === "URGENT" || r.overdue
											? "danger"
											: r.status === "IN_PROGRESS"
												? "info"
												: r.status === "ON_HOLD"
													? "warning"
													: "grey"
									}
								>
									{r.overdue
										? "Overdue"
										: r.priority === "URGENT"
											? "Urgent"
											: r.status === "IN_PROGRESS"
												? "In progress"
												: r.status === "ON_HOLD"
													? "On hold"
													: "To do"}
								</StatusPill>
							</Link>
						))
					)}
				</SectionCard>

				<SectionCard
					title="Money today"
					subtitle={`Payments taken at ${hotel?.name ?? "this hotel"}`}
					action={{ label: "Financials", href: "/dashboard/financials" }}
					bodyClassName="gap-[10px] pt-2"
				>
					<p className="text-[26px] font-bold leading-none text-ink">
						{nairaShort(money.revenue)}
					</p>
					<div className="flex gap-[6px]">
						{(["CARD", "TRANSFER", "CASH"] as const).map((m) => (
							<div
								key={m}
								className="flex min-w-0 flex-1 flex-col rounded-lg bg-[#fafafa] px-[10px] py-2"
							>
								<span className="text-[11px] font-medium capitalize text-ink-3">
									{m.toLowerCase()}
								</span>
								<span className="truncate text-[13px] font-bold text-ink">
									{nairaShort(money.byMethod[m] ?? 0)}
								</span>
							</div>
						))}
					</div>
					<p className="text-xs text-ink-3">
						{plural(money.openTills, "open till")} · {naira(money.cashInTills)}{" "}
						cash in hand
					</p>
				</SectionCard>

				<SectionCard
					title="Stock alerts"
					subtitle={`${plural(lowStock.length, "item")} running low`}
					action={{ label: "Inventory", href: "/dashboard/inventory" }}
					bodyClassName="gap-[10px] pt-2"
				>
					{lowStock.length === 0 ? (
						<EmptyState
							title="Stock is fine"
							hint="Items below their minimum level will show here."
						/>
					) : (
						lowStock.map((item) => {
							const critical = item.quantity <= item.minLevel * 0.4;
							return (
								<div key={item.id} className="flex flex-col gap-[6px]">
									<div className="flex items-start gap-2">
										<span className="flex-1 text-[13px] font-medium text-ink">
											{item.name}
										</span>
										<span
											className={`text-xs font-semibold ${critical ? "text-danger" : "text-warning"}`}
										>
											{item.quantity} left · min {item.minLevel}
										</span>
									</div>
									<ProgressBar
										value={item.quantity}
										max={item.minLevel * 2}
										tone={critical ? "danger" : "warning"}
									/>
								</div>
							);
						})
					)}
					<p className="mt-auto flex items-center gap-[10px] rounded-[10px] bg-[#f6fafd] px-3 py-[10px] text-xs font-medium text-[#424242]">
						<TruckIcon className="size-4 text-ink-2" /> Deliveries land in
						Inventory → Deliveries
					</p>
				</SectionCard>

				<OutletSalesCard sales={outletSales} className="md:col-span-3" />
			</div>
		</>
	);
}
