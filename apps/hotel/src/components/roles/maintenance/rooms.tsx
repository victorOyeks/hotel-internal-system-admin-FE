"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DoorClosedIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { fmtDay, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import type { RoomRow, WorkOrderRow } from "@hospio/api/data/types";

type Row = RoomRow & { workOrder?: WorkOrderRow };

/**
 * Maintenance · Rooms out of order (3248:13987): every room property-service has out of order, with the work order
 * that holds it. A room is taken out of order and put back from its work order, so it can never be forgotten.
 */
export function OutOfOrderScreen({
	rooms,
	workOrders,
}: {
	rooms: RoomRow[];
	workOrders: WorkOrderRow[];
}) {
	const [q, setQ] = useState("");
	const byRoom = new Map(
		workOrders
			.filter((w) => w.roomOutOfOrder && w.roomId)
			.map((w) => [w.roomId as string, w]),
	);
	const ooo: Row[] = rooms
		.filter((r) => r.state === "out_of_order")
		.map((r) => ({ ...r, workOrder: byRoom.get(r.id) }));
	const list = ooo.filter(
		(r) =>
			!q.trim() ||
			`${r.number} ${r.outOfOrderReason ?? ""} ${r.workOrder?.number ?? ""}`
				.toLowerCase()
				.includes(q.trim().toLowerCase()),
	);
	const openOnRooms = workOrders.filter(
		(w) => w.roomId && w.status !== "DONE" && w.status !== "CANCELLED",
	);
	const columns: ColumnDef<Row, unknown>[] = [
		{
			id: "room",
			header: "Room",
			cell: ({ row: { original: r } }) => (
				<TwoLine primary={`Room ${r.number}`} secondary={r.typeName} />
			),
		},
		{
			id: "why",
			header: "Why",
			cell: ({ row: { original: r } }) => r.outOfOrderReason ?? "—",
		},
		{
			id: "until",
			header: "Expected back",
			cell: ({ row: { original: r } }) =>
				r.outOfOrderUntil ? fmtDay(r.outOfOrderUntil) : "When the work is done",
		},
		{
			id: "wo",
			header: "Work order",
			cell: ({ row: { original: r } }) =>
				r.workOrder ? (
					<Link
						href={`/dashboard?tab=open&open=${r.workOrder.id}`}
						className="font-semibold text-brand hover:underline"
					>
						{r.workOrder.number}
					</Link>
				) : (
					<StatusPill tone="warning">Set by a manager</StatusPill>
				),
		},
		{
			id: "who",
			header: "On it",
			cell: ({ row: { original: r } }) => r.workOrder?.assignedToName ?? "—",
		},
	];
	return (
		<>
			<PageHeader
				title="Rooms out of order"
				subtitle={`${plural(ooo.length, "room")} can't be sold right now`}
			/>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
				<KpiCard
					label="Out of order"
					value={ooo.length}
					icon={DoorClosedIcon}
				/>
				<KpiCard
					label="Rooms with open work orders"
					value={new Set(openOnRooms.map((w) => w.roomId)).size}
					icon={DoorClosedIcon}
				/>
				<KpiCard
					label="Rooms in the hotel"
					value={rooms.length}
					icon={DoorClosedIcon}
				/>
			</div>
			<Note tone="info">
				Take a room out of order from its work order (open it, then “Take room
				out of order”). It comes back when the work order is done or cancelled,
				and housekeeping cleans it first.
			</Note>
			<Toolbar
				left={
					<SearchBox
						value={q}
						onChange={setQ}
						placeholder="Search room or work order"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={list}
				emptyTitle="Every room is in service"
			/>
		</>
	);
}
