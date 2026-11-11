"use client";

import {
	ClipboardPasteIcon,
	Loader2Icon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	createRoomsBulk,
	createRoomType,
	deleteRoom,
	deleteRoomType,
	type HotelRoomsSnapshot,
	hotelRooms,
	saveRoomType,
	updateHotelRoom,
} from "@hospio/api/actions/property";
import type { AdminOnboardingData } from "@hospio/api/types";
import { Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import {
	FieldRow,
	SelectField,
	TextareaField,
	TextField,
} from "@hospio/ui/shared/field";
import { naira } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { btn, input as inputCls } from "@hospio/ui/shared/ui";
import {
	byRoomNumber,
	checkFloor,
	checkRoomCount,
	checkRoomPrice,
	checkRoomStart,
	checkRoomType,
	ranges,
	roomNumbers,
} from "@hospio/ui/shared/validate";
import { cn } from "@hospio/ui/utils";
import type { WizardCtx } from "./wizard";
import {
	nextStep,
	prevStep,
	ResultLine,
	StepCard,
	StepFrame,
	useWizardSave,
} from "./shared";

/**
 * J6/J7 · step 5: room types and numbers per hotel. The step reads the hotel's real room types and rooms from
 * property-service whenever it opens (so Back, the step rail, a reload or another admin's work never hide rooms already
 * made), keeps rows typed but not made in this browser, and refuses before anything is created: a blank or meaningless
 * value, a number that already exists or overlaps another row, a second type with a name already used (one type has one
 * price; a row naming an existing type adds rooms to it). Made rooms can be edited or deleted (a room with bookings is
 * refused by the server). The draft's `byHotel` is written from what the server holds.
 */

type ByHotel = NonNullable<AdminOnboardingData["rooms"]>["byHotel"];
type Row = {
	key: string;
	name: string;
	price: string;
	count: string;
	start: string;
	floor: string;
};
type RowErrors = Partial<
	Record<"name" | "price" | "count" | "start" | "floor", string>
>;
type Snapshot = HotelRoomsSnapshot;

let seq = 0;
const blankRow = (): Row => ({
	key: `r${Date.now()}${++seq}`,
	name: "",
	price: "",
	count: "",
	start: "",
	floor: "",
});
const filled = (r: Row) =>
	!!(
		r.name.trim() ||
		r.price.trim() ||
		r.count.trim() ||
		r.start.trim() ||
		r.floor.trim()
	);
const key = (v: string) => v.trim().replace(/\s+/g, " ").toLowerCase();
const price = (v: string) => Number(v.replace(/[₦,\s]/g, ""));
const storeKey = (businessId: string, hotelId: string) =>
	`hospio:admin-onboarding:${businessId}:${hotelId}:room-rows`;

/** The rows kept in this browser for a hotel (typed, not made yet). */
function loadRows(businessId: string, hotelId: string): Row[] {
	try {
		const raw = localStorage.getItem(storeKey(businessId, hotelId));
		const rows = raw ? (JSON.parse(raw) as Row[]) : [];
		return rows.length ? rows : [blankRow()];
	} catch {
		return [blankRow()];
	}
}
function keepRows(businessId: string, hotelId: string, rows: Row[]) {
	try {
		const kept = rows.filter(filled);
		if (kept.length)
			localStorage.setItem(storeKey(businessId, hotelId), JSON.stringify(kept));
		else localStorage.removeItem(storeKey(businessId, hotelId));
	} catch {
		// Storage blocked: the rows stay for this visit only.
	}
}

/** The next free number after the hotel's highest one with the same letters ("101" → "121" when 101–120 exist). */
function nextFree(start: string, taken: Set<string>) {
	const prefix = start.trim().toUpperCase().replace(/\d+$/, "");
	let max = 0;
	for (const n of taken) {
		const m = n.match(/^(.*?)(\d+)$/);
		if (m && m[1] === prefix) max = Math.max(max, Number.parseInt(m[2], 10));
	}
	return max ? `${prefix}${max + 1}` : null;
}

/**
 * Every problem with a row: its own fields, then a name or price that clashes with a type already made (or another row),
 * then numbers that already exist or that another row would make. Empty when the row can be made.
 */
function rowErrors(
	row: Row,
	rows: Row[],
	snap: Snapshot | undefined,
	hotelName: string,
): RowErrors {
	const e: RowErrors = {};
	const name = row.name.trim();
	e.name = checkRoomType(name);
	const existing = snap?.types.find(
		(t) => t.active && key(t.name) === key(name),
	);
	if (!e.name) {
		const other = rows.find(
			(r) => r.key !== row.key && filled(r) && key(r.name) === key(name),
		);
		if (other)
			e.name = `${name} is in another row too. Put all ${name} rooms in one row`;
	}
	if (existing) {
		// A row naming a type already made adds rooms to it: one type, one price.
		if (row.price.trim()) {
			const err = checkRoomPrice(row.price);
			if (err) e.price = err;
			else if (price(row.price) !== existing.basePrice)
				e.price = `${existing.name} is ${naira(existing.basePrice)} a night already. One type has one price: leave this blank or enter ${naira(existing.basePrice)}, or change the price in the table above`;
		}
	} else e.price = checkRoomPrice(row.price);
	e.count = checkRoomCount(row.count);
	e.start = checkRoomStart(row.start);
	e.floor = checkFloor(row.floor);
	if (!e.count && !e.start) {
		const mine = roomNumbers(row.start, Number(row.count));
		const taken = new Set(
			(snap?.rooms ?? []).map((r) => r.number.toUpperCase()),
		);
		const clash = mine.filter((n) => taken.has(n.toUpperCase()));
		if (clash.length) {
			const free = nextFree(row.start, taken);
			e.start = `${clash.length === 1 ? "Room" : "Rooms"} ${ranges(clash)} already ${clash.length === 1 ? "exists" : "exist"} in ${hotelName}.${free ? ` Start from ${free}` : " Choose another first number"}`;
		} else {
			for (const other of rows) {
				if (other.key === row.key || !filled(other)) continue;
				if (checkRoomCount(other.count) || checkRoomStart(other.start))
					continue;
				const theirs = new Set(
					roomNumbers(other.start, Number(other.count)).map((n) =>
						n.toUpperCase(),
					),
				);
				const both = mine.filter((n) => theirs.has(n.toUpperCase()));
				if (both.length) {
					e.start = `${both.length === 1 ? "Room" : "Rooms"} ${ranges(both)} would also be made by the ${other.name.trim() || "other"} row. Give each row its own numbers`;
					break;
				}
			}
		}
	}
	return Object.fromEntries(
		Object.entries(e).filter(([, v]) => v),
	) as RowErrors;
}

/** The draft's summary for a hotel, from what the server holds. */
function summary(snap: Snapshot): ByHotel[string] {
	const roomTypes = snap.types
		.filter((t) => t.active || snap.rooms.some((r) => r.roomTypeId === t.id))
		.map((t) => ({
			roomTypeId: t.id,
			name: t.name,
			price: t.basePrice,
			count: snap.rooms.filter((r) => r.roomTypeId === t.id).length,
		}));
	return { roomTypes, created: snap.rooms.length };
}

export function RoomsStep({ ctx }: { ctx: WizardCtx }) {
	const { hotels, business, setHotels } = ctx;
	const [hotelId, setHotelId] = useState(hotels[0]?.id ?? "");
	const [snaps, setSnaps] = useState<Record<string, Snapshot>>({});
	const [loadError, setLoadError] = useState<string | null>(null);
	const [rowsByHotel, setRowsByHotel] = useState<Record<string, Row[]>>({});
	const [errors, setErrors] = useState<Record<string, RowErrors>>({});
	const [shown, setShown] = useState<Record<string, boolean>>({});
	const [importOpen, setImportOpen] = useState(false);
	const [lastResult, setLastResult] = useState<string | null>(null);
	const [editType, setEditType] = useState<Snapshot["types"][number] | null>(
		null,
	);
	const [editRoom, setEditRoom] = useState<Snapshot["rooms"][number] | null>(
		null,
	);
	const [removeRoom, setRemoveRoom] = useState<
		Snapshot["rooms"][number] | null
	>(null);
	const { pending, call, busy } = useWizardSave();
	const hotel = hotels.find((h) => h.id === hotelId) ?? hotels[0];
	const snap = snaps[hotelId];
	const rows = rowsByHotel[hotelId] ?? [blankRow()];
	const totalMade = Object.values(snaps).reduce(
		(s, h) => s + h.rooms.length,
		0,
	);
	const hotelsWithRooms = Object.values(snaps).filter(
		(s) => s.rooms.length,
	).length;

	const load = useCallback(
		async (id: string) => {
			const result = await hotelRooms(id);
			if (!result.ok) {
				setLoadError(result.error);
				return null;
			}
			setLoadError(null);
			setSnaps((s) => ({ ...s, [id]: result.data }));
			setHotels((list) =>
				list.map((h) =>
					h.id === id ? { ...h, rooms: result.data.rooms.length } : h,
				),
			);
			return result.data;
		},
		[setHotels],
	);

	// Re-read the hotel's rooms whenever the step opens or the tab changes; restore rows typed but not made.
	useEffect(() => {
		if (!hotelId) return;
		void load(hotelId);
		setRowsByHotel((r) =>
			r[hotelId] ? r : { ...r, [hotelId]: loadRows(business.id, hotelId) },
		);
	}, [hotelId, business.id, load]);

	/** Updates this hotel's rows from the latest state (so typing during a save is never lost) and keeps them. */
	const setRows = (next: Row[] | ((prev: Row[]) => Row[])) =>
		setRowsByHotel((all) => {
			const prev = all[hotelId] ?? [blankRow()];
			let rows = typeof next === "function" ? next(prev) : next;
			if (rows.length === 0) rows = [blankRow()];
			keepRows(business.id, hotelId, rows);
			return { ...all, [hotelId]: rows };
		});
	/** Takes a made row off the list, keeping whatever else is typed. */
	const dropRow = (rowKey: string) =>
		setRows((prev) => prev.filter((r) => r.key !== rowKey));
	const patch = (rowKey: string, p: Partial<Row>) =>
		setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, ...p } : r)));

	/** Writes the server's view of every loaded hotel to the draft, so the board and a reload agree. */
	const persist = async (latest: Record<string, Snapshot>) => {
		const byHotel: ByHotel = {};
		for (const [id, s] of Object.entries(latest)) byHotel[id] = summary(s);
		return ctx.saveStep("rooms", { byHotel });
	};

	/** Makes one row's rooms: the type (unless it exists already) then its numbers in one strict call. */
	const makeRow = async (
		row: Row,
		current: Snapshot,
	): Promise<Snapshot | null> => {
		const existing = current.types.find(
			(t) => t.active && key(t.name) === key(row.name),
		);
		let typeId = existing?.id;
		let madeType: string | null = null;
		if (!typeId) {
			const type = await call(() =>
				createRoomType(
					{
						name: row.name.trim().replace(/\s+/g, " "),
						basePrice: price(row.price),
						capacityAdults: 2,
						capacityChildren: 0,
						facilities: [],
					},
					hotelId,
				),
			);
			if (!type) return null;
			typeId = type.id;
			madeType = type.id;
		}
		const numbers = roomNumbers(row.start, Number(row.count));
		const result = await call(() =>
			createRoomsBulk(
				numbers.map((number) => ({
					number,
					roomTypeId: typeId as string,
					floor: row.floor.trim().toUpperCase() || undefined,
				})),
				hotelId,
				true,
			),
		);
		if (!result) {
			// Nothing was made: take back the type this row added so a retry does not meet "already a type called …".
			if (madeType) await deleteRoomType(madeType, hotelId);
			return null;
		}
		setLastResult(
			`${result.created} ${result.created === 1 ? "room" : "rooms"} made as ${existing?.name ?? row.name.trim()}: ${ranges(numbers)}`,
		);
		return load(hotelId);
	};

	/** Checks one row (or every filled row) and shows each problem under its field. */
	const check = (one?: Row) => {
		const list = one ? [one] : rows.filter(filled);
		const next: Record<string, RowErrors> = { ...errors };
		let ok = true;
		for (const r of list) {
			const e = rowErrors(r, rows, snap, hotel?.name ?? "this hotel");
			next[r.key] = e;
			if (Object.keys(e).length) ok = false;
		}
		setErrors(next);
		return ok;
	};

	const createRow = (row: Row) =>
		busy(async () => {
			if (!snap || !check(row)) return;
			const after = await makeRow(row, snap);
			if (!after) return;
			dropRow(row.key);
			await persist({ ...snaps, [hotelId]: after });
			toast.success(`${row.name.trim()}: ${row.count.trim()} rooms made`);
		});

	const save = () =>
		busy(async () => {
			// Rows still typed are made first (each checked), so nothing typed is lost or skipped silently.
			let current = snap;
			const typed = rows.filter(filled);
			if (typed.length && current) {
				if (!check()) {
					toast.error(
						"Fix the rows marked in red, or clear them, before you continue",
					);
					return;
				}
				for (const r of typed) {
					const after = await makeRow(r, current);
					if (!after) return;
					current = after;
					dropRow(r.key);
				}
			}
			const row = await persist(
				current ? { ...snaps, [hotelId]: current } : snaps,
			);
			if (row) {
				ctx.setBusiness({
					...ctx.business,
					rooms: hotels.reduce(
						(s, h) =>
							s +
							(h.id === hotelId && current ? current.rooms.length : h.rooms),
						0,
					),
				});
				ctx.goTo(nextStep("rooms"));
			}
		});

	const reloadAndPersist = async () => {
		const after = await load(hotelId);
		if (after) await persist({ ...snaps, [hotelId]: after });
	};

	if (hotels.length === 0) {
		return (
			<StepFrame step="rooms" onBack={() => ctx.goTo(prevStep("rooms"))}>
				<EmptyState
					title="Add a hotel first"
					hint="Rooms belong to a hotel. Go back one step and add one."
				>
					<button
						type="button"
						className={cn(btn.secondary, btn.small, "mt-2")}
						onClick={() => ctx.goTo("hotels")}
					>
						Back to hotels
					</button>
				</EmptyState>
			</StepFrame>
		);
	}

	const madeTypes = (snap?.types ?? [])
		.map((t) => ({
			...t,
			rooms: (snap?.rooms ?? [])
				.filter((r) => r.roomTypeId === t.id)
				.sort((a, b) => byRoomNumber(a.number, b.number)),
		}))
		.filter((t) => t.active || t.rooms.length > 0);
	const roomCount = snap ? snap.rooms.length : (hotel?.rooms ?? 0);

	return (
		<StepFrame
			step="rooms"
			subtitle={
				hotel
					? `${hotel.name} · ${roomCount} ${roomCount === 1 ? "room" : "rooms"} · build them from a type and a first number, or paste a list`
					: undefined
			}
			onBack={() => ctx.goTo(prevStep("rooms"))}
			onContinue={ctx.editable ? save : undefined}
			continueDisabled={!snap}
			pending={pending}
			footerNote={
				totalMade > 0
					? `${totalMade} rooms made across ${hotelsWithRooms} ${hotelsWithRooms === 1 ? "hotel" : "hotels"}`
					: "You can continue without rooms and add them later from Hotel setup."
			}
		>
			{hotels.length > 1 && (
				<PillTabs
					tabs={hotels.map((h) => ({
						key: h.id,
						label: h.name,
						count: snaps[h.id]?.rooms.length ?? h.rooms,
					}))}
					value={hotelId}
					onChange={setHotelId}
				/>
			)}
			{loadError && (
				<Note tone="danger">
					{loadError}.{" "}
					<button
						type="button"
						className="font-semibold underline"
						onClick={() => void load(hotelId)}
					>
						Try again
					</button>
				</Note>
			)}
			{!snap && !loadError && (
				<p className="flex items-center gap-2 text-[13px] text-ink-3">
					<Loader2Icon className="size-4 animate-spin" /> Reading {hotel?.name}
					's rooms…
				</p>
			)}

			{madeTypes.length > 0 && (
				<StepCard
					title={`Rooms made · ${snap?.rooms.length ?? 0}`}
					subtitle="Edit a type's name or price, change or delete a room. Features come from the template in step 6"
				>
					<div className="overflow-x-auto rounded-xl border border-line">
						<table className="w-full min-w-[560px] text-left text-[13px]">
							<thead>
								<tr className="border-b border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
									<th className="px-4 py-2">Type</th>
									<th className="px-4 py-2">Price a night</th>
									<th className="px-4 py-2">Numbers</th>
									<th className="px-4 py-2 text-right">Rooms</th>
									<th className="px-4 py-2" />
								</tr>
							</thead>
							<tbody>
								{madeTypes.map((t) => (
									<RoomTypeRows
										key={t.id}
										type={t}
										open={!!shown[t.id]}
										editable={ctx.editable}
										onToggle={() =>
											setShown((s) => ({ ...s, [t.id]: !s[t.id] }))
										}
										onEditType={() => setEditType(t)}
										onEditRoom={setEditRoom}
										onDeleteRoom={setRemoveRoom}
										onDeleteType={() =>
											busy(async () => {
												const ok = await call(
													() => deleteRoomType(t.id, hotelId),
													`${t.name} removed`,
												);
												if (ok === null) return;
												await reloadAndPersist();
											})
										}
									/>
								))}
							</tbody>
						</table>
					</div>
				</StepCard>
			)}

			{ctx.editable && (
				<StepCard
					title="Room types and numbers"
					subtitle="Each row makes a type and its rooms, numbered from the first number up. A row naming a type above adds rooms to it"
				>
					<div className="flex flex-col gap-3">
						<div className="hidden grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.8fr_auto] gap-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3 md:grid">
							<span>Type</span>
							<span>Price a night</span>
							<span>Rooms</span>
							<span>First number</span>
							<span>Floor</span>
							<span className="w-[132px]" />
						</div>
						{rows.map((row) => {
							const e = errors[row.key] ?? {};
							const preview =
								!checkRoomCount(row.count) && !checkRoomStart(row.start)
									? `Makes ${ranges(roomNumbers(row.start, Number(row.count)))}`
									: null;
							const cell = (
								field: keyof RowErrors,
								label: string,
								placeholder: string,
								numeric = false,
							) => (
								<div className="flex min-w-0 flex-col gap-1">
									<input
										value={row[field]}
										onChange={(ev) => {
											patch(row.key, { [field]: ev.target.value });
											if (e[field])
												setErrors((all) => ({
													...all,
													[row.key]: { ...all[row.key], [field]: undefined },
												}));
										}}
										placeholder={placeholder}
										inputMode={numeric ? "numeric" : undefined}
										className={cn(inputCls, e[field] && "border-danger")}
										aria-label={label}
										aria-invalid={!!e[field]}
									/>
									{e[field] && (
										<span className="text-xs text-danger" data-error={field}>
											{e[field]}
										</span>
									)}
								</div>
							);
							return (
								<div key={row.key} className="flex flex-col gap-1">
									<div className="grid grid-cols-2 items-start gap-2 md:grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.8fr_auto]">
										{cell("name", "Room type", "e.g. Standard")}
										{cell("price", "Price a night", "e.g. ₦48,000", true)}
										{cell("count", "Number of rooms", "e.g. 20", true)}
										{cell("start", "First room number", "e.g. 101")}
										{cell("floor", "Floor", "e.g. 1")}
										<div className="flex items-center gap-1">
											<button
												type="button"
												className={cn(btn.primary, "whitespace-nowrap")}
												disabled={pending || !snap}
												onClick={() => createRow(row)}
											>
												Make rooms
											</button>
											<button
												type="button"
												className={cn(btn.icon, "size-[38px]")}
												aria-label="Remove row"
												disabled={rows.length === 1 && !filled(row)}
												onClick={() => {
													const rest = rows.filter((r) => r.key !== row.key);
													setRows(rest.length ? rest : [blankRow()]);
												}}
											>
												<Trash2Icon className="size-4" />
											</button>
										</div>
									</div>
									{preview && !e.start && (
										<span className="text-xs text-ink-3">{preview}</span>
									)}
								</div>
							);
						})}
						<p className="text-xs text-ink-3">
							Example: Standard · ₦48,000 · 20 rooms · from 101 makes 101–120.
							The grey text is only a hint; type every value.
						</p>
					</div>
				</StepCard>
			)}

			{ctx.editable && (
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() => setRows([...rows, blankRow()])}
					>
						<PlusIcon className="size-4" /> Add a row
					</button>
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() => setImportOpen(true)}
						disabled={!snap}
					>
						<ClipboardPasteIcon className="size-4" /> Paste a room list
					</button>
				</div>
			)}
			{lastResult && <ResultLine>{lastResult}</ResultLine>}

			{snap && (
				<ImportRoomsModal
					open={importOpen}
					onOpenChange={setImportOpen}
					hotelName={hotel?.name ?? ""}
					snap={snap}
					pending={pending}
					onImport={(lines) =>
						busy(async () => {
							const made: string[] = [];
							const idByName = new Map(
								snap.types
									.filter((t) => t.active)
									.map((t) => [key(t.name), t.id]),
							);
							for (const l of lines) {
								if (idByName.has(key(l.type))) continue;
								const type = await call(() =>
									createRoomType(
										{
											name: l.type.trim().replace(/\s+/g, " "),
											basePrice: l.price as number,
											capacityAdults: 2,
											capacityChildren: 0,
											facilities: [],
										},
										hotelId,
									),
								);
								if (!type) {
									for (const id of made) await deleteRoomType(id, hotelId);
									return;
								}
								idByName.set(key(l.type), type.id);
								made.push(type.id);
							}
							const result = await call(() =>
								createRoomsBulk(
									lines.map((l) => ({
										number: l.number,
										roomTypeId: idByName.get(key(l.type)) as string,
										floor: l.floor || undefined,
									})),
									hotelId,
									true,
								),
							);
							if (!result) {
								for (const id of made) await deleteRoomType(id, hotelId);
								return;
							}
							await reloadAndPersist();
							setLastResult(
								`${result.created} ${result.created === 1 ? "room" : "rooms"} imported: ${ranges(lines.map((l) => l.number).sort(byRoomNumber))}`,
							);
							setImportOpen(false);
							toast.success(`${result.created} rooms imported`);
						})
					}
				/>
			)}

			{editType && snap && (
				<EditTypeModal
					type={editType}
					others={snap.types.filter((t) => t.id !== editType.id && t.active)}
					pending={pending}
					onClose={() => setEditType(null)}
					onSave={(name, basePrice) =>
						busy(async () => {
							const ok = await call(
								() =>
									saveRoomType(
										{
											name,
											basePrice,
											capacityAdults: editType.capacityAdults || 2,
											capacityChildren: 0,
											facilities: [],
										},
										editType.id,
										undefined,
										hotelId,
									),
								`${name} saved`,
							);
							if (!ok) return;
							setEditType(null);
							await reloadAndPersist();
						})
					}
				/>
			)}

			{editRoom && snap && (
				<EditRoomModal
					room={editRoom}
					snap={snap}
					pending={pending}
					onClose={() => setEditRoom(null)}
					onSave={(input) =>
						busy(async () => {
							const ok = await call(
								() => updateHotelRoom(editRoom.id, input, hotelId),
								`Room ${input.number} saved`,
							);
							if (ok === null) return;
							setEditRoom(null);
							await reloadAndPersist();
						})
					}
				/>
			)}

			<ConfirmModal
				open={!!removeRoom}
				onOpenChange={(o) => !o && setRemoveRoom(null)}
				title={`Delete room ${removeRoom?.number ?? ""}?`}
				subtitle={`It comes off ${hotel?.name}'s rooms. A room that has had a booking can't be deleted; take it out of order instead.`}
				tone="danger"
				confirmLabel="Delete room"
				pending={pending}
				onConfirm={() =>
					busy(async () => {
						if (!removeRoom) return;
						const ok = await call(
							() => deleteRoom(removeRoom.id, hotelId),
							`Room ${removeRoom.number} deleted`,
						);
						setRemoveRoom(null);
						if (ok === null) return;
						await reloadAndPersist();
					})
				}
			/>
		</StepFrame>
	);
}

