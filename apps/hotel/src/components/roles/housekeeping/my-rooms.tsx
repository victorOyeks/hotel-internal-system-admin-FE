"use client";

import {
	AlertTriangleIcon,
	CameraIcon,
	CheckIcon,
	ClipboardCheckIcon,
	MoonIcon,
	PlayIcon,
	ShirtIcon,
	SparklesIcon,
	WineIcon,
	WrenchIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	SelectField,
	TextField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtTime, naira } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	askForLinen,
	chargeMinibar,
	finishTask,
	reportProblem,
	saveTaskChecklist,
	saveTaskNote,
	skipTask,
	startTask,
} from "@hospio/api/actions/housekeeping";
import { uploadWorkOrderPhoto } from "@hospio/api/actions/maintenance";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	CleaningTaskRow,
	MinibarPrice,
	RoomRow,
	StaffRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import {
	BigButton,
	RoomBadge,
	ShiftPill,
	Stepper,
} from "../shared-staff/tablet";

type Panel =
	| { kind: "task"; id: string }
	| { kind: "minibar"; id: string }
	| { kind: "problem"; id?: string }
	| { kind: "linen" }
	| { kind: "cant"; id: string }
	| null;

function statusPill(t: CleaningTaskRow) {
	switch (t.status) {
		case "IN_PROGRESS":
			return <StatusPill tone="brand">Cleaning now</StatusPill>;
		case "DONE":
			return <StatusPill tone="info">Waiting inspection</StatusPill>;
		case "INSPECTED":
			return <StatusPill tone="success">Done</StatusPill>;
		case "SENT_BACK":
			return <StatusPill tone="danger">Sent back</StatusPill>;
		case "SKIPPED":
			return <StatusPill tone="grey">Do not disturb</StatusPill>;
		default:
			return <StatusPill tone="warning">To do</StatusPill>;
	}
}

/**
 * Housekeeping · My rooms today (Figma 3238:14342) with the checklist, minibar, problem, linen and can't-clean flows. Minibar prices
 * come from Hotel setup (price list MINIBAR); the note for the supervisor and "try again at" are saved on the task; a problem goes to
 * maintenance with its urgency (and can take the room out of order) and an optional photo; linen requests appear on laundry's Linen.
 */
