"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowLeftIcon,
	BellIcon,
	CreditCardIcon,
	FileTextIcon,
	PencilIcon,
	PlusIcon,
	PrinterIcon,
	UploadIcon,
	UserPlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName, DetailList, Note } from "@hospio/ui/shared/detail-list";
import {
	fmtDay,
	fmtLongDate,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { billingCycleLabel } from "@hospio/api/data/mappers/organizations";
import type { Paged, PageResult } from "@hospio/api/data/paging";
import { useListParams } from "@hospio/ui/shared/list-params";
import type {
	FolioRow,
	InvoiceRow,
	OrgMemberRow,
	OrganizationRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import {
	sendOrgMessage,
	setOrgMemberActive,
} from "@hospio/api/actions/organizations";
import { useAction } from "@hospio/api/actions/use-action";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import {
	AddStaffPanel,
	AgreementPanel,
	ImportStaffModal,
	InvoiceModal,
	OrgPaymentModal,
} from "./organization-panels";

export type OrgAction =
	| "payment"
	| "add-staff"
	| "import"
	| "agreement"
	| "invoice";
const TABS = ["overview", "stays", "staff", "invoices", "agreement"] as const;
type Tab = (typeof TABS)[number];

const invoiceTone = {
	DRAFT: "grey",
	SENT: "info",
	PART_PAID: "warning",
	PAID: "success",
	OVERDUE: "danger",
} as const;
const invoiceLabel = {
	DRAFT: "Draft · not sent",
	SENT: "Sent",
	PART_PAID: "Part-paid",
	PAID: "Paid",
	OVERDUE: "Overdue",
} as const;
const stayDay = (iso: string | undefined) =>
	iso ? fmtDay(iso.slice(0, 10)) : "—";

export function OrganizationScreen({
	org: initialOrg,
	members: initialMembers,
	invoices: invoicePage,
	stays: stayPage,
	openInvoices,
	inHouse: inHousePage,
}: {
	org: OrganizationRow;
	members: OrgMemberRow[];
	/** A page of the account's invoices (`?invPage=`), latest due first. */
	invoices: PageResult<InvoiceRow>;
	/** A page of its stays (`?staysPage=`), latest opened first. */
	stays: PageResult<FolioRow>;
	/** Every invoice still to be paid (Record payment picks from these). */
	openInvoices: InvoiceRow[];
	/** The account's open stays (staff staying now). */
	inHouse: Paged<FolioRow>;
}) {
	const router = useRouter();
	const [tab] = useQueryState("tab", parseAsString.withDefault("overview"));
	const [action, setAction] = useQueryState("action");
	const invList = useListParams({ prefix: "inv" });
	const stayList = useListParams({ prefix: "stays" });
	const [org, setOrg] = useState(initialOrg);
	const [members, setMembers] = useState(initialMembers);
	const [invoices, setInvoices] = useState(invoicePage.data.content);
	// A new page or new figures from the server replace what is on screen.
	useEffect(() => setInvoices(invoicePage.data.content), [invoicePage]);
	useEffect(() => setOrg(initialOrg), [initialOrg]);
	const stays = stayPage.data.content;
	const active = (TABS.includes(tab as Tab) ? tab : "overview") as Tab;
	const overdueCount = org.overdueInvoices ?? 0;
	const inHouse = inHousePage.content;
	const running =
		org.runningBalance ?? inHouse.reduce((s, f) => s + f.balance, 0);
	const used =
		org.creditLimit > 0
			? Math.round((org.outstanding / org.creditLimit) * 100)
			: 0;
	const a = (x: OrgAction) => setAction(x);
	const { run } = useAction();
	const send = (what: "statement" | "reminder") =>
		run(
			() =>
				withDeliveries(
					sendOrgMessage(org.id, what),
					`${what === "statement" ? "Statement" : "Reminder"} to ${org.name}`,
				),
			what === "statement"
				? `Statement sent to ${org.contactEmail || org.contactName || org.name}`
				: `Payment reminder sent to ${org.contactEmail || org.contactName || org.name}`,
		);

	const stayColumns: ColumnDef<FolioRow, unknown>[] = [
		{
			accessorKey: "guestName",
			header: "Staff member",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.guestName}
					secondary={row.original.reference}
				/>
			),
		},
		{
			accessorKey: "roomNumber",
			header: "Room",
			cell: ({ row }) => row.original.roomNumber || "—",
		},
		{
			accessorKey: "openedAt",
			header: "Stay",
			cell: ({ row }) => (
				<TwoLine
					primary={`${stayDay(row.original.openedAt)} → ${row.original.closedAt ? stayDay(row.original.closedAt) : "now"}`}
					secondary={
						row.original.status === "OPEN" ? "Folio open" : "Folio closed"
					}
				/>
			),
		},
		{
			accessorKey: "charges",
			header: "Charges",
			cell: ({ row }) =>
				naira(row.original.charges + row.original.tax - row.original.discounts),
		},
		{
			accessorKey: "payments",
			header: "Paid",
			cell: ({ row }) =>
				row.original.payments > 0 ? (
					naira(row.original.payments)
				) : (
					<span className="text-ink-3">—</span>
				),
		},
		{
			accessorKey: "balance",
			header: "Owed",
			cell: ({ row }) => (
				<span
					className={
						row.original.balance > 0 ? "font-semibold text-ink" : "text-ink-3"
					}
				>
					{naira(row.original.balance)}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={row.original.status === "OPEN" ? "success" : "grey"}>
					{row.original.status === "OPEN" ? "In house" : "Checked out"}
				</StatusPill>
			),
		},
		{
			id: "x",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<Link
					href={`/dashboard/folios?open=${row.original.id}`}
					className="text-[13px] font-semibold text-brand"
					onClick={(e) => e.stopPropagation()}
				>
					Open
				</Link>
			),
		},
	];
	const memberColumns: ColumnDef<OrgMemberRow, unknown>[] = [
		{
			accessorKey: "fullName",
			header: "Name",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.fullName}
					secondary={row.original.staffRef}
				/>
			),
		},
		{ accessorKey: "phone", header: "Phone" },
		{
			accessorKey: "email",
			header: "Email",
			cell: ({ row }) =>
				row.original.email ?? <span className="text-ink-3">—</span>,
		},
		{
			accessorKey: "active",
			header: "Can book",
			cell: ({ row }) => (
				<StatusPill tone={row.original.active ? "success" : "grey"}>
					{row.original.active ? "Yes" : "Removed"}
				</StatusPill>
			),
		},
		{
			id: "a",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<RowActions
					actions={[
						{
							label: "Book a stay",
							onClick: () => router.push("/dashboard/bookings?new=1"),
						},
						{
							label: row.original.active
								? "Remove from account"
								: "Allow again",
							tone: row.original.active ? "danger" : "default",
							separatorBefore: true,
							onClick: () => {
								const next = !row.original.active;
								run(
									() => setOrgMemberActive(org.id, row.original.id, next),
									next
										? `${row.original.fullName} can stay on account again`
										: `${row.original.fullName} removed from the account`,
									() =>
										setMembers((ms) =>
											ms.map((m) =>
												m.id === row.original.id ? { ...m, active: next } : m,
											),
										),
								);
							},
						},
					]}
				/>
			),
		},
	];
	const invoiceColumns: ColumnDef<InvoiceRow, unknown>[] = [
		{
			accessorKey: "number",
			header: "Invoice",
			cell: ({ row }) => (
				<span className="font-semibold">{row.original.number}</span>
			),
		},
		{
			accessorKey: "periodFrom",
			header: "Period",
			cell: ({ row }) =>
				`${fmtDay(row.original.periodFrom)} – ${fmtDay(row.original.periodTo)}`,
		},
		{
			accessorKey: "amount",
			header: "Amount",
			cell: ({ row }) => (
				<TwoLine
					primary={naira(row.original.amount)}
					secondary={
						row.original.paid > 0 && row.original.paid < row.original.amount
							? `${naira(row.original.paid)} paid`
							: undefined
					}
				/>
			),
		},
		{
			accessorKey: "dueDate",
			header: "Due",
			cell: ({ row }) => (
				<span
					className={
						row.original.status === "OVERDUE" ? "font-semibold text-danger" : ""
					}
				>
					{fmtDay(row.original.dueDate)}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={invoiceTone[row.original.status]}>
					{invoiceLabel[row.original.status]}
				</StatusPill>
			),
		},
		{
			id: "a",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex justify-end gap-2">
					{row.original.status !== "PAID" &&
						row.original.status !== "DRAFT" && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									a("payment");
								}}
								className={`${btn.secondary} ${btn.small}`}
							>
								Record payment
							</button>
						)}
					<button
						type="button"
						disabled
						title="Invoice PDFs are not connected yet"
						aria-label="Invoice PDF · not connected yet"
						onClick={(e) => e.stopPropagation()}
						className={`${btn.ghost} ${btn.small} cursor-not-allowed opacity-50`}
					>
						PDF
					</button>
				</div>
			),
		},
	];

	return (
		<>
			<Link
				href="/dashboard/organizations"
				className="flex items-center gap-1 text-[13px] font-semibold text-ink-2 hover:text-ink"
			>
				<ArrowLeftIcon className="size-4" /> All organizations
			</Link>
			<PageHeader
				title={org.name}
				subtitle={`Organization · pays within ${org.termsDays} days · ${org.contactName || "no contact"}${org.contactEmail ? ` · ${org.contactEmail}` : ""}`}
			>
				<Button
					variant="outline"
					className={btn.secondary}
					onClick={() => send("statement")}
				>
					<PrinterIcon className="size-4" /> Send statement
				</Button>
				<Button className={btn.primary} onClick={() => a("payment")}>
					<CreditCardIcon className="size-4" /> Record payment
				</Button>
			</PageHeader>
			{org.status === "ON_HOLD" && (
				<Note tone="danger">
					On hold · staff from {org.name} cannot book on account. Take it off
					hold from its row menu on Organizations.
				</Note>
			)}
			<PillTabs
				param="tab"
				defaultValue="overview"
				tabs={[
					{ key: "overview", label: "Overview" },
					{
						key: "stays",
						label: "Stays & bills",
						count: stayPage.data.total,
					},
					{ key: "staff", label: "Staff", count: members.length },
					{
						key: "invoices",
						label: "Invoices",
						count: invoicePage.data.total,
					},
					{ key: "agreement", label: "Agreement" },
				]}
			/>

			{active === "overview" && (
				<>
					<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
						<div className="rounded-card border border-line bg-card p-[18px]">
							<p className="text-[13px] text-ink-2">Owed on stays</p>
							<p className="mt-1 text-2xl font-bold text-ink">
								{naira(org.outstanding)}
							</p>
							<p className="text-xs text-ink-3">
								What is left on the account's{" "}
								{plural(org.stays ?? stayPage.data.total, "folio")}
							</p>
						</div>
						<div
							className={cn(
								"rounded-card border p-[18px]",
								overdueCount
									? "border-danger/20 bg-danger-soft"
									: "border-line bg-card",
							)}
						>
							<p className="text-[13px] text-ink-2">Overdue</p>
							<p
								className={cn(
									"mt-1 text-2xl font-bold",
									overdueCount ? "text-danger" : "text-ink",
								)}
							>
								{naira(org.overdueAmount ?? 0)}
							</p>
							<p className="text-xs text-ink-3">
								{overdueCount && org.overdueNumber
									? `${org.overdueNumber} · due ${fmtDay(org.overdueDueDate ?? "")}`
									: "Nothing overdue"}
							</p>
						</div>
						<div
							className={cn(
								"rounded-card border p-[18px]",
								running
									? "border-warning/30 bg-warning-soft"
									: "border-line bg-card",
							)}
						>
							<p className="text-[13px] text-ink-2">Stays still running</p>
							<p
								className={cn(
									"mt-1 text-2xl font-bold",
									running ? "text-warning" : "text-ink",
								)}
							>
								{naira(running)}
							</p>
							<p className="text-xs text-ink-3">
								{(org.openStays ?? inHousePage.total)
									? `${plural(org.openStays ?? inHousePage.total, "stay")} in house`
									: "No open stays"}
							</p>
						</div>
						<div className="rounded-card border border-line bg-card p-[18px]">
							<p className="text-[13px] text-ink-2">Credit limit used</p>
							<p className="mt-1 text-2xl font-bold text-ink">{used}%</p>
							<div className="mt-2 h-[6px] overflow-hidden rounded-full bg-subtle">
								<div
									className={cn(
										"h-full rounded-full",
										used >= 80 ? "bg-danger" : "bg-success",
									)}
									style={{ width: `${Math.min(100, used)}%` }}
								/>
							</div>
							<p className="mt-1 text-xs text-ink-3">
								{naira(Math.max(0, org.creditLimit - org.outstanding))} left of{" "}
								{nairaShort(org.creditLimit)}
							</p>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-[10px] md:grid-cols-5">
						{(
							[
								["Create invoice", FileTextIcon, () => a("invoice")],
								["Record payment", CreditCardIcon, () => a("payment")],
								["Send reminder", BellIcon, () => send("reminder")],
								["Send statement", PrinterIcon, () => send("statement")],
								["Change terms", PencilIcon, () => a("agreement")],
							] as const
						).map(([label, I, fn]) => (
							<button
								key={label}
								type="button"
								onClick={fn}
								className="flex items-center gap-[10px] rounded-xl border border-line bg-card px-[14px] py-3 text-[13px] font-semibold text-ink hover:bg-brand-soft/40"
							>
								<span className="flex size-[30px] items-center justify-center rounded-[9px] bg-brand-soft text-brand">
									<I className="size-[15px]" />
								</span>
								{label}
							</button>
						))}
					</div>
					<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
						<SectionCard
							title="Invoices"
							flush
							count={invoicePage.data.total}
							action={
								invoicePage.data.total > 6
									? {
											label: `All ${invoicePage.data.total}`,
											href: `/dashboard/organizations/${org.id}?tab=invoices`,
										}
									: undefined
							}
						>
							<DataTable
								columns={invoiceColumns}
								data={invoices.slice(0, 6)}
								pageSize={6}
								className="rounded-none border-0"
								emptyTitle="No invoices yet"
								error={invoicePage.ok ? null : invoicePage.error}
								onRetry={() => router.refresh()}
							/>
						</SectionCard>
						<div className="flex flex-col gap-4">
							<SectionCard title="Staff staying now" count={inHousePage.total}>
								{inHouse.length === 0 ? (
									<p className="py-2 text-xs text-ink-3">Nobody in house</p>
								) : (
									inHouse.map((f) => (
										<div
											key={f.id}
											className="flex items-center gap-3 rounded-xl border border-line px-3 py-2"
										>
											<div className="min-w-0 flex-1">
												<p className="text-[13px] font-semibold text-ink">
													{f.guestName}
													{f.roomNumber ? ` · ${f.roomNumber}` : ""}
												</p>
												<p className="text-xs text-ink-3">
													since {stayDay(f.openedAt)} · running{" "}
													{naira(f.balance)}
												</p>
											</div>
											<Link
												href={`/dashboard/folios?open=${f.id}`}
												className={`${btn.secondary} ${btn.small}`}
											>
												Open folio
											</Link>
										</div>
									))
								)}
							</SectionCard>
							<SectionCard
								title="Agreement"
								action={{
									label: "Edit",
									href: `/dashboard/organizations/${org.id}?tab=agreement`,
								}}
							>
								<DetailList
									items={[
										{
											label: "Pays within",
											value: `${org.termsDays} days of invoice`,
										},
										{
											label: "Invoices",
											value: billingCycleLabel(org.billingCycle),
										},
										{
											label: "Credit limit",
											value:
												org.requestedCreditLimit != null
													? `${naira(org.creditLimit)} · ${naira(org.requestedCreditLimit)} waiting for the owner`
													: naira(org.creditLimit),
										},
										{
											label: "Daily cap",
											value: org.dailyCap
												? `${naira(org.dailyCap)} per room-night`
												: "None",
										},
										{
											label: "Covers",
											value: org.agreementNotes ?? "Not written down",
										},
									]}
								/>
								{used >= 80 && (
									<Note tone="warning">Near the credit limit.</Note>
								)}
							</SectionCard>
						</div>
					</div>
				</>
			)}

			{active === "stays" && (
				<DataTable
					columns={stayColumns}
					data={stays}
					server={{ page: stayPage.data, onPage: stayList.goTo }}
					error={stayPage.ok ? null : stayPage.error}
					onRetry={() => router.refresh()}
					emptyTitle="No stays on this account yet"
				/>
			)}

			{active === "staff" && (
				<>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => a("import")}
						>
							<UploadIcon className="size-4" /> Import list
						</Button>
						<Button className={btn.primary} onClick={() => a("add-staff")}>
							<UserPlusIcon className="size-4" /> Add staff
						</Button>
					</div>
					<DataTable
						columns={memberColumns}
						data={members}
						emptyTitle="No staff on this account"
						emptyHint="Only people on this list can book on account."
					/>
				</>
			)}

			{active === "invoices" && (
				<>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => send("statement")}
						>
							<PrinterIcon className="size-4" /> Create statement
						</Button>
						<Button className={btn.primary} onClick={() => a("invoice")}>
							<PlusIcon className="size-4" /> Create invoice
						</Button>
					</div>
					<DataTable
						columns={invoiceColumns}
						data={invoices}
						server={{ page: invoicePage.data, onPage: invList.goTo }}
						error={invoicePage.ok ? null : invoicePage.error}
						onRetry={() => router.refresh()}
						emptyTitle="No invoices yet"
					/>
				</>
			)}

			{active === "agreement" && (
				<div className="grid gap-4 xl:grid-cols-2">
					<SectionCard
						title="Terms"
						subtitle={
							org.since
								? `Since ${fmtLongDate(org.since.slice(0, 10))}`
								: undefined
						}
						headerRight={
							<button
								type="button"
								onClick={() => a("agreement")}
								className={`${btn.secondary} ${btn.small}`}
							>
								Edit agreement
							</button>
						}
					>
						<DetailList
							columns={2}
							items={[
								{
									label: "Contact",
									value:
										[org.contactName, org.contactPhone]
											.filter(Boolean)
											.join(" · ") || "—",
								},
								{ label: "Billing email", value: org.contactEmail || "—" },
								{ label: "Pays within", value: `${org.termsDays} days` },
								{
									label: "Invoices",
									value: billingCycleLabel(org.billingCycle),
								},
								{
									label: "Credit limit",
									value:
										org.requestedCreditLimit != null
											? `${naira(org.creditLimit)} · ${naira(org.requestedCreditLimit)} waiting for the owner`
											: naira(org.creditLimit),
								},
								{
									label: "Daily cap",
									value: org.dailyCap ? naira(org.dailyCap) : "None",
								},
							]}
						/>
					</SectionCard>
					<SectionCard title="What the agreement covers">
						<p className="text-[13px] text-ink">
							{org.agreementNotes ?? "Not written down"}
						</p>
					</SectionCard>
				</div>
			)}

			<OrgPaymentModal
				open={action === "payment"}
				org={org}
				invoices={openInvoices.filter(
					(i) => i.status !== "PAID" && i.status !== "DRAFT",
				)}
				onClose={() => setAction(null)}
				onSaved={(invoiceId, amount) => {
					router.refresh();
					setInvoices((is) =>
						is.map((i) =>
							i.id === invoiceId
								? {
										...i,
										paid: i.paid + amount,
										status: i.paid + amount >= i.amount ? "PAID" : "PART_PAID",
									}
								: i,
						),
					);
				}}
			/>
			<InvoiceModal
				open={action === "invoice"}
				org={org}
				onClose={() => setAction(null)}
				onInvoice={(inv) => {
					setInvoices((is) => [inv, ...is]);
					router.refresh();
				}}
			/>
			<AddStaffPanel
				open={action === "add-staff"}
				org={org}
				onClose={() => setAction(null)}
				onSaved={(m) => {
					setMembers((ms) => [m, ...ms]);
					setOrg((o) => ({ ...o, staffCount: o.staffCount + 1 }));
				}}
			/>
			<ImportStaffModal
				open={action === "import"}
				org={org}
				onClose={() => setAction(null)}
				onSaved={(ms) => {
					setMembers((cur) => [...ms, ...cur]);
					setOrg((o) => ({ ...o, staffCount: o.staffCount + ms.length }));
				}}
			/>
			<AgreementPanel
				open={action === "agreement"}
				org={org}
				onClose={() => setAction(null)}
				onSaved={(o) => setOrg(o)}
			/>
		</>
	);
}
