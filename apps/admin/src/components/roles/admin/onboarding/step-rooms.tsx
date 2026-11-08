"use client";

import { ClipboardPasteIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createRoomsBulk, createRoomType } from "@hospio/api/actions/property";
import type { AdminOnboardingData } from "@hospio/api/types";
import { Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { TextareaField } from "@hospio/ui/shared/field";
import { naira } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { btn, input as inputCls } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import type { WizardCtx } from "./wizard";
import {
	nextStep,
	parseRows,
	prevStep,
	ResultLine,
	StepCard,
	StepFrame,
	useWizardSave,
} from "./shared";

/**
 * J6/J7 · step 5: room types and numbers per hotel. Each row creates the type (POST /property/room-types)
 * then its rooms in one go (POST /property/rooms/bulk), both with X-Hotel-Id of the hotel tab. Pasted
 * rows (`number,type,floor`) make any type they name and skip numbers that already exist.
 */

type ByHotel = NonNullable<AdminOnboardingData["rooms"]>["byHotel"];
type PendingRow = {
	key: number;
	name: string;
	price: string;
	count: string;
	start: string;
	floor: string;
};

const blankRow = (key: number, start = "101"): PendingRow => ({
	key,
	name: "",
	price: "",
	count: "",
	start,
	floor: "",
});

/** 101..(101+count-1) as strings, keeping any leading zeros the start number has. */
function numbersFrom(start: string, count: number): string[] {
	const n = Number.parseInt(start, 10);
	if (!Number.isFinite(n))
		return Array.from({ length: count }, (_, i) => `${start}${i + 1}`);
	return Array.from({ length: count }, (_, i) =>
		String(n + i).padStart(start.length, "0"),
	);
}

export function RoomsStep({ ctx }: { ctx: WizardCtx }) {
	const { hotels, data } = ctx;
	const [byHotel, setByHotel] = useState<ByHotel>(data.rooms?.byHotel ?? {});
	const [hotelId, setHotelId] = useState(hotels[0]?.id ?? "");
	const [rows, setRows] = useState<Record<string, PendingRow[]>>({});
	const [importOpen, setImportOpen] = useState(false);
	const [lastResult, setLastResult] = useState<string | null>(null);
	const { pending, call, busy } = useWizardSave();
	const hotel = hotels.find((h) => h.id === hotelId) ?? hotels[0];
	const pendingRows = rows[hotelId] ?? [blankRow(1)];
	const made = byHotel[hotelId] ?? { roomTypes: [], created: 0 };
	const totalMade = Object.values(byHotel).reduce((s, h) => s + h.created, 0);

	const patchRows = (next: PendingRow[]) =>
		setRows((r) => ({ ...r, [hotelId]: next }));
	const bumpHotelRooms = (id: string, by: number) =>
		ctx.setHotels((list) =>
			list.map((h) => (h.id === id ? { ...h, rooms: h.rooms + by } : h)),
		);

	/** Persist the created types and counts at once, so the ids survive a page refresh. */
	const persist = async (next: ByHotel) => {
		setByHotel(next);
		await ctx.saveStep("rooms", { byHotel: next });
	};

	const createRow = (row: PendingRow) =>
		busy(async () => {
			const price = Number(row.price.replace(/[^\d.]/g, ""));
			const count = Number.parseInt(row.count, 10);
			if (!row.name.trim() || !Number.isFinite(count) || count < 1) {
				toast.error("Give the type a name and how many rooms");
				return;
			}
			const type = await call(() =>
				createRoomType(
					{
						name: row.name.trim(),
						basePrice: Number.isFinite(price) ? price : 0,
						capacityAdults: 2,
						capacityChildren: 0,
						facilities: [],
					},
					hotelId,
				),
			);
			if (!type) return;
			const numbers = numbersFrom(row.start.trim() || "101", count);
			const result = await call(() =>
				createRoomsBulk(
					numbers.map((number) => ({
						number,
						roomTypeId: type.id,
						floor: row.floor.trim() || undefined,
					})),
					hotelId,
				),
			);
			if (!result) return;
			const entry = byHotel[hotelId] ?? { roomTypes: [], created: 0 };
			await persist({
				...byHotel,
				[hotelId]: {
					roomTypes: [
						...entry.roomTypes,
						{
							roomTypeId: type.id,
							name: type.name,
							price: type.basePrice,
							count: result.created,
						},
					],
					created: entry.created + result.created,
				},
			});
			bumpHotelRooms(hotelId, result.created);
			patchRows(
				pendingRows.filter((r) => r.key !== row.key).length
					? pendingRows.filter((r) => r.key !== row.key)
					: [
							blankRow(
								row.key + 1,
								String(Number.parseInt(row.start || "101", 10) + count),
							),
						],
			);
			setLastResult(
				`${result.created} ${result.created === 1 ? "room" : "rooms"} made as ${type.name}${result.skipped.length ? ` · ${result.skipped.length} skipped (already there: ${result.skipped.slice(0, 6).join(", ")}${result.skipped.length > 6 ? "…" : ""})` : ""}`,
			);
			toast.success(`${type.name}: ${result.created} rooms made`);
		});

	const importRows = (text: string) =>
		busy(async () => {
			const parsed = parseRows(text, ["number", "type", "floor"]).filter(
				(c) => c[0] && c[1],
			);
			if (parsed.length === 0) {
				toast.error(
					"Nothing to import. One room per line: number, type, floor",
				);
				return;
			}
			if (parsed.length > 500) {
				toast.error("Up to 500 rooms at a time");
				return;
			}
			const entry = byHotel[hotelId] ?? { roomTypes: [], created: 0 };
			const types = [...entry.roomTypes];
			const idByName = new Map(
				types.map((t) => [t.name.toLowerCase(), t.roomTypeId]),
			);
			for (const name of Array.from(new Set(parsed.map((c) => c[1].trim())))) {
				if (idByName.has(name.toLowerCase())) continue;
				const type = await call(() =>
					createRoomType(
						{
							name,
							basePrice: 0,
							capacityAdults: 2,
							capacityChildren: 0,
							facilities: [],
						},
						hotelId,
					),
				);
				if (!type) return;
				idByName.set(name.toLowerCase(), type.id);
				types.push({
					roomTypeId: type.id,
					name: type.name,
					price: 0,
					count: 0,
				});
			}
			const result = await call(() =>
				createRoomsBulk(
					parsed.map((c) => ({
						number: c[0],
						roomTypeId: idByName.get(c[1].trim().toLowerCase()) ?? "",
						floor: c[2]?.trim() || undefined,
					})),
					hotelId,
				),
			);
			if (!result) return;
			const skipped = new Set(result.skipped);
			const perType = new Map<string, number>();
			for (const c of parsed)
				if (!skipped.has(c[0]))
					perType.set(
						c[1].trim().toLowerCase(),
						(perType.get(c[1].trim().toLowerCase()) ?? 0) + 1,
					);
			await persist({
				...byHotel,
				[hotelId]: {
					roomTypes: types.map((t) => ({
						...t,
						count: t.count + (perType.get(t.name.toLowerCase()) ?? 0),
					})),
					created: entry.created + result.created,
				},
			});
			bumpHotelRooms(hotelId, result.created);
			setLastResult(
				`${result.created} of ${parsed.length} rooms imported${result.skipped.length ? ` · ${result.skipped.length} skipped (already there)` : ""}`,
			);
			setImportOpen(false);
			toast.success(`${result.created} rooms imported`);
		});

	const save = () =>
		busy(async () => {
			const row = await ctx.saveStep("rooms", { byHotel });
			if (row) {
				ctx.setBusiness({
					...ctx.business,
					rooms: hotels.reduce((s, h) => s + h.rooms, 0),
				});
				ctx.goTo(nextStep("rooms"));
			}
		});

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

	return (
		<StepFrame
			step="rooms"
			subtitle={
				hotel
					? `${hotel.name} · ${hotel.rooms} rooms · build them from a type and a first number, or paste a list`
					: undefined
			}
			onBack={() => ctx.goTo(prevStep("rooms"))}
			onContinue={ctx.editable ? save : undefined}
			pending={pending}
			footerNote={
				totalMade > 0
					? `${totalMade} rooms made across ${Object.keys(byHotel).length} ${Object.keys(byHotel).length === 1 ? "hotel" : "hotels"}`
					: "You can continue without rooms and add them later from Hotel setup."
			}
		>
			{hotels.length > 1 && (
				<PillTabs
					tabs={hotels.map((h) => ({
						key: h.id,
						label: h.name,
						count: h.rooms,
					}))}
					value={hotelId}
					onChange={setHotelId}
				/>
			)}

			{made.roomTypes.length > 0 && (
				<StepCard
					title="Room types made"
					subtitle="Prices and features can be changed any time in Hotel setup → Rooms"
				>
					<div className="overflow-hidden rounded-xl border border-line">
						<table className="w-full text-left text-[13px]">
							<thead>
								<tr className="border-b border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
									<th className="px-4 py-2">Type</th>
									<th className="px-4 py-2">Price a night</th>
									<th className="px-4 py-2 text-right">Rooms</th>
								</tr>
							</thead>
							<tbody>
								{made.roomTypes.map((t) => (
									<tr
										key={t.roomTypeId}
										className="border-b border-line last:border-b-0"
									>
										<td className="px-4 py-2 font-semibold text-ink">
											{t.name}
										</td>
										<td className="px-4 py-2 text-ink-2">
											{t.price ? (
												naira(t.price)
											) : (
												<span className="text-warning">Set in Hotel setup</span>
											)}
										</td>
										<td className="px-4 py-2 text-right font-semibold text-ink">
											{t.count}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</StepCard>
			)}

			{ctx.editable && (
				<StepCard
					title="Room types and numbers"
					subtitle="Each row makes a type and its rooms, numbered from the first number up"
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
						{pendingRows.map((row) => (
							<div
								key={row.key}
								className="grid grid-cols-2 gap-2 md:grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.8fr_auto]"
							>
								<input
									value={row.name}
									onChange={(e) =>
										patchRows(
											pendingRows.map((r) =>
												r.key === row.key ? { ...r, name: e.target.value } : r,
											),
										)
									}
									placeholder="Standard"
									className={inputCls}
									aria-label="Room type"
								/>
								<input
									value={row.price}
									onChange={(e) =>
										patchRows(
											pendingRows.map((r) =>
												r.key === row.key ? { ...r, price: e.target.value } : r,
											),
										)
									}
									placeholder="₦48,000"
									inputMode="numeric"
									className={inputCls}
									aria-label="Price a night"
								/>
								<input
									value={row.count}
									onChange={(e) =>
										patchRows(
											pendingRows.map((r) =>
												r.key === row.key ? { ...r, count: e.target.value } : r,
											),
										)
									}
									placeholder="20"
									inputMode="numeric"
									className={inputCls}
									aria-label="Number of rooms"
								/>
								<input
									value={row.start}
									onChange={(e) =>
										patchRows(
											pendingRows.map((r) =>
												r.key === row.key ? { ...r, start: e.target.value } : r,
											),
										)
									}
									placeholder="101"
									className={inputCls}
									aria-label="First room number"
								/>
								<input
									value={row.floor}
									onChange={(e) =>
										patchRows(
											pendingRows.map((r) =>
												r.key === row.key ? { ...r, floor: e.target.value } : r,
											),
										)
									}
									placeholder="1"
									className={inputCls}
									aria-label="Floor"
								/>
								<div className="flex items-center gap-1">
									<button
										type="button"
										className={cn(btn.primary, "whitespace-nowrap")}
										disabled={pending}
										onClick={() => createRow(row)}
									>
										Make rooms
									</button>
									<button
										type="button"
										className={cn(btn.icon, "size-[38px]")}
										aria-label="Remove row"
										disabled={pendingRows.length === 1}
										onClick={() =>
											patchRows(pendingRows.filter((r) => r.key !== row.key))
										}
									>
										<Trash2Icon className="size-4" />
									</button>
								</div>
							</div>
						))}
						<p className="text-xs text-ink-3">
							Example: Standard · ₦48,000 · 20 rooms · from 101 makes 101–120.
						</p>
					</div>
				</StepCard>
			)}

			{ctx.editable && (
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() =>
							patchRows([
								...pendingRows,
								blankRow((pendingRows.at(-1)?.key ?? 0) + 1),
							])
						}
					>
						<PlusIcon className="size-4" /> Add a row
					</button>
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() => setImportOpen(true)}
					>
						<ClipboardPasteIcon className="size-4" /> Paste a room list
					</button>
				</div>
			)}
			{lastResult && <ResultLine>{lastResult}</ResultLine>}
			{made.created > 0 && !lastResult && (
				<ResultLine>
					{made.created} rooms made for {hotel?.name} · features and areas come
					from the template in step 6
				</ResultLine>
			)}

			<ImportRoomsModal
				open={importOpen}
				onOpenChange={setImportOpen}
				hotelName={hotel?.name ?? ""}
				pending={pending}
				onImport={importRows}
			/>
		</StepFrame>
	);
}

/** J7 · paste rows from the owner's spreadsheet: `number, type, floor` per line. */
function ImportRoomsModal({
	open,
	onOpenChange,
	hotelName,
	pending,
	onImport,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	hotelName: string;
	pending: boolean;
	onImport: (text: string) => void;
}) {
	const [text, setText] = useState("");
	const count = parseRows(text, ["number", "type", "floor"]).filter(
		(c) => c[0] && c[1],
	).length;
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Paste a room list"
			subtitle={`${hotelName} · one room per line, from a spreadsheet or a text file`}
			icon={ClipboardPasteIcon}
			size="form"
			footerInfo={
				count > 0
					? `${count} rooms ready`
					: "Columns: number, type, floor (floor is optional)"
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
						onClick={() => onImport(text)}
						disabled={pending || count === 0}
					>
						Import {count > 0 ? count : ""} rooms
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-3">
				<TextareaField
					label="Rooms"
					value={text}
					onChange={setText}
					rows={10}
					placeholder={"101, Standard, 1\n102, Standard, 1\n201, Deluxe, 2"}
					hint="Copy the three columns from the spreadsheet and paste them here. Commas or tabs both work."
				/>
				<Note tone="info">
					Types that do not exist yet are made with no price. Numbers already in
					the hotel are skipped, not duplicated.
				</Note>
			</div>
		</Modal>
	);
}