export function MyRoomsScreen({
	tasks,
	rooms,
	me,
	hotelName,
	minibarPrices = [],
	areas = [],
}: {
	tasks: CleaningTaskRow[];
	rooms: RoomRow[];
	me: StaffRow | null;
	hotelName: string;
	/** Active and inactive minibar prices from Hotel setup; only active ones are offered. */
	minibarPrices?: MinibarPrice[];
	/** The hotel's public areas (property areas and Hotel setup → Public areas) for "Report a problem → Where". */
	areas?: string[];
}) {
	const minibar = minibarPrices.filter((m) => m.active);
	const [list, setList] = useState(tasks);
	useEffect(() => setList(tasks), [tasks]);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [panel, setPanel] = useState<Panel>(null);
	const { run, pending } = useAction();

	useEffect(() => {
		if (open && !panel) setPanel({ kind: "task", id: open });
	}, [open, panel]);

	const close = () => {
		setPanel(null);
		void setOpen(null);
	};
	const update = (id: string, patch: Partial<CleaningTaskRow>) =>
		setList((ls) => ls.map((t) => (t.id === id ? { ...t, ...patch } : t)));
	const current =
		panel && "id" in panel && panel.id
			? (list.find((t) => t.id === panel.id) ?? null)
			: null;
	const roomOf = (t: CleaningTaskRow) => rooms.find((r) => r.id === t.roomId);

	const done = list.filter(
		(t) => t.status === "DONE" || t.status === "INSPECTED",
	).length;
	const order = (t: CleaningTaskRow) =>
		t.status === "IN_PROGRESS"
			? 0
			: t.priority && t.status === "TODO"
				? 1
				: t.status === "SENT_BACK"
					? 2
					: t.status === "TODO"
						? 3
						: t.status === "SKIPPED"
							? 4
							: 5;
	const sorted = [...list].sort((a, b) => order(a) - order(b));

	// checklist panel state
	const [note, setNote] = useState("");
	const [reason, setReason] = useState("DND");
	const [retry, setRetry] = useState("15:00");
	const [problem, setProblem] = useState({
		room: "",
		what: "",
		priority: "NORMAL",
	});
	const [ooo, setOoo] = useState(true);
	const [photo, setPhoto] = useState<File | null>(null);
	const photoTooBig = !!photo && photo.size > 2 * 1024 * 1024;
	/** The room the problem is in (a room number), or null for a public area. */
	const problemRoom =
		rooms.find((r) => r.number === problem.room) ??
		null;
	const [noteFor, setNoteFor] = useState<string | null>(null);
	const [linen, setLinen] = useState({
		"Bath towel": 6,
		"Hand towel": 6,
		"Bed sheet": 4,
		Pillowcase: 8,
	});
	const [bar, setBar] = useState<Record<string, number>>({});

	return (
		<>
			<PageHeader
				title="My rooms today"
				subtitle={`${hotelName} · ${me?.fullName ?? "Housekeeping"}`}
			>
				<ShiftPill until="2pm" />
			</PageHeader>

			<div className="flex items-center gap-5 rounded-card border border-line bg-card px-5 py-4">
				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<p className="text-[17px] font-bold text-ink">
						{done} of {list.length} rooms done
					</p>
					<ProgressBar value={done} max={list.length} />
				</div>
				<BigButton tone="secondary" onClick={() => setPanel({ kind: "linen" })}>
					<ShirtIcon className="size-5" /> Ask for linen
				</BigButton>
				<BigButton
					tone="secondary"
					onClick={() => {
						setProblem({ room: "", what: "", priority: "NORMAL" });
						setOoo(true);
						setPhoto(null);
						setPanel({ kind: "problem" });
					}}
				>
					<WrenchIcon className="size-5" /> Report a problem
				</BigButton>
			</div>

			<ul className="flex flex-col gap-3">
				{sorted.map((t) => {
					const room = roomOf(t);
					const active = t.status === "IN_PROGRESS";
					const title = `${t.kind === "DEPARTURE" ? "Departure clean" : t.kind === "DEEP" ? "Deep clean" : "Stay-over"}${room?.guestName && t.kind === "STAYOVER" ? ` · ${room.guestName}` : ""} · ${room?.typeName ?? ""}`;
					const sub =
						t.status === "SKIPPED"
							? `${t.note ?? "Do not disturb"}${t.retryAt ? ` · try again at ${t.retryAt}` : ""}`
							: t.status === "SENT_BACK"
								? `Sent back · ${t.note}`
								: t.status === "DONE" || t.status === "INSPECTED"
									? `Done ${fmtTime(t.doneAt ?? t.due)}`
									: active
										? `${t.guestArrives ? "Guest arrives today · " : ""}${t.startedAt ? `Started ${fmtTime(t.startedAt)}` : "In progress"}`
										: `${t.guestArrives ? "Guest arrives today" : t.kind === "DEEP" ? "Scheduled" : t.kind === "DEPARTURE" ? "Guest has left" : "Guest in the room"}${t.priority ? " · Rush" : ""}`;
					return (
						<li
							key={t.id}
							className={cn(
								"flex items-center gap-4 rounded-card border bg-card px-4 py-3",
								active ? "border-brand bg-brand-soft/20" : "border-line",
								(t.status === "INSPECTED" || t.status === "DONE") &&
									"opacity-70",
							)}
						>
							<RoomBadge number={t.roomNumber} active={active} />
							<button
								type="button"
								onClick={() => {
									setPanel({ kind: "task", id: t.id });
									void setOpen(t.id);
								}}
								className="min-w-0 flex-1 text-left"
							>
								<p
									className={cn(
										"text-[15px] font-semibold",
										active ? "text-brand" : "text-ink",
									)}
								>
									{title}
								</p>
								<p className="text-[13px] text-ink-3">{sub}</p>
							</button>
							{statusPill(t)}
							{t.status === "TODO" || t.status === "SENT_BACK" ? (
								<BigButton
									tone="secondary"
									onClick={() =>
										void run(
											() => startTask(t.id, t),
											`Room ${t.roomNumber} started`,
											(row) => {
												update(t.id, row);
												setPanel({ kind: "task", id: t.id });
												void setOpen(t.id);
											},
										)
									}
								>
									<PlayIcon className="size-4" /> Start
								</BigButton>
							) : active ? (
								<BigButton
									onClick={() => {
										setPanel({ kind: "task", id: t.id });
										void setOpen(t.id);
									}}
								>
									<PlayIcon className="size-4" /> Continue
								</BigButton>
							) : t.status === "SKIPPED" ? (
								<BigButton
									tone="secondary"
									onClick={() =>
										void run(
											() => startTask(t.id, t),
											`Room ${t.roomNumber} started`,
											(row) => update(t.id, row),
										)
									}
								>
									<MoonIcon className="size-4" /> Try again
								</BigButton>
							) : null}
						</li>
					);
				})}
			</ul>

			{/* Checklist panel */}
			<SidePanel
				open={panel?.kind === "task" && !!current}
				onOpenChange={(o) => !o && close()}
				title={current ? `Room ${current.roomNumber}` : ""}
				subtitle={
					current
						? `${current.kind === "DEPARTURE" ? "Departure clean" : current.kind === "DEEP" ? "Deep clean" : "Stay-over"} · ${roomOf(current)?.typeName ?? ""}${current.guestArrives ? " · guest arrives today" : ""}`
						: undefined
				}
				icon={SparklesIcon}
				width="lg"
				footerInfo={
					current
						? `${current.checklist.filter((c) => c.done).length} of ${current.checklist.length} ticked`
						: undefined
				}
				footer={
					current &&
					(current.status === "IN_PROGRESS" ||
						current.status === "TODO" ||
						current.status === "SENT_BACK") ? (
						<>
							<BigButton
								tone="ghost"
								onClick={() => setPanel({ kind: "cant", id: current.id })}
							>
								Can't clean
							</BigButton>
							<BigButton
								pending={pending}
								disabled={!current.checklist.every((c) => c.done)}
								onClick={() =>
									run(
										() => finishTask(current.id, current),
										`Room ${current.roomNumber} done · sent for inspection`,
										(row) => {
											update(current.id, row);
											close();
										},
									)
								}
							>
								<CheckIcon className="size-5" /> Mark done
							</BigButton>
						</>
					) : current ? (
						<BigButton tone="secondary" onClick={close}>
							Close
						</BigButton>
					) : undefined
				}
			>
				{current && (
					<div className="flex flex-col gap-5">
						{current.status === "SENT_BACK" && (
							<Note tone="danger">
								Sent back by your supervisor: {current.note}
							</Note>
						)}
						{current.status === "DONE" && (
							<Note tone="info">Waiting for the supervisor to inspect.</Note>
						)}
						{current.status === "INSPECTED" && (
							<Note tone="success">Inspected and passed.</Note>
						)}
						<PanelSection title="Checklist">
							<ul className="flex flex-col gap-2">
								{current.checklist.map((c, i) => (
									<li key={c.label}>
										<button
											type="button"
											disabled={
												current.status === "DONE" ||
												current.status === "INSPECTED"
											}
											onClick={() => {
												const checklist = current.checklist.map((x, j) =>
													j === i ? { ...x, done: !x.done } : x,
												);
												update(current.id, { checklist });
												void saveTaskChecklist(current.id, checklist, current);
											}}
											className={cn(
												"flex h-14 w-full items-center gap-3 rounded-control border px-4 text-left text-[15px] font-medium",
												c.done
													? "border-success/40 bg-success-soft text-ink"
													: "border-line bg-card text-ink hover:bg-subtle",
											)}
										>
											<span
												className={cn(
													"flex size-7 items-center justify-center rounded-full border-2",
													c.done
														? "border-success bg-success text-white"
														: "border-line-strong",
												)}
											>
												{c.done && <CheckIcon className="size-4" />}
											</span>
											{c.label}
										</button>
									</li>
								))}
							</ul>
						</PanelSection>
						<div className="grid grid-cols-2 gap-2">
							<BigButton
								tone="secondary"
								onClick={() => {
									setBar({});
									setPanel({ kind: "minibar", id: current.id });
								}}
							>
								<WineIcon className="size-5" /> Minibar
							</BigButton>
							<BigButton
								tone="secondary"
								onClick={() => {
									setProblem({
										room: current.roomNumber,
										what: "",
										priority: "NORMAL",
									});
									setOoo(true);
									setPhoto(null);
									setPanel({ kind: "problem", id: current.id });
								}}
							>
								<WrenchIcon className="size-5" /> Problem
							</BigButton>
						</div>
						<div className="flex flex-col gap-2">
							<TextareaField
								label="Note for the supervisor"
								value={noteFor === current.id ? note : (current.attendantNote ?? "")}
								onChange={(v) => {
									setNoteFor(current.id);
									setNote(v);
								}}
								placeholder="e.g. stain on the carpet near the window"
								rows={2}
								hint="Your supervisor sees it when they inspect the room"
							/>
							{noteFor === current.id &&
								note.trim() !== (current.attendantNote ?? "") && (
									<BigButton
										tone="secondary"
										pending={pending}
										onClick={() =>
											run(
												() => saveTaskNote(current.id, note, current),
												note.trim() ? "Note saved for the supervisor" : "Note cleared",
												(row) => {
													update(current.id, { attendantNote: row.attendantNote });
													setNoteFor(null);
												},
											)
										}
									>
										Save note
									</BigButton>
								)}
						</div>
					</div>
				)}
			</SidePanel>

			{/* Minibar panel */}
			<SidePanel
				open={panel?.kind === "minibar"}
				onOpenChange={(o) =>
					!o && setPanel(current ? { kind: "task", id: current.id } : null)
				}
				title="Minibar"
				subtitle={
					current
						? `Room ${current.roomNumber} · what was used goes on the guest's bill`
						: undefined
				}
				icon={WineIcon}
				footerInfo={`${naira(Object.entries(bar).reduce((s, [n, q]) => s + (minibar.find((m) => m.name === n)?.price ?? 0) * q, 0))} to post`}
				footer={
					<>
						<BigButton
							tone="secondary"
							onClick={() =>
								setPanel(current ? { kind: "task", id: current.id } : null)
							}
						>
							Back
						</BigButton>
						<BigButton
							pending={pending}
							disabled={Object.values(bar).every((q) => !q)}
							onClick={() =>
								current &&
								run(
									() =>
										chargeMinibar({
											roomId: current.roomId,
											items: Object.entries(bar)
												.filter(([, q]) => q > 0)
												.map(([n, q]) => `${q} × ${n}`)
												.join(", "),
											total: Object.entries(bar).reduce(
												(s, [n, q]) =>
													s +
													(minibar.find((m) => m.name === n)?.price ?? 0) * q,
												0,
											),
										}),
									"Minibar charges posted to the folio",
									() => setPanel({ kind: "task", id: current.id }),
								)
							}
						>
							Post charges
						</BigButton>
					</>
				}
			>
				{minibar.length === 0 && (
					<Note tone="info">
						No minibar prices yet. A manager adds them in Hotel setup →
						Housekeeping → Minibar prices; then they show here.
					</Note>
				)}
				<ul
					className={cn(
						"divide-y divide-line rounded-control border border-line",
						minibar.length === 0 && "hidden",
					)}
				>
					{minibar.map((m) => (
						<li key={m.name} className="flex items-center gap-3 px-4 py-3">
							<span className="min-w-0 flex-1">
								<span className="block text-[15px] font-semibold text-ink">
									{m.name}
								</span>
								<span className="block text-xs text-ink-3">
									{naira(m.price)}
								</span>
							</span>
							<Stepper
								value={bar[m.name] ?? 0}
								onChange={(v) => setBar({ ...bar, [m.name]: v })}
							/>
						</li>
					))}
				</ul>
				<p className="mt-3 text-xs text-ink-3">
					Restock what was used from the housekeeping store. Prices come from
					Hotel setup → Housekeeping → Minibar prices.
				</p>
			</SidePanel>

			{/* Report problem */}
			<SidePanel
				open={panel?.kind === "problem"}
				onOpenChange={(o) =>
					!o && (current ? setPanel({ kind: "task", id: current.id }) : close())
				}
				title="Report a problem"
				subtitle="Goes to Maintenance as a work order"
				icon={WrenchIcon}
				tone={problem.priority === "URGENT" ? "danger" : "default"}
				footer={
					<>
						<BigButton
							tone="secondary"
							onClick={() =>
								current ? setPanel({ kind: "task", id: current.id }) : close()
							}
						>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={!problem.what.trim() || !problem.room || photoTooBig}
							onClick={() => {
								const takeOut =
									problem.priority === "URGENT" && !!problemRoom && ooo;
								const back = () =>
									current
										? setPanel({ kind: "task", id: current.id })
										: close();
								run(
									() =>
										reportProblem({
											roomId: problemRoom?.id,
											roomNumber: problem.room || undefined,
											description: problem.what.trim(),
											priority: problem.priority as "LOW" | "NORMAL" | "URGENT",
											outOfOrder: takeOut,
										}),
									(r) =>
										r.outOfOrder
											? `Sent to Maintenance · Room ${problem.room} is out of order · front office told`
											: problem.priority === "URGENT"
												? "Sent to Maintenance as urgent · front office told"
												: "Sent to Maintenance",
									async (r) => {
										if (photo && r.repairId) {
											const form = new FormData();
											form.set("file", photo);
											const up = await uploadWorkOrderPhoto(r.repairId, form);
											if (up.ok) toast.success("Photo added to the work order");
											else toast.error(`The report was sent, but the photo wasn't: ${up.error}`);
										}
										setPhoto(null);
										back();
									},
								);
							}}
						>
							Send to Maintenance
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<SelectField
						label="Where"
						value={problem.room}
						onChange={(v) => setProblem({ ...problem, room: v })}
						options={[
							...Array.from(
								new Set([
									...list.map((t) => t.roomNumber),
									...rooms.map((r) => r.number),
								]),
							)
								.filter((n) => n && n !== "—")
								.map((n) => ({ value: n, label: `Room ${n}` })),
							...areas
								.filter((a) => !rooms.some((r) => r.number === a))
								.map((a) => ({ value: a, label: a })),
						]}
						placeholder="Room or area"
						required
					/>
					<TextareaField
						label="What's wrong"
						value={problem.what}
						onChange={(v) => setProblem({ ...problem, what: v })}
						placeholder="e.g. AC blowing warm air, shower head leaking"
					/>
					<ChoiceCards
						label="How urgent"
						value={problem.priority}
						onChange={(v) => setProblem({ ...problem, priority: v })}
						columns={3}
						options={[
							{ value: "LOW", label: "Can wait" },
							{ value: "NORMAL", label: "Today" },
							{ value: "URGENT", label: "Now", hint: "Due within 4 hours" },
						]}
					/>
					{problem.priority === "URGENT" && problemRoom && (
						<ToggleField
							label={`Take room ${problemRoom.number} out of order`}
							hint="Nobody can be checked in until Maintenance clears it. Not possible while a guest is checked in."
							checked={ooo}
							onChange={setOoo}
						/>
					)}
					<div className="flex flex-col gap-2">
						<p className="text-[13px] font-semibold text-ink">
							Photo <span className="font-normal text-ink-3">(optional)</span>
						</p>
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp"
							capture="environment"
							aria-label="Photo of the problem"
							onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
							className="block w-full text-[13px] text-ink file:mr-3 file:rounded-control file:border file:border-line file:bg-card file:px-3 file:py-2 file:font-semibold"
						/>
						{photoTooBig ? (
							<Note tone="danger">That photo is over 2 MB · take a smaller one.</Note>
						) : (
							<p className="text-xs text-ink-3">
								<CameraIcon className="mr-1 inline size-3" />
								JPEG, PNG or WebP up to 2 MB, added to the work order.
							</p>
						)}
					</div>

					{problem.priority === "URGENT" && (
						<WhatHappens
							tone="danger"
							items={[
								"Maintenance gets it as urgent, due within 4 hours; managers are told",
								problemRoom && ooo
									? `Room ${problemRoom.number} goes out of order until Maintenance clears it`
									: "The room stays in service",
								problemRoom
									? "Front office is told straight away"
									: "Front office is told about problems in rooms",
							]}
						/>
					)}
				</div>
			</SidePanel>

			{/* Ask for linen */}
			<Modal
				open={panel?.kind === "linen"}
				onOpenChange={(o) => !o && close()}
				title="Ask for linen"
				subtitle="Laundry brings it to your floor"
				icon={ShirtIcon}
				size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							onClick={() =>
								run(
									() =>
										askForLinen({
											items: Object.entries(linen)
												.filter(([, q]) => q > 0)
												.map(([n, q]) => `${q} × ${n}`)
												.join(", "),
										}),
									"Linen request sent · it is on laundry's Linen screen",
									close,
								)
							}
						>
							Send request
						</BigButton>
					</>
				}
			>
				<ul className="divide-y divide-line rounded-control border border-line">
					{Object.entries(linen).map(([n, q]) => (
						<li key={n} className="flex items-center gap-3 px-4 py-3">
							<span className="flex-1 text-[15px] font-medium text-ink">
								{n}
							</span>
							<Stepper
								value={q}
								onChange={(v) => setLinen({ ...linen, [n]: v })}
							/>
						</li>
					))}
				</ul>
				<p className="mt-3 text-xs text-ink-3">
					Laundry sees the request on their Linen screen and you get a notice
					when it is sent.
				</p>
			</Modal>

			{/* Can't clean */}
			<Modal
				open={panel?.kind === "cant"}
				onOpenChange={(o) =>
					!o && (current ? setPanel({ kind: "task", id: current.id }) : close())
				}
				title={`Can't clean ${current?.roomNumber ?? ""}`}
				subtitle="Say why so the supervisor can plan"
				icon={AlertTriangleIcon}
				size="confirm"
				footer={
					<>
						<BigButton
							tone="secondary"
							onClick={() =>
								current ? setPanel({ kind: "task", id: current.id }) : close()
							}
						>
							Back
						</BigButton>
						<BigButton
							pending={pending}
							onClick={() =>
								current &&
								run(
									() =>
										skipTask(
											current.id,
											reason === "DND"
												? "Do not disturb"
												: reason === "GUEST"
													? "Guest in the room"
													: "Something is broken",
											current,
											reason !== "OOO" ? retry : undefined,
										),
									`Room ${current.roomNumber} skipped${reason !== "OOO" && retry ? ` · try again at ${retry}` : ""}`,
									(row) => {
										update(current.id, row);
										close();
									},
								)
							}
						>
							Skip for now
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<ChoiceCards
						value={reason}
						onChange={setReason}
						options={[
							{
								value: "DND",
								label: "Do not disturb sign",
								hint: "Try again later",
							},
							{
								value: "GUEST",
								label: "Guest is in the room",
								hint: "They asked to come back",
							},
							{
								value: "OOO",
								label: "Something is broken",
								hint: "Report it to Maintenance",
							},
						]}
					/>
					{reason !== "OOO" && (
						<TextField
							label="Try again at"
							type="time"
							value={retry}
							onChange={setRetry}
						/>
					)}
					{reason === "OOO" && (
						<Note tone="warning">
							Use Report a problem after this so Maintenance gets it.
						</Note>
					)}
				</div>
			</Modal>
			<span className="hidden">
				<ClipboardCheckIcon />
			</span>
		</>
	);
}
