"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BookOpenIcon, Undo2Icon } from "lucide-react";
import { useState } from "react";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { fmtWhen } from "@/components/shared/format";
import { ConfirmModal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { SectionCard } from "@/components/shared/section-card";
import { WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { ExportButton, FilterSelect, SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import type { BusinessRow, PlatformChangeRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import type { AdminRole } from "@/lib/demo/fixtures/platform-extra";
import { cn } from "@/lib/utils";
import { can } from "./shared";

export function ChangesScreen({ role, changes: initial, businesses, activity }: { role: AdminRole; changes: PlatformChangeRow[]; businesses: BusinessRow[]; activity: { id: string; at: string; by: string; action: string; target: string }[] }) {
	const [changes, setChanges] = useState(initial);
	const [tab, setTab] = useState<"changes" | "activity">("changes");
	const [biz, setBiz] = useState("");
	const [search, setSearch] = useState("");
	const [undo, setUndo] = useState<PlatformChangeRow | null>(null);
	const { run, pending } = useDemoAction();
	const now = Date.now();
	const rows = changes.filter((c) => !biz || c.businessName === biz);

	const columns: ColumnDef<PlatformChangeRow, unknown>[] = [
		{ accessorKey: "description", header: "Change", cell: ({ row }) => <TwoLine primary={row.original.description} secondary={`${row.original.businessName} · ${row.original.area}`} /> },
		{ accessorKey: "reason", header: "Reason", cell: ({ row }) => <span className="text-ink-2">{row.original.reason}</span> },
		{ accessorKey: "madeBy", header: "By" },
		{ accessorKey: "at", header: "When", cell: ({ row }) => <span className="text-ink-3">{fmtWhen(row.original.at)}</span> },
		{ id: "undo", header: "Undo", cell: ({ row }) => {
			const c = row.original;
			if (c.undone) return <StatusPill tone="grey" dot={false}>undone</StatusPill>;
			const open = new Date(c.undoUntil).getTime() > now;
			const days = Math.max(0, Math.ceil((new Date(c.undoUntil).getTime() - now) / 86400000));
			return open ? (
				can.editBusiness(role) ? <button type="button" onClick={(e) => { e.stopPropagation(); setUndo(c); }} className={cn(btn.secondary, btn.small, "flex items-center gap-1")}><Undo2Icon className="size-3" /> Undo · {days}d left</button> : <StatusPill tone="info" dot={false}>{days}d left</StatusPill>
			) : <StatusPill tone="grey" dot={false}>window closed</StatusPill>;
		} },
	];

	return (
		<>
			<PageHeader title="Changes by H.M.S" subtitle="Everything our team changed inside a hotel's account, with the reason given, undoable for 7 days">
				<ExportButton />
			</PageHeader>
			<Toolbar
				left={<PillTabs tabs={[{ key: "changes", label: "Changes in hotels", count: changes.length }, { key: "activity", label: "Admin activity", count: activity.length }]} value={tab} onChange={setTab} />}
				right={tab === "changes" ? <><FilterSelect value={biz} onChange={setBiz} all="All businesses" options={businesses.map((b) => ({ value: b.name, label: b.name }))} /><SearchBox value={search} onChange={setSearch} /></> : undefined}
			/>
			{tab === "changes" ? (
				<DataTable columns={columns} data={rows} search={search} emptyTitle="No changes" emptyHint="Edits made as H.M.S appear here." />
			) : (
				<SectionCard title="Admin activity" subtitle="Sign-ins, approvals and actions by the H.M.S team" flush>
					<ul className="divide-y divide-line">
						{activity.map((a) => (
							<li key={a.id} className="flex items-center gap-3 px-5 py-3">
								<BookOpenIcon className="size-4 shrink-0 text-ink-3" />
								<div className="min-w-0 flex-1">
									<p className="text-[13px] font-semibold text-ink">{a.action}</p>
									<p className="text-xs text-ink-3">{a.by} · {a.target}</p>
								</div>
								<span className="text-xs text-ink-3">{fmtWhen(a.at)}</span>
							</li>
						))}
					</ul>
				</SectionCard>
			)}

			<ConfirmModal open={!!undo} onOpenChange={(o) => !o && setUndo(null)} tone="danger" title="Undo this change?" subtitle={undo ? `${undo.businessName} · ${undo.description}` : undefined} confirmLabel="Undo change" pending={pending}
				onConfirm={() => undo && run("Change undone · hotel notified", () => { setChanges((all) => all.map((c) => (c.id === undo.id ? { ...c, undone: true } : c))); setUndo(null); })}>
				<WhatHappens tone="warning" items={["The previous value is restored right now", "The owner and managers see 'undone by H.M.S' in their activity log", "Anything the hotel changed since stays as it is"]} />
			</ConfirmModal>
		</>
	);
}
