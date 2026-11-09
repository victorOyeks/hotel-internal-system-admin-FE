"use client";

import { ShirtIcon, TruckIcon } from "lucide-react";
import { useState } from "react";
import { Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextareaField } from "@hospio/ui/shared/field";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import type { LinenRow } from "@hospio/api/demo/fixtures/tablet";
import { useNotConnectedAction } from "@hospio/api/demo/actions";
import { BigButton, ShiftPill, Stepper } from "../shared-staff/tablet";

/** Housekeeping · linen on hand per type and a request to Laundry. */
export function LinenScreen({ linen }: { linen: LinenRow[] }) {
	const [asking, setAsking] = useState(false);
	const [req, setReq] = useState<Record<string, number>>(() => Object.fromEntries(linen.map((l) => [l.name, Math.max(0, Math.round(l.par / 2) - l.clean)])));
	const [floor, setFloor] = useState("Floor A2 trolley");
	const [note, setNote] = useState("");
	const { run, pending } = useNotConnectedAction();
	const short = linen.filter((l) => l.clean < l.par * 0.5);

	return (
		<>
			<PageHeader title="Linen" subtitle="What's clean on the floors, what's dirty, what Laundry is washing">
				<ShiftPill />
				<BigButton onClick={() => setAsking(true)}><TruckIcon className="size-5" /> Ask Laundry for linen</BigButton>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Clean on floors" value={linen.reduce((s, l) => s + l.clean, 0)} icon={ShirtIcon} />
				<KpiCard label="Dirty waiting" value={linen.reduce((s, l) => s + l.dirty, 0)} icon={ShirtIcon} />
				<KpiCard label="In laundry" value={linen.reduce((s, l) => s + l.inLaundry, 0)} icon={ShirtIcon} />
				<KpiCard label="Below half par" value={short.length} icon={ShirtIcon} hint={short.map((l) => l.name).join(", ") || "All fine"} />
			</div>
			<SectionCard title="By type" subtitle="Par is the full set the hotel keeps · from Hotel setup → Housekeeping" flush>
				<table className="w-full text-left">
					<thead><tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="px-5 py-3">Type</th><th className="py-3">Clean</th><th className="py-3">Dirty</th><th className="py-3">In laundry</th><th className="py-3">Damaged</th><th className="py-3 pr-5">Of par</th></tr></thead>
					<tbody>
						{linen.map((l) => (
							<tr key={l.id} className="border-b border-line last:border-b-0">
								<td className="px-5 py-3 text-[15px] font-semibold text-ink">{l.name}</td>
								<td className="py-3 text-[15px] text-ink">{l.clean}</td>
								<td className="py-3 text-[15px] text-ink-2">{l.dirty}</td>
								<td className="py-3 text-[15px] text-ink-2">{l.inLaundry}</td>
								<td className="py-3">{l.damaged > 0 ? <StatusPill tone="warning">{l.damaged}</StatusPill> : <span className="text-ink-3">—</span>}</td>
								<td className="py-3 pr-5"><div className="flex w-40 flex-col gap-1"><span className="text-xs text-ink-3">{l.clean} of {l.par}</span><ProgressBar value={l.clean} max={l.par} tone={l.clean < l.par * 0.5 ? "warning" : undefined} /></div></td>
							</tr>
						))}
					</tbody>
				</table>
			</SectionCard>

			<Modal open={asking} onOpenChange={setAsking} title="Ask Laundry for linen" subtitle="Clean linen brought to a floor" icon={TruckIcon} size="form"
				footer={<><BigButton tone="secondary" onClick={() => setAsking(false)}>Cancel</BigButton><BigButton pending={pending} onClick={() => run("Request sent to Laundry", () => setAsking(false), { tone: "info" })}>Send request</BigButton></>}>
				<div className="flex flex-col gap-4">
					<SelectField label="Deliver to" value={floor} onChange={setFloor} options={["Floor A1 trolley", "Floor A2 trolley", "Floor A3 trolley", "Floor B1 trolley"]} />
					<ul className="divide-y divide-line rounded-control border border-line">
						{linen.map((l) => (
							<li key={l.id} className="flex items-center gap-3 px-4 py-2"><span className="flex-1 text-[15px] font-medium text-ink">{l.name}</span><span className="text-xs text-ink-3">{l.clean} clean</span><Stepper value={req[l.name] ?? 0} onChange={(v) => setReq({ ...req, [l.name]: v })} /></li>
						))}
					</ul>
					<TextareaField label="Note" value={note} onChange={setNote} rows={2} placeholder="e.g. before 2pm please" />
					<Note tone="info">Laundry sees it on their Linen tab and marks it sent when the trolley leaves.</Note>
				</div>
			</Modal>
		</>
	);
}
