"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ActivityIcon, HeadsetIcon, Undo2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { DetailList } from "@/components/shared/detail-list";
import { fmtAgo, fmtWhen, humanize, plural } from "@/components/shared/format";
import { ConfirmModal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs, useTabParam } from "@/components/shared/pill-tabs";
import { SectionCard } from "@/components/shared/section-card";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { ExportButton, FilterSelect, SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import { useDemoAction } from "@/lib/demo/actions";
import type { ActivityRow, DepartmentLive, PlatformChangeRow } from "@/lib/data/types";
import type { OwnerHotelFinance } from "@/lib/demo/fixtures/owner";
import { DownloadModal, HotelFilter, useParam } from "./common";

type Tab = "hotels" | "departments" | "activity" | "changes";

export function OwnerOperations({ hotels, departments, activity, changes }: { hotels: OwnerHotelFinance[]; departments: DepartmentLive[]; activity: ActivityRow[]; changes: PlatformChangeRow[] }) {
	const [tab] = useTabParam<Tab>("hotels");
	const [open, setOpen] = useParam("open");
	const [hotel, setHotel] = useParam("hotel");
	const [search, setSearch] = useState("");
	const [exportOpen, setExportOpen] = useState(false);
	const [undo, setUndo] = useState<PlatformChangeRow | null>(null);
	const { run, pending } = useDemoAction();
	const rows = activity.map((a, i) => ({ ...a, hotelName: hotels[i % 5 === 4 ? 1 : 0].name })).filter((a) => !hotel || hotels.find((h) => h.hotelId === hotel)?.name === a.hotelName);
	const selected = rows.find((a) => a.id === open) ?? null;
	const cols: ColumnDef<(typeof rows)[number], unknown>[] = [
		{ accessorKey: "at", header: "When", cell: ({ row }) => fmtWhen(row.original.at) },
		{ accessorKey: "action", header: "What happened", cell: ({ row }) => <TwoLine primary={row.original.action} secondary={row.original.summary} /> },
		{ accessorKey: "actor", header: "Who", cell: ({ row }) => <TwoLine primary={row.original.actor} secondary={humanize(row.original.actorRole)} /> },
		{ accessorKey: "hotelName", header: "Hotel" },
		{ accessorKey: "department", header: "Department", cell: ({ row }) => (row.original.byPlatform ? <StatusPill tone="info" dot={false}>H.M.S</StatusPill> : row.original.department) },
	];
	const live = hotels.filter((h) => !hotel || h.hotelId === hotel);

	return (
		<>
			<PageHeader title="Operations" subtitle="What is happening right now across your hotels">
				<ExportButton onClick={() => setExportOpen(true)} />
			</PageHeader>
			<Toolbar left={<PillTabs param="tab" tabs={[{ key: "hotels", label: "All hotels" }, { key: "departments", label: "Departments" }, { key: "activity", label: "Activity log", count: activity.length }, { key: "changes", label: "Changes by H.M.S", count: changes.filter((c) => !c.undone).length }]} />} right={tab !== "changes" && <HotelFilter hotels={hotels} value={hotel ?? ""} onChange={(v) => setHotel(v || null)} />} />

			{tab === "hotels" && (
				<div className="grid gap-4 md:grid-cols-2">
					{live.map((h) => (
						<SectionCard key={h.hotelId} title={h.name} subtitle={`${h.manager} · ${h.rooms} rooms`} action={{ label: "Open", href: `/dashboard/hotels/${h.hotelId}` }} bodyClassName="gap-3 pt-2">
							<div className="grid grid-cols-3 gap-2">
								{[["On shift", `${h.onShift} / ${h.scheduled}`, h.onShift < h.scheduled ? "warning" : "success"], ["Open issues", h.openIssues, h.openIssues >= 5 ? "danger" : "success"], ["Occupancy", `${h.occupancy}%`, "info"]].map(([l, v, t]) => (
									<div key={l as string} className="rounded-lg bg-subtle/70 px-3 py-2"><p className="text-[10px] text-ink-3">{l}</p><p className="text-sm font-bold text-ink">{v}</p><span className={`mt-1 block h-1 rounded-full ${t === "danger" ? "bg-danger" : t === "warning" ? "bg-[#dbab00]" : t === "info" ? "bg-info" : "bg-success"}`} /></div>
								))}
							</div>
							<p className="text-[13px] text-ink"><span className="font-semibold">Last action:</span> {h.lastAction} <span className="text-ink-3">· {fmtAgo(h.lastAt)}</span></p>
						</SectionCard>
					))}
				</div>
			)}

			{tab === "departments" && (
				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					{departments.map((d) => (
						<div key={d.key} className="flex flex-col gap-2 rounded-card border border-line bg-card p-4">
							<div className="flex items-center justify-between"><p className="text-sm font-bold text-ink">{d.name}</p><StatusPill tone={d.tone === "grey" ? "grey" : d.tone}>{d.open} {d.openLabel}</StatusPill></div>
							<p className="text-xs text-ink-3">{d.onShift} of {d.scheduled} on shift · {d.actionsLastHour} actions last hour</p>
							<p className="truncate text-[13px] text-ink-2">{d.lastAction}</p>
							<p className="text-[11px] text-ink-3">{fmtAgo(d.lastAt)} · {hotel ? hotels.find((h) => h.hotelId === hotel)?.name : "Simpas Ikeja"}</p>
						</div>
					))}
				</div>
			)}

			{tab === "activity" && (
				<>
					<Toolbar left={<SearchBox value={search} onChange={setSearch} placeholder="Who, what, room" />} right={<FilterSelect value="" onChange={() => undefined} all="All departments" options={[...new Set(activity.map((a) => a.department))].map((d) => ({ value: d, label: d }))} />} />
					<DataTable columns={cols} data={rows} search={search} onRowClick={(a) => setOpen(a.id)} pageSize={12} />
				</>
			)}

			{tab === "changes" && (
				<SectionCard title="Changes made by Hospio support" subtitle="Anything H.M.S changed in your hotels. You can undo within 7 days." flush>
					<ul className="divide-y divide-line">
						{changes.map((c) => (
							<li key={c.id} className="flex items-center gap-4 px-5 py-3">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-info-soft text-info"><HeadsetIcon className="size-4" /></span>
								<div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{c.description}</p><p className="text-xs text-ink-3">{c.area} · {c.businessName} · {c.madeBy} · {fmtWhen(c.at)} · reason: {c.reason}</p></div>
								{c.undone ? <StatusPill tone="grey">Undone</StatusPill> : new Date(c.undoUntil) > new Date() ? <Button variant="outline" className={`${btn.secondary} ${btn.small}`} onClick={() => setUndo(c)}><Undo2Icon className="size-3" /> Undo</Button> : <StatusPill tone="grey">Undo expired</StatusPill>}
							</li>
						))}
					</ul>
				</SectionCard>
			)}

			<SidePanel open={!!selected} onOpenChange={(o) => !o && setOpen(null)} title={selected?.action ?? ""} subtitle={selected ? `${selected.actor} · ${fmtWhen(selected.at)}` : undefined} icon={selected?.byPlatform ? HeadsetIcon : ActivityIcon} footer={<Button variant="outline" className={btn.secondary} onClick={() => setOpen(null)}>Close</Button>}>
				{selected && (
					<div className="flex flex-col gap-6">
						<PanelSection title="Entry"><DetailList columns={2} items={[{ label: "Summary", value: selected.summary }, { label: "Hotel", value: selected.hotelName }, { label: "Department", value: selected.department }, { label: "By", value: `${selected.actor} · ${humanize(selected.actorRole)}` }, { label: "Event", value: <code className="text-xs">{selected.eventType}</code> }, { label: "When", value: fmtWhen(selected.at) }]} /></PanelSection>
						<Link href="/dashboard/operations?tab=activity" className="text-[13px] font-semibold text-brand">See everything {selected.actor} did today →</Link>
					</div>
				)}
			</SidePanel>

			<ConfirmModal open={!!undo} onOpenChange={(o) => !o && setUndo(null)} title="Undo this change?" subtitle={undo?.description} confirmLabel="Undo change" pending={pending} onConfirm={() => run("Change undone · Hospio support told", () => setUndo(null))}>
				<WhatHappens items={["The setting goes back to what it was", "Hospio support sees that you undid it", `${plural(1, "entry", "entries")} added to the activity log`]} />
			</ConfirmModal>
			<DownloadModal open={exportOpen} onOpenChange={setExportOpen} title="Export activity" what="Activity log" />
		</>
	);
}
