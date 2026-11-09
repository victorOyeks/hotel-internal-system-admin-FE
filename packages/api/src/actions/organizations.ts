"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import {
	billingCycleCode,
	toInvoiceRow,
	toOrganizationRow,
	toOrgMemberRow,
} from "@hospio/api/data/mappers/organizations";
import type {
	InvoiceRow,
	OrgMemberRow,
	OrganizationRow,
} from "@hospio/api/data/types";
import { demoDelay } from "@hospio/api/demo/mode";

/**
 * Company accounts (folio-service /folio/organizations): add or change an account and its agreement
 * (manager), add or import the staff who can book on it (manager), invoice its stays and record what it
 * pays (manager, or finance with edit access). In demo mode the caller's own row is echoed back.
 *
 * There is no route to put an account on hold, remove a member, send a statement or reminder, or
 * download an invoice: the screens say "Not connected yet" for those.
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

/** Manager. A credit limit above the owner's threshold is refused for a manager ("… is set by the owner"). */
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
