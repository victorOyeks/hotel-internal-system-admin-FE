import type {
	Invoice,
	Organization,
	OrganizationMember,
	OrganizationSummary,
} from "@hospio/api/api/schema";
import type {
	FolioRow,
	InvoiceRow,
	OrgMemberRow,
	OrganizationRow,
} from "../types";
import { lagosDate } from "./finance";

/**
 * folio-service organizations (Manager · Organizations, Finance · Organizations). The account's numbers
 * come from its own routes: outstanding is GET /:id/outstanding (the balance left on its folios), staff
 * is the members who can book, stays this month are its folios opened this month (Lagos time).
 */

/** How folio-service spells a billing cycle, and how the screens say it. */
export const BILLING_CYCLES = [
	{ value: "MONTHLY", label: "Monthly" },
	{ value: "TWICE_MONTHLY", label: "Twice a month" },
	{ value: "PER_STAY", label: "Per stay" },
] as const;

/** The service's code for a cycle, accepting the label the sample data uses. */
export function billingCycleCode(cycle: string | null | undefined): string {
	if (!cycle) return "MONTHLY";
	const found = BILLING_CYCLES.find(
		(c) => c.value === cycle || c.label.toLowerCase() === cycle.toLowerCase(),
	);
	return found ? found.value : cycle;
}

export function billingCycleLabel(cycle: string | null | undefined): string {
	if (!cycle) return "Monthly";
	return (
		BILLING_CYCLES.find((c) => c.value === cycle || c.label === cycle)?.label ??
		cycle
	);
}

export type OrganizationParts = {
	members: OrgMemberRow[];
	stays: FolioRow[];
	outstanding: number | null;
};

export function toOrganizationRow(
	o: Organization,
	parts?: OrganizationParts,
): OrganizationRow {
	const month = lagosDate().slice(0, 7);
	return {
		id: o.id,
		name: o.name,
		contactName: o.contactName ?? "",
		contactPhone: o.contactPhone ?? "",
		contactEmail: o.contactEmail ?? "",
		address: o.address ?? undefined,
		creditLimit: Number(o.creditLimit ?? 0),
		dailyCap: o.dailyCap ? Number(o.dailyCap) : undefined,
		billingCycle: o.billingCycle ?? "MONTHLY",
		termsDays: o.paymentTermsDays ?? 30,
		status: o.status === "ON_HOLD" ? "ON_HOLD" : "ACTIVE",
		outstanding: parts
			? (parts.outstanding ?? parts.stays.reduce((s, f) => s + f.balance, 0))
			: 0,
		staffCount: parts ? parts.members.filter((m) => m.active).length : 0,
		staysThisMonth: parts
			? parts.stays.filter(
					(f) =>
						f.openedAt && lagosDate(new Date(f.openedAt)).slice(0, 7) === month,
				).length
			: 0,
		agreementNotes: o.agreementNotes ?? undefined,
		since: o.createdAt ?? "",
		requestedCreditLimit:
			o.requestedCreditLimit != null
				? Number(o.requestedCreditLimit)
				: undefined,
		creditRequestedBy: o.creditRequestedByName ?? undefined,
		creditApprovalId: o.creditApprovalId ?? undefined,
	};
}

/** An account with folio-service's figures (the paged list and the account page). */
export function toOrganizationSummaryRow(
	o: OrganizationSummary,
): OrganizationRow {
	return {
		...toOrganizationRow(o),
		outstanding: Number(o.outstanding),
		staffCount: o.staffCount,
		staysThisMonth: o.staysThisMonth,
		stays: o.stays,
		openStays: o.openStays,
		runningBalance: Number(o.runningBalance),
		invoices: o.invoices,
		openInvoices: o.openInvoices,
		invoicesLeft: Number(o.invoicesLeft),
		overdueInvoices: o.overdueInvoices,
		overdueAmount: Number(o.overdueAmount),
		overdueNumber: o.overdueNumber ?? undefined,
		overdueDueDate: o.overdueDueDate ?? undefined,
	};
}

/** Demo figures for an account, worked out from the fixtures the way folio-service does. */
export function withDemoFigures(
	o: OrganizationRow,
	stays: FolioRow[],
	invoices: InvoiceRow[],
): OrganizationRow {
	const open = stays.filter((f) => f.status === "OPEN");
	const unpaid = invoices.filter(
		(i) => i.status !== "PAID" && i.status !== "DRAFT",
	);
	const overdue = invoices
		.filter((i) => i.status === "OVERDUE")
		.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
	return {
		...o,
		stays: stays.length,
		openStays: open.length,
		runningBalance: open.reduce((s, f) => s + f.balance, 0),
		invoices: invoices.length,
		openInvoices: unpaid.length,
		invoicesLeft: unpaid.reduce((s, i) => s + i.amount - i.paid, 0),
		overdueInvoices: overdue.length,
		overdueAmount: overdue.reduce((s, i) => s + i.amount - i.paid, 0),
		overdueNumber: overdue[0]?.number,
		overdueDueDate: overdue[0]?.dueDate,
	};
}

export function toOrgMemberRow(m: OrganizationMember): OrgMemberRow {
	return {
		id: m.id,
		fullName: m.fullName,
		staffRef: m.staffRef || "—",
		phone: m.phone || "—",
		email: m.email || undefined,
		active: m.active ?? true,
	};
}

/** folio-service never marks an invoice overdue on its own: an unpaid one past its due date reads as overdue here. */
export function toInvoiceRow(
	i: Invoice & { overdue?: boolean | null },
	organizationName: string,
): InvoiceRow {
	const amount = Number(i.amount);
	const paid = Number(i.paidAmount ?? 0);
	const known = ["DRAFT", "SENT", "PART_PAID", "PAID", "OVERDUE"] as const;
	let status: InvoiceRow["status"] = (known as readonly string[]).includes(
		i.status,
	)
		? (i.status as InvoiceRow["status"])
		: "SENT";
	if (
		i.overdue ||
		((status === "SENT" || status === "PART_PAID") &&
			paid < amount &&
			i.dueDate < lagosDate())
	)
		status = "OVERDUE";
	return {
		id: i.id,
		number: i.number,
		organizationId: i.organizationId,
		organizationName,
		periodFrom: i.periodFrom,
		periodTo: i.periodTo,
		amount,
		paid,
		dueDate: i.dueDate,
		status,
	};
}
