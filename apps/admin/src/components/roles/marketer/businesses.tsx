"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BuildingIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import type {
	CommissionLine,
	MarketerBusinessItem,
	MarketerMeData,
} from "@hospio/api/data/admin-types";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { fmtLongDate, naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { CommissionTable } from "../admin/marketers";
import { monthsLeft, stageLabel, stageTone } from "./shared";

/** Marketer — My businesses: GET /platform/marketer/businesses with the ledger lines per business. */
export function MarketerBusinesses({
	me,
	businesses,
	ledger,
}: {
	me: MarketerMeData;
	businesses: MarketerBusinessItem[];
	ledger: CommissionLine[];
}) {
	const [open, setOpen] = useQueryState("open");
	const p = me.profile;
	const selected = businesses.find((b) => b.id === open) ?? null;
	const wht = (n: number) => Math.round(n * 0.05);

	const columns: ColumnDef<MarketerBusinessItem, unknown>[] = [
		{
			accessorKey: "name",
			header: "Business",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.name}
					secondary={`${row.original.city || "—"} · ${plural(row.original.hotels, "hotel")}`}
				/>
			),
		},
		{
			accessorKey: "stage",
			header: "Stage",
			cell: ({ row }) => (
				<StatusPill tone={stageTone[row.original.stage] ?? "grey"}>
					{stageLabel[row.original.stage] ?? row.original.stage}
				</StatusPill>
			),
		},
		{
			accessorKey: "since",
			header: "Live since",
			cell: ({ row }) =>
				row.original.since ? fmtLongDate(row.original.since) : "—",
		},
		{
			accessorKey: "sharePct",
			header: "Your share",
			cell: ({ row }) => `${row.original.sharePct}%`,
		},
		{
			accessorKey: "lastMonthShare",
			header: "Last month",
			cell: ({ row }) => (
				<span className="font-semibold">
					{naira(row.original.lastMonthShare)}
				</span>
			),
		},
		{
			id: "left",
			header: "Months left",
			accessorFn: (b) => monthsLeft(b.since, p.months),
			cell: ({ row }) => {
				const n = monthsLeft(row.original.since, p.months);
				return n > 0 ? (
					`${n} of ${p.months}`
				) : (
					<span className="text-ink-3">ended</span>
				);
			},
		},
	];

	return (
		<>
			<PageHeader
				title="My businesses"
				subtitle={`${businesses.length} businesses you brought to H.M.S · you earn ${p.sharePct}% of our share for ${p.months} months each`}
			/>
			<DataTable
				columns={columns}
				data={businesses}
				onRowClick={(b) => setOpen(b.id)}
				emptyTitle="No businesses yet"
				emptyHint="Refer a hotel to start earning."
			/>

			<SidePanel
				open={!!selected}
				onOpenChange={(o) => !o && void setOpen(null)}
				title={selected?.name ?? ""}
				subtitle={
					selected
						? `${selected.city || "—"} · ${plural(selected.hotels, "hotel")}`
						: undefined
				}
				icon={BuildingIcon}
				width="md"
			>
				{selected && (
					<div className="flex flex-col gap-5">
						<DetailList
							columns={2}
							items={[
								{
									label: "Stage",
									value: (
										<StatusPill tone={stageTone[selected.stage] ?? "grey"}>
											{stageLabel[selected.stage] ?? selected.stage}
										</StatusPill>
									),
								},
								{
									label: "Live since",
									value: selected.since ? fmtLongDate(selected.since) : "—",
								},
								{
									label: "Months left",
									value: `${monthsLeft(selected.since, p.months)} of ${p.months}`,
								},
								{ label: "Your share", value: `${selected.sharePct}%` },
							]}
						/>
						<PanelSection
							title={
								selected.lastMonth
									? `Last month · ${selected.lastMonth}`
									: "Last month"
							}
						>
							<TotalsList
								rows={[
									{
										label: `Your ${selected.sharePct}% of the H.M.S share`,
										value: naira(selected.lastMonthShare),
									},
									{
										label: "WHT 5%",
										value: `-${naira(wht(selected.lastMonthShare))}`,
									},
									{
										label: "Paid to you",
										value: naira(
											selected.lastMonthShare - wht(selected.lastMonthShare),
										),
										strong: true,
									},
								]}
							/>
						</PanelSection>
						{ledger.some(
							(c) => c.businessId === selected.id && c.status === "WAITING",
						) && (
							<Note tone="warning">
								This business hasn't paid its H.M.S fee yet. Your commission for
								the month is paid once they do.
							</Note>
						)}
						<PanelSection title="History">
							<CommissionTable
								rows={ledger.filter(
									(c) =>
										c.businessId === selected.id ||
										c.businessName === selected.name,
								)}
								sharePct={p.sharePct}
							/>
						</PanelSection>
					</div>
				)}
			</SidePanel>
		</>
	);
}