/** One type in the "Rooms made" table, with its rooms listed under it when opened. */
function RoomTypeRows({
	type,
	open,
	editable,
	onToggle,
	onEditType,
	onEditRoom,
	onDeleteRoom,
	onDeleteType,
}: {
	type: Snapshot["types"][number] & { rooms: Snapshot["rooms"] };
	open: boolean;
	editable: boolean;
	onToggle: () => void;
	onEditType: () => void;
	onEditRoom: (r: Snapshot["rooms"][number]) => void;
	onDeleteRoom: (r: Snapshot["rooms"][number]) => void;
	onDeleteType: () => void;
}) {
	return (
		<>
			<tr className="border-b border-line last:border-b-0">
				<td className="px-4 py-2 font-semibold text-ink">{type.name}</td>
				<td className="px-4 py-2 text-ink-2">{naira(type.basePrice)}</td>
				<td className="px-4 py-2 text-ink-2">
					{type.rooms.length ? ranges(type.rooms.map((r) => r.number)) : "—"}
				</td>
				<td className="px-4 py-2 text-right font-semibold text-ink">
					{type.rooms.length}
				</td>
				<td className="px-4 py-2">
					<div className="flex justify-end gap-1">
						{type.rooms.length > 0 && (
							<button
								type="button"
								className={cn(btn.secondary, btn.small)}
								onClick={onToggle}
							>
								{open ? "Hide rooms" : "Rooms"}
							</button>
						)}
						{editable && (
							<button
								type="button"
								className={cn(
									btn.secondary,
									btn.small,
									"flex items-center gap-1",
								)}
								onClick={onEditType}
								aria-label={`Edit ${type.name}`}
							>
								<PencilIcon className="size-3" /> Edit
							</button>
						)}
						{editable && type.rooms.length === 0 && (
							<button
								type="button"
								className={cn(btn.secondary, btn.small)}
								onClick={onDeleteType}
							>
								Remove type
							</button>
						)}
					</div>
				</td>
			</tr>
			{open &&
				type.rooms.map((r) => (
					<tr
						key={r.id}
						className="border-b border-line bg-subtle/40 text-[12px]"
					>
						<td className="px-4 py-[6px] pl-8 text-ink">Room {r.number}</td>
						<td className="px-4 py-[6px] text-ink-3">
							{r.floor
								? `Floor ${r.floor.replace(/^floor\s*/i, "")}`
								: "No floor"}
						</td>
						<td colSpan={2} />
						<td className="px-4 py-[6px]">
							{editable && (
								<div className="flex justify-end gap-1">
									<button
										type="button"
										className={cn(btn.secondary, btn.small)}
										onClick={() => onEditRoom(r)}
										aria-label={`Edit room ${r.number}`}
									>
										Edit
									</button>
									<button
										type="button"
										className={cn(btn.secondary, btn.small, "text-danger")}
										onClick={() => onDeleteRoom(r)}
										aria-label={`Delete room ${r.number}`}
									>
										Delete
									</button>
								</div>
							)}
						</td>
					</tr>
				))}
		</>
	);
}

