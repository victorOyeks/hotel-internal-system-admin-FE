"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CreditCardIcon, DownloadIcon, FileTextIcon, HandshakeIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { DetailList, Note, TotalsList } from "@/components/shared/detail-list";
import { ChoiceCards, MoneyField, TextField } from "@/components/shared/field";
import { fmtDay, fmtLongDate, naira, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionCard } from "@/components/shared/section-card";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import type { BookingRow, InvoiceRow, OrgMemberRow, OrganizationRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";

const invoiceTone: Record<InvoiceRow["status"], { label: string; tone: "success" | "warning" | "danger" | "info" | "grey" }> = { DRAFT: { label: "Draft", tone: "grey" }, SENT: { label: "Sent", tone: "info" }, PART_PAID: { label: "Part paid", tone: "warning" }, PAID: { label: "Paid", tone: "success" }, OVERDUE: { label: "Overdue", tone: "danger" } };

/** Finance 6.1 · Organizations list. */
export function OrganizationsList({ organizations, invoices }: { organizations: OrganizationRow[]; invoices: InvoiceRow[] }) {
	const [search, setSearch] = useState("");
	const outstanding = organizations.reduce((s, o) => s + o.outstanding, 0);
	const overdue = invoices.filter((i) => i.status === "OVERDUE");
	const columns = useMemo<ColumnDef<OrganizationRow, unknown>[]>(
		() => [
			{ accessorKey: "name", header: "Organization", cell: ({ row }) => <TwoLine primary={row.original.name} secondary={`${row.original.contactName} · ${row.original.contactPhone}`} /> },
			{ accessorKey: "staysThisMonth", header: "Stays this month", cell: ({ row }) => `${row.original.staysThisMonth} · ${plural(row.original.staffCount, "person", "people")} on the list` },
			{ accessorKey: "outstanding", header: "Outstanding", cell: ({ row }) => <span className={cn("font-semibold", row.original.outstanding > 0 ? "text-danger" : "text-ink")}>{naira(row.original.outstanding)}</span> },
			{ accessorKey: "creditLimit", header: "Credit used", cell: ({ row }) => <div className="w-32"><ProgressBar value={row.original.outstanding} max={row.original.creditLimit} tone={row.original.outstanding / row.original.creditLimit > 0.8 ? "danger" : "brand"} /><p className="mt-1 text-[11px] text-ink-3">{Math.round((row.original.outstanding / row.original.creditLimit) * 100)}% of {naira(row.original.creditLimit)}</p></div>, enableSorting: false },
			{ accessorKey: "status", header: "Status", cell: ({ row }) => (row.original.status === "ACTIVE" ? <StatusPill tone="success">Active</StatusPill> : <StatusPill tone="danger">On hold</StatusPill>), enableSorting: false },
			{ id: "open", header: "", enableSorting: false, cell: ({ row }) => <div className="flex justify-end"><Link href={`/dashboard/organizations/${row.original.id}`} className={`${btn.secondary} ${btn.small}`} onClick={(e) => e.stopPropagation()}>Open</Link></div> },
		],
		[],
	);
	return (
		<>
			<PageHeader title="Organizations" subtitle={`${organizations.length} company accounts · ${naira(outstanding)} outstanding · ${plural(overdue.length, "overdue invoice")}`} />
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Outstanding" value={naira(outstanding)} icon={HandshakeIcon} hint="Across all accounts" />
				<KpiCard label="Overdue" value={naira(overdue.reduce((s, i) => s + i.amount - i.paid, 0))} icon={FileTextIcon} pill={overdue.length ? <StatusPill tone="danger">{overdue.length}</StatusPill> : undefined} />
				<KpiCard label="On hold" value={organizations.filter((o) => o.status === "ON_HOLD").length} icon={HandshakeIcon} hint="Can't book until paid" />
				<KpiCard label="Stays this month" value={organizations.reduce((s, o) => s + o.staysThisMonth, 0)} icon={HandshakeIcon} />
			</div>
			<Toolbar right={<SearchBox value={search} onChange={setSearch} placeholder="Company, contact…" />} />
			<DataTable columns={columns} data={organizations} search={search} />
		</>
	);
}

/** Finance 6.2–6.5 · Organization account, statement, invoice, record payment. */
export function OrganizationAccount({ org, members, invoices: initial, bookings }: { org: OrganizationRow; members: OrgMemberRow[]; invoices: InvoiceRow[]; bookings: BookingRow[] }) {
	const [invoices, setInvoices] = useState(initial);
	const [tab, setTab] = useQueryState("tab");
	const [openInv, setOpenInv] = useQueryState("invoice");
	const [statement, setStatement] = useState(false);
	const [paying, setPaying] = useState<InvoiceRow | null>(null);
	const [amount, setAmount] = useState<number | "">("");
	const [method, setMethod] = useState<"TRANSFER" | "CHEQUE" | "CASH">("TRANSFER");
	const [ref, setRef] = useState("");
	const { run, pending } = useDemoAction();
	const active = tab ?? "invoices";
	const inv = invoices.find((i) => i.id === openInv) ?? null;
	const outstanding = invoices.reduce((s, i) => s + (i.amount - i.paid), 0);

	return (
		<>
			<PageHeader title={org.name} subtitle={`${org.contactName} · ${org.contactPhone} · ${org.billingCycle} billing · ${org.termsDays}-day terms · since ${fmtLongDate(org.since)}`}>
				<Link href="/dashboard/organizations" className={btn.secondary}>All organizations</Link>
				<button type="button" className={btn.secondary} onClick={() => setStatement(true)}><FileTextIcon className="mr-1 inline size-4" /> Statement</button>
				<button type="button" className={btn.primary} onClick={() => { setPaying(invoices.find((i) => i.status !== "PAID") ?? null); setAmount(""); }}><CreditCardIcon className="mr-1 inline size-4" /> Record payment</button>
			</PageHeader>
			{org.status === "ON_HOLD" && <Note tone="danger">On hold · {org.agreementNotes}. Front office can't book on this account until an invoice is paid.</Note>}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Outstanding" value={naira(outstanding)} icon={HandshakeIcon} hint={`${plural(invoices.filter((i) => i.status === "OVERDUE").length, "overdue invoice")}`} />
				<KpiCard label="Credit limit" value={naira(org.creditLimit)} icon={HandshakeIcon} hint={`${Math.round((org.outstanding / org.creditLimit) * 100)}% used${org.dailyCap ? ` · daily cap ${naira(org.dailyCap)}` : ""}`} />
				<KpiCard label="Stays this month" value={org.staysThisMonth} icon={HandshakeIcon} hint={`${bookings.length} on record`} />
				<KpiCard label="People on the list" value={members.length} icon={HandshakeIcon} hint={`${members.filter((m) => m.active).length} active`} />
			</div>
			<PillTabs value={active} onChange={(k) => void setTab(k === "invoices" ? null : k)} tabs={[{ key: "invoices", label: "Invoices", count: invoices.length }, { key: "stays", label: "Stays & bills", count: bookings.length }, { key: "people", label: "People", count: members.length }, { key: "agreement", label: "Agreement" }]} />
			{active === "invoices" && (
				<SectionCard title="Invoices" flush>
					<table className="w-full text-left text-[13px]">
						<thead><tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="px-5 py-2">Invoice</th><th className="py-2">Period</th><th className="py-2 text-right">Amount</th><th className="py-2 text-right">Paid</th><th className="py-2">Due</th><th className="py-2">Status</th><th className="px-5 py-2" /></tr></thead>
						<tbody>
							{invoices.map((i) => (
								<tr key={i.id} className="border-b border-line last:border-b-0">
									<td className="px-5 py-3 font-semibold text-ink">{i.number}</td>
									<td className="py-3 text-ink-2">{fmtDay(i.periodFrom)} → {fmtDay(i.periodTo)}</td>
									<td className="py-3 text-right">{naira(i.amount)}</td>
									<td className="py-3 text-right text-success">{naira(i.paid)}</td>
									<td className={cn("py-3", i.status === "OVERDUE" && "font-semibold text-danger")}>{fmtDay(i.dueDate)}</td>
									<td className="py-3"><StatusPill tone={invoiceTone[i.status].tone}>{invoiceTone[i.status].label}</StatusPill></td>
									<td className="px-5 py-3 text-right"><button type="button" className={`${btn.secondary} ${btn.small}`} onClick={() => void setOpenInv(i.id)}>Open</button></td>
								</tr>
							))}
						</tbody>
					</table>
				</SectionCard>
			)}
			{active === "stays" && (
				<SectionCard title="Stays billed to the account" flush>
					<table className="w-full text-left text-[13px]">
						<thead><tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="px-5 py-2">Guest</th><th className="py-2">Stay</th><th className="py-2">Room</th><th className="py-2 text-right">Amount</th><th className="px-5 py-2">Status</th></tr></thead>
						<tbody>
							{bookings.map((b) => (
								<tr key={b.id} className="border-b border-line last:border-b-0"><td className="px-5 py-3 font-semibold text-ink">{b.guestName}</td><td className="py-3 text-ink-2">{fmtDay(b.checkInDate)} → {fmtDay(b.checkOutDate)} · {plural(b.nights, "night")}</td><td className="py-3">{b.roomNumber ?? b.roomTypeName}</td><td className="py-3 text-right">{naira(b.totalAmount)}</td><td className="px-5 py-3"><StatusPill tone={b.status === "CHECKED_IN" ? "success" : b.status === "BOOKED" ? "info" : "grey"}>{b.status.toLowerCase().replace("_", " ")}</StatusPill></td></tr>
							))}
						</tbody>
					</table>
				</SectionCard>
			)}
			{active === "people" && (
				<SectionCard title="Who can book on this account" subtitle="Managed by the manager · you see it to check a stay" flush>
					<ul className="divide-y divide-line">
						{members.map((m) => (
							<li key={m.id} className="flex items-center gap-3 px-5 py-3 text-[13px]"><span className="flex-1 font-medium text-ink">{m.fullName} <span className="text-ink-3">· {m.staffRef}</span></span><span className="text-ink-2">{m.phone}</span>{m.active ? <StatusPill tone="success">Active</StatusPill> : <StatusPill tone="grey">Removed</StatusPill>}</li>
						))}
					</ul>
				</SectionCard>
			)}
			{active === "agreement" && (
				<SectionCard title="Agreement" subtitle="Changed by the manager in Organizations">
					<DetailList columns={2} items={[{ label: "Credit limit", value: naira(org.creditLimit) }, { label: "Daily cap", value: org.dailyCap ? naira(org.dailyCap) : "None" }, { label: "Billing", value: `${org.billingCycle} · ${org.termsDays} days` }, { label: "Contact", value: `${org.contactName} · ${org.contactEmail}` }, { label: "Notes", value: org.agreementNotes ?? "—" }]} />
				</SectionCard>
			)}

			<SidePanel open={!!inv} onOpenChange={(o) => !o && void setOpenInv(null)} title={inv?.number ?? ""} subtitle={inv ? `${org.name} · ${fmtLongDate(inv.periodFrom)} → ${fmtLongDate(inv.periodTo)} · due ${fmtLongDate(inv.dueDate)}` : undefined} icon={FileTextIcon} footer={inv && <><button type="button" className={btn.secondary} disabled={pending} onClick={() => void run(`Invoice sent to ${org.contactEmail}`, undefined, { tone: "info" })}><SendIcon className="mr-1 inline size-4" /> Send</button><button type="button" className={btn.secondary} disabled={pending} onClick={() => void run("Invoice downloading (PDF)", undefined, { tone: "info" })}><DownloadIcon className="mr-1 inline size-4" /> PDF</button>{inv.status !== "PAID" && <button type="button" className={btn.primary} onClick={() => { setPaying(inv); setAmount(inv.amount - inv.paid); }}>Record payment</button>}</>} footerInfo={inv && <StatusPill tone={invoiceTone[inv.status].tone}>{invoiceTone[inv.status].label}</StatusPill>}>
				{inv && (
					<div className="flex flex-col gap-6">
						<TotalsList rows={[{ label: "Room nights", value: naira(Math.round(inv.amount * 0.86)) }, { label: "Restaurant, bar, laundry", value: naira(Math.round(inv.amount * 0.14)) }, { label: "Invoice total", value: naira(inv.amount) }, { label: "Paid", value: `-${naira(inv.paid)}`, tone: "success" }, { label: "Balance", value: naira(inv.amount - inv.paid), strong: true, tone: inv.amount - inv.paid > 0 ? "danger" : "success" }]} />
						<PanelSection title="Stays on this invoice">
							<ul className="divide-y divide-line text-[13px]">
								{bookings.slice(0, 4).map((b) => <li key={b.id} className="flex justify-between py-2"><span>{b.guestName} · {b.roomNumber ?? b.roomTypeName} · {plural(b.nights, "night")}</span><span className="font-medium">{naira(b.totalAmount)}</span></li>)}
							</ul>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<Modal open={statement} onOpenChange={setStatement} title="Create a statement" subtitle={`${org.name} · every stay and payment in the period`} icon={FileTextIcon} size="confirm" footer={<><button type="button" className={btn.secondary} onClick={() => setStatement(false)}>Cancel</button><button type="button" className={btn.primary} disabled={pending} onClick={() => void run(`Statement sent to ${org.contactEmail}`, () => setStatement(false))}>Create & send</button></>}>
				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3"><TextField label="From" type="date" value={invoices[0]?.periodFrom ?? ""} onChange={() => undefined} /><TextField label="To" type="date" value={invoices[0]?.periodTo ?? ""} onChange={() => undefined} /></div>
					<ChoiceCards value="EMAIL" onChange={() => undefined} columns={2} options={[{ value: "EMAIL", label: "Email", hint: org.contactEmail }, { value: "PDF", label: "Download PDF" }]} />
				</div>
			</Modal>

			<Modal open={!!paying} onOpenChange={(o) => !o && setPaying(null)} title="Record a payment from the company" subtitle={paying ? `${paying.number} · ${naira(paying.amount - paying.paid)} outstanding` : undefined} icon={CreditCardIcon} size="confirm" footer={<><button type="button" className={btn.secondary} onClick={() => setPaying(null)}>Cancel</button><button type="button" className={btn.primary} disabled={typeof amount !== "number" || amount <= 0 || pending} onClick={() => void run(`${naira(typeof amount === "number" ? amount : 0)} recorded against ${paying?.number}`, () => { setInvoices((xs) => xs.map((i) => (i.id === paying?.id ? { ...i, paid: i.paid + (typeof amount === "number" ? amount : 0), status: i.paid + (typeof amount === "number" ? amount : 0) >= i.amount ? "PAID" : "PART_PAID" } : i))); setPaying(null); })}>Record</button></>}>
				<div className="flex flex-col gap-4">
					<MoneyField label="Amount received" value={amount} onChange={setAmount} required />
					<ChoiceCards label="How" value={method} onChange={setMethod} columns={3} options={[{ value: "TRANSFER", label: "Transfer" }, { value: "CHEQUE", label: "Cheque" }, { value: "CASH", label: "Cash" }]} />
					<TextField label="Reference" value={ref} onChange={setRef} placeholder="Bank reference or cheque no." />
				</div>
			</Modal>
		</>
	);
}
