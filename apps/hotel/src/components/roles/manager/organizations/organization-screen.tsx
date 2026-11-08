"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeftIcon, BellIcon, CreditCardIcon, FileTextIcon, PencilIcon, PlusIcon, PrinterIcon, UploadIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName, DetailList, Note } from "@hospio/ui/shared/detail-list";
import { fmtDay, fmtLongDate, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { BookingRow, FolioRow, InvoiceRow, OrgMemberRow, OrganizationRow } from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { AddStaffPanel, AgreementPanel, ImportStaffModal, OrgPaymentModal, ReminderModal, StatementModal } from "./organization-panels";

export type OrgAction = "payment" | "reminder" | "statement" | "add-staff" | "import" | "agreement" | "invoice";
const TABS = ["overview", "stays", "staff", "invoices", "agreement"] as const;
type Tab = (typeof TABS)[number];

const invoiceTone = { DRAFT: "grey", SENT: "info", PART_PAID: "warning", PAID: "success", OVERDUE: "danger" } as const;
const invoiceLabel = { DRAFT: "Draft · not sent", SENT: "Sent", PART_PAID: "Part-paid", PAID: "Paid", OVERDUE: "Overdue" } as const;

export function OrganizationScreen({ org: initialOrg, members: initialMembers, invoices: initialInvoices, stays, folios }: { org: OrganizationRow; members: OrgMemberRow[]; invoices: InvoiceRow[]; stays: BookingRow[]; folios: FolioRow[] }) {
	const [tab] = useQueryState("tab", parseAsString.withDefault("overview"));
	const [action, setAction] = useQueryState("action");
	const [org, setOrg] = useState(initialOrg);
	const [members, setMembers] = useState(initialMembers);
	const [invoices, setInvoices] = useState(initialInvoices);
	const { run } = useDemoAction();
	const active = (TABS.includes(tab as Tab) ? tab : "overview") as Tab;
	const overdue = invoices.filter((i) => i.status === "OVERDUE");
	const notInvoiced = folios.filter((f) => f.status === "OPEN").reduce((s, f) => s + f.balance, 0);
	const used = Math.round((org.outstanding / org.creditLimit) * 100);
	const inHouse = stays.filter((b) => b.status === "CHECKED_IN");
	const a = (x: OrgAction) => setAction(x);

	const stayColumns: ColumnDef<BookingRow, unknown>[] = [
		{ accessorKey: "guestName", header: "Staff member", cell: ({ row }) => <AvatarName name={row.original.guestName} secondary={row.original.reference} /> },
		{ accessorKey: "roomNumber", header: "Room", cell: ({ row }) => <TwoLine primary={row.original.roomNumber ?? "—"} secondary={row.original.roomTypeName} /> },
		{ accessorKey: "checkInDate", header: "Stay", cell: ({ row }) => <TwoLine primary={`${fmtDay(row.original.checkInDate)} → ${fmtDay(row.original.checkOutDate)}`} secondary={plural(row.original.nights, "night")} /> },
		{ accessorKey: "totalAmount", header: "Room charges", cell: ({ row }) => naira(row.original.totalAmount) },
		{ id: "extras", header: "Extras", cell: ({ row }) => { const f = folios.find((x) => x.bookingId === row.original.id); const extras = f ? f.charges + f.tax - row.original.totalAmount : 0; return extras > 0 ? <span className="text-warning">{naira(extras)} · guest pays</span> : <span className="text-ink-3">—</span>; } },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.status === "CHECKED_IN" ? "success" : row.original.status === "BOOKED" ? "info" : "grey"}>{row.original.status === "CHECKED_IN" ? "In house" : row.original.status === "BOOKED" ? "Upcoming" : "Checked out"}</StatusPill> },
		{ id: "x", header: "", enableSorting: false, cell: ({ row }) => <Link href={`/dashboard/bookings?open=${row.original.id}`} className="text-[13px] font-semibold text-brand" onClick={(e) => e.stopPropagation()}>Open</Link> },
	];
	const memberColumns: ColumnDef<OrgMemberRow, unknown>[] = [
		{ accessorKey: "fullName", header: "Name", cell: ({ row }) => <AvatarName name={row.original.fullName} secondary={row.original.staffRef} /> },
		{ accessorKey: "phone", header: "Phone" },
		{ accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email ?? <span className="text-ink-3">—</span> },
		{ accessorKey: "active", header: "Can book", cell: ({ row }) => <StatusPill tone={row.original.active ? "success" : "grey"}>{row.original.active ? "Yes" : "Removed"}</StatusPill> },
		{ id: "a", header: "", enableSorting: false, cell: ({ row }) => <RowActions actions={[{ label: "Book a stay", onClick: () => run(`Booking started for ${row.original.fullName} on ${org.name}'s account`, undefined, { tone: "info" }) }, { label: row.original.active ? "Remove from account" : "Allow again", tone: row.original.active ? "danger" : "default", separatorBefore: true, onClick: () => run(row.original.active ? `${row.original.fullName} can no longer book on account` : `${row.original.fullName} can book again`, () => setMembers((ms) => ms.map((m) => (m.id === row.original.id ? { ...m, active: !m.active } : m)))) }]} /> },
	];
	const invoiceColumns: ColumnDef<InvoiceRow, unknown>[] = [
		{ accessorKey: "number", header: "Invoice", cell: ({ row }) => <span className="font-semibold">{row.original.number}</span> },
		{ accessorKey: "periodFrom", header: "Period", cell: ({ row }) => `${fmtDay(row.original.periodFrom)} – ${fmtDay(row.original.periodTo)}` },
		{ accessorKey: "amount", header: "Amount", cell: ({ row }) => <TwoLine primary={naira(row.original.amount)} secondary={row.original.paid > 0 && row.original.paid < row.original.amount ? `${naira(row.original.paid)} paid` : undefined} /> },
		{ accessorKey: "dueDate", header: "Due", cell: ({ row }) => <span className={row.original.status === "OVERDUE" ? "font-semibold text-danger" : ""}>{fmtDay(row.original.dueDate)}</span> },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={invoiceTone[row.original.status]}>{invoiceLabel[row.original.status]}</StatusPill> },
		{ id: "a", header: "", enableSorting: false, cell: ({ row }) => <div className="flex justify-end gap-2">{row.original.status === "DRAFT" ? <button type="button" onClick={(e) => { e.stopPropagation(); run(`${row.original.number} sent to ${org.contactEmail}`, () => setInvoices((is) => is.map((i) => (i.id === row.original.id ? { ...i, status: "SENT" } : i)))); }} className={`${btn.primary} ${btn.small}`}>Review & send</button> : row.original.status === "OVERDUE" || row.original.status === "SENT" || row.original.status === "PART_PAID" ? <button type="button" onClick={(e) => { e.stopPropagation(); a("reminder"); }} className={`${btn.secondary} ${btn.small}`}>Send reminder</button> : null}<button type="button" onClick={(e) => { e.stopPropagation(); run(`${row.original.number}.pdf downloaded`, undefined, { tone: "info" }); }} className={`${btn.ghost} ${btn.small}`}>View</button></div> },
	];

	return (
		<>
			<Link href="/dashboard/organizations" className="flex items-center gap-1 text-[13px] font-semibold text-ink-2 hover:text-ink"><ArrowLeftIcon className="size-4" /> All organizations</Link>
			<PageHeader title={org.name} subtitle={`Organization · pays within ${org.termsDays} days · ${org.contactName} · ${org.contactEmail}`}>
				<Button variant="outline" className={btn.secondary} onClick={() => a("statement")}><PrinterIcon className="size-4" /> Send statement</Button>
				<Button className={btn.primary} onClick={() => a("payment")}><CreditCardIcon className="size-4" /> Record payment</Button>
			</PageHeader>
			{org.status === "ON_HOLD" && <Note tone="danger">On hold · staff from {org.name} cannot book until the overdue invoice is paid. <button type="button" className="font-semibold underline" onClick={() => run(`${org.name} taken off hold`, () => setOrg((o) => ({ ...o, status: "ACTIVE" })))}>Take off hold</button></Note>}
			<PillTabs param="tab" defaultValue="overview" tabs={[{ key: "overview", label: "Overview" }, { key: "stays", label: "Stays & bills", count: stays.length }, { key: "staff", label: "Staff", count: members.length }, { key: "invoices", label: "Invoices & statements", count: invoices.length }, { key: "agreement", label: "Agreement" }]} />

			{active === "overview" && (
				<>
					<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
						<div className="rounded-card border border-line bg-card p-[18px]"><p className="text-[13px] text-ink-2">Owed in total</p><p className="mt-1 text-2xl font-bold text-ink">{naira(org.outstanding)}</p><p className="text-xs text-ink-3">{plural(invoices.filter((i) => i.status !== "PAID" && i.status !== "DRAFT").length, "invoice")} + {plural(inHouse.length, "stay")} still running</p></div>
						<div className={cn("rounded-card border p-[18px]", overdue.length ? "border-danger/20 bg-danger-soft" : "border-line bg-card")}><p className="text-[13px] text-ink-2">Overdue</p><p className={cn("mt-1 text-2xl font-bold", overdue.length ? "text-danger" : "text-ink")}>{naira(overdue.reduce((s, i) => s + i.amount - i.paid, 0))}</p><p className="text-xs text-ink-3">{overdue.length ? `${overdue[0].number} · due ${fmtDay(overdue[0].dueDate)}` : "Nothing overdue"}</p></div>
						<div className={cn("rounded-card border p-[18px]", notInvoiced ? "border-warning/30 bg-warning-soft" : "border-line bg-card")}><p className="text-[13px] text-ink-2">Not invoiced yet</p><p className={cn("mt-1 text-2xl font-bold", notInvoiced ? "text-warning" : "text-ink")}>{naira(notInvoiced)}</p><p className="text-xs text-ink-3">{inHouse.length ? `${plural(inHouse.length, "stay")} in house · draft ready at month end` : "No open stays"}</p></div>
						<div className="rounded-card border border-line bg-card p-[18px]"><p className="text-[13px] text-ink-2">Credit limit used</p><p className="mt-1 text-2xl font-bold text-ink">{used}%</p><div className="mt-2 h-[6px] overflow-hidden rounded-full bg-subtle"><div className={cn("h-full rounded-full", used >= 80 ? "bg-danger" : "bg-success")} style={{ width: `${Math.min(100, used)}%` }} /></div><p className="mt-1 text-xs text-ink-3">{naira(Math.max(0, org.creditLimit - org.outstanding))} left of {nairaShort(org.creditLimit)}</p></div>
					</div>
					<div className="grid grid-cols-2 gap-[10px] md:grid-cols-5">
						{[["Create invoice", FileTextIcon, () => a("invoice")], ["Record payment", CreditCardIcon, () => a("payment")], ["Send reminder", BellIcon, () => a("reminder")], ["Send statement", PrinterIcon, () => a("statement")], ["Change terms", PencilIcon, () => a("agreement")]].map(([label, Icon, fn]) => {
							const I = Icon as typeof FileTextIcon;
							return <button key={label as string} type="button" onClick={fn as () => void} className="flex items-center gap-[10px] rounded-xl border border-line bg-card px-[14px] py-3 text-[13px] font-semibold text-ink hover:bg-brand-soft/40"><span className="flex size-[30px] items-center justify-center rounded-[9px] bg-brand-soft text-brand"><I className="size-[15px]" /></span>{label as string}</button>;
						})}
					</div>
					<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
						<SectionCard title="Invoices" flush count={invoices.length}>
							<DataTable columns={invoiceColumns} data={invoices} pageSize={6} className="rounded-none border-0" />
						</SectionCard>
						<div className="flex flex-col gap-4">
							<SectionCard title="Staff staying now" count={inHouse.length}>
								{inHouse.length === 0 ? <p className="py-2 text-xs text-ink-3">Nobody in house</p> : inHouse.map((b) => { const f = folios.find((x) => x.bookingId === b.id); return (
									<div key={b.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
										<div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{b.guestName} · {b.roomNumber}</p><p className="text-xs text-ink-3">{fmtDay(b.checkInDate)} → {fmtDay(b.checkOutDate)} · running {naira(f?.balance ?? b.totalAmount)}</p></div>
										<Link href={f ? `/dashboard/folios?open=${f.id}` : `/dashboard/bookings?open=${b.id}`} className={`${btn.secondary} ${btn.small}`}>Open folio</Link>
									</div>); })}
							</SectionCard>
							<SectionCard title="Agreement" action={{ label: "Edit", href: `/dashboard/organizations/${org.id}?tab=agreement` }}>
								<DetailList items={[{ label: "Pays within", value: `${org.termsDays} days of invoice` }, { label: "Invoices", value: org.billingCycle }, { label: "Credit limit", value: naira(org.creditLimit) }, { label: "Daily cap", value: org.dailyCap ? `${naira(org.dailyCap)} per room-night` : "None" }, { label: "Covers", value: org.agreementNotes ?? "Room only" }]} />
								{used >= 80 && <Note tone="warning">Near the limit. New bookings on this account need your OK until an invoice is paid.</Note>}
							</SectionCard>
						</div>
					</div>
				</>
			)}

			{active === "stays" && <DataTable columns={stayColumns} data={stays} emptyTitle="No stays on this account yet" />}

			{active === "staff" && (
				<>
					<div className="flex justify-end gap-2">
						<Button variant="outline" className={btn.secondary} onClick={() => a("import")}><UploadIcon className="size-4" /> Import list</Button>
						<Button className={btn.primary} onClick={() => a("add-staff")}><UserPlusIcon className="size-4" /> Add staff</Button>
					</div>
					<DataTable columns={memberColumns} data={members} emptyTitle="No staff on this account" emptyHint="Only people on this list can book on account." />
				</>
			)}

			{active === "invoices" && (
				<>
					<div className="flex justify-end gap-2">
						<Button variant="outline" className={btn.secondary} onClick={() => a("statement")}><PrinterIcon className="size-4" /> Create statement</Button>
						<Button className={btn.primary} onClick={() => a("invoice")}><PlusIcon className="size-4" /> Create invoice</Button>
					</div>
					<DataTable columns={invoiceColumns} data={invoices} emptyTitle="No invoices yet" />
				</>
			)}

			{active === "agreement" && (
				<div className="grid gap-4 xl:grid-cols-2">
					<SectionCard title="Terms" subtitle={`Since ${fmtLongDate(org.since)}`} headerRight={<button type="button" onClick={() => a("agreement")} className={`${btn.secondary} ${btn.small}`}>Edit agreement</button>}>
						<DetailList columns={2} items={[{ label: "Contact", value: `${org.contactName} · ${org.contactPhone}` }, { label: "Billing email", value: org.contactEmail }, { label: "Pays within", value: `${org.termsDays} days` }, { label: "Invoices", value: org.billingCycle }, { label: "Credit limit", value: naira(org.creditLimit) }, { label: "Daily cap", value: org.dailyCap ? naira(org.dailyCap) : "None" }]} />
					</SectionCard>
					<SectionCard title="What the agreement covers"><p className="text-[13px] text-ink">{org.agreementNotes ?? "Room and breakfast · guest pays other extras"}</p><Note tone="info">Anything over the daily cap or outside the agreement is charged to the guest at check-out.</Note></SectionCard>
				</div>
			)}

			<OrgPaymentModal open={action === "payment"} org={org} invoices={invoices.filter((i) => i.status !== "PAID" && i.status !== "DRAFT")} onClose={() => setAction(null)} onSaved={(invoiceId, amount) => { setInvoices((is) => is.map((i) => (i.id === invoiceId ? { ...i, paid: i.paid + amount, status: i.paid + amount >= i.amount ? "PAID" : "PART_PAID" } : i))); setOrg((o) => ({ ...o, outstanding: Math.max(0, o.outstanding - amount) })); }} />
			<ReminderModal open={action === "reminder"} org={org} invoices={overdue.length ? overdue : invoices.filter((i) => i.status === "SENT" || i.status === "PART_PAID")} onClose={() => setAction(null)} />
			<StatementModal open={action === "statement" || action === "invoice"} kind={action === "invoice" ? "invoice" : "statement"} org={org} stays={stays} onClose={() => setAction(null)} onInvoice={(inv) => setInvoices((is) => [inv, ...is])} />
			<AddStaffPanel open={action === "add-staff"} org={org} onClose={() => setAction(null)} onSaved={(m) => setMembers((ms) => [m, ...ms])} />
			<ImportStaffModal open={action === "import"} org={org} onClose={() => setAction(null)} onSaved={(ms) => setMembers((cur) => [...ms, ...cur])} />
			<AgreementPanel open={action === "agreement"} org={org} onClose={() => setAction(null)} onSaved={(o) => setOrg(o)} />
		</>
	);
}
