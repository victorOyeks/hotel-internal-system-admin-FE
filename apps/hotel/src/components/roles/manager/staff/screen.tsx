"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	CalendarDaysIcon,
	KeyRoundIcon,
	MessageSquareIcon,
	PauseCircleIcon,
	PencilIcon,
	PlayCircleIcon,
	PlusIcon,
	UserIcon,
	UserXIcon,
	UsersIcon,
	UserCheckIcon,
	PercentIcon,
	WalletIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import type { PageResult } from "@hospio/api/data/paging";
import { useListParams } from "@hospio/ui/shared/list-params";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName } from "@hospio/ui/shared/detail-list";
import { fmtWhen, humanize, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import {
	ExportButton,
	FilterSelect,
	SearchBox,
	Toolbar,
} from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type {
	LeaveRow,
	ShiftRequestRow,
	ShiftRow,
	StaffRow,
} from "@hospio/api/data/types";
import { LeaveTable, RequestsTable } from "./leave";
import {
	EditDetailsModal,
	MessageStaffModal,
	ReinstateModal,
	SuspendStaffModal,
} from "../../shared-staff/staff-account";
import {
	ChangeShiftModal,
	RemoveModal,
	ResetPasswordModal,
	ROLE_OPTIONS,
	StaffFormPanel,
	StaffProfilePanel,
	staffStatusPill,
} from "./panels";
import {
	AutoFillModal,
	FindCoverPanel,
	RotaGrid,
	SwapShiftModal,
} from "./rota";

type Tab = "all" | "rota" | "leave" | "requests";

/** Manager · Staff. The list, add, reset password, suspend/resume and remove are live on identity-service; the rota, leave and requests are live on finance-service. */
export function StaffScreen({
	result,
	overall,
	opened,
	staff,
	shifts,
	leave,
	requests,
	hotelName,
	hotelId,
	businessName,
	inviterName,
	clockedIn = [],
}: {
	clockedIn?: string[];
	/** The list on screen, a page at a time from identity (`?q=&role=&status=&sort=&page=`). */
	result: PageResult<StaffRow>;
	/** The hotel's people without search or filters, for the header and the cards (counts only). */
	overall: PageResult<StaffRow>;
	/** The person in `?open=` when they are not on this page (a link from elsewhere). */
	opened?: StaffRow | null;
	/** Everyone at the hotel: read only for the rota tab (the grid, find cover, swap and auto-fill). */
	staff: StaffRow[];
	shifts: ShiftRow[];
	leave: LeaveRow[];
	requests: ShiftRequestRow[];
	hotelName: string;
	hotelId?: string;
	businessName?: string;
	inviterName?: string;
}) {
	const router = useRouter();
	const list = useListParams({ extra: ["role"] });
	// The tab reloads the page: the rota reads everyone, the list reads one page.
	const [tab, setTab] = useQueryState(
		"tab",
		parseAsString.withOptions({ shallow: false }),
	);
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [search, setSearch] = useState("");
	const [editing, setEditing] = useState<StaffRow | null>(null);
	const [modal, setModal] = useState<{
		kind: "shift" | "message" | "reset" | "suspend" | "resume" | "remove";
		staff: StaffRow;
	} | null>(null);
	const [cover, setCover] = useState<ShiftRow | null>(null);
	const [swap, setSwap] = useState<ShiftRow | null>(null);
	const [autoFill, setAutoFill] = useState(false);

	const active = (tab as Tab) || "all";
	const today = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Africa/Lagos",
	}).format(new Date());
	// Who is clocked in right now (from the clock, so someone in without a rota shift still counts).
	const clocked = new Set(clockedIn);
	const onShift = clocked.size;
	const todays = shifts.filter(
		(s) => s.date === today && s.status !== "CANCELLED",
	);
	const scheduled = todays.length;
	const notIn = todays.filter(
		(s) =>
			!clocked.has(s.staffId) && s.status !== "PRESENT" && s.status !== "LATE",
	).length;
	// Attendance this week: shifts that were worked (present or late) out of those whose outcome is known.
	const weekStart = (() => {
		const d = new Date(`${today}T12:00:00Z`);
		d.setUTCDate(d.getUTCDate() - d.getUTCDay());
		return d.toISOString().slice(0, 10);
	})();
	const decided = shifts.filter(
		(s) =>
			s.date >= weekStart &&
			s.date <= today &&
			(s.status === "PRESENT" || s.status === "LATE" || s.status === "ABSENT"),
	);
	const worked = decided.filter((s) => s.status !== "ABSENT").length;
	const late = decided.filter((s) => s.status === "LATE").length;
	const pendingCount =
		leave.filter(
			(l) => l.status === "PENDING" || l.status === "CHANGE_REQUESTED",
		).length + requests.filter((r) => r.status === "PENDING").length;
	const rows = result.data.content;
	const cards = overall.data.counts ?? result.data.counts ?? {};
	const counts = result.data.counts ?? {};
	const people = cards.all ?? 0;
	const onLeave = new Set(
		leave
			.filter(
				(l) => l.status === "APPROVED" && l.from <= today && l.to >= today,
			)
			.map((l) => l.staffId),
	).size;
	const selected =
		rows.find((s) => s.id === openId) ??
		staff.find((s) => s.id === openId) ??
		(opened && opened.id === openId ? opened : null);

	const onAction = (
		action:
			| "edit"
			| "shift"
			| "message"
			| "reset"
			| "suspend"
			| "resume"
			| "remove",
		s: StaffRow,
	) => {
		if (action === "edit") {
			setEditing(s);
			return;
		}
		setModal({ kind: action, staff: s });
	};

	const columns: ColumnDef<StaffRow, unknown>[] = [
		{
			header: "Staff",
			accessorKey: "fullName",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.fullName}
					photo={row.original.photo}
					secondary={`#${row.original.id.replace("u-", "DD0").toUpperCase().slice(0, 6)} · ${row.original.phone}`}
				/>
			),
		},
		{
			header: "Role",
			accessorKey: "jobTitle",
			enableSorting: false,
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.jobTitle}
					secondary={`${row.original.department} · ${humanize(row.original.role)} · ${row.original.level === "FULL" ? "Full" : row.original.level === "EDIT" ? "Can edit" : "View"}`}
				/>
			),
		},
		{
			header: "Today",
			accessorKey: "shift",
			enableSorting: false,
			cell: ({ row }) => {
				const s = shifts.find(
					(x) => x.staffId === row.original.id && x.date === today,
				);
				const line = s ? `${row.original.shift} · ${s.starts}–${s.ends}` : "—";
				const sub =
					row.original.status === "SUSPENDED"
						? "Suspended"
						: row.original.status === "ON_LEAVE"
							? "On leave"
							: s?.status === "ABSENT"
								? "Called in sick"
								: s?.status === "PRESENT" || (s && s.starts <= "14:00")
									? "On shift now"
									: s
										? "Starts later"
										: "Not scheduled";
				const tone =
					sub === "On shift now"
						? "text-success"
						: sub === "Called in sick"
							? "text-danger"
							: "text-ink-3";
				return (
					<TwoLine
						primary={line}
						secondary={<span className={tone}>{sub}</span>}
					/>
				);
			},
		},
		{
			header: "Hours this week",
			id: "hours",
			enableSorting: false,
			accessorFn: (r) =>
				shifts.filter((s) => s.staffId === r.id && s.status !== "ABSENT")
					.length * 8,
			cell: ({ getValue }) => `${getValue<number>()}h`,
		},
		{
			header: "Last sign-in",
			accessorKey: "lastSignIn",
			cell: ({ row }) => (
				<span className="text-ink-2">{fmtWhen(row.original.lastSignIn)}</span>
			),
		},
		{
			header: "Status",
			accessorKey: "status",
			enableSorting: false,
			cell: ({ row }) => staffStatusPill(row.original),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => {
				const s = row.original;
				const absent = shifts.some(
					(x) =>
						x.staffId === s.id && x.date === today && x.status === "ABSENT",
				);
				return (
					<div className="flex items-center justify-end gap-2">
						{absent && (
							<Button
								size="sm"
								className={`${btn.primary} ${btn.small}`}
								onClick={(e) => {
									e.stopPropagation();
									setCover(
										shifts.find(
											(x) => x.staffId === s.id && x.date === today,
										) ?? null,
									);
								}}
							>
								Find cover
							</Button>
						)}
						<RowActions
							actions={[
								{
									label: "View profile",
									icon: UserIcon,
									onClick: () => setOpenId(s.id),
								},
								{
									label: "Edit details",
									icon: PencilIcon,
									onClick: () => setEditing(s),
								},
								{
									label: "Change shift",
									icon: CalendarDaysIcon,
									onClick: () => setModal({ kind: "shift", staff: s }),
								},
								{
									label: "Message",
									icon: MessageSquareIcon,
									onClick: () => setModal({ kind: "message", staff: s }),
								},
								{
									label: "Reset password",
									icon: KeyRoundIcon,
									onClick: () => setModal({ kind: "reset", staff: s }),
								},
								s.status === "PAUSED" || s.status === "SUSPENDED"
									? {
											label: "Resume access",
											icon: PlayCircleIcon,
											onClick: () => setModal({ kind: "resume", staff: s }),
											managerOnly: true,
											separatorBefore: true,
										}
									: {
											label: "Suspend",
											icon: PauseCircleIcon,
											onClick: () => setModal({ kind: "suspend", staff: s }),
											managerOnly: true,
											separatorBefore: true,
											tone: "danger" as const,
										},
								{
									label: "Remove from hotel",
									icon: UserXIcon,
									onClick: () => setModal({ kind: "remove", staff: s }),
									managerOnly: true,
									tone: "danger",
								},
							]}
						/>
					</div>
				);
			},
		},
	];

	return (
		<>
			<PageHeader
				title="Staff"
				subtitle={`${hotelName} · ${plural(people, "person", "people")} · ${onShift} on shift right now`}
			>
				<Button
					variant="outline"
					className={btn.secondary}
					onClick={() => setTab("rota")}
				>
					<CalendarDaysIcon className="size-4" /> Staff rota
				</Button>
				<Button className={btn.primary} onClick={() => setIsNew("1")}>
					<PlusIcon className="size-4" /> Add staff
				</Button>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Total staff"
					value={people}
					icon={UsersIcon}
					hint={`${cards.ACTIVE ?? 0} active · ${onLeave} on leave · ${(cards.PAUSED ?? 0) + (cards.SUSPENDED ?? 0)} paused`}
				/>
				<KpiCard
					label="On shift now"
					value={onShift}
					icon={UserCheckIcon}
					hint={`clocked in · ${scheduled} on today's rota · ${notIn} not in`}
				/>
				<KpiCard
					label="Attendance this week"
					value={
						decided.length
							? `${Math.round((worked / decided.length) * 100)}%`
							: "—"
					}
					icon={PercentIcon}
					hint={
						decided.length
							? `${worked} of ${plural(decided.length, "shift")} worked · ${late} late`
							: "No shifts worked yet this week"
					}
				/>
				<KpiCard
					label="Payroll · this month"
					value="—"
					icon={WalletIcon}
					hint="Not connected yet"
				/>
			</div>

			<Toolbar
				left={
					<PillTabs<Tab>
						value={active}
						onChange={(k) => void setTab(k === "all" ? null : k)}
						tabs={[
							{ key: "all", label: "All staff", count: people },
							{ key: "rota", label: "Rota" },
							{
								key: "leave",
								label: "Leave",
								count: leave.filter(
									(l) =>
										l.status === "PENDING" || l.status === "CHANGE_REQUESTED",
								).length,
							},
							{
								key: "requests",
								label: "Requests",
								count: requests.filter((r) => r.status === "PENDING").length,
							},
						]}
					/>
				}
				right={
					<>
						{active === "all" && (
							<>
								<FilterSelect
									value={list.params.role ?? ""}
									onChange={(v) => list.set({ role: v })}
									all="All roles"
									options={ROLE_OPTIONS.map((r) => ({
										value: r.value,
										label: r.label,
									}))}
								/>
								<FilterSelect
									value={list.params.status ?? ""}
									onChange={(v) => list.set({ status: v })}
									all={`Any status (${counts.all ?? 0})`}
									options={[
										{
											value: "ACTIVE",
											label: `Active (${counts.ACTIVE ?? 0})`,
										},
										{
											value: "PAUSED",
											label: `Paused (${counts.PAUSED ?? 0})`,
										},
										{
											value: "SUSPENDED",
											label: `Suspended (${counts.SUSPENDED ?? 0})`,
										},
									]}
								/>
								<SearchBox
									value={list.search}
									onChange={list.setSearch}
									placeholder="Name, email or phone"
								/>
							</>
						)}
						{(active === "leave" || active === "requests") && (
							<SearchBox
								value={search}
								onChange={setSearch}
								placeholder="Search staff…"
							/>
						)}
						<ExportButton />
					</>
				}
			/>

			{active === "all" && (
				<DataTable
					columns={columns}
					data={rows}
					server={{
						page: result.data,
						onPage: list.goTo,
						sort: list.sort,
						onSort: list.setSort,
						sortKeys: { fullName: "fullName", lastSignIn: "lastSignInAt" },
					}}
					filtered={list.filtered}
					onClearFilters={list.clear}
					error={result.ok ? null : result.error}
					onRetry={() => router.refresh()}
					onRowClick={(s) => setOpenId(s.id)}
					emptyTitle="No staff match"
				/>
			)}
			{active === "rota" && (
				<RotaGrid
					staff={staff}
					shifts={shifts}
					onFindCover={setCover}
					onSwap={setSwap}
					onAutoFill={() => setAutoFill(true)}
				/>
			)}
			{active === "leave" && <LeaveTable rows={leave} search={search} />}
			{active === "requests" && (
				<RequestsTable rows={requests} search={search} />
			)}
			{pendingCount > 0 && active === "all" && (
				<p className="text-xs text-ink-3">
					{plural(pendingCount, "request")} waiting in Leave and Requests.
				</p>
			)}

			<StaffProfilePanel
				staff={selected}
				shifts={shifts}
				onClose={() => setOpenId(null)}
				onAction={onAction}
			/>
			<EditDetailsModal
				staff={editing ? { ...editing, hotelName } : null}
				onClose={() => setEditing(null)}
			/>
			{isNew && (
				<StaffFormPanel
					open
					onClose={() => {
						setIsNew(null);
					}}
					hotelId={hotelId}
					hotelName={hotelName}
					businessName={businessName}
					inviterName={inviterName}
				/>
			)}
			<ChangeShiftModal
				staff={modal?.kind === "shift" ? modal.staff : null}
				onClose={() => setModal(null)}
			/>
			<MessageStaffModal
				staff={modal?.kind === "message" ? { ...modal.staff, hotelName } : null}
				onClose={() => setModal(null)}
			/>
			<ResetPasswordModal
				staff={modal?.kind === "reset" ? modal.staff : null}
				onClose={() => setModal(null)}
				hotelName={hotelName}
				businessName={businessName}
				inviterName={inviterName}
			/>
			<SuspendStaffModal
				staff={modal?.kind === "suspend" ? modal.staff : null}
				onClose={() => setModal(null)}
			/>
			<ReinstateModal
				staff={modal?.kind === "resume" ? modal.staff : null}
				onClose={() => setModal(null)}
			/>
			<RemoveModal
				staff={modal?.kind === "remove" ? modal.staff : null}
				onClose={() => setModal(null)}
				hotelName={hotelName}
				onSuspend={(s) => setModal({ kind: "suspend", staff: s })}
			/>
			<FindCoverPanel
				shift={cover}
				staff={staff}
				onClose={() => setCover(null)}
			/>
			<SwapShiftModal
				shift={swap}
				shifts={shifts}
				staff={staff}
				onClose={() => setSwap(null)}
			/>
			<AutoFillModal
				open={autoFill}
				shifts={shifts}
				staff={staff}
				onClose={() => setAutoFill(false)}
			/>
		</>
	);
}
