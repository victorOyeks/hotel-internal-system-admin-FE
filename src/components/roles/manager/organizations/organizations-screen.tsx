"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangleIcon, BuildingIcon, HandshakeIcon, PlusIcon, WalletIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { fmtDay, fmtLongDate, naira, nairaShort, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { RowActions } from "@/components/shared/row-actions";
import { StatusPill } from "@/components/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import { useDemoAction } from "@/lib/demo/actions";
import type { InvoiceRow, OrganizationRow } from "@/lib/data/types";
import { NewOrganizationPanel } from "./organization-panels";

export function OrganizationsScreen({ hotelName, organizations: initial, invoices }: { hotelName: string; organizations: OrganizationRow[]; invoices: InvoiceRow[] }) {
	const router = useRouter();
	const [isNew, setIsNew] = useQueryState("new");
	const [orgs, setOrgs] = useState(initial);
	const [search, setSearch] = useState("");
	const { run } = useDemoAction();
	const outstanding = orgs.reduce((s, o) => s + o.outstanding, 0);
	const overdue = invoices.filter((i) => i.status === "OVERDUE");
	const onHold = orgs.filter((o) => o.status === "ON_HOLD");

	const columns: ColumnDef<OrganizationRow, unknown>[] = [
		{ accessorKey: "name", header: "Organization", cell: ({ row }) => <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-[10px] bg-brand-soft text-brand"><BuildingIcon className="size-4" /></span><TwoLine primary={row.original.name} secondary={`${row.original.contactName} · ${row.original.contactPhone}`} /></div> },
		{ accessorKey: "staffCount", header: "Staff", cell: ({ row }) => <TwoLine primary={row.original.staffCount} secondary={`${row.original.staysThisMonth} stays this month`} /> },
		{ accessorKey: "outstanding", header: "Outstanding", cell: ({ row }) => { const o = row.original; const pct = Math.round((o.outstanding / o.creditLimit) * 100); return <div className="min-w-[140px]"><p className={`text-[13px] font-semibold ${pct >= 80 ? "text-danger" : "text-ink"}`}>{naira(o.outstanding)}</p><div className="mt-1 h-[5px] overflow-hidden rounded-full bg-subtle"><div className={`h-full rounded-full ${pct >= 80 ? "bg-danger" : pct >= 50 ? "bg-[#dbab00]" : "bg-success"}`} style={{ width: `${Math.min(100, pct)}%` }} /></div><p className="text-[11px] text-ink-3">{pct}% of {nairaShort(o.creditLimit)} limit</p></div>; } },
		{ accessorKey: "termsDays", header: "Terms", cell: ({ row }) => <TwoLine primary={`${row.original.termsDays} days`} secondary={row.original.billingCycle} /> },
		{ accessorKey: "since", header: "Since", cell: ({ row }) => fmtLongDate(row.original.since) },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => { const o = row.original; const od = invoices.some((i) => i.organizationId === o.id && i.status === "OVERDUE"); return <StatusPill tone={o.status === "ON_HOLD" ? "danger" : od ? "warning" : "success"}>{o.status === "ON_HOLD" ? "On hold" : od ? "Invoice overdue" : "Active"}</StatusPill>; } },
		{ id: "actions", header: "", enableSorting: false, cell: ({ row }) => <RowActions actions={[
			{ label: "Open account", onClick: () => router.push(`/dashboard/organizations/${row.original.id}`) },
			{ label: "Record payment", onClick: () => router.push(`/dashboard/organizations/${row.original.id}?action=payment`) },
			{ label: "Send reminder", onClick: () => run(`Payment reminder sent to ${row.original.contactName}`) },
			{ label: row.original.status === "ON_HOLD" ? "Take off hold" : "Put on hold", tone: "danger" as const, managerOnly: true, separatorBefore: true, onClick: () => run(row.original.status === "ON_HOLD" ? `${row.original.name} can book again` : `${row.original.name} on hold · no new bookings`, () => setOrgs((os) => os.map((o) => (o.id === row.original.id ? { ...o, status: o.status === "ON_HOLD" ? "ACTIVE" : "ON_HOLD" } : o)))) },
		]} /> },
	];

	return (
		<>
			<PageHeader title="Organizations" subtitle={`${hotelName} · companies that book on account and pay by invoice`}>
				<ExportButton onClick={() => run("Export ready · organizations.xlsx sent to your email", undefined, { tone: "info" })} />
				<Button className={btn.primary} onClick={() => setIsNew("1")}><PlusIcon className="size-[15px]" /> New organization</Button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard label="Accounts" value={orgs.length} icon={HandshakeIcon} hint={`${orgs.reduce((s, o) => s + o.staffCount, 0)} staff can book`} />
				<KpiCard label="Owed in total" value={nairaShort(outstanding)} icon={WalletIcon} hint={`${plural(invoices.filter((i) => i.status !== "PAID").length, "open invoice")}`} />
				<KpiCard label="Overdue" value={nairaShort(overdue.reduce((s, i) => s + i.amount - i.paid, 0))} icon={AlertTriangleIcon} hint={overdue.length ? `${overdue.map((i) => i.organizationName).join(", ")}` : "Nothing overdue"} pill={overdue.length > 0 ? <StatusPill tone="danger">{plural(overdue.length, "invoice")}</StatusPill> : undefined} />
				<KpiCard label="On hold" value={onHold.length} icon={BuildingIcon} hint={onHold.length ? onHold.map((o) => o.name).join(", ") : "Every account can book"} />
			</div>
			<Toolbar left={<p className="text-[13px] text-ink-2">Stays this month: <span className="font-semibold text-ink">{orgs.reduce((s, o) => s + o.staysThisMonth, 0)}</span> · next invoice run {fmtDay(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 10))}</p>} right={<SearchBox value={search} onChange={setSearch} placeholder="Company or contact" />} />
			<DataTable columns={columns} data={orgs} search={search} onRowClick={(o) => router.push(`/dashboard/organizations/${o.id}`)} emptyTitle="No organizations yet" emptyHint="Add a company so its staff can book on account." />
			<NewOrganizationPanel open={!!isNew} onClose={() => setIsNew(null)} onSaved={(o) => setOrgs((os) => [o, ...os])} />
		</>
	);
}
