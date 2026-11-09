"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	BoxIcon,
	CalendarClockIcon,
	PauseIcon,
	PlayIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	SelectField,
	TextField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtDate } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	deleteSchedule,
	pauseSchedule,
	runDueSchedules,
	saveAsset,
	saveSchedule,
} from "@hospio/api/actions/maintenance";
import { useAction } from "@hospio/api/actions/use-action";
import type { MaintAssetRow, MaintScheduleRow } from "@hospio/api/data/types";
import { BigButton } from "../shared-staff/tablet";
import {
	CATEGORIES,
	type Person,
	categoryLabel,
	priorityLabel,
	priorityTone,
} from "./work-orders";

const lagosToday = () =>
	new Date(Date.now() + 3600_000).toISOString().slice(0, 10);

/**
 * Maintenance 2.x · Preventive: repeating schedules (each opens a work order on its due morning, once) and the assets
 * they are for. The supervisor and managers change them; technicians see them.
 */
export function PreventiveScreen({
	schedules: s0,
	assets: a0,
	rooms,
	technicians,
	canEdit,
	canRunNow,
}: {
	schedules: MaintScheduleRow[];
	assets: MaintAssetRow[];
	rooms: { id: string; number: string }[];
	technicians: Person[];
	canEdit: boolean;
	canRunNow: boolean;
}) {
	const [schedules, setSchedules] = useState(s0);
	const [assets, setAssets] = useState(a0);
	useEffect(() => setSchedules(s0), [s0]);
	useEffect(() => setAssets(a0), [a0]);
	const [editJob, setEditJob] = useState<MaintScheduleRow | "new" | null>(null);
	const [editAsset, setEditAsset] = useState<MaintAssetRow | "new" | null>(
		null,
	);
	const [removing, setRemoving] = useState<MaintScheduleRow | null>(null);
	const { run, pending } = useAction();
	const today = lagosToday();
	const patchJob = (j: MaintScheduleRow) =>
		setSchedules((js) =>
			js.some((x) => x.id === j.id)
				? js.map((x) => (x.id === j.id ? j : x))
				: [...js, j],
		);
	const patchAsset = (a: MaintAssetRow) =>
		setAssets((as) =>
			as.some((x) => x.id === a.id)
				? as.map((x) => (x.id === a.id ? a : x))
				: [...as, a],
		);

	const jobCols: ColumnDef<MaintScheduleRow, unknown>[] = [
		{
			id: "title",
			header: "Job",
			cell: ({ row: { original: j } }) => (
				<TwoLine
					primary={j.title}
					secondary={`${categoryLabel(j.category)} · ${j.where}`}
				/>
			),
		},
		{
			id: "every",
			header: "Every",
			cell: ({ row: { original: j } }) => `${j.everyDays} days`,
		},
		{
			id: "next",
			header: "Next due",
			cell: ({ row: { original: j } }) => (
				<span
					className={
						j.nextDue <= today && !j.paused
							? "font-semibold text-warning"
							: undefined
					}
				>
					{fmtDate(j.nextDue, "d MMM yyyy")}
				</span>
			),
		},
		{
			id: "last",
			header: "Last done",
			cell: ({ row: { original: j } }) =>
				j.lastDone ? fmtDate(j.lastDone, "d MMM yyyy") : "—",
		},
		{
			id: "who",
			header: "Goes to",
			cell: ({ row: { original: j } }) =>
				j.assignedToName ?? <span className="text-ink-3">The board</span>,
		},
		{
			id: "state",
			header: "",
			cell: ({ row: { original: j } }) => (
				<span className="flex items-center gap-2">
					<StatusPill tone={priorityTone[j.priority]} dot={false}>
						{priorityLabel[j.priority]}
					</StatusPill>
					{j.paused && <StatusPill tone="grey">Paused</StatusPill>}
					{canEdit && (
						<>
							<button
								type="button"
								aria-label={j.paused ? `Resume ${j.title}` : `Pause ${j.title}`}
								className="rounded-control p-1 text-ink-2 hover:bg-subtle"
								onClick={(e) => {
									e.stopPropagation();
									run(
										() => pauseSchedule(j.id, !j.paused),
										j.paused ? `${j.title} resumed` : `${j.title} paused`,
										patchJob,
									);
								}}
							>
								{j.paused ? (
									<PlayIcon className="size-4" />
								) : (
									<PauseIcon className="size-4" />
								)}
							</button>
							<button
								type="button"
								aria-label={`Delete ${j.title}`}
								className="rounded-control p-1 text-danger hover:bg-danger-soft"
								onClick={(e) => {
									e.stopPropagation();
									setRemoving(j);
								}}
							>
								<Trash2Icon className="size-4" />
							</button>
						</>
					)}
				</span>
			),
		},
	];
	const assetCols: ColumnDef<MaintAssetRow, unknown>[] = [
		{
			id: "name",
			header: "Asset",
			cell: ({ row: { original: a } }) => (
				<TwoLine primary={a.name} secondary={categoryLabel(a.category)} />
			),
		},
		{
			id: "where",
			header: "Where",
			cell: ({ row: { original: a } }) => a.where,
		},
		{
			id: "open",
			header: "Open work orders",
			cell: ({ row: { original: a } }) => a.openWorkOrders,
		},
		{
			id: "active",
			header: "",
			cell: ({ row: { original: a } }) =>
				a.active ? (
					<StatusPill tone="success">In use</StatusPill>
				) : (
					<StatusPill tone="grey">Retired</StatusPill>
				),
		},
	];

	return (
		<>
			<PageHeader
				title="Preventive maintenance"
				subtitle="Repeating jobs open a work order on their due morning · once per due date"
			>
				{canRunNow && (
					<BigButton
						tone="secondary"
						pending={pending}
						onClick={() =>
							run(runDueSchedules, (r) =>
								r.opened
									? `${r.opened} work order${r.opened === 1 ? "" : "s"} opened`
									: "Nothing is due today",
							)
						}
					>
						<CalendarClockIcon className="size-5" /> Open due jobs now
					</BigButton>
				)}
				{canEdit && (
					<BigButton onClick={() => setEditJob("new")}>
						<PlusIcon className="size-5" /> New schedule
					</BigButton>
				)}
			</PageHeader>
			{!canEdit && (
				<Note tone="info">
					The maintenance supervisor or a manager changes schedules and assets.
				</Note>
			)}
			<SectionCard
				title="Schedules"
				subtitle={`${schedules.filter((j) => !j.paused && j.nextDue <= today).length} due today`}
				flush
			>
				<DataTable
					columns={jobCols}
					data={schedules}
					onRowClick={canEdit ? (j) => setEditJob(j) : undefined}
					emptyTitle="No schedules yet"
					emptyHint="Add one, e.g. AC service every 90 days"
				/>
			</SectionCard>
			<SectionCard
				title="Assets"
				subtitle="What the schedules look after"
				flush
				headerRight={
					canEdit ? (
						<BigButton
							tone="secondary"
							className="h-10"
							onClick={() => setEditAsset("new")}
						>
							<BoxIcon className="size-4" /> Add asset
						</BigButton>
					) : undefined
				}
			>
				<DataTable
					columns={assetCols}
					data={assets}
					onRowClick={canEdit ? (a) => setEditAsset(a) : undefined}
					emptyTitle="No assets yet"
				/>
			</SectionCard>
			<ScheduleModal
				job={editJob}
				assets={assets}
				rooms={rooms}
				technicians={technicians}
				onClose={() => setEditJob(null)}
				onSaved={(j) => {
					patchJob(j);
					setEditJob(null);
				}}
			/>
			<AssetModal
				asset={editAsset}
				rooms={rooms}
				onClose={() => setEditAsset(null)}
				onSaved={(a) => {
					patchAsset(a);
					setEditAsset(null);
				}}
			/>
			<ConfirmModal
				open={!!removing}
				onOpenChange={(o) => !o && setRemoving(null)}
				title={`Delete ${removing?.title ?? "schedule"}?`}
				subtitle="It stops opening work orders. Work orders it already opened stay."
				confirmLabel="Delete"
				tone="danger"
				pending={pending}
				onConfirm={() =>
					removing &&
					run(
						() => deleteSchedule(removing.id),
						`${removing.title} deleted`,
						() => {
							setSchedules((js) => js.filter((x) => x.id !== removing.id));
							setRemoving(null);
						},
					)
				}
			/>
		</>
	);
}

