"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BookOpenIcon, Undo2Icon } from "lucide-react";
import { useState } from "react";
import { undoChange } from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	AdminActivityRow,
	AdminChangeRow,
	Paged,
} from "@hospio/api/data/admin-types";
import type { BusinessRow } from "@hospio/api/data/types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { fmtWhen } from "@hospio/ui/shared/format";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { ServerPager, useFilterParam, usePageParam } from "./live";
import { can } from "./shared";

/**
 * Admin — Changes by H.M.S (Figma 3334:1454): GET /platform/admin/changes paged and filtered on the
 * server, undo while the window is open; the Activity tab is GET /platform/activity?byPlatform=true.
 */
export function ChangesScreen({
	role,
	changes: initial,
	businesses,
	activity,
}: {
	role: AdminRole;
	changes: Paged<AdminChangeRow>;
	businesses: BusinessRow[];
	activity: Paged<AdminActivityRow>;
}) {
	const [changes, setChanges] = useState(initial.content);
	const [tab, setTab] = useFilterParam("tab");
	const [biz, setBiz] = useFilterParam("businessId");
	const [, setPage] = usePageParam();
	const [search, setSearch] = useState("");
	const [undo, setUndo] = useState<AdminChangeRow | null>(null);
	const { run, pending } = useAction();
	const now = Date.now();
	const active = tab || "changes";
	const rows = changes;

	const columns: ColumnDef<AdminChangeRow, unknown>[] = [
		{
			accessorKey: "description",
			header: "Change",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.description}
					secondary={`${row.original.businessName} · ${row.original.area}`}
				/>
			),
		},
		{
			accessorKey: "reason",
			header: "Reason",
			cell: ({ row }) => (
				<span className="text-ink-2">{row.original.reason}</span>
			),
		},
		{ accessorKey: "madeBy", header: "By" },
		{
			accessorKey: "at",
			header: "When",
			cell: ({ row }) => (
				<span className="text-ink-3">{fmtWhen(row.original.at)}</span>
			),
		},
		{
			id: "undo",
			header: "Undo",
			cell: ({ row }) => {
				const c = row.original;
				if (c.undone)
					return (
						<StatusPill tone="grey" dot={false}>
							undone
						</StatusPill>
					);
				const open = new Date(c.undoUntil).getTime() > now;
				const days = Math.max(
					0,
					Math.ceil((new Date(c.undoUntil).getTime() - now) / 86400000),
				);
				if (!open)
					return (
						<StatusPill tone="grey" dot={false}>
							window closed
						</StatusPill>
					);
				return can.editBusiness(role) ? (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setUndo(c);
						}}
						className={cn(btn.secondary, btn.small, "flex items-center gap-1")}
					>
						<Undo2Icon className="size-3" /> Undo · {days}d left
					</button>
				) : (
					<StatusPill tone="info" dot={false}>
						{days}d left
					</StatusPill>
				);
			},
		},
	];

	return (
		<>
			<PageHeader
				title="Changes by H.M.S"
				subtitle="Everything our team changed inside a hotel's account, with the reason given, undoable for 7 days"
			/>
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{
								key: "changes",
								label: "Changes in hotels",
								count: initial.total,
							},
							{
								key: "activity",
								label: "Admin activity",
								count: activity.total,
							},
						]}
						value={active}
						onChange={(k) => {
							setTab(k === "changes" ? null : k);
							setPage(0);
						}}
					/>
				}
				right={
					active === "changes" ? (
						<>
							<FilterSelect
								value={biz}
								onChange={(v) => {
									setBiz(v);
									setPage(0);
								}}
								all="All businesses"
								options={businesses.map((b) => ({
									value: b.id,
									label: b.name,
								}))}
							/>
							<SearchBox
								value={search}
								onChange={setSearch}
								placeholder="Search this page…"
							/>
						</>
					) : undefined
				}
			/>
			{active === "changes" ? (
				<DataTable
					columns={columns}
					data={rows}
					search={search}
					pageSize={initial.size}
					emptyTitle="No changes"
					emptyHint="Edits made as H.M.S appear here."
					footer={<ServerPager page={initial} onPage={setPage} />}
				/>
			) : (
				<SectionCard
					title="Admin activity"
					subtitle="Sign-ins, approvals and actions by the H.M.S team"
					flush
				>
					{activity.content.length === 0 ? (
						<p className="px-5 pb-5 text-sm text-ink-3">
							Nothing recorded yet.
						</p>
					) : (
						<ul className="divide-y divide-line">
							{activity.content.map((a) => (
								<li key={a.id} className="flex items-center gap-3 px-5 py-3">
									<BookOpenIcon className="size-4 shrink-0 text-ink-3" />
									<div className="min-w-0 flex-1">
										<p className="text-[13px] font-semibold text-ink">
											{a.action}
										</p>
										<p className="text-xs text-ink-3">
											{a.by} · {a.eventType.toLowerCase().replace(/_/g, " ")}
										</p>
									</div>
									<span className="text-xs text-ink-3">{fmtWhen(a.at)}</span>
								</li>
							))}
						</ul>
					)}
					<div className="border-t border-line px-5 py-3">
						<ServerPager page={activity} onPage={setPage} />
					</div>
				</SectionCard>
			)}

			<ConfirmModal
				open={!!undo}
				onOpenChange={(o) => !o && setUndo(null)}
				tone="danger"
				title="Undo this change?"
				subtitle={
					undo ? `${undo.businessName} · ${undo.description}` : undefined
				}
				confirmLabel="Undo change"
				pending={pending}
				onConfirm={() =>
					undo &&
					run(
						() => undoChange(undo.id, undo),
						"Change undone",
						(c) => {
							setChanges((all) => all.map((x) => (x.id === c.id ? c : x)));
							setUndo(null);
						},
					)
				}
			>
				<WhatHappens
					tone="warning"
					items={[
						"The previous value is restored right now",
						"The owner and managers see 'undone by H.M.S' in their activity log",
						"Anything the hotel changed since stays as it is",
					]}
				/>
			</ConfirmModal>
		</>
	);
}
