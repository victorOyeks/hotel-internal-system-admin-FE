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
import { useQueryState } from "nuqs";
import { useState } from "react";
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
	staff: StaffRow[];
	shifts: ShiftRow[];
	leave: LeaveRow[];
	requests: ShiftRequestRow[];
	hotelName: string;
	hotelId?: string;
	businessName?: string;
	inviterName?: string;
}) {
	const [tab, setTab] = useQueryState("tab");
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [search, setSearch] = useState("");
	const [dept, setDept] = useState("");
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
	const selected = staff.find((s) => s.id === openId) ?? null;
	const filtered = staff.filter((s) => !dept || s.department === dept);

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
				subtitle={`${hotelName} · ${plural(staff.length, "person", "people")} · ${onShift} on shift right now`}
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
					value={staff.length}
					icon={UsersIcon}
					hint={`${staff.filter((s) => s.status === "ACTIVE").length} active · ${staff.filter((s) => s.status === "ON_LEAVE").length} on leave · ${staff.filter((s) => s.status === "PAUSED" || s.status === "SUSPENDED").length} paused`}
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
						param="tab"
						tabs={[
							{ key: "all", label: "All staff", count: staff.length },
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
							<FilterSelect
								value={dept}
								onChange={setDept}
								all="All departments"
								options={[...new Set(staff.map((s) => s.department))].map(
									(d) => ({ value: d, label: d }),
								)}
							/>
						)}
						{active !== "rota" && (
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
					data={filtered}
					search={search}
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
