"use client";

import { CheckIcon, ClipboardCheckIcon, HandshakeIcon } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { DetailList } from "@/components/shared/detail-list";
import { EmptyState } from "@/components/shared/empty-state";
import { SelectField, TextareaField } from "@/components/shared/field";
import { fmtAgo, fmtLongDate } from "@/components/shared/format";
import { ConfirmModal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionCard } from "@/components/shared/section-card";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import type { BusinessRow, OnboardingRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { type AdminRole, ONBOARDING_STEPS } from "@/lib/demo/fixtures/platform-extra";
import { cn } from "@/lib/utils";
import { can, ReadOnlyNote } from "./shared";

export function OnboardingScreen({ role, rows, progress, businesses }: { role: AdminRole; rows: OnboardingRow[]; progress: Record<string, string[]>; businesses: BusinessRow[] }) {
	const [open, setOpen] = useQueryState("open");
	const [done, setDone] = useState<Record<string, string[]>>(progress);
	const { run, pending } = useDemoAction();
	const [handover, setHandover] = useState<OnboardingRow | null>(null);
	const selected = rows.find((r) => r.id === open) ?? null;
	const editable = can.editBusiness(role);
	const groups = [
		{ key: "IN_PROGRESS", label: "In progress", tone: "info" as const },
		{ key: "READY_FOR_HANDOVER", label: "Ready for handover", tone: "warning" as const },
		{ key: "DONE", label: "Handed over", tone: "success" as const },
	];
	const statusOf = (r: OnboardingRow) => (r.status === "DONE" ? "DONE" : (done[r.id]?.length ?? 0) >= ONBOARDING_STEPS.length - 1 ? "READY_FOR_HANDOVER" : "IN_PROGRESS");

	return (
		<>
			<PageHeader title="Onboarding" subtitle="Back-office setup for new businesses, step by step, then handover">
				{editable && <Link href="/dashboard/businesses?new=1" className={btn.primary}>Onboard a business</Link>}
			</PageHeader>
			{!editable && <ReadOnlyNote>Onboarding is run by Support.</ReadOnlyNote>}
			<div className="grid gap-4 md:grid-cols-3">
				{groups.map((g) => {
					const list = rows.filter((r) => statusOf(r) === g.key);
					return (
						<SectionCard key={g.key} title={g.label} count={list.length} bodyClassName="gap-3 pt-2">
							{list.length === 0 ? <EmptyState title="Nothing here" /> : list.map((r) => {
								const n = r.status === "DONE" ? ONBOARDING_STEPS.length : (done[r.id]?.length ?? 0);
								return (
									<button key={r.id} type="button" onClick={() => setOpen(r.id)} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4 text-left transition-colors hover:bg-subtle/60">
										<div className="flex items-center gap-2">
											<span className="flex-1 text-[13px] font-semibold text-ink">{r.businessName}</span>
											<StatusPill tone={g.tone} dot={false}>{n} / {ONBOARDING_STEPS.length}</StatusPill>
										</div>
										<ProgressBar value={n} max={ONBOARDING_STEPS.length} tone={g.key === "DONE" ? "success" : undefined} />
										<p className="text-xs text-ink-3">{r.assignedTo} · started {fmtAgo(r.startedAt)}</p>
										<p className="text-xs font-medium text-ink-2">Next: {r.nextAction}</p>
									</button>
								);
							})}
						</SectionCard>
					);
				})}
			</div>

			<SidePanel open={!!selected} onOpenChange={(o) => !o && void setOpen(null)} title={selected?.businessName ?? ""} subtitle={selected ? `Onboarding · ${selected.assignedTo} · started ${fmtLongDate(selected.startedAt)}` : undefined} icon={ClipboardCheckIcon} width="md"
				footerInfo={selected && selected.status !== "DONE" ? `${(done[selected.id]?.length ?? 0)} of ${ONBOARDING_STEPS.length} steps done` : undefined}
				footer={selected && selected.status !== "DONE" && editable ? (
					<>
						<button type="button" className={btn.secondary} onClick={() => run("Progress saved", () => void setOpen(null))}>Save</button>
						<button type="button" className={btn.primary} disabled={(done[selected.id]?.length ?? 0) < ONBOARDING_STEPS.length - 1} onClick={() => setHandover(selected)}>Ready for handover</button>
					</>
				) : undefined}
			>
				{selected && (
					<div className="flex flex-col gap-5">
						<DetailList columns={2} items={[
							{ label: "Business", value: <Link href={`/dashboard/businesses/${businesses.find((b) => b.name === selected.businessName)?.id ?? ""}`} className="text-brand hover:underline">{selected.businessName}</Link> },
							{ label: "Assigned to", value: selected.assignedTo },
						]} />
						<PanelSection title="Checklist">
							<ol className="flex flex-col gap-2">
								{ONBOARDING_STEPS.map((s, i) => {
									const isDone = selected.status === "DONE" || (done[selected.id] ?? []).includes(s.key);
									return (
										<li key={s.key}>
											<button type="button" disabled={!editable || selected.status === "DONE"} onClick={() => setDone((d) => ({ ...d, [selected.id]: isDone ? (d[selected.id] ?? []).filter((k) => k !== s.key) : [...(d[selected.id] ?? []), s.key] }))}
												className={cn("flex w-full items-start gap-3 rounded-control border px-3 py-[10px] text-left", isDone ? "border-success/30 bg-success-soft/40" : "border-line bg-card hover:bg-subtle")}>
												<span className={cn("mt-[1px] flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold", isDone ? "border-success bg-success text-white" : "border-line-strong text-ink-3")}>{isDone ? <CheckIcon className="size-3" /> : i + 1}</span>
												<span className="min-w-0">
													<span className="block text-[13px] font-semibold text-ink">{s.label}</span>
													<span className="block text-xs text-ink-3">{s.help}</span>
												</span>
											</button>
										</li>
									);
								})}
							</ol>
						</PanelSection>
						{selected.status !== "DONE" && (
							<PanelSection title="Next action">
								<TextareaField label="What happens next" value={selected.nextAction} onChange={() => undefined} rows={2} />
								<SelectField label="Assigned to" value={selected.assignedTo} onChange={() => undefined} options={["Dapo Ajala", "Ngozi Umeh"]} />
							</PanelSection>
						)}
					</div>
				)}
			</SidePanel>

			<ConfirmModal open={!!handover} onOpenChange={(o) => !o && setHandover(null)} title={`Mark ${handover?.businessName} ready for handover?`} subtitle="The handover call is scheduled with the owner" confirmLabel="Ready for handover" pending={pending}
				onConfirm={() => run(`${handover?.businessName} ready for handover`, () => { setHandover(null); void setOpen(null); })}>
				<WhatHappens items={["The owner gets an email to book the handover call", "The business shows in Ready for handover on this board", "Finish the handover from the business page"]} />
				<p className="mt-3 flex items-center gap-2 text-xs text-ink-3"><HandshakeIcon className="size-4" /> Handover itself is done from Hotel businesses → the business → Hand over.</p>
			</ConfirmModal>
		</>
	);
}