function EditTypeModal({
	type,
	others,
	pending,
	onClose,
	onSave,
}: {
	type: Snapshot["types"][number];
	others: Snapshot["types"];
	pending: boolean;
	onClose: () => void;
	onSave: (name: string, basePrice: number) => void;
}) {
	const [name, setName] = useState(type.name);
	const [amount, setAmount] = useState(String(type.basePrice));
	const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
	const submit = () => {
		const e = {
			name:
				checkRoomType(name) ??
				(others.some((t) => key(t.name) === key(name))
					? `There is already a room type called ${name.trim()}`
					: undefined),
			price: checkRoomPrice(amount),
		};
		setErrors(e);
		if (!e.name && !e.price)
			onSave(name.trim().replace(/\s+/g, " "), price(amount));
	};
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`Edit ${type.name}`}
			subtitle="The name and price a night apply to every room of this type"
			icon={PencilIcon}
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={onClose}
						disabled={pending}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						onClick={submit}
						disabled={pending}
					>
						Save type
					</button>
				</>
			}
		>
			<FieldRow>
				<TextField
					label="Room type"
					value={name}
					onChange={setName}
					required
					error={errors.name}
				/>
				<TextField
					label="Price a night (₦)"
					value={amount}
					onChange={setAmount}
					required
					error={errors.price}
				/>
			</FieldRow>
		</Modal>
	);
}

