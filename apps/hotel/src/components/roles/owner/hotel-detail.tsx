"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	BedDoubleIcon,
	MessageSquareIcon,
	PencilIcon,
	TrendingUpIcon,
	UsersIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName, DetailList } from "@hospio/ui/shared/detail-list";
import { fmtWhen, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs, useTabParam } from "@hospio/ui/shared/pill-tabs";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { RoomRow, RoomTypeRow, StaffRow } from "@hospio/api/data/types";
import type { OwnerHotelFinance } from "@hospio/api/demo/fixtures/owner";
import { ContactManagerPanel, EditHotelPanel } from "./hotels";
import { DownloadModal, hotelStatusLabel, hotelStatusTone } from "./common";

const stateLabel: Record<
	RoomRow["state"],
	{
		label: string;
		tone: "success" | "warning" | "danger" | "info" | "grey" | "brand";
	}
> = {
	occupied: { label: "Occupied", tone: "brand" },
	ready: { label: "Ready", tone: "success" },
	dirty: { label: "Needs cleaning", tone: "warning" },
	inspecting: { label: "Inspecting", tone: "info" },
	held: { label: "Held", tone: "info" },
	out_of_order: { label: "Out of order", tone: "danger" },
};

export function OwnerHotelDetail({
	hotel,
	rooms,
	types,
	staff,
}: {
	hotel: OwnerHotelFinance;
	rooms: RoomRow[];
	types: RoomTypeRow[];
	staff: StaffRow[];
}) {
	const [edit, setEdit] = useState(false);
	const [contact, setContact] = useState(false);
	const [download, setDownload] = useState(false);
	const count = (s: RoomRow["state"]) =>
		rooms.filter((r) => r.state === s).length;

	const roomCols: ColumnDef<RoomRow, unknown>[] = [
		{
			accessorKey: "number",
			header: "Room",
			cell: ({ row }) => (
				<TwoLine primary={row.original.number} secondary={row.original.floor} />
			),
		},
		{ accessorKey: "typeName", header: "Type" },
		{
			accessorKey: "price",
			header: "Price",
			cell: ({ row }) => naira(row.original.price),
		},
		{
			accessorKey: "state",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={stateLabel[row.original.state].tone}>
					{stateLabel[row.original.state].label}
				</StatusPill>
			),
		},
		{
			accessorKey: "guestName",
			header: "Guest",
			cell: ({ row }) =>
				row.original.guestName ?? <span className="text-ink-3">—</span>,
		},
		{ accessorKey: "attendant", header: "Attendant" },
	];
	const staffCols: ColumnDef<StaffRow, unknown>[] = [
		{
			accessorKey: "fullName",
			header: "Name",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.fullName}
					secondary={row.original.jobTitle}
					size="sm"
				/>
			),
		},
		{ accessorKey: "department", header: "Department" },
		{ accessorKey: "role", header: "Role" },
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill
					tone={
						row.original.status === "ACTIVE"
							? "success"
							: row.original.status === "SUSPENDED"
								? "danger"
								: row.original.status === "ON_LEAVE"
									? "info"
									: "warning"
					}
				>
					{row.original.status === "ACTIVE"
						? "Active"
						: row.original.status === "SUSPENDED"
							? "Suspended"
							: row.original.status === "ON_LEAVE"
								? "On leave"
								: "Paused"}
				</StatusPill>
			),
		},
		{
			accessorKey: "lastSignIn",
			header: "Last sign-in",
			cell: ({ row }) => fmtWhen(row.original.lastSignIn),
		},
	];

	return (
		<>
			<PageHeader
				title={hotel.name}
				subtitle={
					<span className="flex items-center gap-2">
						<Link
							href="/dashboard/hotels"
							className="text-brand hover:underline"
						>
							Hotels
						</Link>{" "}
						/ {hotel.code} · {hotel.city} · {hotel.rooms} rooms · managed by{" "}
						{hotel.manager}{" "}
						<StatusPill tone={hotelStatusTone[hotel.status]}>
							{hotelStatusLabel[hotel.status]}
						</StatusPill>
					</span>
				}
			>
				<Button
					variant="outline"
					className={btn.secondary}
					onClick={() => setContact(true)}
				>
					<MessageSquareIcon className="size-4" /> Contact manager
				</Button>
				<Button
					variant="outline"
					className={btn.secondary}
					onClick={() => setEdit(true)}
				>
					<PencilIcon className="size-4" /> Edit
				</Button>
				<Button className={btn.primary} onClick={() => setDownload(true)}>
					Download report
				</Button>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Revenue · month to date"
					value={nairaShort(hotel.revenueMonth)}
					icon={TrendingUpIcon}
					hint={`${nairaShort(hotel.revenueLastMonth)} last month`}
				/>
				<KpiCard
					label="Net profit"
					value={nairaShort(hotel.revenueMonth - hotel.expensesMonth)}
					icon={WalletIcon}
					pill={
						hotel.revenueMonth > 0 ? (
							<StatusPill
								dot={false}
								tone={
									hotel.revenueMonth > hotel.expensesMonth
										? "success"
										: "danger"
								}
							>
								{Math.round(
									((hotel.revenueMonth - hotel.expensesMonth) /
										hotel.revenueMonth) *
										100,
								)}
								%
							</StatusPill>
						) : undefined
					}
					hint={`${nairaShort(hotel.expensesMonth)} expenses`}
				/>
				<KpiCard
					label="Occupancy tonight"
					value={`${hotel.occupancy}%`}
					icon={BedDoubleIcon}
					hint={`${Math.round((hotel.rooms * hotel.occupancy) / 100)} of ${hotel.rooms} rooms`}
				/>
				<KpiCard
					label="Staff on shift"
					value={hotel.onShift}
					icon={UsersIcon}
					hint={`of ${hotel.scheduled} scheduled · ${hotel.openIssues} open issues`}
				/>
			</div>

			<PillTabs
				param="tab"
				tabs={[
					{ key: "overview", label: "Overview" },
					{ key: "rooms", label: "Rooms", count: rooms.length },
					{ key: "staff", label: "Staff", count: staff.length },
					{ key: "money", label: "Money" },
				]}
			/>
			<TabBody
				hotel={hotel}
				rooms={rooms}
				types={types}
				staff={staff}
				roomCols={roomCols}
				staffCols={staffCols}
				count={count}
			/>

			<EditHotelPanel
				hotel={edit ? hotel : null}
				onClose={() => setEdit(false)}
			/>
			<ContactManagerPanel
				hotel={contact ? hotel : null}
				onClose={() => setContact(false)}
			/>
			<DownloadModal
				open={download}
				onOpenChange={setDownload}
				what={`${hotel.name} · this month`}
				rows={() => [
					[
						"Hotel",
						"Rooms",
						"Occupancy %",
						"Revenue this month (NGN)",
						"Expenses this month (NGN)",
						"Net (NGN)",
						"Revenue last month (NGN)",
						"Staff on shift",
						"Scheduled today",
						"Open repairs",
					],
					[
						hotel.name,
						hotel.rooms,
						hotel.occupancy,
						hotel.revenueMonth,
						hotel.expensesMonth,
						hotel.revenueMonth - hotel.expensesMonth,
						hotel.revenueLastMonth,
						hotel.onShift,
						hotel.scheduled,
						hotel.openIssues,
					],
				]}
			/>
		</>
	);
}

