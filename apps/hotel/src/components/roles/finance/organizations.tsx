"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	CreditCardIcon,
	DownloadIcon,
	FileTextIcon,
	HandshakeIcon,
	SendIcon,
} from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, MoneyField, TextField } from "@hospio/ui/shared/field";
import { fmtDay, fmtLongDate, naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { recordOrgPayment } from "@hospio/api/actions/organizations";
import { useAction } from "@hospio/api/actions/use-action";
import { billingCycleLabel } from "@hospio/api/data/mappers/organizations";
import type {
	FolioRow,
	InvoiceRow,
	OrgMemberRow,
	OrganizationRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";

const invoiceTone: Record<
	InvoiceRow["status"],
	{ label: string; tone: "success" | "warning" | "danger" | "info" | "grey" }
> = {
	DRAFT: { label: "Draft", tone: "grey" },
	SENT: { label: "Sent", tone: "info" },
	PART_PAID: { label: "Part paid", tone: "warning" },
	PAID: { label: "Paid", tone: "success" },
	OVERDUE: { label: "Overdue", tone: "danger" },
};
const pctUsed = (o: OrganizationRow) =>
	o.creditLimit > 0 ? Math.round((o.outstanding / o.creditLimit) * 100) : 0;
const day = (iso: string | undefined) => (iso ? fmtDay(iso.slice(0, 10)) : "—");

/** folio-service has no route for this: say so instead of pretending it happened. */
function notConnected(what: string) {
	toast.info(`${what} is not connected yet · nothing was sent or changed`);
}

/** Finance 6.1 · Organizations list. */
export function OrganizationsList({
	organizations,
	invoices,
}: {
	organizations: OrganizationRow[];
	invoices: InvoiceRow[];
}) {
	const [search, setSearch] = useState("");
	const outstanding = organizations.reduce((s, o) => s + o.outstanding, 0);
	const overdue = invoices.filter((i) => i.status === "OVERDUE");
	const columns = useMemo<ColumnDef<OrganizationRow, unknown>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Organization",
				cell: ({ row }) => (
					<TwoLine
						primary={row.original.name}
						secondary={
							[row.original.contactName, row.original.contactPhone]
								.filter(Boolean)
								.join(" · ") || "No contact"
						}
					/>
				),
			},
			{
				accessorKey: "staysThisMonth",
				header: "Stays this month",
				cell: ({ row }) =>
					`${row.original.staysThisMonth} · ${plural(row.original.staffCount, "person", "people")} on the list`,
			},
			{
				accessorKey: "outstanding",
				header: "Outstanding",
				cell: ({ row }) => (
					<span
						className={cn(
							"font-semibold",
							row.original.outstanding > 0 ? "text-danger" : "text-ink",
						)}
					>
						{naira(row.original.outstanding)}
					</span>
				),
			},
			{
				accessorKey: "creditLimit",
				header: "Credit used",
				cell: ({ row }) => (
					<div className="w-32">
						<ProgressBar
							value={row.original.outstanding}
							max={row.original.creditLimit || 1}
							tone={pctUsed(row.original) > 80 ? "danger" : "brand"}
						/>
						<p className="mt-1 text-[11px] text-ink-3">
							{pctUsed(row.original)}% of {naira(row.original.creditLimit)}
						</p>
					</div>
				),
				enableSorting: false,
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ row }) =>
					row.original.status === "ACTIVE" ? (
						<StatusPill tone="success">Active</StatusPill>
					) : (
						<StatusPill tone="danger">On hold</StatusPill>
					),
				enableSorting: false,
			},
			{
				id: "open",
				header: "",
				enableSorting: false,
				cell: ({ row }) => (
					<div className="flex justify-end">
						<Link
							href={`/dashboard/organizations/${row.original.id}`}
							className={`${btn.secondary} ${btn.small}`}
							onClick={(e) => e.stopPropagation()}
						>
							Open
						</Link>
					</div>
				),
			},
		],
		[],
	);
	return (
		<>
			<PageHeader
				title="Organizations"
				subtitle={`${organizations.length} company accounts · ${naira(outstanding)} outstanding · ${plural(overdue.length, "overdue invoice")}`}
			/>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Outstanding"
					value={naira(outstanding)}
					icon={HandshakeIcon}
					hint="Owed on the accounts' stays"
				/>
				<KpiCard
					label="Overdue"
					value={naira(overdue.reduce((s, i) => s + i.amount - i.paid, 0))}
					icon={FileTextIcon}
					pill={
						overdue.length ? (
							<StatusPill tone="danger">{overdue.length}</StatusPill>
						) : undefined
					}
				/>
				<KpiCard
					label="On hold"
					value={organizations.filter((o) => o.status === "ON_HOLD").length}
					icon={HandshakeIcon}
					hint="Can't book until paid"
				/>
				<KpiCard
					label="Stays this month"
					value={organizations.reduce((s, o) => s + o.staysThisMonth, 0)}
					icon={HandshakeIcon}
				/>
			</div>
			<Toolbar
				right={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Company, contact…"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={organizations}
				search={search}
				emptyTitle="No organizations yet"
				emptyHint="The manager adds company accounts in Organizations."
			/>
		</>
	);
}

