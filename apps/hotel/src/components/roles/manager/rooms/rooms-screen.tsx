"use client";

import {
	ChevronDownIcon,
	LayoutGridIcon,
	ListIcon,
	PlusIcon,
	TagIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { fmtDay, fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import {
	type AreaRow,
	occupancyLabel,
	type RoomRow,
	type RoomState,
	type RoomTypeRow,
	type StaffRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { roomStateMeta, roomStateOrder } from "./room-state";
import {
	AddRoomPanel,
	AssignCleaningPanel,
	OutOfOrderPanel,
	RoomDetailsPanel,
} from "./room-panels";
import { type PriceRule, RoomTypesTab } from "./room-types";

type Panel = null | "out-of-order" | "edit" | "assign" | "add";

export function RoomsScreen({
	hotelName,
	rooms: initial,
	types,
	areas,
	attendants,
	priceRule,
}: {
	hotelName: string;
	rooms: RoomRow[];
	types: RoomTypeRow[];
	areas: AreaRow[];
	attendants: StaffRow[];
	priceRule?: PriceRule;
}) {
	const [tab, setTab] = useQueryState(
		"tab",
		parseAsString.withDefault("board"),
	);
	const [openId, setOpenId] = useQueryState("open");
	const [rooms, setRooms] = useState(initial);
	const [stateFilter, setStateFilter] = useState<RoomState | "all">("all");
	const [search, setSearch] = useState("");
	const [view, setView] = useState<"grid" | "list">("grid");
	const [panel, setPanel] = useState<Panel>(null);
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

	const selected = rooms.find((r) => r.id === openId) ?? null;
	const counts = useMemo(() => {
		const c: Record<string, number> = { all: rooms.length };
		for (const s of roomStateOrder)
			c[s] = rooms.filter((r) => r.state === s).length;
		return c;
	}, [rooms]);

	const visible = rooms.filter((r) => {
		if (stateFilter !== "all" && r.state !== stateFilter) return false;
		const q = search.toLowerCase().trim();
		return (
			!q ||
			r.number.toLowerCase().includes(q) ||
			(r.guestName ?? "").toLowerCase().includes(q) ||
			r.typeName.toLowerCase().includes(q)
		);
	});
	const floors = Array.from(new Set(rooms.map((r) => r.floor)));

	function patch(id: string, changes: Partial<RoomRow>) {
		setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, ...changes } : r)));
	}
	function closePanel() {
		setPanel(null);
	}

	const listColumns: ColumnDef<RoomRow, unknown>[] = [
		{
			accessorKey: "number",
			header: "Room",
			cell: ({ row }) => (
				<TwoLine primary={row.original.number} secondary={row.original.floor} />
			),
		},
		{
			accessorKey: "typeName",
			header: "Type",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.typeName}
					secondary={naira(row.original.price)}
				/>
			),
		},
		{
			accessorKey: "state",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={roomStateMeta[row.original.state].tone}>
					{roomStateMeta[row.original.state].label}
				</StatusPill>
			),
		},
		{
			accessorKey: "guestName",
			header: "Guest",
			cell: ({ row }) =>
				row.original.guestName ?? <span className="text-ink-3">—</span>,
		},
		{
			accessorKey: "checkOut",
			header: "Check-out",
			cell: ({ row }) =>
				row.original.checkOut ? fmtDay(row.original.checkOut) : "—",
		},
		{
			accessorKey: "lastCleaned",
			header: "Last cleaned",
			cell: ({ row }) => (
				<TwoLine
					primary={fmtWhen(row.original.lastCleaned)}
					secondary={row.original.attendant}
				/>
			),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<RowActions
					actions={[
						{ label: "Open room", onClick: () => setOpenId(row.original.id) },
						{
							label: "Assign cleaning",
							onClick: () => {
								setOpenId(row.original.id);
								setPanel("assign");
							},
						},
						{
							label: "Edit room",
							onClick: () => {
								setOpenId(row.original.id);
								setPanel("edit");
							},
						},
						{
							label:
								row.original.state === "out_of_order"
									? "Back in service"
									: "Mark out of order",
							tone: "danger",
							managerOnly: true,
							separatorBefore: true,
							onClick: () => {
								setOpenId(row.original.id);
								setPanel("out-of-order");
							},
						},
					]}
				/>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Rooms"
				subtitle={`${hotelName} · ${rooms.length} rooms · live status`}
			>
				<Button
					variant="outline"
					className={cn(
						btn.secondary,
						tab === "types" && "border-brand text-brand",
					)}
					onClick={() => setTab(tab === "types" ? null : "types")}
				>
					<TagIcon className="size-4" />{" "}
					{tab === "types" ? "Back to board" : "Room types & prices"}
				</Button>
				<Button className={btn.primary} onClick={() => setPanel("add")}>
					<PlusIcon className="size-[15px]" /> Add room
				</Button>
			</PageHeader>

			{tab === "types" ? (
				<RoomTypesTab
					types={types}
					roomsByType={rooms.reduce<Record<string, number>>((acc, r) => {
						acc[r.typeId] = (acc[r.typeId] ?? 0) + 1;
						return acc;
					}, {})}
					rule={priceRule}
				/>
			) : (
				<>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="inline-flex flex-wrap gap-[2px] rounded-[10px] bg-subtle p-1">
							{(["all", ...roomStateOrder] as const).map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => setStateFilter(s)}
									className={cn(
										"flex items-center gap-[6px] rounded-lg py-[6px] px-[10px] text-xs transition-colors",
										stateFilter === s
											? "bg-card font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
											: "font-medium text-ink-2 hover:text-ink",
									)}
								>
									{s !== "all" && (
										<span
											className={cn(
												"size-[7px] rounded-full",
												roomStateMeta[s].dot,
											)}
										/>
									)}
									{s === "all" ? "All" : roomStateMeta[s].label}
									<span className="text-[11px] text-ink-3">{counts[s]}</span>
								</button>
							))}
						</div>
						<div className="flex items-center gap-2">
							<SearchBox
								value={search}
								onChange={setSearch}
								placeholder="Room or guest"
								className="w-[220px]"
							/>
							<div className="flex rounded-control border border-line bg-card p-[2px]">
								{(["grid", "list"] as const).map((v) => (
									<button
										key={v}
										type="button"
										onClick={() => setView(v)}
										className={cn(
											"flex size-8 items-center justify-center rounded-lg",
											view === v
												? "bg-brand text-white"
												: "text-ink-2 hover:bg-subtle",
										)}
										aria-label={v}
									>
										{v === "grid" ? (
											<LayoutGridIcon className="size-4" />
										) : (
											<ListIcon className="size-4" />
										)}
									</button>
								))}
							</div>
						</div>
					</div>

					{view === "list" ? (
						<DataTable
							columns={listColumns}
							data={visible}
							pageSize={15}
							onRowClick={(r) => setOpenId(r.id)}
							emptyTitle="No rooms match"
						/>
					) : (
						<div className="flex flex-col gap-3">
							{floors.map((floor) => {
								const all = rooms.filter((r) => r.floor === floor);
								const shown = visible.filter((r) => r.floor === floor);
								if (shown.length === 0 && (stateFilter !== "all" || search))
									return null;
								const isCollapsed = collapsed[floor] ?? false;
								const byState = (s: RoomState) =>
									all.filter((r) => r.state === s).length;
								return (
									<section
										key={floor}
										className="rounded-card border border-line bg-card"
									>
										<button
											type="button"
											onClick={() =>
												setCollapsed((c) => ({ ...c, [floor]: !isCollapsed }))
											}
											className="flex w-full items-center gap-4 px-5 py-4 text-left"
										>
											<div className="w-[180px] shrink-0">
												<p className="text-sm font-bold text-ink">
													{floor.replace(" · floor ", " · Floor ")}
												</p>
												<p className="text-xs text-ink-3">
													{all[0]?.number}–{all[all.length - 1]?.number} ·{" "}
													{plural(all.length, "room")}
												</p>
											</div>
											<div className="flex h-[10px] flex-1 gap-[2px] overflow-hidden rounded">
												{roomStateOrder.map((s) =>
													byState(s) > 0 ? (
														<span
															key={s}
															className={cn(
																"h-full rounded-[2px]",
																roomStateMeta[s].dot,
															)}
															style={{
																width: `${(byState(s) / all.length) * 100}%`,
															}}
														/>
													) : null,
												)}
											</div>
											<div className="hidden items-center gap-3 text-xs text-ink-2 xl:flex">
												{(
													[
														"ready",
														"dirty",
														"held",
														"out_of_order",
													] as RoomState[]
												).map(
													(s) =>
														byState(s) > 0 && (
															<span key={s} className="flex items-center gap-1">
																<span
																	className={cn(
																		"size-[6px] rounded-full",
																		roomStateMeta[s].dot,
																	)}
																/>
																{byState(s)}{" "}
																{roomStateMeta[s].label.toLowerCase()}
															</span>
														),
												)}
												<span className="font-semibold text-ink">
													{byState("occupied")} occupied
												</span>
											</div>
											<ChevronDownIcon
												className={cn(
													"size-4 text-ink-3 transition-transform",
													!isCollapsed && "rotate-180",
												)}
											/>
										</button>
										{!isCollapsed && (
											<div className="grid grid-cols-2 gap-[10px] border-t border-line px-5 py-4 md:grid-cols-4 xl:grid-cols-6">
												{shown.map((r) => {
													const meta = roomStateMeta[r.state];
													const sub =
														r.state === "occupied"
															? `${r.guestName?.split(" ").pop()} · ${occupancyLabel(r) === "Past departure" ? "past departure" : occupancyLabel(r) === "Due out" ? "due out today" : `out ${fmtDay(r.checkOut)}`}`
															: r.state === "held"
																? (r.note ?? "Arriving today")
																: r.state === "out_of_order"
																	? r.outOfOrderReason
																	: r.state === "ready"
																		? `${r.typeName} · ${naira(r.price)}`
																		: r.state === "inspecting"
																			? r.attendant
																				? `Inspecting · ${r.attendant}`
																				: "Waiting for inspection"
																			: r.attendant
																				? `Cleaning · ${r.attendant}`
																				: "Needs cleaning · not assigned";
													return (
														<button
															key={r.id}
															type="button"
															onClick={() => setOpenId(r.id)}
															className={cn(
																"flex flex-col gap-[6px] rounded-[10px] border px-3 py-[10px] text-left transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
																meta.card,
															)}
														>
															<span className="flex items-center gap-2">
																<span
																	className={cn(
																		"h-3 w-[3px] rounded-full",
																		meta.dot,
																	)}
																/>
																<span className="flex-1 text-[13px] font-bold text-ink">
																	{r.number}
																</span>
																<span className="text-[10px] text-ink-3">
																	{r.typeName}
																</span>
															</span>
															<span
																className={cn(
																	"truncate text-[11px]",
																	r.state === "out_of_order"
																		? "text-danger"
																		: "text-ink-2",
																)}
															>
																{sub}
															</span>
														</button>
													);
												})}
											</div>
										)}
									</section>
								);
							})}
						</div>
					)}
				</>
			)}

			<RoomDetailsPanel
				room={panel === null ? selected : null}
				areas={areas}
				onClose={() => setOpenId(null)}
				onAction={(p) => setPanel(p)}
				onMarkReady={(id) => patch(id, { state: "ready" })}
				onPatched={(id, changes) => patch(id, changes)}
			/>
			<OutOfOrderPanel
				room={panel === "out-of-order" ? selected : null}
				areas={areas}
				onClose={closePanel}
				onSaved={(id, changes) => patch(id, changes)}
			/>
			<AssignCleaningPanel
				room={panel === "assign" ? selected : null}
				attendants={attendants}
				onClose={closePanel}
				onSaved={(id, changes) => patch(id, changes)}
			/>
			<AddRoomPanel
				open={panel === "add" || panel === "edit"}
				room={panel === "edit" ? selected : null}
				types={types}
				areas={areas}
				onClose={closePanel}
				onSaved={(r) =>
					panel === "edit" ? patch(r.id, r) : setRooms((rs) => [...rs, r])
				}
			/>
		</>
	);
}
