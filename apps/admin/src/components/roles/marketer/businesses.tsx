"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BuildingIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { fmtLongDate, naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import type { BusinessRow, MarketerRow } from "@hospio/api/data/types";
import type { CommissionRow } from "@hospio/api/demo/fixtures/platform-extra";
import { CommissionTable } from "../admin/marketers";
import { monthsLeft, stageLabel, stageTone } from "./shared";

export function MarketerBusinesses({ me, businesses, ledger }: { me: MarketerRow; businesses: BusinessRow[]; ledger: CommissionRow[] }) {
	const [open, setOpen] = useQueryState("open");
	const mine = businesses.filter((b) => b.marketer === me.fullName);
	const selected = mine.find((b) => b.id === open) ?? null;
	const share = (b: BusinessRow) => Math.round(b.mrr * (me.sharePct / 100));

	const columns: ColumnDef<BusinessRow, unknown>[] = [
		{ accessorKey: "name", header: "Business", cell: ({ row }) => <TwoLine primary={row.original.name} secondary={`${row.original.city} · ${plural(row.original.hotels, "hotel")} · ${row.original.rooms} rooms`} /> },
		{ accessorKey: "stage", header: "Stage", cell: ({ row }) => <StatusPill tone={stageTone[row.original.stage]}>{stageLabel[row.original.stage]}</StatusPill> },
		{ accessorKey: "since", header: "Live since", cell: ({ row }) => fmtLongDate(row.original.since) },
		{ accessorKey: "mrr", header: "H.M.S share / month", cell: ({ row }) => naira(row.original.mrr) },
		{ id: "mine", header: `Your ${me.sharePct}%`, accessorFn: share, cell: ({ row }) => <span className="font-semibold">{naira(share(row.original))}</span> },
		{ id: "left", header: "Months left", accessorFn: (b) => monthsLeft(b.since, me.months), cell: ({ row }) => { const n = monthsLeft(row.original.since, me.months); return n > 0 ? `${n} of ${me.months}` : <span className="text-ink-3">ended</span>; } },
	];

	return (
		<>
			<PageHeader title="My businesses" subtitle={`${mine.length} businesses you brought to H.M.S · you earn ${me.sharePct}% of our share for ${me.months} months each`} />
			<DataTable columns={columns} data={mine} onRowClick={(b) => setOpen(b.id)} emptyTitle="No businesses yet" emptyHint="Refer a hotel to start earning." />

			<SidePanel open={!!selected} onOpenChange={(o) => !o && void setOpen(null)} title={selected?.name ?? ""} subtitle={selected ? `${selected.city} · ${plural(selected.hotels, "hotel")} · ${selected.rooms} rooms` : undefined} icon={BuildingIcon} width="md">
				{selected && (
					<div className="flex flex-col gap-5">
						<DetailList columns={2} items={[{ label: "Stage", value: <StatusPill tone={stageTone[selected.stage]}>{stageLabel[selected.stage]}</StatusPill> }, { label: "Live since", value: fmtLongDate(selected.since) }, { label: "Months left", value: `${monthsLeft(selected.since, me.months)} of ${me.months}` }, { label: "Fee model", value: selected.feeModel }]} />
						<PanelSection title="This month">
							<TotalsList rows={[{ label: "H.M.S share from this business", value: naira(selected.mrr) }, { label: `Your ${me.sharePct}%`, value: naira(share(selected)) }, { label: "WHT 5%", value: `-${naira(Math.round(share(selected) * 0.05))}` }, { label: "Paid to you", value: naira(Math.round(share(selected) * 0.95)), strong: true }]} />
						</PanelSection>
						{selected.dueFees > 0 && <Note tone="warning">This business hasn't paid its H.M.S fee yet. Your commission for the month is paid once they do.</Note>}
						<PanelSection title="History">
							<CommissionTable rows={ledger.filter((c) => c.businessName === selected.name)} />
						</PanelSection>
					</div>
				)}
			</SidePanel>
		</>
	);
}