/** Finance 6.2–6.5 · Organization account, invoices and record payment. Statements and invoice PDFs are not connected yet. */
export function OrganizationAccount({
	org,
	members,
	invoices: initial,
	stays,
}: {
	org: OrganizationRow;
	members: OrgMemberRow[];
	invoices: InvoiceRow[];
	stays: FolioRow[];
}) {
	const [invoices, setInvoices] = useState(initial);
	const [tab, setTab] = useQueryState("tab");
	const [openInv, setOpenInv] = useQueryState("invoice");
	const [paying, setPaying] = useState<InvoiceRow | null>(null);
	const [amount, setAmount] = useState<number | "">("");
	const [method, setMethod] = useState<"TRANSFER" | "CHEQUE" | "CASH">(
		"TRANSFER",
	);
	const [ref, setRef] = useState("");
	const { run, pending } = useAction();
	const active = tab ?? "invoices";
	const inv = invoices.find((i) => i.id === openInv) ?? null;
	const invoiced = invoices.reduce((s, i) => s + (i.amount - i.paid), 0);
	const invStays = inv
		? stays.filter(
				(f) =>
					f.openedAt.slice(0, 10) >= inv.periodFrom &&
					f.openedAt.slice(0, 10) <= inv.periodTo,
			)
		: [];
	const startPaying = (i: InvoiceRow | undefined) => {
		if (!i) {
			toast.info(
				"No open invoice on this account · the manager creates invoices",
			);
			return;
		}
		setPaying(i);
		setAmount(i.amount - i.paid);
		setRef("");
	};
	const record = () => {
		if (!paying || typeof amount !== "number") return;
		const target = paying;
		run(
			() =>
				recordOrgPayment(org.id, {
					amount,
					method,
					reference: ref,
					invoiceId: target.id,
				}),
			`${naira(amount)} recorded against ${target.number}`,
			() => {
				setInvoices((xs) =>
					xs.map((i) =>
						i.id === target.id
							? {
									...i,
									paid: i.paid + amount,
									status: i.paid + amount >= i.amount ? "PAID" : "PART_PAID",
								}
							: i,
					),
				);
				setPaying(null);
			},
		);
	};

	return (
		<>
			<PageHeader
				title={org.name}
				subtitle={`${[org.contactName, org.contactPhone].filter(Boolean).join(" · ") || "No contact"} · ${billingCycleLabel(org.billingCycle)} billing · ${org.termsDays}-day terms${org.since ? ` · since ${fmtLongDate(org.since.slice(0, 10))}` : ""}`}
			>
				<Link href="/dashboard/organizations" className={btn.secondary}>
					All organizations
				</Link>
				<button
					type="button"
					className={btn.secondary}
					onClick={() => notConnected("Statements")}
				>
					<FileTextIcon className="mr-1 inline size-4" /> Statement
				</button>
				<button
					type="button"
					className={btn.primary}
					onClick={() =>
						startPaying(
							invoices.find((i) => i.status !== "PAID" && i.status !== "DRAFT"),
						)
					}
				>
					<CreditCardIcon className="mr-1 inline size-4" /> Record payment
				</button>
			</PageHeader>
			{org.status === "ON_HOLD" && (
				<Note tone="danger">
					On hold · front office can't book on this account.
				</Note>
			)}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Outstanding"
					value={naira(org.outstanding)}
					icon={HandshakeIcon}
					hint={`Owed on its stays · ${naira(invoiced)} left on invoices`}
				/>
				<KpiCard
					label="Credit limit"
					value={naira(org.creditLimit)}
					icon={HandshakeIcon}
					hint={`${pctUsed(org)}% used${org.dailyCap ? ` · daily cap ${naira(org.dailyCap)}` : ""}`}
				/>
				<KpiCard
					label="Stays this month"
					value={org.staysThisMonth}
					icon={HandshakeIcon}
					hint={`${stays.length} on record`}
				/>
				<KpiCard
					label="People on the list"
					value={members.length}
					icon={HandshakeIcon}
					hint={`${members.filter((m) => m.active).length} active`}
				/>
			</div>
			<PillTabs
				value={active}
				onChange={(k) => void setTab(k === "invoices" ? null : k)}
				tabs={[
					{ key: "invoices", label: "Invoices", count: invoices.length },
					{ key: "stays", label: "Stays & bills", count: stays.length },
					{ key: "people", label: "People", count: members.length },
					{ key: "agreement", label: "Agreement" },
				]}
			/>
			{active === "invoices" && (
				<SectionCard title="Invoices" flush>
					{invoices.length === 0 ? (
						<p className="px-5 py-4 text-[13px] text-ink-3">
							No invoices yet · the manager creates them from the account.
						</p>
					) : (
						<table className="w-full text-left text-[13px]">
							<thead>
								<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
									<th className="px-5 py-2">Invoice</th>
									<th className="py-2">Period</th>
									<th className="py-2 text-right">Amount</th>
									<th className="py-2 text-right">Paid</th>
									<th className="py-2">Due</th>
									<th className="py-2">Status</th>
									<th className="px-5 py-2" />
								</tr>
							</thead>
							<tbody>
								{invoices.map((i) => (
									<tr
										key={i.id}
										className="border-b border-line last:border-b-0"
									>
										<td className="px-5 py-3 font-semibold text-ink">
											{i.number}
										</td>
										<td className="py-3 text-ink-2">
											{fmtDay(i.periodFrom)} → {fmtDay(i.periodTo)}
										</td>
										<td className="py-3 text-right">{naira(i.amount)}</td>
										<td className="py-3 text-right text-success">
											{naira(i.paid)}
										</td>
										<td
											className={cn(
												"py-3",
												i.status === "OVERDUE" && "font-semibold text-danger",
											)}
										>
											{fmtDay(i.dueDate)}
										</td>
										<td className="py-3">
											<StatusPill tone={invoiceTone[i.status].tone}>
												{invoiceTone[i.status].label}
											</StatusPill>
										</td>
										<td className="px-5 py-3 text-right">
											<button
												type="button"
												className={`${btn.secondary} ${btn.small}`}
												onClick={() => void setOpenInv(i.id)}
											>
												Open
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</SectionCard>
			)}
			{active === "stays" && (
				<SectionCard title="Stays billed to the account" flush>
					{stays.length === 0 ? (
						<p className="px-5 py-4 text-[13px] text-ink-3">
							No stays on this account yet.
						</p>
					) : (
						<table className="w-full text-left text-[13px]">
							<thead>
								<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
									<th className="px-5 py-2">Guest</th>
									<th className="py-2">Stay</th>
									<th className="py-2">Room</th>
									<th className="py-2 text-right">Charges</th>
									<th className="py-2 text-right">Owed</th>
									<th className="px-5 py-2">Status</th>
								</tr>
							</thead>
							<tbody>
								{stays.map((f) => (
									<tr
										key={f.id}
										className="border-b border-line last:border-b-0"
									>
										<td className="px-5 py-3 font-semibold text-ink">
											{f.guestName}
										</td>
										<td className="py-3 text-ink-2">
											{day(f.openedAt)} → {f.closedAt ? day(f.closedAt) : "now"}
										</td>
										<td className="py-3">{f.roomNumber || "—"}</td>
										<td className="py-3 text-right">
											{naira(f.charges + f.tax - f.discounts)}
										</td>
										<td className="py-3 text-right">{naira(f.balance)}</td>
										<td className="px-5 py-3">
											<StatusPill
												tone={f.status === "OPEN" ? "success" : "grey"}
											>
												{f.status === "OPEN" ? "In house" : "Checked out"}
											</StatusPill>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</SectionCard>
			)}
			{active === "people" && (
				<SectionCard
					title="Who can book on this account"
					subtitle="Managed by the manager · you see it to check a stay"
					flush
				>
					<ul className="divide-y divide-line">
						{members.length === 0 && (
							<li className="px-5 py-3 text-[13px] text-ink-3">
								Nobody on the list yet.
							</li>
						)}
						{members.map((m) => (
							<li
								key={m.id}
								className="flex items-center gap-3 px-5 py-3 text-[13px]"
							>
								<span className="flex-1 font-medium text-ink">
									{m.fullName}{" "}
									<span className="text-ink-3">· {m.staffRef}</span>
								</span>
								<span className="text-ink-2">{m.phone}</span>
								{m.active ? (
									<StatusPill tone="success">Active</StatusPill>
								) : (
									<StatusPill tone="grey">Removed</StatusPill>
								)}
							</li>
						))}
					</ul>
				</SectionCard>
			)}
			{active === "agreement" && (
				<SectionCard
					title="Agreement"
					subtitle="Changed by the manager in Organizations"
				>
					<DetailList
						columns={2}
						items={[
							{ label: "Credit limit", value: naira(org.creditLimit) },
							{
								label: "Daily cap",
								value: org.dailyCap ? naira(org.dailyCap) : "None",
							},
							{
								label: "Billing",
								value: `${billingCycleLabel(org.billingCycle)} · ${org.termsDays} days`,
							},
							{
								label: "Contact",
								value:
									[org.contactName, org.contactEmail]
										.filter(Boolean)
										.join(" · ") || "—",
							},
							{ label: "Notes", value: org.agreementNotes ?? "—" },
						]}
					/>
				</SectionCard>
			)}

			<SidePanel
				open={!!inv}
				onOpenChange={(o) => !o && void setOpenInv(null)}
				title={inv?.number ?? ""}
				subtitle={
					inv
						? `${org.name} · ${fmtLongDate(inv.periodFrom)} → ${fmtLongDate(inv.periodTo)} · due ${fmtLongDate(inv.dueDate)}`
						: undefined
				}
				icon={FileTextIcon}
				footer={
					inv && (
						<>
							<button
								type="button"
								className={btn.secondary}
								onClick={() => notConnected("Emailing invoices")}
							>
								<SendIcon className="mr-1 inline size-4" /> Send
							</button>
							<button
								type="button"
								className={btn.secondary}
								onClick={() => notConnected("Invoice PDFs")}
							>
								<DownloadIcon className="mr-1 inline size-4" /> PDF
							</button>
							{inv.status !== "PAID" && (
								<button
									type="button"
									className={btn.primary}
									onClick={() => startPaying(inv)}
								>
									Record payment
								</button>
							)}
						</>
					)
				}
				footerInfo={
					inv && (
						<StatusPill tone={invoiceTone[inv.status].tone}>
							{invoiceTone[inv.status].label}
						</StatusPill>
					)
				}
			>
				{inv && (
					<div className="flex flex-col gap-6">
						<TotalsList
							rows={[
								{ label: "Invoice total", value: naira(inv.amount) },
								{
									label: "Paid",
									value: `-${naira(inv.paid)}`,
									tone: "success",
								},
								{
									label: "Balance",
									value: naira(inv.amount - inv.paid),
									strong: true,
									tone: inv.amount - inv.paid > 0 ? "danger" : "success",
								},
							]}
						/>
						<PanelSection title="Stays opened in this period">
							<ul className="divide-y divide-line text-[13px]">
								{invStays.length === 0 && (
									<li className="py-2 text-ink-3">
										No stays opened in this period
									</li>
								)}
								{invStays.map((f) => (
									<li key={f.id} className="flex justify-between py-2">
										<span>
											{f.guestName}
											{f.roomNumber ? ` · ${f.roomNumber}` : ""} ·{" "}
											{day(f.openedAt)}
										</span>
										<span className="font-medium">
											{naira(f.balance)} owed now
										</span>
									</li>
								))}
							</ul>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<Modal
				open={!!paying}
				onOpenChange={(o) => !o && setPaying(null)}
				title="Record a payment from the company"
				subtitle={
					paying
						? `${paying.number} · ${naira(paying.amount - paying.paid)} outstanding`
						: undefined
				}
				icon={CreditCardIcon}
				size="confirm"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setPaying(null)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={typeof amount !== "number" || amount <= 0 || pending}
							onClick={record}
						>
							Record
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<MoneyField
						label="Amount received"
						value={amount}
						onChange={setAmount}
						required
					/>
					<ChoiceCards
						label="How"
						value={method}
						onChange={setMethod}
						columns={3}
						options={[
							{ value: "TRANSFER", label: "Transfer" },
							{ value: "CHEQUE", label: "Cheque" },
							{ value: "CASH", label: "Cash" },
						]}
					/>
					<TextField
						label="Reference"
						value={ref}
						onChange={setRef}
						placeholder="Bank reference or cheque no."
					/>
				</div>
			</Modal>
		</>
	);
}
