"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";
import {
	billingCycleCode,
	toInvoiceRow,
	toOrganizationRow,
	toOrgMemberRow,
} from "@hospio/api/data/mappers/organizations";
import type {
	FolioRow,
	InvoiceRow,
	OrgMemberRow,
	OrganizationRow,
} from "@hospio/api/data/types";
import { demoDelay } from "@hospio/api/demo/mode";
import type { Delivery } from "@hospio/api/api/routes-admin";

/**
 * Company accounts (folio-service /folio/organizations): add or change an account and its agreement
 * (manager), add or import the staff who can book on it (manager), invoice its stays and record what it
 * pays (manager, or finance with edit access). In demo mode the caller's own row is echoed back.
 *
 * Put an account on hold, remove (or allow again) a member, and send a statement or payment reminder
 * to the account's contact are wired too. There is no invoice PDF: the screens say "Not connected yet".
 */

function revalidateOrganizations() {
	revalidatePath("/manager/organizations", "layout");
	revalidatePath("/financials/organizations", "layout");
}

export type OrganizationInput = {
	name: string;
	contactName: string;
	contactPhone: string;
	contactEmail?: string;
	address?: string;
	creditLimit: number;
	dailyCap?: number;
	billingCycle: string;
	termsDays: number;
	agreementNotes?: string;
};

const blank = (v: string | undefined) => (v?.trim() ? v.trim() : null);

function organizationBody(input: OrganizationInput) {
	return {
		name: input.name.trim(),
		contactName: blank(input.contactName),
		contactPhone: blank(input.contactPhone),
		contactEmail: blank(input.contactEmail),
		address: blank(input.address),
		creditLimit: input.creditLimit,
		dailyCap: input.dailyCap ?? null,
		billingCycle: billingCycleCode(input.billingCycle),
		paymentTermsDays: input.termsDays,
		agreementNotes: blank(input.agreementNotes),
	};
}

/** An id that isn't there ("undefined" from a missing value): the call is never sent. */
function noOrg(id?: string | null): boolean {
	return !id || id === "undefined" || id === "null";
}