function EditRoomModal({
	room,
	snap,
	pending,
	onClose,
	onSave,
}: {
	room: Snapshot["rooms"][number];
	snap: Snapshot;
	pending: boolean;
	onClose: () => void;
	onSave: (input: {
		number: string;
		roomTypeId: string;
		floor: string | null;
	}) => void;
}) {
	const [number, setNumber] = useState(room.number);
	const [typeId, setTypeId] = useState(room.roomTypeId);
	const [floor, setFloor] = useState(
		room.floor?.replace(/^floor\s*/i, "") ?? "",
	);
	const [errors, setErrors] = useState<{ number?: string; floor?: string }>({});
	const options = useMemo(
		() =>
			snap.types
				.filter((t) => t.active || t.id === room.roomTypeId)
				.map((t) => ({
					value: t.id,
					label: `${t.name} · ${naira(t.basePrice)}`,
				})),
		[snap.types, room.roomTypeId],
	);
	const submit = () => {
		const n = number.trim().toUpperCase();
		const e = {
			number: checkRoomStart(n)
				? "Use digits with up to 3 letters in front, like 101 or A101"
				: snap.rooms.some(
							(r) => r.id !== room.id && r.number.toUpperCase() === n,
						)
					? `Room ${n} already exists in this hotel`
					: undefined,
			floor: checkFloor(floor),
		};
		setErrors(e);
		if (!e.number && !e.floor)
			onSave({
				number: n,
				roomTypeId: typeId,
				floor: floor.trim().toUpperCase() || null,
			});
	};
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`Edit room ${room.number}`}
			subtitle="Fix the number, the type or the floor"
			icon={PencilIcon}
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={onClose}
						disabled={pending}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						onClick={submit}
						disabled={pending}
					>
						Save room
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<FieldRow>
					<TextField
						label="Room number"
						value={number}
						onChange={setNumber}
						required
						error={errors.number}
					/>
					<TextField
						label="Floor"
						value={floor}
						onChange={setFloor}
						placeholder="e.g. 1"
						error={errors.floor}
					/>
				</FieldRow>
				<SelectField
					label="Room type"
					value={typeId}
					onChange={setTypeId}
					options={options}
				/>
			</div>
		</Modal>
	);
}

