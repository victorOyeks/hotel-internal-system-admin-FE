"use client";

import {
	BellRingIcon,
	HandIcon,
	PackageSearchIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	SelectField,
	TextareaField,
	TextField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtDay, fmtWhen, plural } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { useListParams } from "@hospio/ui/shared/list-params";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import {
	disposeFoundItem,
	logFoundItem,
	returnFoundItem,
	tellFrontOffice,
	uploadFoundPhoto,
} from "@hospio/api/actions/ml";
import { useAction } from "@hospio/api/actions/use-action";
import type { PageResult } from "@hospio/api/data/paging";
import type { LostFoundRow } from "@hospio/api/data/types";
import { BigButton, ShiftPill } from "../shared-staff/tablet";

const lagosToday = () =>
	new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
const OTHER = "__other";
const HOW = ["In person", "Collected by someone they sent", "Sent by courier"];

const statusPill = (r: LostFoundRow) =>
	r.status === "FOUND" ? (
		<StatusPill tone="warning">Held</StatusPill>
	) : r.status === "RETURNED" ? (
		<StatusPill tone="success">Returned to {r.returnedTo}</StatusPill>
	) : (
		<StatusPill tone="grey">Disposed of</StatusPill>
	);

type Draft = {
	what: string;
	details: string;
	kind: "room" | "area";
	roomId: string;
	area: string;
	otherArea: string;
	finder: string;
	tell: boolean;
	photo: File | null;
};

/**
 * Lost & found (housekeeping and the front office): log an item found in a room or public area with who found it and an
 * optional photo, tell the front office by in-app notice, hand it back to its owner with the ID shown, or dispose of it with
 * a reason once the hotel's hold days have passed. Paged by housekeeping-service; the tab is the status.
 */
