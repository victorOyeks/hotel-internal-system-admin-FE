"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	AlertTriangleIcon,
	BuildingIcon,
	HandshakeIcon,
	PlusIcon,
	WalletIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import {
	fmtLongDate,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	ExportButton,
	FilterSelect,
	SearchBox,
	Toolbar,
} from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { billingCycleLabel } from "@hospio/api/data/mappers/organizations";
import type { PageResult } from "@hospio/api/data/paging";
import type {
	OrganizationRow,
	OrganizationsOverviewRow,
} from "@hospio/api/data/types";
import { useListParams } from "@hospio/ui/shared/list-params";
import {
	sendOrgMessage,
	setOrganizationStatus,
} from "@hospio/api/actions/organizations";
import { useAction } from "@hospio/api/actions/use-action";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { NewOrganizationPanel } from "./organization-panels";

/**
 * Manager · Organizations: the accounts a page at a time from folio-service (`?q=&status=&sort=&page=`), each with its
 * figures; the cards read the hotel's overview, so they don't change with the page or the search.
 */
export function OrganizationsScreen({
	hotelName,
	result,
	overview,
}: {
	hotelName: string;
	result: PageResult<OrganizationRow>;
	overview: OrganizationsOverviewRow | null;
}) {
	const router = useRouter();
	const list = useListParams();
	const [isNew, setIsNew] = useQueryState("new");
	const [orgs, setOrgs] = useState(result.data.content);
	// A new page from the server replaces what is on screen.
	useEffect(() => setOrgs(result.data.content), [result]);
	const { run } = useAction();
	const counts = result.data.counts ?? {};
	const ov: OrganizationsOverviewRow = overview ?? {
		accounts: counts.all ?? 0,
		staffCanBook: 0,
		staysThisMonth: 0,
		outstanding: result.data.totals?.outstanding ?? 0,
		openInvoices: 0,
		overdueInvoices: 0,
		overdueAmount: 0,
		overdueOrganizations: [],
		onHold: counts.ON_HOLD ?? 0,
		onHoldOrganizations: [],
	};

	const columns: ColumnDef<OrganizationRow, unknown>[] = [
		{
			accessorKey: "name",
			header: "Organization",
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<span className="flex size-9 items-center justify-center rounded-[10px] bg-brand-soft text-brand">
						<BuildingIcon className="size-4" />
					</span>
					<TwoLine
						primary={row.original.name}
						secondary={
							[row.original.contactName, row.original.contactPhone]
								.filter(Boolean)
								.join(" · ") || "No contact"
						}
					/>
				</div>
			),
		},
		{
			accessorKey: "staffCount",
			header: "Staff",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.staffCount}
					secondary={`${row.original.staysThisMonth} stays this month`}
				/>
			),
		},
		{
			accessorKey: "outstanding",
			header: "Outstanding",
			cell: ({ row }) => {
				const o = row.original;
				const pct =
					o.creditLimit > 0
						? Math.round((o.outstanding / o.creditLimit) * 100)
						: 0;
				return (
					<div className="min-w-[140px]">
						<p
							className={`text-[13px] font-semibold ${pct >= 80 ? "text-danger" : "text-ink"}`}
						>
							{naira(o.outstanding)}
						</p>
						<div className="mt-1 h-[5px] overflow-hidden rounded-full bg-subtle">
							<div
								className={`h-full rounded-full ${pct >= 80 ? "bg-danger" : pct >= 50 ? "bg-[#dbab00]" : "bg-success"}`}
								style={{ width: `${Math.min(100, pct)}%` }}
							/>
						</div>
						<p className="text-[11px] text-ink-3">
							{pct}% of {nairaShort(o.creditLimit)} limit
						</p>
					</div>
				);
			},
		},
		{
			accessorKey: "termsDays",
			header: "Terms",
			cell: ({ row }) => (
				<TwoLine
					primary={`${row.original.termsDays} days`}
					secondary={billingCycleLabel(row.original.billingCycle)}
				/>
			),
		},
		{
			accessorKey: "since",
			header: "Since",
			cell: ({ row }) =>
				row.original.since ? fmtLongDate(row.original.since.slice(0, 10)) : "—",
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const o = row.original;
				const od = (o.overdueInvoices ?? 0) > 0;
				return (
					<StatusPill
						tone={
							o.status === "ON_HOLD" ? "danger" : od ? "warning" : "success"
						}
					>
						{o.status === "ON_HOLD"
							? "On hold"
							: od
								? "Invoice overdue"
								: "Active"}
					</StatusPill>
				);
			},
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<RowActions
					actions={[
						{
							label: "Open account",
							onClick: () =>
								router.push(`/dashboard/organizations/${row.original.id}`),
						},
						{
							label: "Record payment",
							onClick: () =>
								router.push(
									`/dashboard/organizations/${row.original.id}?action=payment`,
								),
						},
						{
							label: "Send reminder",
							onClick: () =>
								run(
									() =>
										withDeliveries(
											sendOrgMessage(row.original.id, "reminder"),
											`Reminder to ${row.original.name}`,
										),
									`Payment reminder sent to ${row.original.name}`,
								),
						},
						{
							label:
								row.original.status === "ON_HOLD"
									? "Take off hold"
									: "Put on hold",
							tone: "danger" as const,
							managerOnly: true,
							separatorBefore: true,
							onClick: () => {
								const next =
									row.original.status === "ON_HOLD" ? "ACTIVE" : "ON_HOLD";
								run(
									() => setOrganizationStatus(row.original.id, next),
									next === "ON_HOLD"
										? `${row.original.name} is on hold · no new stays on account`
										: `${row.original.name} is active again`,
									() => {
										setOrgs((os) =>
											os.map((o) =>
												o.id === row.original.id ? { ...o, status: next } : o,
											),
										);
									},
								);
							},
						},
					]}
				/>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Organizations"
				subtitle={`${hotelName} · companies that book on account and pay by invoice`}
			>
				<ExportButton />
				<Button className={btn.primary} onClick={() => setIsNew("1")}>
					<PlusIcon className="size-[15px]" /> New organization
				</Button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Accounts"
					value={ov.accounts}
					icon={HandshakeIcon}
					hint={`${ov.staffCanBook} staff can book`}
				/>
				<KpiCard
					label="Owed in total"
					value={nairaShort(ov.outstanding)}
					icon={WalletIcon}
					hint={`${plural(ov.openInvoices, "open invoice")}`}
				/>
				<KpiCard
					label="Overdue"
					value={nairaShort(ov.overdueAmount)}
					icon={AlertTriangleIcon}
					hint={
						ov.overdueInvoices
							? ov.overdueOrganizations.join(", ")
							: "Nothing overdue"
					}
					pill={
						ov.overdueInvoices > 0 ? (
							<StatusPill tone="danger">
								{plural(ov.overdueInvoices, "invoice")}
							</StatusPill>
						) : undefined
					}
				/>
				<KpiCard
					label="On hold"
					value={ov.onHold}
					icon={BuildingIcon}
					hint={
						ov.onHold
							? ov.onHoldOrganizations.join(", ")
							: "Every account can book"
					}
				/>
			</div>
			<Toolbar
				left={
					<p className="text-[13px] text-ink-2">
						Stays this month:{" "}
						<span className="font-semibold text-ink">{ov.staysThisMonth}</span>
					</p>
				}
				right={
					<>
						<FilterSelect
							value={list.params.status ?? ""}
							onChange={(v) => list.set({ status: v })}
							all={`All accounts (${counts.all ?? 0})`}
							options={[
								{ value: "ACTIVE", label: `Active (${counts.ACTIVE ?? 0})` },
								{ value: "ON_HOLD", label: `On hold (${counts.ON_HOLD ?? 0})` },
							]}
						/>
						<SearchBox
							value={list.search}
							onChange={list.setSearch}
							placeholder="Company or contact"
						/>
					</>
				}
			/>
			<DataTable
				columns={columns}
				data={orgs}
				server={{
					page: result.data,
					onPage: list.goTo,
					sort: list.sort,
					onSort: list.setSort,
					sortKeys: { name: "name", since: "createdAt", status: "status" },
				}}
				filtered={list.filtered}
				onClearFilters={list.clear}
				error={result.ok ? null : result.error}
				onRetry={() => router.refresh()}
				onRowClick={(o) => router.push(`/dashboard/organizations/${o.id}`)}
				emptyTitle="No organizations yet"
				emptyHint="Add a company so its staff can book on account."
			/>
			<NewOrganizationPanel
				open={!!isNew}
				onClose={() => setIsNew(null)}
				onSaved={(o) => {
					setOrgs((os) => [o, ...os]);
				}}
			/>
		</>
	);
}
