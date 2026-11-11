"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ActivityIcon, HeadsetIcon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { requestUndo } from "@hospio/api/actions/owner";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	ActivityRow,
	AtHotel,
	DepartmentLive,
	OwnerChangeRow,
	OwnerHotelRow,
} from "@hospio/api/data/types";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { TextareaField } from "@hospio/ui/shared/field";
import { fmtAgo, fmtWhen, plural } from "@hospio/ui/shared/format";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs, useTabParam } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	ExportButton,
	FilterSelect,
	SearchBox,
	Toolbar,
} from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { DownloadModal, HotelFilter } from "./common";

type Tab = "hotels" | "departments" | "activity" | "changes";
type Activity = ActivityRow & Partial<AtHotel>;

/** A change's undo state: undone, asked for, still possible, or too late. */
function undoState(
	c: OwnerChangeRow,
): "undone" | "requested" | "open" | "expired" {
	if (c.undone) return "undone";
	if (c.undoRequestedAt) return "requested";
	return Date.parse(c.undoUntil) > Date.now() ? "open" : "expired";
}

/**
 * Hotel Owner · 12 Operations and 16 Changes by Hospio360: each hotel now (staff clocked in against today's rota, open
 * repairs, occupancy, the last action), each department's last hour, the business's activity log, and what Hospio
 * support changed in the business. An owner asks support to undo a change within 7 days; support puts it back and the
 * request (a support ticket) is resolved.
 */
