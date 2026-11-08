"use client";

import { addDays, format, parseISO } from "date-fns";
import { ArrowLeftRightIcon, SparklesIcon, UserCheckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Note } from "@/components/shared/detail-list";
import { ChoiceCards, SelectField, TextareaField } from "@/components/shared/field";
import { fmtDay, humanize, plural } from "@/components/shared/format";
import { Modal } from "@/components/shared/modal";
import { SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import type { ShiftRow, StaffRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

export function RotaGrid({ staff, shifts, onFindCover, onSwap, onAutoFill }: { staff: StaffRow[]; shifts: ShiftRow[]; onFindCover: (s: ShiftRow) => void; onSwap: (s: ShiftRow) => void; onAutoFill: () => void }) {
	const [start, setStart] = useState(() => addDays(new Date(), -1));
	const days = Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
	const people = staff.filter((s) => s.shift !== "—");
	const gaps = shifts.filter((s) => s.status === "ABSENT" && s.date >= today()).length;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex items-center gap-1 rounded-control border border-line bg-card p-1">
					<button type="button" className="rounded-lg px-2 py-1 text-xs font-medium text-ink-2 hover:bg-subtle" onClick={() => setStart((d) => addDays(d, -7))}>← Prev week</button>
					<span className="px-2 text-[13px] font-semibold text-ink">{format(start, "d MMM")} – {format(addDays(start, 6), "d MMM")}</span>
					<button type="button" className="rounded-lg px-2 py-1 text-xs font-medium text-ink-2 hover:bg-subtle" onClick={() => setStart((d) => addDays(d, 7))}>Next week →</button>
				</div>
				<div className="ml-auto flex items-center gap-2">
					{gaps > 0 && <StatusPill tone="danger">{plural(gaps, "gap")} to cover</StatusPill>}
					<Button variant="outline" className={btn.secondary} onClick={onAutoFill}>
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
								<th key={d} className={cn("px-2 py-[10px] text-center", d === today() && "text-brand")}>
									{format(parseISO(d), "EEE")}
									<span className="block text-[10px] font-medium normal-case tracking-normal">{format(parseISO(d), "d MMM")}</span>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{people.map((p) => (
							<tr key={p.id} className="border-b border-line last:border-b-0">
								<td className="px-4 py-2">
									<p className="text-[13px] font-semibold text-ink">{p.fullName}</p>
									<p className="text-xs text-ink-3">{humanize(p.role)} · {p.shift}</p>
								</td>
								{days.map((d) => {
									const s = shifts.find((x) => x.staffId === p.id && x.date === d);
									if (!s) return <td key={d} className="px-2 py-2 text-center text-xs text-ink-3">—</td>;
									const tone = s.status === "ABSENT" ? "border-danger/40 bg-danger-soft text-danger" : s.status === "PRESENT" ? "border-success/30 bg-success-soft text-success" : s.status === "COVERED" || s.status === "SWAPPED" ? "border-info/30 bg-info-soft text-info" : "border-line bg-subtle/60 text-ink";
									return (
										<td key={d} className="px-1 py-1">
											<button type="button" onClick={() => (s.status === "ABSENT" ? onFindCover(s) : onSwap(s))} className={cn("flex w-full flex-col items-center rounded-lg border px-1 py-[6px] text-[11px] font-semibold leading-tight hover:opacity-80", tone)}>
												{s.starts}–{s.ends}
												<span className="text-[10px] font-medium opacity-80">{s.status === "ABSENT" ? "Needs cover" : s.status === "SCHEDULED" ? "Scheduled" : humanize(s.status)}</span>
											</button>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="text-xs text-ink-3">Tap a shift to swap it, or a gap to find cover. Shift times come from Hotel setup → Staff & shifts.</p>
		</div>
	);
}

export function FindCoverPanel({ shift, staff, onClose }: { shift: ShiftRow | null; staff: StaffRow[]; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [chosen, setChosen] = useState("");
	const candidates = shift ? staff.filter((s) => s.role === shift.role && s.id !== shift.staffId && s.status === "ACTIVE") : [];
	return (
		<SidePanel
			open={!!shift}
			onOpenChange={(o) => !o && onClose()}
			icon={UserCheckIcon}
			title="Find cover"
			subtitle={shift ? `${shift.staffName} · ${fmtDay(shift.date)} · ${shift.starts}–${shift.ends}` : ""}
			footerInfo="The person you pick is asked on WhatsApp and the rota updates when they accept"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button>
					<Button className={btn.primary} disabled={!chosen || pending} onClick={() => run(`Cover request sent to ${staff.find((s) => s.id === chosen)?.fullName}`, onClose)}>Ask to cover</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				{candidates.length === 0 ? (
					<Note>Nobody else holds the {shift ? humanize(shift.role) : ""} role here. Add staff or ask another branch.</Note>
				) : (
					<ChoiceCards
						label={`Who can cover (${humanize(shift?.role ?? "")})`}
						value={chosen}
						onChange={setChosen}
						options={candidates.map((c, i) => ({ value: c.id, label: c.fullName, hint: `${c.shift} shift · ${i === 0 ? "free that day" : i === 1 ? "worked 32h this week" : "on the day before"}` }))}
					/>
				)}
				<WhatHappens items={["Their shift that day becomes a double or an extra", "Overtime is counted automatically in payroll"]} />
			</div>
		</SidePanel>
	);
}

export function SwapShiftModal({ shift, staff, onClose }: { shift: ShiftRow | null; staff: StaffRow[]; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [withId, setWithId] = useState("");
	const [note, setNote] = useState("");
	const others = shift ? staff.filter((s) => s.role === shift.role && s.id !== shift.staffId) : [];
	return (
		<Modal
			open={!!shift}
			onOpenChange={(o) => !o && onClose()}
			icon={ArrowLeftRightIcon}
			title="Swap shift"
			subtitle={shift ? `${shift.staffName} · ${fmtDay(shift.date)} ${shift.starts}–${shift.ends}` : ""}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button>
					<Button className={btn.primary} disabled={!withId || pending} onClick={() => run("Shift swapped · both told on WhatsApp", onClose)}>Swap</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField label="Swap with" value={withId} onChange={setWithId} options={others.map((o) => ({ value: o.id, label: o.fullName, hint: `${o.shift} shift` }))} placeholder="Choose a colleague" />
				<TextareaField label="Note (optional)" value={note} onChange={setNote} placeholder="Why the swap" />
			</div>
		</Modal>
	);
}

export function AutoFillModal({ open, shifts, onClose }: { open: boolean; shifts: ShiftRow[]; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const gaps = shifts.filter((s) => s.status === "ABSENT" && s.date >= today());
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			icon={SparklesIcon}
			title="Auto-fill gaps"
			subtitle={`${plural(gaps.length, "uncovered shift")} this week`}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button>
					<Button className={btn.primary} disabled={pending || gaps.length === 0} onClick={() => run(`${plural(gaps.length, "cover request")} sent`, onClose)}>Send requests</Button>
				</>
			}
		>
			<div className="flex flex-col gap-3">
				{gaps.length === 0 ? (
					<Note tone="success">Every shift this week is covered.</Note>
				) : (
					<ul className="divide-y divide-line rounded-xl border border-line">
						{gaps.map((g) => (
							<li key={g.id} className="flex items-center gap-3 px-3 py-[10px] text-[13px]">
								<span className="w-24 font-medium text-ink">{fmtDay(g.date)}</span>
								<span className="flex-1 text-ink-2">{g.staffName} · {g.starts}–{g.ends}</span>
								<span className="text-xs text-ink-3">→ best match: {humanize(g.role)} with fewest hours</span>
							</li>
						))}
					</ul>
				)}
				<WhatHappens items={["Each gap goes to the person with the fewest hours in that role", "Nobody is scheduled for more than 48h a week", "You see who accepted on the rota"]} />
			</div>
		</Modal>
	);
}
