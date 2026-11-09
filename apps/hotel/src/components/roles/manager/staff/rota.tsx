"use client";

import { addDays, format, parseISO } from "date-fns";
import { ArrowLeftRightIcon, SparklesIcon, UserCheckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	SelectField,
	TextareaField,
} from "@hospio/ui/shared/field";
import { fmtDay, humanize, plural } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import {
	cancelShift,
	changeShift,
	swapShifts,
} from "@hospio/api/actions/workforce";
import { useAction } from "@hospio/api/actions/use-action";
import type { ShiftRow, StaffRow } from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";

const today = () => format(new Date(), "yyyy-MM-dd");

/** The shift as the actions want it: who, when, and the times to keep. */
const asInput = (s: ShiftRow) => ({
	userId: s.staffId,
	userName: s.staffName,
	role: s.role,
	date: s.date,
	starts: s.starts,
	ends: s.ends,
});

export function RotaGrid({
	staff,
	shifts,
	onFindCover,
	onSwap,
	onAutoFill,
}: {
	staff: StaffRow[];
	shifts: ShiftRow[];
	onFindCover: (s: ShiftRow) => void;
	onSwap: (s: ShiftRow) => void;
	onAutoFill: () => void;
}) {
	const [start, setStart] = useState(() => addDays(new Date(), -1));
	const days = Array.from({ length: 7 }, (_, i) =>
		format(addDays(start, i), "yyyy-MM-dd"),
	);
	// People are whoever holds a shift in the data (identity does not carry a shift label), plus anyone the demo marks with one.
	const people = staff.filter(
		(s) => s.shift !== "—" || shifts.some((x) => x.staffId === s.id),
	);
	const gaps = shifts.filter(
		(s) => s.status === "ABSENT" && s.date >= today(),
	).length;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex items-center gap-1 rounded-control border border-line bg-card p-1">
					<button
						type="button"
						className="rounded-lg px-2 py-1 text-xs font-medium text-ink-2 hover:bg-subtle"
						onClick={() => setStart((d) => addDays(d, -7))}
					>
						← Prev week
					</button>
					<span className="px-2 text-[13px] font-semibold text-ink">
						{format(start, "d MMM")} – {format(addDays(start, 6), "d MMM")}
					</span>
					<button
						type="button"
						className="rounded-lg px-2 py-1 text-xs font-medium text-ink-2 hover:bg-subtle"
						onClick={() => setStart((d) => addDays(d, 7))}
					>
						Next week →
					</button>
				</div>
				<div className="ml-auto flex items-center gap-2">
					{gaps > 0 && (
						<StatusPill tone="danger">
							{plural(gaps, "gap")} to cover
						</StatusPill>
					)}
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={onAutoFill}
					>
						<SparklesIcon className="size-4" /> Auto-fill gaps
					</Button>
				</div>
			</div>
			<div className="overflow-x-auto rounded-card border border-line bg-card">
				<table className="w-full min-w-[900px] text-left">
					<thead>
						<tr className="border-b border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
							<th className="w-56 px-4 py-[10px]">Staff</th>
							{days.map((d) => (
								<th
									key={d}
									className={cn(
										"px-2 py-[10px] text-center",
										d === today() && "text-brand",
									)}
								>
									{format(parseISO(d), "EEE")}
									<span className="block text-[10px] font-medium normal-case tracking-normal">
										{format(parseISO(d), "d MMM")}
									</span>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{people.map((p) => (
							<tr key={p.id} className="border-b border-line last:border-b-0">
								<td className="px-4 py-2">
									<p className="text-[13px] font-semibold text-ink">
										{p.fullName}
									</p>
									<p className="text-xs text-ink-3">
										{humanize(p.role)} · {p.shift}
									</p>
								</td>
								{days.map((d) => {
									const s = shifts.find(
										(x) => x.staffId === p.id && x.date === d,
									);
									if (!s)
										return (
											<td
												key={d}
												className="px-2 py-2 text-center text-xs text-ink-3"
											>
												—
											</td>
										);
									const tone =
										s.status === "ABSENT"
											? "border-danger/40 bg-danger-soft text-danger"
											: s.status === "LATE"
												? "border-warning/40 bg-warning-soft text-warning"
												: s.status === "CANCELLED"
													? "border-line bg-subtle/40 text-ink-3 line-through"
													: s.status === "PRESENT"
														? "border-success/30 bg-success-soft text-success"
														: s.status === "COVERED" || s.status === "SWAPPED"
															? "border-info/30 bg-info-soft text-info"
															: "border-line bg-subtle/60 text-ink";
									return (
										<td key={d} className="px-1 py-1">
											<button
												type="button"
												onClick={() =>
													s.status === "ABSENT" ? onFindCover(s) : onSwap(s)
												}
												className={cn(
													"flex w-full flex-col items-center rounded-lg border px-1 py-[6px] text-[11px] font-semibold leading-tight hover:opacity-80",
													tone,
												)}
											>
												{s.starts}–{s.ends}
												<span className="text-[10px] font-medium opacity-80">
													{s.status === "ABSENT"
														? s.date >= today()
															? "Needs cover"
															: "Absent"
														: s.status === "SCHEDULED"
															? "Scheduled"
															: humanize(s.status)}
												</span>
											</button>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="text-xs text-ink-3">
				{people.length === 0
					? "Nobody is on the rota yet: open a person in All staff → Change shift to add their first shift. "
					: ""}
				Tap a shift to swap or cancel it, or a gap to find cover. Shifts are
				Morning 6am–2pm, Afternoon 2pm–10pm and Night 10pm–6am (ends the next
				morning); late after the minutes set in Hotel setup → Staff & shifts.
			</p>
		</div>
	);
}

export function FindCoverPanel({
	shift,
	staff,
	onClose,
}: {
	shift: ShiftRow | null;
	staff: StaffRow[];
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const [chosen, setChosen] = useState("");
	const candidates = shift
		? staff.filter(
				(s) =>
					s.role === shift.role &&
					s.id !== shift.staffId &&
					s.status === "ACTIVE",
			)
		: [];
	return (
		<SidePanel
			open={!!shift}
			onOpenChange={(o) => !o && onClose()}
			icon={UserCheckIcon}
			title="Find cover"
			subtitle={
				shift
					? `${shift.staffName} · ${fmtDay(shift.date)} · ${shift.starts}–${shift.ends}`
					: ""
			}
			footerInfo="The shift moves to the person you pick and the rota updates straight away"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={!chosen || pending}
						onClick={() =>
							shift &&
							run(
								() =>
									changeShift(shift.id, {
										...asInput(shift),
										userId: chosen,
										userName: staff.find((s) => s.id === chosen)?.fullName,
									}),
								`${staff.find((s) => s.id === chosen)?.fullName} now covers this shift`,
								() => {
									setChosen("");
									onClose();
								},
							)
						}
					>
						Give the shift
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				{candidates.length === 0 ? (
					<Note>
						Nobody else holds the {shift ? humanize(shift.role) : ""} role here.
						Add staff or ask another branch.
					</Note>
				) : (
					<ChoiceCards
						label={`Who can cover (${humanize(shift?.role ?? "")})`}
						value={chosen}
						onChange={setChosen}
						options={candidates.map((c) => ({
							value: c.id,
							label: c.fullName,
							hint: c.shift !== "—" ? `${c.shift} shift` : humanize(c.role),
						}))}
					/>
				)}
				<WhatHappens
					items={[
						"The shift moves to them for that day",
						"They see it under My shifts",
					]}
				/>
			</div>
		</SidePanel>
	);
}

export function SwapShiftModal({
	shift,
	shifts,
	staff,
	onClose,
}: {
	shift: ShiftRow | null;
	shifts: ShiftRow[];
	staff: StaffRow[];
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const [withId, setWithId] = useState("");
	const [note, setNote] = useState("");
	const others = shift
		? staff.filter((s) => s.role === shift.role && s.id !== shift.staffId)
		: [];
	return (
		<Modal
			open={!!shift}
			onOpenChange={(o) => !o && onClose()}
			icon={ArrowLeftRightIcon}
			title="Swap shift"
			subtitle={
				shift
					? `${shift.staffName} · ${fmtDay(shift.date)} ${shift.starts}–${shift.ends}`
					: ""
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						variant="outline"
						className={btn.dangerSoft}
						disabled={pending}
						onClick={() =>
							shift &&
							run(() => cancelShift(shift.id), "Shift cancelled", onClose)
						}
					>
						Cancel this shift
					</Button>
					<Button
						className={btn.primary}
						disabled={!withId || pending}
						onClick={() => {
							const other = staff.find((o) => o.id === withId);
							if (!shift || !other) return;
							const theirs = shifts.find(
								(x) =>
									x.staffId === withId &&
									x.date === shift.date &&
									x.status !== "CANCELLED",
							);
							run(
								() =>
									swapShifts(
										{ id: shift.id, ...asInput(shift) },
										theirs ? { id: theirs.id, ...asInput(theirs) } : null,
										{ userId: other.id, userName: other.fullName },
									),
								`Shift swapped with ${other.fullName}`,
								() => {
									setWithId("");
									onClose();
								},
							);
						}}
					>
						Swap
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Swap with"
					value={withId}
					onChange={setWithId}
					options={others.map((o) => ({
						value: o.id,
						label: o.fullName,
						hint: o.shift !== "—" ? `${o.shift} shift` : humanize(o.role),
					}))}
					placeholder="Choose a colleague"
				/>
				<TextareaField
					label="Note (optional)"
					value={note}
					onChange={setNote}
					placeholder="Why the swap"
				/>
			</div>
		</Modal>
	);
}

/** Each gap goes to the person of that role with the fewest shifts on the rota. */
function bestCover(gap: ShiftRow, staff: StaffRow[], shifts: ShiftRow[]) {
	const load = (id: string) =>
		shifts.filter((s) => s.staffId === id && s.status !== "CANCELLED").length;
	const busy = (id: string) =>
		shifts.some(
			(s) =>
				s.staffId === id && s.date === gap.date && s.status !== "CANCELLED",
		);
	return staff
		.filter(
			(p) =>
				p.role === gap.role &&
				p.id !== gap.staffId &&
				p.status === "ACTIVE" &&
				!busy(p.id),
		)
		.sort((a, b) => load(a.id) - load(b.id))[0];
}

export function AutoFillModal({
	open,
	shifts,
	staff,
	onClose,
}: {
	open: boolean;
	shifts: ShiftRow[];
	staff: StaffRow[];
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const gaps = shifts.filter((s) => s.status === "ABSENT" && s.date >= today());
	const matches = gaps.map((g) => ({
		gap: g,
		cover: bestCover(g, staff, shifts),
	}));
	const fillable = matches.filter((m) => m.cover);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			icon={SparklesIcon}
			title="Auto-fill gaps"
			subtitle={`${plural(gaps.length, "uncovered shift")} this week`}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || fillable.length === 0}
						onClick={() =>
							run(
								async () => {
									for (const m of fillable) {
										const r = await changeShift(m.gap.id, {
											...asInput(m.gap),
											userId: m.cover?.id ?? "",
											userName: m.cover?.fullName,
										});
										if (!r.ok) return r;
									}
									return { ok: true as const, data: null };
								},
								`${plural(fillable.length, "shift")} handed to cover`,
								onClose,
							)
						}
					>
						Hand over
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-3">
				{gaps.length === 0 ? (
					<Note tone="success">Every shift this week is covered.</Note>
				) : (
					<ul className="divide-y divide-line rounded-xl border border-line">
						{matches.map(({ gap: g, cover }) => (
							<li
								key={g.id}
								className="flex items-center gap-3 px-3 py-[10px] text-[13px]"
							>
								<span className="w-24 font-medium text-ink">
									{fmtDay(g.date)}
								</span>
								<span className="flex-1 text-ink-2">
									{g.staffName} · {g.starts}–{g.ends}
								</span>
								<span className="text-xs text-ink-3">
									{cover
										? `→ ${cover.fullName}`
										: `→ nobody free in ${humanize(g.role)}`}
								</span>
							</li>
						))}
					</ul>
				)}
				<WhatHappens
					items={[
						"Each gap goes to the person with the fewest shifts in that role",
						"Nobody is given two shifts on one day",
						"You see the new name on the rota straight away",
					]}
				/>
			</div>
		</Modal>
	);
}