/** Manager. A credit limit above the owner's threshold is saved as a request to the owner (requestedCreditLimit). */
export async function createOrganization(
	input: OrganizationInput,
	fallback: OrganizationRow,
): Promise<ActionResult<OrganizationRow>> {
	if (!live("folio")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const { data, error } = await api("@post/folio/organizations", {
		...(await withSession()),
		body: organizationBody(input),
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The organization could not be added"),
		};
	revalidateOrganizations();
	return {
		ok: true,
		data: toOrganizationRow(data.data, {
			members: [],
			stays: [],
			outstanding: 0,
		}),
	};
}

/** Manager. PUT replaces every field, so the caller sends the whole agreement; status is not part of it. */
export async function updateOrganization(
	id: string,
	input: OrganizationInput,
	current: OrganizationRow,
): Promise<ActionResult<OrganizationRow>> {
	if (noOrg(id)) return { ok: false, error: "Organization not found" };
	if (!live("folio")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				...current,
				...input,
				dailyCap: input.dailyCap,
				billingCycle: billingCycleCode(input.billingCycle),
			},
		};
	}
	const { data, error } = await api("@put/folio/organizations/:id", {
		...(await withSession()),
		params: { id },
		body: organizationBody(input),
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The agreement could not be saved"),
		};
	revalidateOrganizations();
	const saved = toOrganizationRow(data.data);
	// The account's running numbers do not change with its agreement.
	return {
		ok: true,
		data: {
			...saved,
			outstanding: current.outstanding,
			staffCount: current.staffCount,
			staysThisMonth: current.staysThisMonth,
		},
	};
}

export type MemberInput = {
	fullName: string;
	staffRef?: string;
	phone?: string;
	email?: string;
};

const memberBody = (m: MemberInput) => ({
	fullName: m.fullName.trim(),
	staffRef: blank(m.staffRef),
	phone: blank(m.phone),
	email: blank(m.email),
});

/** Manager. */
export async function addOrgMember(
	orgId: string,
	input: MemberInput,
	fallback: OrgMemberRow,
): Promise<ActionResult<OrgMemberRow>> {
	if (noOrg(orgId)) return { ok: false, error: "Organization not found" };
	if (!live("folio")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const { data, error } = await api("@post/folio/organizations/:id/members", {
		...(await withSession()),
		params: { id: orgId },
		body: memberBody(input),
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The staff member could not be added"),
		};
	revalidateOrganizations();
	return { ok: true, data: toOrgMemberRow(data.data) };
}

/** Manager. Every row needs a name; the service adds them one by one in a single transaction. */
export async function importOrgMembers(
	orgId: string,
	rows: MemberInput[],
	fallback: OrgMemberRow[],
): Promise<ActionResult<OrgMemberRow[]>> {
	if (noOrg(orgId)) return { ok: false, error: "Organization not found" };
	if (!live("folio")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const { data, error } = await api(
		"@post/folio/organizations/:id/members/import",
		{
			...(await withSession()),
			params: { id: orgId },
			body: rows.map(memberBody),
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The staff list could not be imported"),
		};
	revalidateOrganizations();
	return { ok: true, data: data.data.map(toOrgMemberRow) };
}

/**
 * Manager or finance (edit). The service bills the balance left on the account's folios opened in the
 * period (UTC dates), numbers the invoice and marks it sent; nothing is emailed. "Nothing to invoice for
 * that period" when those folios owe nothing.
 */
export async function createOrgInvoice(
	orgId: string,
	organizationName: string,
	input: { periodFrom: string; periodTo: string; dueDate?: string },
	fallback: InvoiceRow,
): Promise<ActionResult<InvoiceRow>> {
	if (noOrg(orgId)) return { ok: false, error: "Organization not found" };
	if (!live("folio")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const { data, error } = await api("@post/folio/organizations/:id/invoices", {
		...(await withSession()),
		params: { id: orgId },
		body: {
			periodFrom: input.periodFrom,
			periodTo: input.periodTo,
			dueDate: input.dueDate ?? null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The invoice could not be created"),
		};
	revalidateOrganizations();
	return { ok: true, data: toInvoiceRow(data.data, organizationName) };
}

/**
 * Manager or finance (edit). Against an invoice, the invoice's paid amount goes up (PART_PAID or PAID).
 * The account's outstanding is its folios' balance, which a payment here does not change.
 */
export async function recordOrgPayment(
	orgId: string,
	input: {
		amount: number;
		method: string;
		reference?: string;
		invoiceId?: string;
	},
): Promise<ActionResult<{ id: string; amount: number }>> {
	if (noOrg(orgId)) return { ok: false, error: "Organization not found" };
	if (!live("folio")) {
		await demoDelay(400);
		return {
			ok: true,
			data: { id: `opay-${Date.now()}`, amount: input.amount },
		};
	}
	const { data, error } = await api("@post/folio/organizations/:id/payments", {
		...(await withSession()),
		params: { id: orgId },
		body: {
			amount: input.amount,
			method: input.method,
			reference: blank(input.reference),
			invoiceId: input.invoiceId ?? null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The payment could not be recorded"),
		};
	revalidateOrganizations();
	return {
		ok: true,
		data: { id: data.data.id, amount: Number(data.data.amount) },
	};
}

/** Manager. ON_HOLD stops new stays on account (the booking screens refuse an account on hold). */
export async function setOrganizationStatus(
	orgId: string,
	status: "ACTIVE" | "ON_HOLD",
): Promise<ActionResult<OrganizationRow>> {
	if (noOrg(orgId)) return { ok: false, error: "Organization not found" };
	if (!live("folio")) return { ok: false, error: "Not connected in demo mode" };
	const { data, error } = await api("@put/folio/organizations/:id/status", {
		...(await withSession()),
		params: { id: orgId },
		query: { status },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The account could not be changed"),
		};
	revalidateOrganizations();
	return { ok: true, data: toOrganizationRow(data.data) };
}

/** Manager. Removing a member keeps them on the list as not allowed; they can be allowed again. */
export async function setOrgMemberActive(
	orgId: string,
	memberId: string,
	active: boolean,
): Promise<ActionResult<OrgMemberRow>> {
	if (noOrg(orgId)) return { ok: false, error: "Organization not found" };
	if (!live("folio")) return { ok: false, error: "Not connected in demo mode" };
	const { data, error } = await api(
		"@put/folio/organizations/:id/members/:memberId/active",
		{
			...(await withSession()),
			params: { id: orgId, memberId },
			query: { active },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The staff member could not be changed"),
		};
	revalidateOrganizations();
	return { ok: true, data: toOrgMemberRow(data.data) };
}

export type OrgSent = {
	to: string;
	channel: string;
	deliveries?: Delivery[] | null;
};

/** Manager or finance. Emails (or texts) the account's contact a statement or a payment reminder. */
export async function sendOrgMessage(
	orgId: string,
	what: "statement" | "reminder",
): Promise<ActionResult<OrgSent>> {
	if (noOrg(orgId)) return { ok: false, error: "Organization not found" };
	if (!live("folio")) return { ok: false, error: "Not connected in demo mode" };
	const { data, error } =
		what === "statement"
			? await api("@post/folio/organizations/:id/statement", {
					...(await withSession()),
					params: { id: orgId },
				})
			: await api("@post/folio/organizations/:id/reminder", {
					...(await withSession()),
					params: { id: orgId },
				});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				what === "statement"
					? "The statement could not be sent"
					: "The reminder could not be sent",
			),
		};
	return { ok: true, data: data.data };
}

/**
 * An account's stays opened in the Lagos days `from`..`to` (both inclusive), every page of them: the invoice preview
 * and an invoice's stays read them on demand instead of the screen holding the account's whole history.
 */
export async function loadOrgStays(
	organizationId: string,
	from: string,
	to: string,
): Promise<ActionResult<FolioRow[]>> {
	const rows = await data.organizations.stays(organizationId, { from, to });
	return { ok: true, data: rows };
}
