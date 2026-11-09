"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BookOpenIcon, DownloadIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, SelectField } from "@hospio/ui/shared/field";
import { fmtWhen, humanize } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { useNotConnectedAction } from "@hospio/api/demo/actions";
import type { ActivityRow } from "@hospio/api/data/types";
import { Button } from "@hospio/ui/primitives/button";

const linkFor = (a: ActivityRow) => {
	const t = a.eventType;
	if (t.startsWith("payment") || t.startsWith("refund")) return "/dashboard/payments";
	if (t.startsWith("booking")) return "/dashboard/bookings";
	if (t.startsWith("room")) return "/dashboard/rooms";
	if (t.startsWith("repair")) return "/dashboard/tasks";
	if (t.startsWith("po") || t.startsWith("stock")) return "/dashboard/inventory";
	if (t.startsWith("till") || t.startsWith("night_audit")) return "/dashboard/financials";
	if (t.startsWith("staff")) return "/dashboard/staff";
	if (t.startsWith("setup")) return "/dashboard/hotel-setup";
	return "/dashboard";
};

/** Manager · Activity log: every action by every person, with an entry panel and export. */
export function ActivityLogScreen({ rows, hotelName }: { rows: ActivityRow[]; hotelName: string }) {
	const [search, setSearch] = useState("");
	const [department, setDepartment] = useQueryState("department", parseAsString.withDefault(""));
	const [range, setRange] = useState("today");
	const [open, setOpen] = useQueryState("open");
	const [exporting, setExporting] = useState(false);
	const [exportRange, setExportRange] = useState("7");
	const [format, setFormat] = useState<"CSV" | "PDF">("CSV");
	const { run, pending } = useNotConnectedAction();

	const departments = useMemo(() => Array.from(new Set(rows.map((r) => r.department))).map((d) => ({ value: d, label: d })), [rows]);
	const filtered = rows.filter((r) => {
		if (department && r.department !== department) return false;
		const today = new Date().toISOString().slice(0, 10);
		if (range === "today" && r.at.slice(0, 10) !== today) return false;
		if (range === "yesterday") {
			const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
			if (r.at.slice(0, 10) !== y) return false;
		}
		return true;
	});
	const entry = rows.find((r) => r.id === open) ?? null;

	const columns: ColumnDef<ActivityRow, unknown>[] = [
		{ accessorKey: "at", header: "When", cell: ({ row }) => <span className="whitespace-nowrap text-ink-2">{fmtWhen(row.original.at)}</span>, size: 150 },
		{ accessorKey: "actor", header: "Who", cell: ({ row }) => <TwoLine primary={row.original.actor} secondary={humanize(row.original.actorRole)} /> },
		{ accessorKey: "department", header: "Department", cell: ({ row }) => <span className="text-ink-2">{row.original.department}</span> },
		{ accessorKey: "action", header: "Action", cell: ({ row }) => <TwoLine primary={row.original.action} secondary={row.original.summary} /> },
		{ id: "flag", header: "", cell: ({ row }) => (row.original.byPlatform ? <StatusPill tone="info" dot={false}>by H.M.S</StatusPill> : null), size: 90 },
	];

	return (
		<>
			<PageHeader title="Activity log" subtitle={`${hotelName} · every action by every person, newest first · nothing here can be edited`}>
				<ExportButton onClick={() => setExporting(true)} />
			</PageHeader>

			<Toolbar
				left={
					<>
						<SearchBox value={search} onChange={setSearch} placeholder="Search people, rooms, amounts…" />
						<FilterSelect value={department} onChange={(v) => void setDepartment(v || null)} options={departments} all="All departments" />
						<FilterSelect value={range === "all" ? "" : range} onChange={(v) => setRange(v || "all")} options={[{ value: "today", label: "Today" }, { value: "yesterday", label: "Yesterday" }]} all="All dates" />
					</>
				}
				right={<span className="text-xs text-ink-3">{filtered.length} entries</span>}
			/>

			<DataTable columns={columns} data={filtered} search={search} pageSize={12} onRowClick={(r) => void setOpen(r.id)} emptyTitle="No activity matches" emptyHint="Try another department or date." />

			<SidePanel open={!!entry} onOpenChange={(o) => !o && void setOpen(null)} title={entry?.action ?? ""} subtitle={entry ? `${entry.actor} · ${fmtWhen(entry.at)}` : undefined} icon={BookOpenIcon}
				footer={entry && <Link href={linkFor(entry)} className={btn.primary}>Open in {humanize(linkFor(entry).split("/").pop() ?? "")}</Link>}
				footerInfo={entry?.byPlatform ? "Made by Hospio support on your behalf · you can undo within 7 days from Notifications" : "Entries are kept for 2 years and cannot be edited"}>
				{entry && (
					<div className="flex flex-col gap-5">
						<PanelSection title="Entry">
							<DetailList columns={2} items={[{ label: "Who", value: entry.actor }, { label: "Role", value: humanize(entry.actorRole) }, { label: "Department", value: entry.department }, { label: "When", value: fmtWhen(entry.at) }, { label: "Event", value: <code className="text-xs">{entry.eventType}</code> }, { label: "Source", value: entry.byPlatform ? "H.M.S support" : "This hotel" }]} />
						</PanelSection>
						<PanelSection title="What changed">
							<p className="rounded-xl bg-subtle px-4 py-3 text-[13px] text-ink">{entry.summary}</p>
						</PanelSection>
						{entry.payload && (
							<PanelSection title="Details">
								<DetailList items={Object.entries(entry.payload).map(([k, v]) => ({ label: humanize(k), value: String(v) }))} />
							</PanelSection>
						)}
					</div>
				)}
			</SidePanel>

			<Modal open={exporting} onOpenChange={setExporting} title="Export activity log" subtitle="Everything in the range, one row per entry" icon={DownloadIcon} size="confirm"
				footer={
					<>
						<Button variant="outline" className={btn.secondary} onClick={() => setExporting(false)}>Cancel</Button>
						<Button className={btn.primary} disabled={pending} onClick={() => run(`Activity log exported as ${format}`, () => setExporting(false), { description: "The file is in your downloads and was emailed to you." })}>Download {format}</Button>
					</>
				}>
				<div className="flex flex-col gap-4">
					<SelectField label="Range" value={exportRange} onChange={setExportRange} options={[{ value: "1", label: "Today" }, { value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" }]} />
					<ChoiceCards label="Format" value={format} onChange={setFormat} columns={2} options={[{ value: "CSV", label: "CSV", hint: "Opens in Excel" }, { value: "PDF", label: "PDF", hint: "For printing or the owner" }]} />
				</div>
			</Modal>
		</>
	);
}