function ScheduleModal({
	job,
	assets,
	rooms,
	technicians,
	onClose,
	onSaved,
}: {
	job: MaintScheduleRow | "new" | null;
	assets: MaintAssetRow[];
	rooms: { id: string; number: string }[];
	technicians: Person[];
	onClose: () => void;
	onSaved: (j: MaintScheduleRow) => void;
}) {
	const editing = job && job !== "new" ? job : null;
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState("AC");
	const [priority, setPriority] = useState("NORMAL");
	const [every, setEvery] = useState("90");
	const [nextDue, setNextDue] = useState("");
	const [target, setTarget] = useState<"ASSET" | "ROOM" | "AREA">("ASSET");
	const [assetId, setAssetId] = useState("");
	const [roomId, setRoomId] = useState("");
	const [area, setArea] = useState("");
	const [assignee, setAssignee] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (!job) return;
		const j = job === "new" ? null : job;
		setTitle(j?.title ?? "");
		setDescription(j?.description ?? "");
		setCategory(j?.category ?? "AC");
		setPriority(j?.priority ?? "NORMAL");
		setEvery(String(j?.everyDays ?? 90));
		setNextDue(j?.nextDue ?? "");
		setTarget(j ? (j.assetId ? "ASSET" : j.roomId ? "ROOM" : "AREA") : "ASSET");
		setAssetId(j?.assetId ?? "");
		setRoomId(j?.roomId ?? "");
		setArea(j?.area ?? "");
		setAssignee(j?.assignedTo ?? "");
	}, [job]);
	const n = Number(every);
	const everyOk = /^\d+$/.test(every) && n >= 1 && n <= 730;
	const pastDue =
		!!nextDue &&
		nextDue < lagosToday() &&
		(!editing || nextDue !== editing.nextDue);
	const whereOk =
		target === "ASSET"
			? !!assetId
			: target === "ROOM"
				? !!roomId
				: !!area.trim();
	const tech = technicians.find((t) => t.id === assignee);
	return (
		<Modal
			open={!!job}
			onOpenChange={(o) => !o && onClose()}
			title={editing ? `Edit ${editing.title}` : "New schedule"}
			subtitle="A repeating job that opens a work order when it falls due"
			icon={CalendarClockIcon}
			size="large"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Cancel
					</BigButton>
					<BigButton
						pending={pending}
						disabled={!title.trim() || !everyOk || pastDue || !whereOk}
						onClick={() =>
							run(
								() =>
									saveSchedule({
										id: editing?.id,
										title,
										description,
										category,
										priority,
										everyDays: n,
										nextDue: nextDue || null,
										assetId: target === "ASSET" ? assetId : null,
										roomId: target === "ROOM" ? roomId : null,
										area: target === "AREA" ? area : null,
										assignedTo: tech?.id ?? null,
										assignedToName: tech?.name ?? null,
									}),
								editing ? "Schedule saved" : "Schedule added",
								onSaved,
							)
						}
					>
						{editing ? "Save" : "Add schedule"}
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Job"
					value={title}
					onChange={setTitle}
					placeholder="e.g. AC service"
					required
				/>
				<div className="grid grid-cols-2 gap-3">
					<SelectField
						label="Category"
						value={category}
						onChange={setCategory}
						options={CATEGORIES.map((c) => ({
							value: c,
							label: categoryLabel(c),
						}))}
					/>
					<SelectField
						label="Priority"
						value={priority}
						onChange={setPriority}
						options={Object.entries(priorityLabel).map(([value, label]) => ({
							value,
							label,
						}))}
					/>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<TextField
						label="Every (days)"
						value={every}
						onChange={setEvery}
						error={everyOk ? undefined : "1 to 730 days"}
					/>
					<TextField
						label={editing ? "Next due" : "First due (optional)"}
						type="date"
						value={nextDue}
						onChange={setNextDue}
						error={pastDue ? "Pick today or later" : undefined}
						hint={editing ? undefined : "Blank: one interval from today"}
					/>
				</div>
				<ChoiceCards
					label="For"
					columns={3}
					value={target}
					onChange={setTarget}
					options={[
						{ value: "ASSET", label: "An asset" },
						{ value: "ROOM", label: "A room" },
						{ value: "AREA", label: "An area" },
					]}
				/>
				{target === "ASSET" ? (
					<SelectField
						label="Asset"
						value={assetId}
						onChange={setAssetId}
						options={assets
							.filter((a) => a.active)
							.map((a) => ({ value: a.id, label: a.name, hint: a.where }))}
						placeholder="Pick an asset"
					/>
				) : target === "ROOM" ? (
					<SelectField
						label="Room"
						value={roomId}
						onChange={setRoomId}
						options={rooms.map((r) => ({
							value: r.id,
							label: `Room ${r.number}`,
						}))}
						placeholder="Pick a room"
					/>
				) : (
					<TextField
						label="Area"
						value={area}
						onChange={setArea}
						placeholder="e.g. Generator house"
					/>
				)}
				<SelectField
					label="Goes to (optional)"
					value={assignee}
					onChange={setAssignee}
					options={technicians.map((t) => ({ value: t.id, label: t.name }))}
					placeholder="The maintenance board"
				/>
				<TextareaField
					label="Checklist (optional)"
					value={description}
					onChange={setDescription}
					rows={2}
					placeholder="e.g. Clean filters, check gas, test cold"
				/>
				<WhatHappens
					items={[
						"On the due morning (6am) a work order opens, once",
						"The next due date moves on by the interval",
						"Completing that work order records the job as done",
					]}
				/>
			</div>
		</Modal>
	);
}