function TabBody({
	hotel,
	rooms,
	types,
	staff,
	roomCols,
	staffCols,
	count,
}: {
	hotel: OwnerHotelFinance;
	rooms: RoomRow[];
	types: RoomTypeRow[];
	staff: StaffRow[];
	roomCols: ColumnDef<RoomRow, unknown>[];
	staffCols: ColumnDef<StaffRow, unknown>[];
	count: (s: RoomRow["state"]) => number;
}) {
	const [tab] = useTabParam<"overview" | "rooms" | "staff" | "money">(
		"overview",
	);
	if (tab === "rooms") {
		return (
			<>
				<div className="grid gap-3 md:grid-cols-4">
					{types.map((t) => (
						<div
							key={t.id}
							className="rounded-card border border-line bg-card p-4"
						>
							<p className="text-sm font-bold text-ink">{t.name}</p>
							<p className="text-xs text-ink-3">
								{t.rooms} rooms · {t.capacityAdults} adults
							</p>
							<p className="mt-2 text-lg font-bold text-ink">
								{naira(t.basePrice)}
								<span className="text-xs font-normal text-ink-3"> / night</span>
							</p>
						</div>
					))}
				</div>
				<DataTable columns={roomCols} data={rooms} pageSize={15} />
			</>
		);
	}
	if (tab === "staff")
		return <DataTable columns={staffCols} data={staff} pageSize={12} />;
	if (tab === "money") {
		return (
			<div className="grid gap-4 xl:grid-cols-2">
				<SectionCard
					title="This month"
					subtitle="Revenue, costs and what is left"
				>
					<DetailList
						columns={2}
						items={[
							{ label: "Revenue", value: naira(hotel.revenueMonth) },
							{ label: "Expenses", value: naira(hotel.expensesMonth) },
							{
								label: "Net",
								value: (
									<span
										className={
											hotel.revenueMonth - hotel.expensesMonth >= 0
												? "text-success"
												: "text-danger"
										}
									>
										{naira(hotel.revenueMonth - hotel.expensesMonth)}
									</span>
								),
							},
							{
								label: "Revenue last month",
								value: naira(hotel.revenueLastMonth),
							},
						]}
					/>
				</SectionCard>
				<SectionCard
					title="Card and transfer money"
					subtitle="What the POS providers collected and paid out"
				>
					<p className="text-[13px] text-ink-2">
						Settlements are by business and provider, every hotel together.
					</p>
					<Link
						href="/dashboard/payments"
						className="mt-3 text-[13px] font-semibold text-brand"
					>
						Payments & payouts →
					</Link>
				</SectionCard>
			</div>
		);
	}
	return (
		<div className="grid gap-4 xl:grid-cols-[1fr_420px]">
			<SectionCard
				title="Rooms tonight"
				subtitle={`${hotel.rooms} rooms`}
				bodyClassName="gap-3 pt-2"
			>
				{(Object.keys(stateLabel) as RoomRow["state"][]).map((s) => (
					<div key={s} className="flex items-center gap-3">
						<span className="w-32 text-[13px] text-ink">
							{stateLabel[s].label}
						</span>
						<ProgressBar
							value={count(s)}
							max={rooms.length}
							tone={
								stateLabel[s].tone === "brand"
									? "brand"
									: stateLabel[s].tone === "grey"
										? "brand"
										: stateLabel[s].tone
							}
						/>
						<span className="w-8 text-right text-[13px] font-bold text-ink">
							{count(s)}
						</span>
					</div>
				))}
			</SectionCard>
			<SectionCard title="Hotel" subtitle="Contacts and status">
				<DetailList
					items={[
						{ label: "Manager", value: hotel.manager },
						{ label: "Phone", value: hotel.phone },
						{ label: "Email", value: hotel.email },
						{
							label: "Last action",
							value: hotel.lastAt
								? `${hotel.lastAction} · ${fmtWhen(hotel.lastAt)}`
								: "Nothing logged yet",
						},
						{ label: "Open issues", value: plural(hotel.openIssues, "issue") },
					]}
				/>
			</SectionCard>
		</div>
	);
}