export function LostFoundScreen({
	items,
	opened,
	me,
	finders,
	rooms,
	areas,
}: {
	items: PageResult<LostFoundRow>;
	opened?: LostFoundRow | null;
	me: { id: string; name: string };
	finders: { id: string; name: string }[];
	rooms: { id: string; number: string }[];
	areas: string[];
}) {
	const router = useRouter();
	const list$ = useListParams({ extra: ["tab"] });
	const page = items.data;
	const [rows, setRows] = useState(page.content);
	useEffect(() => setRows(page.content), [page]);
	const tab = list$.params.tab ?? "held";
	const count = (k: string) => page.counts?.[k] ?? 0;
	const [adding, setAdding] = useQueryState("new", parseAsString);
	const [openId, setOpenId] = useQueryState("open", parseAsString);
	const [modal, setModal] = useState<null | "return" | "dispose">(null);
	const blank: Draft = {
		what: "",
		details: "",
		kind: "room",
		roomId: "",
		area: "",
		otherArea: "",
		finder: me.id,
		tell: true,
		photo: null,
	};
	const [draft, setDraft] = useState<Draft>(blank);
	const [to, setTo] = useState({ name: "", idNote: "", how: HOW[0] });
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	const current =
		rows.find((r) => r.id === openId) ??
		(opened?.id === openId ? opened : null) ??
		null;
	const patch = (r: LostFoundRow) =>
		setRows((rs) => rs.map((x) => (x.id === r.id ? r : x)));
	const people =
		finders.some((f) => f.id === me.id) || !me.id
			? finders
			: [{ id: me.id, name: me.name }, ...finders];
	const room = rooms.find((r) => r.id === draft.roomId);
	const where =
		draft.kind === "room"
			? room
				? `Room ${room.number}`
				: ""
			: draft.area === OTHER
				? draft.otherArea.trim()
				: draft.area;
	const photoTooBig = !!draft.photo && draft.photo.size > 2 * 1024 * 1024;
	const canDispose = current?.disposableFrom
		? current.disposableFrom <= lagosToday()
		: false;

	const log = () =>
		run(
			async () => {
				const finder = people.find((p) => p.id === draft.finder);
				const r = await logFoundItem({
					description: draft.what,
					details: draft.details,
					roomId: draft.kind === "room" ? draft.roomId : undefined,
					roomNumber: draft.kind === "room" ? room?.number : undefined,
					foundWhere: where,
					foundById: finder?.id,
					foundByName: finder?.name,
					tellFrontOffice: draft.tell,
				});
				if (!r.ok || !draft.photo) return r;
				const form = new FormData();
				form.set("file", draft.photo);
				const withPhoto = await uploadFoundPhoto(r.data.id, form);
				// The item is logged either way; a photo that failed is said, not hidden.
				return withPhoto.ok
					? withPhoto
					: {
							ok: false as const,
							error: `Item logged, but the photo was not saved: ${withPhoto.error}`,
						};
			},
			(r) =>
				draft.tell
					? `${r.description} logged · front office told`
					: `${r.description} logged`,
			(r) => {
				setRows((rs) => [r, ...rs]);
				void setAdding(null);
				setDraft(blank);
				router.refresh();
			},
		);

	return (
		<>
			<PageHeader
				title="Lost & found"
				subtitle={`${plural(count("FOUND"), "item")} held at the housekeeping office`}
			>
				<ShiftPill />
				<BigButton
					onClick={() => {
						setDraft(blank);
						void setAdding("1");
					}}
				>
					<PlusIcon className="size-5" /> Log a found item
				</BigButton>
			</PageHeader>
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{ key: "held", label: "Held", count: count("FOUND") },
							{ key: "returned", label: "Returned", count: count("RETURNED") },
							{
								key: "disposed",
								label: "Disposed of",
								count: count("DISPOSED"),
							},
							{ key: "all", label: "All", count: count("all") },
						]}
						value={tab}
						onChange={(k) => list$.set({ tab: k === "held" ? null : k })}
					/>
				}
				right={
					<SearchBox
						value={list$.search}
						onChange={list$.setSearch}
						placeholder="Item, room, place or person"
					/>
				}
			/>
			<DataTable
				data={rows}
				server={{ page, onPage: list$.goTo }}
				filtered={!!list$.params.q}
				onClearFilters={list$.clear}
				error={items.ok ? null : items.error}
				onRetry={() => router.refresh()}
				emptyTitle="Nothing here"
				onRowClick={(r) => void setOpenId(r.id)}
				columns={[
					{
						accessorKey: "description",
						header: "Item",
						cell: ({ row }) => (
							<TwoLine
								primary={row.original.description}
								secondary={`Found in ${row.original.foundWhere}`}
							/>
						),
					},
					{
						accessorKey: "foundAt",
						header: "Found",
						cell: ({ row }) => (
							<span className="text-ink-2">
								{fmtWhen(row.original.foundAt)} · {row.original.foundBy}
							</span>
						),
					},
					{
						accessorKey: "status",
						header: "Status",
						cell: ({ row }) => statusPill(row.original),
					},
				]}
			/>

			{/* Log a found item */}
			<SidePanel
				open={!!adding}
				onOpenChange={(o) => !o && void setAdding(null)}
				title="Log a found item"
				subtitle="Held at the housekeeping office until it is claimed"
				icon={PackageSearchIcon}
				footer={
					<>
						<BigButton tone="secondary" onClick={() => void setAdding(null)}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={!draft.what.trim() || !where || photoTooBig}
							onClick={log}
						>
							Log item
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<TextField
						label="What"
						value={draft.what}
						onChange={(v) => setDraft({ ...draft, what: v })}
						placeholder="e.g. black iPhone charger"
						required
					/>
					<ChoiceCards
						label="Where"
						value={draft.kind}
						onChange={(k) => setDraft({ ...draft, kind: k })}
						columns={2}
						options={[
							{ value: "room", label: "A room" },
							{ value: "area", label: "A public area" },
						]}
					/>
					{draft.kind === "room" ? (
						<SelectField
							label="Room"
							value={draft.roomId}
							onChange={(v) => setDraft({ ...draft, roomId: v })}
							options={rooms.map((r) => ({
								value: r.id,
								label: `Room ${r.number}`,
							}))}
							placeholder={rooms.length ? "Pick the room" : "No rooms set up"}
							required
						/>
					) : (
						<>
							<SelectField
								label="Area"
								value={draft.area}
								onChange={(v) => setDraft({ ...draft, area: v })}
								options={[
									...areas.map((a) => ({ value: a, label: a })),
									{ value: OTHER, label: "Somewhere else…" },
								]}
								placeholder="Pick the area"
								hint={
									areas.length === 0
										? "Add the hotel's public areas in Hotel setup → Rooms"
										: undefined
								}
								required
							/>
							{draft.area === OTHER && (
								<TextField
									label="Where exactly"
									value={draft.otherArea}
									onChange={(v) => setDraft({ ...draft, otherArea: v })}
									placeholder="e.g. car park, staff canteen"
									required
								/>
							)}
						</>
					)}
					<TextareaField
						label="Details"
						value={draft.details}
						onChange={(v) => setDraft({ ...draft, details: v })}
						placeholder="Colour, brand, anything that helps the guest describe it"
						rows={2}
					/>
					<SelectField
						label="Found by"
						value={draft.finder}
						onChange={(v) => setDraft({ ...draft, finder: v })}
						options={people.map((p) => ({
							value: p.id,
							label: p.id === me.id ? `${p.name} (you)` : p.name,
						}))}
					/>
					<div className="flex flex-col gap-2">
						<span className="text-[13px] font-semibold text-ink">
							Photo (optional)
						</span>
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp"
							aria-label="Photo"
							onChange={(e) =>
								setDraft({ ...draft, photo: e.target.files?.[0] ?? null })
							}
							className="block w-full text-[13px] text-ink file:mr-3 file:rounded-control file:border file:border-line file:bg-card file:px-3 file:py-2 file:font-semibold"
						/>
						{photoTooBig ? (
							<Note tone="danger">
								That photo is over 2 MB · take a smaller one.
							</Note>
						) : (
							<p className="text-xs text-ink-3">
								JPEG, PNG or WebP, up to 2 MB.
							</p>
						)}
					</div>
					<ToggleField
						label="Tell the front office"
						hint="They get a notice so they can answer a guest who asks"
						checked={draft.tell}
						onChange={(v) => setDraft({ ...draft, tell: v })}
					/>
				</div>
			</SidePanel>

			{/* One item */}
			<SidePanel
				open={!!current && !modal}
				onOpenChange={(o) => !o && void setOpenId(null)}
				title={current?.description ?? ""}
				subtitle={
					current
						? `Found in ${current.foundWhere} · ${fmtWhen(current.foundAt)}`
						: undefined
				}
				icon={PackageSearchIcon}
				footer={
					current?.status === "FOUND" ? (
						<>
							<BigButton
								tone="secondary"
								pending={pending}
								onClick={() =>
									run(
										() => tellFrontOffice(current.id),
										"Front office told",
										patch,
									)
								}
							>
								<BellRingIcon className="size-5" /> Tell front office
							</BigButton>
							<BigButton tone="dangerSoft" onClick={() => setModal("dispose")}>
								<Trash2Icon className="size-5" /> Dispose
							</BigButton>
							<BigButton onClick={() => setModal("return")}>
								<HandIcon className="size-5" /> Return
							</BigButton>
						</>
					) : (
						<BigButton tone="secondary" onClick={() => void setOpenId(null)}>
							Close
						</BigButton>
					)
				}
			>
				{current && (
					<div className="flex flex-col gap-5">
						<div>{statusPill(current)}</div>
						{current.hasPhoto && (
							<img
								src={`/api/lost-found/${current.id}/photo`}
								alt={current.description}
								className="max-h-64 w-full rounded-xl border border-line object-contain"
							/>
						)}
						<PanelSection title="Found">
							<DetailList
								columns={2}
								items={[
									{ label: "Where", value: current.foundWhere },
									{ label: "By", value: current.foundBy },
									{ label: "When", value: fmtWhen(current.foundAt) },
									{
										label: "Front office",
										value: current.frontOfficeToldAt
											? `Told ${fmtWhen(current.frontOfficeToldAt)}`
											: "Not told",
									},
									...(current.details
										? [{ label: "Details", value: current.details }]
										: []),
								]}
							/>
						</PanelSection>
						{current.status === "RETURNED" && (
							<PanelSection title="Returned">
								<DetailList
									columns={2}
									items={[
										{ label: "To", value: current.returnedTo ?? "—" },
										{ label: "ID shown", value: current.returnIdNote ?? "—" },
										{ label: "How", value: current.returnHow ?? "—" },
										{
											label: "Handed over by",
											value: current.returnedBy ?? "—",
										},
										{
											label: "When",
											value: current.returnedAt
												? fmtWhen(current.returnedAt)
												: "—",
										},
									]}
								/>
							</PanelSection>
						)}
						{current.status === "DISPOSED" && (
							<PanelSection title="Disposed of">
								<DetailList
									columns={2}
									items={[
										{ label: "Why", value: current.disposeReason ?? "—" },
										{ label: "By", value: current.disposedBy ?? "—" },
										{
											label: "When",
											value: current.disposedAt
												? fmtWhen(current.disposedAt)
												: "—",
										},
									]}
								/>
							</PanelSection>
						)}
						{current.status === "FOUND" && current.disposableFrom && (
							<Note tone="info">
								Kept {current.holdDays ?? 90} days ·{" "}
								{canDispose
									? "it can be disposed of now if nobody claims it"
									: `it can be disposed of from ${fmtDay(current.disposableFrom)}`}
								.
							</Note>
						)}
					</div>
				)}
			</SidePanel>

			<Modal
				open={modal === "return" && !!current}
				onOpenChange={(o) => !o && setModal(null)}
				title="Return to its owner"
				subtitle={current?.description}
				icon={HandIcon}
				size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setModal(null)}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={!to.name.trim()}
							onClick={() =>
								current &&
								run(
									() =>
										returnFoundItem(current.id, {
											returnedTo: to.name,
											idNote: to.idNote,
											how: to.how,
										}),
									`Returned to ${to.name.trim()}`,
									(r) => {
										patch(r);
										setModal(null);
										setTo({ name: "", idNote: "", how: HOW[0] });
										router.refresh();
									},
								)
							}
						>
							Mark returned
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<TextField
						label="Returned to"
						value={to.name}
						onChange={(v) => setTo({ ...to, name: v })}
						placeholder="Guest's name"
						required
					/>
					<TextField
						label="ID shown"
						value={to.idNote}
						onChange={(v) => setTo({ ...to, idNote: v })}
						placeholder="e.g. NIN ending 4471, driver's licence"
					/>
					<SelectField
						label="How"
						value={to.how}
						onChange={(v) => setTo({ ...to, how: v })}
						options={HOW}
					/>
					<WhatHappens
						items={[
							`You are recorded as the person who handed it over (${me.name})`,
							"The item leaves the held list",
						]}
					/>
				</div>
			</Modal>

			<Modal
				open={modal === "dispose" && !!current}
				onOpenChange={(o) => !o && setModal(null)}
				title="Dispose of this item?"
				subtitle={current?.description}
				icon={Trash2Icon}
				size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setModal(null)}>
							Cancel
						</BigButton>
						<BigButton
							tone="danger"
							pending={pending}
							disabled={!reason.trim() || !canDispose}
							onClick={() =>
								current &&
								run(
									() => disposeFoundItem(current.id, reason),
									`${current.description} disposed of`,
									(r) => {
										patch(r);
										setModal(null);
										setReason("");
										router.refresh();
									},
								)
							}
						>
							Dispose
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					{!canDispose && current?.disposableFrom && (
						<Note tone="warning">
							Items are kept {current.holdDays ?? 90} days; this one can be
							disposed of from {fmtDay(current.disposableFrom)}.
						</Note>
					)}
					<TextareaField
						label="Why"
						value={reason}
						onChange={setReason}
						placeholder="e.g. unclaimed after 90 days, given to charity"
						rows={2}
					/>
					<WhatHappens
						tone="warning"
						items={[
							"The item is marked disposed of with your name and the reason",
							"It can't be returned afterwards",
						]}
					/>
				</div>
			</Modal>
		</>
	);
}
