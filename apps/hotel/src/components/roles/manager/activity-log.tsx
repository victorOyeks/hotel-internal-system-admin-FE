"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BookOpenIcon, DownloadIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@hospio/ui/primitives/button";
import { csvName, downloadCsv } from "@hospio/ui/shared/csv";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { FieldRow, TextField } from "@hospio/ui/shared/field";
import { fmtWhen, humanize, plural } from "@hospio/ui/shared/format";
import { useListParams } from "@hospio/ui/shared/list-params";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	ExportButton,
	FilterSelect,
	SearchBox,
	Toolbar,
} from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { exportActivity } from "@hospio/api/actions/ml";
import { ACTIVITY_DEPARTMENTS } from "@hospio/api/data/activity-labels";
import type { PageResult } from "@hospio/api/data/paging";
import type { ActivityRow } from "@hospio/api/data/types";

const linkFor = (a: ActivityRow) => {
	const t = a.eventType.toLowerCase();
	if (t.startsWith("payment") || t.startsWith("refund"))
		return "/dashboard/payments";
	if (t.startsWith("booking") || t.startsWith("guest"))
		return "/dashboard/bookings";
	if (t.startsWith("room")) return "/dashboard/rooms";
	if (t.startsWith("repair")) return "/dashboard/tasks";
	if (t.startsWith("po") || t.startsWith("stock"))
		return "/dashboard/inventory";
	if (
		t.startsWith("till") ||
		t.startsWith("night") ||
		t.startsWith("expense") ||
		t.startsWith("day")
	)
		return "/dashboard/financials";
	if (t.startsWith("staff") || t.startsWith("user") || t.startsWith("access"))
		return "/dashboard/staff";
	if (t.startsWith("setting")) return "/dashboard/hotel-setup";
	if (t.startsWith("approval")) return "/dashboard/approvals";
	return "/dashboard";
};

const lagos = (offset = 0) =>
	new Date(Date.now() + offset * 86_400_000).toLocaleDateString("en-CA", {
		timeZone: "Africa/Lagos",
	});
const RANGES: {
	value: string;
	label: string;
	from: () => string;
	to: () => string;
}[] = [
	{ value: "today", label: "Today", from: () => lagos(), to: () => lagos() },
	{
		value: "yesterday",
		label: "Yesterday",
		from: () => lagos(-1),
		to: () => lagos(-1),
	},
	{
		value: "7",
		label: "Last 7 days",
		from: () => lagos(-6),
		to: () => lagos(),
	},
	{
		value: "30",
		label: "Last 30 days",
		from: () => lagos(-29),
		to: () => lagos(),
	},
];

/**
 * Manager · Activity log: every action by every person, newest first, paged and filtered by platform-service (search,
 * department, Lagos days in the URL). The export reads every page of the same filters, 200 at a time, into one CSV.
 */
