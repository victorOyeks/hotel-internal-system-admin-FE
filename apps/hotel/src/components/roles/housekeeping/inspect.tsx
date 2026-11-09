"use client";

import {
	CheckIcon,
	ClipboardCheckIcon,
	ShuffleIcon,
	UndoIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { AvatarName, Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextareaField } from "@hospio/ui/shared/field";
import { fmtTime, naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { assignRoom, inspectTask } from "@hospio/api/actions/housekeeping";
import { useAction } from "@hospio/api/actions/use-action";
import { useNotConnectedAction } from "@hospio/api/demo/actions";
import type {
	CleaningTaskRow,
	RoomRow,
	StaffRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { BigButton, RoomBadge, ShiftPill } from "../shared-staff/tablet";

const writeOffs = [
	{
		id: "wo-1",
		item: "Bath towel × 3",
		reason: "Bleach stains",
		by: "Lola Eze",
		value: 12600,
	},
	{
		id: "wo-2",
		item: "Duvet cover × 1",
		reason: "Torn",
		by: "Lola Eze",
		value: 9500,
	},
];

/** Housekeeping supervisor: assign rooms (3241:14341), rooms to inspect (3241:14592), inspect / send back (3241:14696, 3241:14863), approve write-off (3278:9226). */
export function InspectScreen({
	tasks,
	rooms,
	attendants,
	demo,
}: {
	tasks: CleaningTaskRow[];
	rooms: RoomRow[];
	attendants: StaffRow[];
	demo: boolean;
}) {
	const [list, setList] = useState(tasks);
	useEffect(() => setList(tasks), [tasks]);
	const [tab, setTab] = useQueryState(
		"tab",
		parseAsString.withDefault("inspect"),
	);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [assigning, setAssigning] = useState(false);
	const [sendBack, setSendBack] = useState(false);
	const [reason, setReason] = useState("");
	const [writeOff, setWriteOff] = useState<(typeof writeOffs)[number] | null>(
		null,
	);
	const [pendingWriteOffs, setPendingWriteOffs] = useState(writeOffs);
	const { run, pending } = useAction();
	// Write-offs have no backend yet: they stay on the demo flow and are only shown in demo mode.
	const { run: demoRun, pending: demoPending } = useNotConnectedAction();

	const current = list.find((t) => t.id === open) ?? null;
	const toInspect = list.filter((t) => t.status === "DONE");
	const dirtyRooms = rooms.filter(
		(r) => r.state === "dirty" || r.state === "inspecting",
	);
	const close = () => {
		void setOpen(null);
		setSendBack(false);
		setReason("");
	};
	const update = (id: string, patch: Partial<CleaningTaskRow>) =>
		setList((ls) => ls.map((t) => (t.id === id ? { ...t, ...patch } : t)));

	const [assignment, setAssignment] = useState<Record<string, string>>(() =>
		Object.fromEntries(tasks.map((t) => [t.id, t.attendant])),
	);
	useEffect(
		() =>
			setAssignment(Object.fromEntries(tasks.map((t) => [t.id, t.attendant]))),
		[tasks],
	);
	const onShift = attendants.filter((a) => a.status === "ACTIVE");
	const assignRows = [
		...list,
		...dirtyRooms
			.filter((r) => !list.some((t) => t.roomId === r.id))
			.map((r) => ({
				id: `extra-${r.id}`,
				roomNumber: r.number,
				kind: "DEPARTURE" as const,
				attendant: "",
			})),
	];
	const autoSplit = () => {
		const next: Record<string, string> = {};
		list.forEach((t, i) => {
			next[t.id] = onShift[i % onShift.length]?.fullName ?? t.attendant;
		});
		setAssignment(next);
	};

	return (
		<>
			<PageHeader
				title="Inspect & assign"
				subtitle={`Supervisor · ${plural(toInspect.length, "room")} waiting for inspection · ${onShift.length} attendants on shift`}
			>
				<ShiftPill />
				<BigButton tone="secondary" onClick={() => setAssigning(true)}>
					<UsersIcon className="size-5" /> Assign rooms
				</BigButton>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="To inspect"
					value={toInspect.length}
					icon={ClipboardCheckIcon}
				/>
				<KpiCard
					label="Being cleaned"
					value={list.filter((t) => t.status === "IN_PROGRESS").length}
					icon={ClipboardCheckIcon}
				/>
				<KpiCard
					label="Still to do"
					value={
						list.filter((t) => t.status === "TODO" || t.status === "SENT_BACK")
							.length
					}
					icon={ClipboardCheckIcon}
					hint={`${list.filter((t) => t.guestArrives && t.status !== "INSPECTED").length} before arrivals`}
				/>
				<KpiCard
					label="Passed today"
					value={list.filter((t) => t.status === "INSPECTED").length}
					icon={CheckIcon}
				/>
			</div>
			<PillTabs
				tabs={[
					{ key: "inspect", label: "To inspect", count: toInspect.length },
					{ key: "all", label: "All rooms", count: list.length },
					...(demo
						? [
								{
									key: "writeoffs",
									label: "Write-offs",
									count: pendingWriteOffs.length,
								},
							]
						: []),
				]}
				value={tab}
				onChange={(k) => void setTab(k === "inspect" ? null : k)}
			/>

			{tab === "writeoffs" ? (
				<ul className="flex flex-col gap-3">
					{pendingWriteOffs.length === 0 && (
						<Note tone="success">Nothing waiting for approval.</Note>
					)}
					{pendingWriteOffs.map((w) => (
						<li
							key={w.id}
							className="flex items-center gap-4 rounded-card border border-line bg-card px-5 py-4"
						>
							<div className="min-w-0 flex-1">
								<p className="text-[15px] font-semibold text-ink">{w.item}</p>
								<p className="text-[13px] text-ink-3">
									{w.reason} · asked by {w.by} · {naira(w.value)}
								</p>
							</div>
							<BigButton tone="secondary" onClick={() => setWriteOff(w)}>
								Review
							</BigButton>
						</li>
					))}
				</ul>
			) : (
				<ul className="flex flex-col gap-3">
					{(tab === "inspect" ? toInspect : list).map((t) => (
						<li
							key={t.id}
							className="flex items-center gap-4 rounded-card border border-line bg-card px-4 py-3"
						>
							<RoomBadge number={t.roomNumber} />
							<button
								type="button"
								onClick={() => void setOpen(t.id)}
								className="min-w-0 flex-1 text-left"
							>
								<p className="text-[15px] font-semibold text-ink">
									{t.kind === "DEPARTURE"
										? "Departure clean"
										: t.kind === "DEEP"
											? "Deep clean"
											: "Stay-over"}{" "}
									· {t.attendant}
								</p>
								<p className="text-[13px] text-ink-3">
									{t.status === "DONE"
										? `Finished ${fmtTime(t.doneAt ?? t.due)} · ${t.guestArrives ? "guest arrives today" : "no arrival today"}`
										: (t.note ??
											(t.guestArrives ? `Arrival ${t.guestArrives}` : ""))}
								</p>
							</button>
							<StatusPill
								tone={
									t.status === "DONE"
										? "info"
										: t.status === "INSPECTED"
											? "success"
											: t.status === "IN_PROGRESS"
												? "brand"
												: t.status === "SENT_BACK"
													? "danger"
													: t.status === "SKIPPED"
														? "grey"
														: "warning"
								}
							>
								{t.status === "DONE"
									? "Inspect"
									: t.status === "INSPECTED"
										? "Passed"
										: t.status === "IN_PROGRESS"
											? "Cleaning"
											: t.status === "SENT_BACK"
												? "Sent back"
												: t.status === "SKIPPED"
													? "Skipped"
													: "To do"}
							</StatusPill>
							{t.status === "DONE" && (
								<BigButton onClick={() => void setOpen(t.id)}>
									<ClipboardCheckIcon className="size-5" /> Inspect
								</BigButton>
							)}
						</li>
					))}
					{tab === "inspect" && toInspect.length === 0 && (
						<Note tone="success">
							No rooms waiting. Attendants' finished rooms land here.
						</Note>
					)}
				</ul>
			)}

			{/* Inspect panel */}
			<SidePanel
				open={!!current}
				onOpenChange={(o) => !o && close()}
				title={current ? `Inspect ${current.roomNumber}` : ""}
				subtitle={
					current
						? `Cleaned by ${current.attendant}${current.guestArrives ? " · guest arrives today" : ""}`
						: undefined
				}
				icon={ClipboardCheckIcon}
				tone={sendBack ? "danger" : "default"}
				footer={
					current && current.status === "DONE" ? (
						sendBack ? (
							<>
								<BigButton tone="secondary" onClick={() => setSendBack(false)}>
									Back
								</BigButton>
								<BigButton
									tone="danger"
									pending={pending}
									disabled={!reason}
									onClick={() =>
										run(
											() => inspectTask(current.id, false, reason, current),
											`${current.roomNumber} sent back to ${current.attendant}`,
											(row) => {
												update(current.id, row);
												close();
											},
										)
									}
								>
									<UndoIcon className="size-5" /> Send back
								</BigButton>
							</>
						) : (
							<>
								<BigButton tone="dangerSoft" onClick={() => setSendBack(true)}>
									<XIcon className="size-5" /> Send back
								</BigButton>
								<BigButton
									pending={pending}
									onClick={() =>
										run(
											() => inspectTask(current.id, true, undefined, current),
											`${current.roomNumber} passed · room is ready`,
											(row) => {
												update(current.id, row);
												close();
											},
										)
									}
								>
									<CheckIcon className="size-5" /> Pass · room ready
								</BigButton>
							</>
						)
					) : (
						<BigButton tone="secondary" onClick={close}>
							Close
						</BigButton>
					)
				}
			>
				{current && (
					<div className="flex flex-col gap-5">
						{sendBack ? (
							<>
								<TextareaField
									label="What needs doing again"
									value={reason}
									onChange={setReason}
									placeholder="e.g. bathroom mirror still smudged, bin not emptied"
								/>
								<WhatHappens
									tone="danger"
									items={[
										`${current.attendant} gets an alert and the room goes back to their list`,
										"The room stays Not ready until it passes",
									]}
								/>
							</>
						) : (
							<>
								<PanelSection title="Checklist from the attendant">
									<ul className="flex flex-col gap-2">
										{current.checklist.map((c) => (
											<li
												key={c.label}
												className={cn(
													"flex h-12 items-center gap-3 rounded-control border px-4 text-[15px]",
													c.done
														? "border-success/40 bg-success-soft"
														: "border-danger/40 bg-danger-soft",
												)}
											>
												{c.done ? (
													<CheckIcon className="size-5 text-success" />
												) : (
													<XIcon className="size-5 text-danger" />
												)}
												{c.label}
											</li>
										))}
									</ul>
								</PanelSection>
								{current.note && (
									<Note tone="info">Attendant's note: {current.note}</Note>
								)}
								<WhatHappens
									items={[
										"Pass: the room shows Ready to the front desk at once",
										"Send back: say what's wrong and it returns to the attendant",
									]}
								/>
							</>
						)}
					</div>
				)}
			</SidePanel>

			{/* Assign rooms */}
			<SidePanel
				open={assigning}
				onOpenChange={setAssigning}
				title="Assign rooms"
				subtitle={`${plural(list.length, "room")} today · ${onShift.length} attendants on shift`}
				icon={UsersIcon}
				width="lg"
				footerInfo={
					<button
						type="button"
						onClick={autoSplit}
						className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
					>
						<ShuffleIcon className="size-3" /> Split evenly
					</button>
				}
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setAssigning(false)}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							onClick={() =>
								run(
									async () => {
										const changes = assignRows.filter(
											(t) =>
												assignment[t.id] && assignment[t.id] !== t.attendant,
										);
										for (const t of changes) {
											const person = onShift.find(
												(a) => a.fullName === assignment[t.id],
											);
											if (!person) continue;
											const real = list.find((x) => x.id === t.id);
											const r = await assignRoom(
												{
													taskId: real?.id,
													roomId: real?.roomId ?? t.id.replace("extra-", ""),
													roomNumber: t.roomNumber,
													kind: t.kind,
													attendantId: person.userId ?? person.id,
													attendantName: person.fullName,
												},
												real,
											);
											if (!r.ok) return r;
										}
										return { ok: true as const, data: null };
									},
									"Rooms assigned · attendants alerted",
									() => {
										setList((ls) =>
											ls.map((t) => ({
												...t,
												attendant: assignment[t.id] ?? t.attendant,
											})),
										);
										setAssigning(false);
									},
								)
							}
						>
							Save assignment
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-5">
					<PanelSection title="On shift">
						<div className="grid grid-cols-2 gap-2">
							{onShift.map((a) => (
								<div
									key={a.id}
									className="flex items-center gap-3 rounded-control border border-line px-3 py-2"
								>
									<AvatarName
										name={a.fullName}
										secondary={`${Object.values(assignment).filter((n) => n === a.fullName).length} rooms`}
										size="sm"
									/>
								</div>
							))}
						</div>
					</PanelSection>
					<PanelSection title="Rooms">
						<ul className="divide-y divide-line rounded-control border border-line">
							{assignRows.map((t) => (
								<li key={t.id} className="flex items-center gap-3 px-4 py-2">
									<span className="w-16 text-[15px] font-bold text-ink">
										{t.roomNumber}
									</span>
									<span className="flex-1 text-[13px] text-ink-3">
										{t.kind === "DEPARTURE"
											? "Departure"
											: t.kind === "DEEP"
												? "Deep clean"
												: "Stay-over"}
									</span>
									<div className="w-56">
										<SelectField
											label=""
											value={assignment[t.id] ?? ""}
											onChange={(v) =>
												setAssignment({ ...assignment, [t.id]: v })
											}
											options={onShift.map((a) => a.fullName)}
											placeholder="Unassigned"
										/>
									</div>
								</li>
							))}
						</ul>
					</PanelSection>
				</div>
			</SidePanel>

			{demo && (
				<ConfirmModal
					open={!!writeOff}
					onOpenChange={(o) => !o && setWriteOff(null)}
					title={`Write off ${writeOff?.item ?? ""}?`}
					subtitle={
						writeOff
							? `${writeOff.reason} · ${naira(writeOff.value)} of linen`
							: undefined
					}
					confirmLabel="Approve write-off"
					tone="danger"
					pending={demoPending}
					alternative={{
						label: "Decline · keep in stock",
						onClick: () =>
							writeOff &&
							demoRun(
								"Write-off declined",
								() => {
									setPendingWriteOffs((w) =>
										w.filter((x) => x.id !== writeOff.id),
									);
									setWriteOff(null);
								},
								{ tone: "info" },
							),
					}}
					onConfirm={() =>
						writeOff &&
						demoRun("Write-off approved · stock updated", () => {
							setPendingWriteOffs((w) => w.filter((x) => x.id !== writeOff.id));
							setWriteOff(null);
						})
					}
				>
					<WhatHappens
						tone="warning"
						items={[
							"The items leave the linen count for good",
							"The manager sees it on the stock movement report",
							"Above ₦50,000 the manager must approve instead",
						]}
					/>
				</ConfirmModal>
			)}
		</>
	);
}