function AssetModal({
	asset,
	rooms,
	onClose,
	onSaved,
}: {
	asset: MaintAssetRow | "new" | null;
	rooms: { id: string; number: string }[];
	onClose: () => void;
	onSaved: (a: MaintAssetRow) => void;
}) {
	const editing = asset && asset !== "new" ? asset : null;
	const [name, setName] = useState("");
	const [category, setCategory] = useState("OTHER");
	const [target, setTarget] = useState<"ROOM" | "AREA">("AREA");
	const [roomId, setRoomId] = useState("");
	const [area, setArea] = useState("");
	const [active, setActive] = useState(true);
	const { run, pending } = useAction();
	useEffect(() => {
		if (!asset) return;
		const a = asset === "new" ? null : asset;
		setName(a?.name ?? "");
		setCategory(a?.category ?? "OTHER");
		setTarget(a?.roomId ? "ROOM" : "AREA");
		setRoomId(a?.roomId ?? "");
		setArea(a?.area ?? "");
		setActive(a?.active ?? true);
	}, [asset]);
	return (
		<Modal
			open={!!asset}
			onOpenChange={(o) => !o && onClose()}
			title={editing ? `Edit ${editing.name}` : "Add asset"}
			icon={BoxIcon}
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Cancel
					</BigButton>
					<BigButton
						pending={pending}
						disabled={
							!name.trim() || (target === "ROOM" ? !roomId : !area.trim())
						}
						onClick={() =>
							run(
								() =>
									saveAsset({
										id: editing?.id,
										name,
										category,
										roomId: target === "ROOM" ? roomId : null,
										area: target === "AREA" ? area : null,
										active,
									}),
								editing ? "Asset saved" : "Asset added",
								onSaved,
							)
						}
					>
						{editing ? "Save" : "Add asset"}
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Name"
					value={name}
					onChange={setName}
					placeholder="e.g. Generator 2 (100 kVA)"
					required
				/>
				<SelectField
					label="Category"
					value={category}
					onChange={setCategory}
					options={CATEGORIES.map((c) => ({
						value: c,
						label: categoryLabel(c),
					}))}
				/>
				<ChoiceCards
					label="Where"
					columns={2}
					value={target}
					onChange={setTarget}
					options={[
						{ value: "ROOM", label: "In a room" },
						{ value: "AREA", label: "Elsewhere" },
					]}
				/>
				{target === "ROOM" ? (
					<SelectField
						label="Room"
						value={roomId}
						onChange={setRoomId}
						options={rooms.map((r) => ({
							value: r.id,
							label: `Room ${r.number}`,
						}))}
						placeholder="Pick a room"
					/>
				) : (
					<TextField
						label="Area"
						value={area}
						onChange={setArea}
						placeholder="e.g. Generator house"
					/>
				)}
				{editing && (
					<ToggleField
						label="In use"
						hint="Retired assets can't get new schedules"
						checked={active}
						onChange={setActive}
					/>
				)}
			</div>
		</Modal>
	);
}