export function ActivityLogScreen({
	rows,
	hotelName,
	opened,
}: {
	rows: PageResult<ActivityRow>;
	hotelName: string;
	/** The entry in `?open=` when it is not on this page. */
	opened?: ActivityRow | null;
}) {
	const router = useRouter();
	const list$ = useListParams({ extra: ["department"] });
	const page = rows.data;
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [exporting, setExporting] = useState(false);
	const [busy, setBusy] = useState(false);
	const from = list$.params.from ?? "";
	const to = list$.params.to ?? "";
	const range =
		RANGES.find((r) => r.from() === from && r.to() === to)?.value ??
		(from || to ? "custom" : "");
	const entry =
		page.content.find((r) => r.id === open) ??
		(opened?.id === open ? opened : null) ??
		null;
	const filters = {
		q: list$.params.q ?? undefined,
		department: list$.params.department ?? undefined,
		from: from || undefined,
		to: to || undefined,
	};
	const what = [
		filters.department ?? "Every department",
		from && to ? (from === to ? from : `${from} to ${to}`) : "all dates",
		filters.q ? `“${filters.q}”` : "",
	]
		.filter(Boolean)
		.join(" · ");

	const doExport = async () => {
		setBusy(true);
		try {
			const r = await exportActivity(filters);
			if (!r.ok) {
				toast.error(r.error);
				return;
			}
			downloadCsv(csvName(`Activity log ${hotelName}`), [
				[
					"When",
					"Who",
					"Department",
					"Action",
					"What changed",
					"Event",
					"By H.M.S",
				],
				...r.data.rows.map((a) => [
					new Date(a.at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" }),
					a.actor,
					a.department,
					a.action,
					a.summary,
					a.eventType,
					a.byPlatform ? "Yes" : "",
				]),
			]);
			toast.success(
				r.data.truncated
					? `Exported the first ${r.data.rows.length} of ${r.data.total} entries`
					: `Exported ${plural(r.data.rows.length, "entry", "entries")}`,
			);
			setExporting(false);
		} finally {
			setBusy(false);
		}
	};

	const columns: ColumnDef<ActivityRow, unknown>[] = [
		{
			accessorKey: "at",
			header: "When",
			cell: ({ row }) => (
				<span className="whitespace-nowrap text-ink-2">
					{fmtWhen(row.original.at)}
				</span>
			),
			size: 150,
		},
		{
			accessorKey: "actor",
			header: "Who",
			cell: ({ row }) => <span className="text-ink">{row.original.actor}</span>,
		},
		{
			accessorKey: "department",
			header: "Department",
			cell: ({ row }) => (
				<span className="text-ink-2">{row.original.department}</span>
			),
		},
		{
			accessorKey: "action",
			header: "Action",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.action}
					secondary={row.original.summary}
				/>
			),
		},
		{
			id: "flag",
			header: "",
			cell: ({ row }) =>
				row.original.byPlatform ? (
					<StatusPill tone="info" dot={false}>
						by H.M.S
					</StatusPill>
				) : null,
			size: 90,
		},
	];

	return (
		<>
			<PageHeader
				title="Activity log"
				subtitle={`${hotelName} · every action by every person, newest first · nothing here can be edited`}
			>
				<ExportButton onClick={() => setExporting(true)} />
			</PageHeader>

			<Toolbar
				left={
					<>
						<SearchBox
							value={list$.search}
							onChange={list$.setSearch}
							placeholder="Search people, rooms, amounts…"
						/>
						<FilterSelect
							value={list$.params.department ?? ""}
							onChange={(v) => list$.set({ department: v || null })}
							options={ACTIVITY_DEPARTMENTS.map((d) => ({
								value: d,
								label: d,
							}))}
							all="All departments"
						/>
						<FilterSelect
							value={range === "custom" ? "" : range}
							onChange={(v) => {
								const r = RANGES.find((x) => x.value === v);
								list$.set({ from: r ? r.from() : null, to: r ? r.to() : null });
							}}
							options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
							all={
								range === "custom"
									? `${from || "…"} to ${to || "…"}`
									: "All dates"
							}
						/>
					</>
				}
				right={
					<span className="text-xs text-ink-3">
						{plural(page.total, "entry", "entries")}
					</span>
				}
			/>

			<DataTable
				columns={columns}
				data={page.content}
				server={{ page, onPage: list$.goTo }}
				filtered={list$.filtered}
				onClearFilters={list$.clear}
				error={rows.ok ? null : rows.error}
				onRetry={() => router.refresh()}
				onRowClick={(r) => void setOpen(r.id)}
				emptyTitle="No activity matches"
				emptyHint="Try another department or date."
			/>

			<SidePanel
				open={!!entry}
				onOpenChange={(o) => !o && void setOpen(null)}
				title={entry?.action ?? ""}
				subtitle={entry ? `${entry.actor} · ${fmtWhen(entry.at)}` : undefined}
				icon={BookOpenIcon}
				footer={
					entry && (
						<Link href={linkFor(entry)} className={btn.primary}>
							Open in {humanize(linkFor(entry).split("/").pop() || "dashboard")}
						</Link>
					)
				}
				footerInfo={
					entry?.byPlatform
						? "Made by Hospio support on your behalf"
						: "Entries are kept for 2 years and cannot be edited"
				}
			>
				{entry && (
					<div className="flex flex-col gap-5">
						<PanelSection title="Entry">
							<DetailList
								columns={2}
								items={[
									{ label: "Who", value: entry.actor },
									{ label: "Department", value: entry.department },
									{ label: "When", value: fmtWhen(entry.at) },
									{
										label: "Source",
										value: entry.byPlatform ? "H.M.S support" : "This hotel",
									},
								]}
							/>
						</PanelSection>
						<PanelSection title="What changed">
							<p className="rounded-xl bg-subtle px-4 py-3 text-[13px] text-ink">
								{entry.summary}
							</p>
						</PanelSection>
						{entry.payload && (
							<PanelSection title="Details">
								<DetailList
									items={Object.entries(entry.payload).map(([k, v]) => ({
										label: humanize(k.replace(/([a-z])([A-Z])/g, "$1_$2")),
										value: String(v),
									}))}
								/>
							</PanelSection>
						)}
					</div>
				)}
			</SidePanel>

			<Modal
				open={exporting}
				onOpenChange={setExporting}
				title="Export activity log"
				subtitle="Every entry of the filters on screen, one row per entry"
				icon={DownloadIcon}
				size="confirm"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setExporting(false)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={busy || page.total === 0}
							onClick={() => void doExport()}
						>
							{busy ? "Exporting…" : "Download CSV"}
						</Button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<FieldRow>
						<TextField
							label="From"
							type="date"
							value={from}
							onChange={(v) => list$.set({ from: v || null })}
						/>
						<TextField
							label="To"
							type="date"
							value={to}
							onChange={(v) => list$.set({ to: v || null })}
						/>
					</FieldRow>
					<Note tone="info">
						{plural(page.total, "entry", "entries")} · {what}. The file has all
						of them, not just this page, and opens in Excel.
					</Note>
				</div>
			</Modal>
		</>
	);
}