type ImportLine = {
	line: number;
	number: string;
	type: string;
	price: number | null;
	floor: string;
};

/**
 * The pasted list, checked line by line: `number, type, price, floor` (price may be left out for a type that already
 * exists or is priced on an earlier line; floor is optional). Problems name the line; nothing is imported while any remain.
 */
function parseRoomList(
	text: string,
	snap: Snapshot,
): { lines: ImportLine[]; problems: string[] } {
	const problems: string[] = [];
	const lines: ImportLine[] = [];
	const existingNumbers = new Set(
		snap.rooms.map((r) => r.number.toUpperCase()),
	);
	const madeTypes = new Set(
		snap.types.filter((t) => t.active).map((t) => key(t.name)),
	);
	const priceOf = new Map<string, number>(
		snap.types.filter((t) => t.active).map((t) => [key(t.name), t.basePrice]),
	);
	const seen = new Map<string, number>();
	text.split(/\r?\n/).forEach((raw, i) => {
		const lineNo = i + 1;
		const t = raw.trim();
		if (!t) return;
		// Tabs when copied from a spreadsheet (so "48,000" stays one cell), commas otherwise.
		const cells = (t.includes("\t") ? t.split("\t") : t.split(",")).map((c) =>
			c.trim(),
		);
		// A header row copied with the spreadsheet ("Number, Type, Price, Floor").
		if (/^(room\s*)?(no\.?|number|#)$/i.test(cells[0] ?? "")) return;
		const [number = "", type = "", priceText = "", floor = ""] = cells;
		const n = number.toUpperCase();
		if (checkRoomStart(n)) {
			problems.push(
				`Line ${lineNo}: "${number || "(blank)"}" is not a room number, like 101 or A101`,
			);
			return;
		}
		const tErr = checkRoomType(type);
		if (tErr) {
			problems.push(`Line ${lineNo}: ${tErr}`);
			return;
		}
		let p: number | null = null;
		if (priceText) {
			const pErr = checkRoomPrice(priceText);
			if (pErr) {
				problems.push(`Line ${lineNo}: ${pErr}`);
				return;
			}
			p = price(priceText);
		}
		const known = priceOf.get(key(type));
		if (known === undefined) {
			if (p === null) {
				problems.push(
					`Line ${lineNo}: give ${type} a price a night (it is a new type)`,
				);
				return;
			}
			priceOf.set(key(type), p);
		} else if (p !== null && p !== known) {
			problems.push(
				`Line ${lineNo}: ${type} is ${naira(known)} a night${madeTypes.has(key(type)) ? " already" : " on an earlier line"}. One type has one price`,
			);
			return;
		}
		const fErr = checkFloor(floor);
		if (fErr) {
			problems.push(`Line ${lineNo}: ${fErr}`);
			return;
		}
		if (seen.has(n)) {
			problems.push(
				`Line ${lineNo}: room ${n} is listed twice (lines ${seen.get(n)} and ${lineNo})`,
			);
			return;
		}
		seen.set(n, lineNo);
		if (existingNumbers.has(n)) {
			problems.push(`Line ${lineNo}: room ${n} already exists in this hotel`);
			return;
		}
		lines.push({
			line: lineNo,
			number: n,
			type,
			price: p ?? known ?? null,
			floor: floor.toUpperCase(),
		});
	});
	if (lines.length > 500) problems.push("Up to 500 rooms at a time");
	return { lines, problems };
}

/** J7 · paste rows from the owner's spreadsheet: `number, type, price, floor` per line. */
function ImportRoomsModal({
	open,
	onOpenChange,
	hotelName,
	snap,
	pending,
	onImport,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	hotelName: string;
	snap: Snapshot;
	pending: boolean;
	onImport: (lines: ImportLine[]) => void;
}) {
	const [text, setText] = useState("");
	const { lines, problems } = useMemo(
		() => parseRoomList(text, snap),
		[text, snap],
	);
	const ready = lines.length > 0 && problems.length === 0;
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Paste a room list"
			subtitle={`${hotelName} · one room per line, from a spreadsheet or a text file`}
			icon={ClipboardPasteIcon}
			size="form"
			footerInfo={
				problems.length
					? `${problems.length} ${problems.length === 1 ? "problem" : "problems"} to fix`
					: lines.length
						? `${lines.length} rooms ready`
						: "Columns: number, type, price a night, floor"
			}
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
						disabled={pending}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						onClick={() => onImport(lines)}
						disabled={pending || !ready}
					>
						Import {ready ? lines.length : ""} rooms
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-3">
				<TextareaField
					label="Rooms"
					value={text}
					onChange={setText}
					rows={9}
					placeholder={
						"101, Standard, 48000, 1\n102, Standard, 48000, 1\n201, Deluxe, 75000, 2"
					}
					hint="Four columns: room number, type, price a night in naira, floor. Commas or tabs both work. Leave the price out for a type that already exists or was priced on an earlier line; the floor is optional."
				/>
				{problems.length > 0 && (
					<Note tone="danger">
						<ul className="flex flex-col gap-1" data-import-problems>
							{problems.slice(0, 8).map((p) => (
								<li key={p}>{p}</li>
							))}
							{problems.length > 8 && <li>… and {problems.length - 8} more</li>}
						</ul>
					</Note>
				)}
				<Note tone="info">
					Each type has one price. Numbers already in the hotel or listed twice
					are flagged, and nothing is imported until they are fixed.
				</Note>
			</div>
		</Modal>
	);
}
