"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ReceiptIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName } from "@hospio/ui/shared/detail-list";
import { fmtWhen, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import type { BookingRow, FolioRow } from "@hospio/api/data/types";
import { FolioPanel } from "./folio-panel";
import { type FolioAction, FolioModals } from "./folio-modals";

const TABS = ["open", "balance", "closed"] as const;
type Tab = (typeof TABS)[number];
const inTab = (f: FolioRow, t: Tab) =>
	t === "open"
		? f.status === "OPEN"
		: t === "balance"
			? f.status === "CLOSED_WITH_BALANCE"
			: f.status === "CLOSED";

export function folioStatus(f: FolioRow): {
	label: string;
	tone: "success" | "warning" | "danger" | "grey" | "info";
} {
	if (f.status === "CLOSED") return { label: "Closed · paid", tone: "grey" };
	if (f.status === "CLOSED_WITH_BALANCE")
		return { label: `Closed · ${naira(f.balance)} owed`, tone: "danger" };
	if (f.balance < 0)
		return { label: `${naira(-f.balance)} credit`, tone: "success" };
	if (f.balance === 0) return { label: "Settled", tone: "success" };
	return {
		label: f.organizationName ? "On account" : `${naira(f.balance)} due`,
		tone: f.organizationName ? "info" : "warning",
	};
}

export function FoliosScreen({
	hotelName,
	folios: initial,
	inHouse,
}: {
	hotelName: string;
	folios: FolioRow[];
	inHouse: BookingRow[];
}) {
	const [tab] = useQueryState("tab", parseAsString.withDefault("open"));
	const [openId, setOpenId] = useQueryState("open");
	const [action, setAction] = useQueryState("action");
	const [folios, setFolios] = useState(initial);
	const [search, setSearch] = useState("");
	const active = (TABS.includes(tab as Tab) ? tab : "open") as Tab;
	const selected = folios.find((f) => f.id === openId) ?? null;
	const patch = (id: string, fn: (f: FolioRow) => FolioRow) =>
		setFolios((fs) => fs.map((f) => (f.id === id ? fn(f) : f)));

	const open = folios.filter((f) => f.status === "OPEN");
	const dueTotal = open
		.filter((f) => f.balance > 0 && !f.organizationName)
		.reduce((s, f) => s + f.balance, 0);
	const onAccount = open
		.filter((f) => f.organizationName)
		.reduce((s, f) => s + f.balance, 0);
	const owed = folios
		.filter((f) => f.status === "CLOSED_WITH_BALANCE")
		.reduce((s, f) => s + f.balance, 0);

	const columns: ColumnDef<FolioRow, unknown>[] = [
		{
			accessorKey: "guestName",
			header: "Guest",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.guestName}
					secondary={
						<>
							{row.original.reference}
							{row.original.organizationName
								? ` · ${row.original.organizationName}`
								: ""}
						</>
					}
				/>
			),
		},
		{
			accessorKey: "roomNumber",
			header: "Room",
			cell: ({ row }) => (
				<span className="font-medium">{row.original.roomNumber}</span>
			),
		},
		{
			accessorKey: "charges",
			header: "Charges",
			cell: ({ row }) => (
				<TwoLine
					primary={naira(row.original.charges + row.original.tax)}
					secondary={plural(
						row.original.lines.filter((l) => l.kind === "CHARGE").length,
						"line",
					)}
				/>
			),
		},
		{
			accessorKey: "payments",
			header: "Paid",
			cell: ({ row }) => (
				<span className="text-success">{naira(row.original.payments)}</span>
			),
		},
		{
			accessorKey: "balance",
			header: "Balance",
			cell: ({ row }) => (
				<span
					className={
						row.original.balance > 0
							? "font-semibold text-danger"
							: "font-semibold text-success"
					}
				>
					{naira(row.original.balance)}
				</span>
			),
		},
		{
			accessorKey: "openedAt",
			header: "Opened",
			cell: ({ row }) => (
				<TwoLine
					primary={fmtWhen(row.original.openedAt)}
					secondary={
						row.original.closedAt
							? `closed ${fmtWhen(row.original.closedAt)}`
							: undefined
					}
				/>
			),
		},
		{
			id: "status",
			header: "Status",
			enableSorting: false,
			cell: ({ row }) => {
				const s = folioStatus(row.original);
				return <StatusPill tone={s.tone}>{s.label}</StatusPill>;
			},
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<RowActions
					actions={[
						{ label: "Open folio", onClick: () => setOpenId(row.original.id) },
						{
							label: "Post charge",
							onClick: () => {
								setOpenId(row.original.id);
								setAction("charge");
							},
							disabled: row.original.status !== "OPEN",
						},
						{
							label: "Record payment",
							onClick: () => {
								setOpenId(row.original.id);
								setAction("payment");
							},
							disabled: row.original.balance <= 0,
						},
						{
							label: "Print / email",
							onClick: () => {
								setOpenId(row.original.id);
								setAction("print");
							},
						},
						{
							label: "Transfer charges",
							separatorBefore: true,
							managerOnly: true,
							onClick: () => {
								setOpenId(row.original.id);
								setAction("transfer");
							},
							disabled: row.original.status !== "OPEN",
						},
					]}
				/>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Folios"
				subtitle={`${hotelName} · ${plural(open.length, "open folio")} · every charge and payment for a stay`}
			>
				<ExportButton />
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Open folios"
					value={open.length}
					icon={ReceiptIcon}
					hint={`${inHouse.length} guests in house`}
				/>
				<KpiCard
					label="Due from guests"
					value={nairaShort(dueTotal)}
					icon={WalletIcon}
					hint={`${plural(open.filter((f) => f.balance > 0 && !f.organizationName).length, "folio")} with a balance`}
					pill={
						dueTotal > 0 ? (
							<StatusPill tone="warning">collect</StatusPill>
						) : undefined
					}
				/>
				<KpiCard
					label="On company accounts"
					value={nairaShort(onAccount)}
					icon={ReceiptIcon}
					hint="Invoiced to organizations"
				/>
				<KpiCard
					label="Owed after check-out"
					value={nairaShort(owed)}
					icon={WalletIcon}
					hint={`${plural(folios.filter((f) => f.status === "CLOSED_WITH_BALANCE").length, "guest")} left with a balance`}
					pill={
						owed > 0 ? <StatusPill tone="danger">chase</StatusPill> : undefined
					}
				/>
			</div>
			<Toolbar
				left={
					<PillTabs
						param="tab"
						defaultValue="open"
						tabs={[
							{ key: "open", label: "Open", count: open.length },
							{
								key: "balance",
								label: "Closed with balance",
								count: folios.filter((f) => inTab(f, "balance")).length,
							},
							{
								key: "closed",
								label: "Closed",
								count: folios.filter((f) => inTab(f, "closed")).length,
							},
						]}
					/>
				}
				right={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Guest, room, ref…"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={folios.filter((f) => inTab(f, active))}
				search={search}
				onRowClick={(f) => setOpenId(f.id)}
				emptyTitle={
					active === "open" ? "No open folios" : "No closed folios in this list"
				}
				emptyHint={
					active === "open"
						? "A folio opens when a guest checks in."
						: "This list shows the folios open right now; a closed folio is on its booking under Bookings → Past."
				}
				footer={
					<Link
						href="/dashboard/bookings?tab=in-house"
						className="font-semibold text-brand"
					>
						In-house guests →
					</Link>
				}
			/>

			<FolioPanel
				folio={action ? null : selected}
				onClose={() => setOpenId(null)}
				onAction={(a) => setAction(a)}
				onReplace={(updated) => patch(updated.id, () => updated)}
			/>
			<FolioModals
				folio={selected}
				action={(action as FolioAction | null) ?? null}
				others={folios.filter(
					(f) => f.status === "OPEN" && f.id !== selected?.id,
				)}
				onClose={() => setAction(null)}
				onPatch={patch}
			/>
		</>
	);
}