export function OwnerOperations({
	hotels,
	departments,
	activity,
	changes,
}: {
	hotels: OwnerHotelRow[];
	departments: (DepartmentLive & AtHotel)[];
	activity: Activity[];
	changes: OwnerChangeRow[];
}) {
	const [tab] = useTabParam<Tab>("hotels");
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [hotel, setHotel] = useQueryState("hotel", parseAsString);
	const [search, setSearch] = useState("");
	const [dept, setDept] = useState("");
	const [exportOpen, setExportOpen] = useState(false);
	const [undo, setUndo] = useState<OwnerChangeRow | null>(null);
	const filters = hotels.map((h) => ({ hotelId: h.hotelId, name: h.name }));
	const hotelName = hotel
		? (hotels.find((h) => h.hotelId === hotel)?.name ?? "this hotel")
		: null;

	const rows = activity.filter(
		(a) => (!hotel || a.hotelId === hotel) && (!dept || a.department === dept),
	);
	const selected = activity.find((a) => a.id === open) ?? null;
	const live = hotels.filter((h) => !hotel || h.hotelId === hotel);
	const changeRows = changes.filter(
		(c) => !hotel || !c.hotelName || c.hotelName === hotelName,
	);

	// "All hotels" adds the hotels' departments together; the last action is the latest of them.
	const byDept = new Map<string, DepartmentLive & { hotels: number }>();
	for (const d of departments.filter((x) => !hotel || x.hotelId === hotel)) {
		const prev = byDept.get(d.key);
		if (!prev) {
			byDept.set(d.key, { ...d, hotels: 1 });
			continue;
		}
		const later = (d.lastAt ?? "") > (prev.lastAt ?? "");
		byDept.set(d.key, {
			...prev,
			onShift: prev.onShift + d.onShift,
			scheduled: prev.scheduled + d.scheduled,
			actionsLastHour: prev.actionsLastHour + d.actionsLastHour,
			open: prev.open + d.open,
			lastAction: later ? `${d.lastAction} · ${d.hotelName}` : prev.lastAction,
			lastAt: later ? d.lastAt : prev.lastAt,
			tone: prev.actionsLastHour + d.actionsLastHour > 0 ? "success" : "grey",
			hotels: prev.hotels + 1,
		});
	}
	const deptCards = [...byDept.values()];

	const cols: ColumnDef<Activity, unknown>[] = [
		{
			accessorKey: "at",
			header: "When",
			cell: ({ row }) => fmtWhen(row.original.at),
		},
		{
			accessorKey: "action",
			header: "What happened",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.action}
					secondary={row.original.summary}
				/>
			),
		},
		{ accessorKey: "actor", header: "Who" },
		{
			accessorKey: "hotelName",
			header: "Hotel",
			cell: ({ row }) => row.original.hotelName ?? "Business",
		},
		{
			accessorKey: "department",
			header: "Department",
			cell: ({ row }) =>
				row.original.byPlatform ? (
					<StatusPill tone="info" dot={false}>
						Hospio360
					</StatusPill>
				) : (
					row.original.department
				),
		},
	];

	return (
		<>
			<PageHeader
				title="Operations"
				subtitle={`What is happening now across ${hotelName ?? plural(hotels.length, "hotel")}`}
			>
				{tab === "activity" && (
					<ExportButton onClick={() => setExportOpen(true)} />
				)}
			</PageHeader>
			<Toolbar
				left={
					<PillTabs
						param="tab"
						tabs={[
							{ key: "hotels", label: "Hotels now" },
							{ key: "departments", label: "Departments" },
							{ key: "activity", label: "Activity log", count: rows.length },
							{
								key: "changes",
								label: "Changes by Hospio360",
								count: changeRows.filter((c) => undoState(c) === "open").length,
							},
						]}
					/>
				}
				right={
					<HotelFilter
						hotels={filters}
						value={hotel ?? ""}
						onChange={(v) => void setHotel(v || null)}
					/>
				}
			/>

			{tab === "hotels" &&
				(live.length === 0 ? (
					<EmptyState title="No hotels yet" />
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{live.map((h) => (
							<SectionCard
								key={h.hotelId}
								title={h.name}
								subtitle={`${h.manager === "—" ? "No manager yet" : h.manager} · ${plural(h.rooms, "room")}`}
								action={{
									label: "Open",
									href: `/dashboard/hotels/${h.hotelId}`,
								}}
								bodyClassName="gap-3 pt-2"
							>
								<div className="grid grid-cols-3 gap-2">
									{(
										[
											[
												"On shift",
												`${h.onShift} / ${h.scheduled}`,
												h.scheduled > 0 && h.onShift < h.scheduled
													? "warning"
													: "success",
											],
											[
												"Open repairs",
												h.openIssues,
												h.openIssues >= 5
													? "danger"
													: h.openIssues > 0
														? "warning"
														: "success",
											],
											["Occupancy", `${h.occupancy}%`, "info"],
										] as const
									).map(([l, v, t]) => (
										<div key={l} className="rounded-lg bg-subtle/70 px-3 py-2">
											<p className="text-[10px] text-ink-3">{l}</p>
											<p className="text-sm font-bold text-ink">{v}</p>
											<span
												className={`mt-1 block h-1 rounded-full ${t === "danger" ? "bg-danger" : t === "warning" ? "bg-[#dbab00]" : t === "info" ? "bg-info" : "bg-success"}`}
											/>
										</div>
									))}
								</div>
								<p className="text-[13px] text-ink">
									<span className="font-semibold">Last action:</span>{" "}
									{h.lastAt ? (
										<>
											{h.lastAction}{" "}
											<span className="text-ink-3" suppressHydrationWarning>
												· {fmtAgo(h.lastAt)}
											</span>
										</>
									) : (
										<span className="text-ink-3">nothing logged yet</span>
									)}
								</p>
							</SectionCard>
						))}
					</div>
				))}

			{tab === "departments" && (
				<>
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
						{deptCards.map((d) => (
							<div
								key={d.key}
								className="flex flex-col gap-2 rounded-card border border-line bg-card p-4"
							>
								<div className="flex items-center justify-between gap-2">
									<p className="text-sm font-bold text-ink">{d.name}</p>
									<StatusPill tone={d.tone}>
										{d.actionsLastHour}{" "}
										{d.actionsLastHour === 1 ? "action" : "actions"} · last hour
									</StatusPill>
								</div>
								<p className="text-xs text-ink-3">
									{d.onShift} of {d.scheduled} on shift today
								</p>
								<p
									className="truncate text-[13px] text-ink-2"
									title={d.lastAction}
								>
									{d.lastAction || "Nothing yet"}
								</p>
								<p className="text-[11px] text-ink-3" suppressHydrationWarning>
									{d.lastAt ? fmtAgo(d.lastAt) : "—"} ·{" "}
									{hotelName ?? `${plural(d.hotels, "hotel")}`}
								</p>
							</div>
						))}
					</div>
					{deptCards.length === 0 && (
						<EmptyState
							title="Nothing to show"
							hint="The departments board could not be read"
						/>
					)}
				</>
			)}

			{tab === "activity" && (
				<>
					<Toolbar
						left={
							<SearchBox
								value={search}
								onChange={setSearch}
								placeholder="Who, what, room"
							/>
						}
						right={
							<FilterSelect
								value={dept}
								onChange={setDept}
								all="All departments"
								options={[...new Set(activity.map((a) => a.department))]
									.sort()
									.map((d) => ({ value: d, label: d }))}
							/>
						}
					/>
					<DataTable
						columns={cols}
						data={rows}
						search={search}
						onRowClick={(a) => void setOpen(a.id)}
						pageSize={15}
						emptyTitle="Nothing logged here yet"
					/>
				</>
			)}

			{tab === "changes" && (
				<SectionCard
					title="Changes made by Hospio support"
					subtitle="Anything Hospio360 changed in your business. Within 7 days you can ask support to put it back."
					flush
				>
					{changeRows.length === 0 ? (
						<EmptyState
							title="No changes by Hospio360"
							hint="When Hospio support changes a setting for you, it is listed here"
							className="mx-5 mb-5"
						/>
					) : (
						<ul className="divide-y divide-line">
							{changeRows.map((c) => {
								const st = undoState(c);
								return (
									<li
										key={c.id}
										className="flex flex-wrap items-center gap-4 px-5 py-3"
									>
										<span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-info-soft text-info">
											<HeadsetIcon className="size-4" />
										</span>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{c.description}
											</p>
											<p className="text-xs text-ink-3">
												{c.area}
												{c.hotelName ? ` · ${c.hotelName}` : ""} · {c.madeBy} ·{" "}
												{fmtWhen(c.at)}
												{c.reason ? ` · reason: ${c.reason}` : ""}
											</p>
											{st === "requested" && (
												<p className="text-xs text-ink-3">
													You asked support to undo it{" "}
													{fmtWhen(c.undoRequestedAt)}
												</p>
											)}
										</div>
										{st === "undone" ? (
											<StatusPill tone="grey">Undone</StatusPill>
										) : st === "requested" ? (
											<StatusPill tone="info">
												Undo asked · support is on it
											</StatusPill>
										) : st === "open" ? (
											<Button
												variant="outline"
												className={`${btn.secondary} ${btn.small}`}
												onClick={() => setUndo(c)}
											>
												<Undo2Icon className="size-3" /> Ask support to undo
											</Button>
										) : (
											<StatusPill tone="grey">Undo window passed</StatusPill>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</SectionCard>
			)}

			<SidePanel
				open={!!selected}
				onOpenChange={(o) => !o && void setOpen(null)}
				title={selected?.action ?? ""}
				subtitle={
					selected ? `${selected.actor} · ${fmtWhen(selected.at)}` : undefined
				}
				icon={selected?.byPlatform ? HeadsetIcon : ActivityIcon}
				footer={
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={() => void setOpen(null)}
					>
						Close
					</Button>
				}
			>
				{selected && (
					<div className="flex flex-col gap-6">
						<PanelSection title="Entry">
							<DetailList
								columns={2}
								items={[
									{ label: "Summary", value: selected.summary },
									{ label: "Hotel", value: selected.hotelName ?? "Business" },
									{ label: "Department", value: selected.department },
									{ label: "By", value: selected.actor },
									{ label: "When", value: fmtWhen(selected.at) },
								]}
							/>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<UndoModal change={undo} onClose={() => setUndo(null)} />
			<DownloadModal
				open={exportOpen}
				onOpenChange={setExportOpen}
				title="Export activity"
				what={`Activity log · ${hotelName ?? "All hotels"}`}
				rows={() => [
					["When", "What happened", "Summary", "Who", "Hotel", "Department"],
					...rows
						.filter(
							(a) =>
								!search ||
								`${a.action} ${a.summary} ${a.actor}`
									.toLowerCase()
									.includes(search.toLowerCase()),
						)
						.map((a) => [
							a.at,
							a.action,
							a.summary,
							a.actor,
							a.hotelName ?? "Business",
							a.department,
						]),
				]}
			/>
		</>
	);
}

function UndoModal({
	change,
	onClose,
}: {
	change: OwnerChangeRow | null;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [note, setNote] = useState("");
	return (
		<ConfirmModal
			open={!!change}
			onOpenChange={(o) => !o && onClose()}
			title="Ask support to undo this change?"
			subtitle={change?.description}
			confirmLabel="Send to support"
			pending={pending}
			onConfirm={() =>
				change &&
				run(
					() => requestUndo(change.id, note),
					"Hospio support has your request · they put it back and tell you",
					() => {
						setNote("");
						onClose();
						router.refresh();
					},
				)
			}
		>
			<div className="flex flex-col gap-4">
				<WhatHappens
					items={[
						"Hospio support gets an urgent ticket with the change and your note",
						"They put the setting back as it was and mark the change undone here",
						"You are told when it is done",
					]}
				/>
				<TextareaField
					label="Note for support"
					value={note}
					onChange={setNote}
					rows={3}
					placeholder="Optional · why it should go back"
				/>
				{change && (
					<Note tone="info">
						You can ask until {fmtWhen(change.undoUntil)}.
					</Note>
				)}
			</div>
		</ConfirmModal>
	);
}
