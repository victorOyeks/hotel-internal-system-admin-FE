"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type {
	AccessChangeRequest,
	CreateUserRequest,
	GrantRoleRequest,
	UserCreated,
	UserSummary,
} from "@hospio/api/api/schema";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import { BUSINESS_ID } from "@hospio/api/demo/fixtures/hotel";
import { demoDelay } from "@hospio/api/demo/mode";

/**
 * identity-service writes: people and their access. Owners manage their business, managers their
 * hotel's staff, platform admins any business by naming it (`businessId`). Temporary passwords and
 * invite tokens come back once and are shown once.
 */

const USER_PATHS = [
	"/hotel-owner/users",
	"/hotel-owner/staff",
	"/manager/staff",
	"/manager/roles",
	"/onboarding",
	"/admin/businesses",
	"/admin/onboarding",
	"/shared/shifts",
];
function revalidateUsers(businessId?: string | null) {
	for (const p of USER_PATHS) revalidatePath(p);
	if (businessId) {
		revalidatePath(`/admin/businesses/${businessId}`);
		revalidatePath(`/admin/onboarding/${businessId}`);
	}
}

const demoCreated = (): UserCreated => ({
	userId: `u-${Date.now()}`,
	temporaryPassword: `Hospio-${Math.floor(1000 + Math.random() * 9000)}`,
	temporaryPasswordExpiresAt: new Date(
		Date.now() + 72 * 3_600_000,
	).toISOString(),
	inviteToken: `demo-invite-${Date.now().toString(36)}`,
	inviteExpiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
});

const demoUser = (
	id: string,
	patch: Partial<UserSummary> = {},
): UserSummary => ({
	id,
	fullName: "Staff member",
	email: "staff@example.com",
	phone: null,
	businessId: BUSINESS_ID,
	status: "ACTIVE",
	grants: [],
	mustChangePassword: false,
	twoStepEnabled: false,
	lastSignInAt: null,
	createdAt: new Date().toISOString(),
	inviteStatus: "ACCEPTED",
	...patch,
});

export type CreateUserInput = CreateUserRequest;

/**
 * POST /identity/users: a person with their first role. Hotel roles need `hotelId`; platform callers
 * must send `businessId`. The response carries the temporary password and the invite token.
 */
export async function createUser(
	input: CreateUserInput,
): Promise<ActionResult<UserCreated>> {
	if (!live("identity")) {
		await demoDelay(500);
		return { ok: true, data: demoCreated() };
	}
	const { data, error } = await api("@post/identity/users", {
		...(await withSession()),
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				error?.status === 409
					? "Someone already has this email"
					: "The person could not be added",
			),
		};
	revalidateUsers(input.businessId);
	return { ok: true, data: data.data };
}

/** POST /identity/users/{id}/roles: another role at a hotel, at a level, optionally until a date. */
export async function grantRole(
	userId: string,
	input: GrantRoleRequest,
	businessId?: string,
): Promise<ActionResult<UserSummary>> {
	if (!live("identity")) {
		await demoDelay(400);
		return {
			ok: true,
			data: demoUser(userId, {
				grants: [
					{
						id: `g-${Date.now()}`,
						role: input.role,
						level: input.level ?? "FULL",
						hotelId: input.hotelId ?? null,
						paused: false,
						expiresAt: input.expiresAt ?? null,
					},
				],
			}),
		};
	}
	const { data, error } = await api("@post/identity/users/:id/roles", {
		...(await withSession()),
		params: { id: userId },
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The role could not be given"),
		};
	revalidateUsers(businessId);
	return { ok: true, data: data.data };
}

/** PUT /identity/users/{id}/roles/{grantId}: change the level, pause, resume or remove one role. */
export async function changeAccess(
	userId: string,
	grantId: string,
	input: AccessChangeRequest,
	businessId?: string,
): Promise<ActionResult<UserSummary>> {
	if (!live("identity")) {
		await demoDelay(400);
		return {
			ok: true,
			data: demoUser(userId, {
				grants:
					input.change === "REMOVE"
						? []
						: [
								{
									id: grantId,
									role: "FRONT_OFFICE",
									level: input.level ?? "FULL",
									hotelId: null,
									paused: input.change === "PAUSE",
									expiresAt: null,
								},
							],
			}),
		};
	}
	const { data, error } = await api("@put/identity/users/:id/roles/:grantId", {
		...(await withSession()),
		params: { id: userId, grantId },
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The access could not be changed"),
		};
	revalidateUsers(businessId);
	return { ok: true, data: data.data };
}

/** POST /identity/users/{id}/pause-all?paused=: pause (or resume) every role the person holds. */
export async function pauseAll(
	userId: string,
	paused = true,
	businessId?: string,
): Promise<ActionResult<UserSummary>> {
	if (!live("identity")) {
		await demoDelay(400);
		return {
			ok: true,
			data: demoUser(userId, { status: paused ? "PAUSED" : "ACTIVE" }),
		};
	}
	const { data, error } = await api("@post/identity/users/:id/pause-all", {
		...(await withSession()),
		params: { id: userId },
		query: { paused },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				paused
					? "The access could not be paused"
					: "The access could not be resumed",
			),
		};
	revalidateUsers(businessId);
	return { ok: true, data: data.data };
}

/** POST /identity/users/{id}/reset-password: a fresh temporary password, shown once. */
export async function resetPassword(
	userId: string,
	businessId?: string,
): Promise<ActionResult<UserCreated>> {
	if (!live("identity")) {
		await demoDelay(400);
		return { ok: true, data: { ...demoCreated(), userId } };
	}
	const { data, error } = await api("@post/identity/users/:id/reset-password", {
		...(await withSession()),
		params: { id: userId },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The password could not be reset"),
		};
	revalidateUsers(businessId);
	return { ok: true, data: data.data };
}

/** POST /identity/users/{id}/resend-invite: a fresh temporary password and invite token. */
export async function resendInvite(
	userId: string,
	businessId?: string,
): Promise<ActionResult<UserCreated>> {
	if (!live("identity")) {
		await demoDelay(400);
		return { ok: true, data: { ...demoCreated(), userId } };
	}
	const { data, error } = await api("@post/identity/users/:id/resend-invite", {
		...(await withSession()),
		params: { id: userId },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The invite could not be resent"),
		};
	revalidateUsers(businessId);
	return { ok: true, data: data.data };
}

/** POST /identity/auth/set-pin: the signed-in person's own tablet PIN (4–6 digits). */
export async function setMyPin(pin: string): Promise<ActionResult<null>> {
	if (!live("identity")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@post/identity/auth/set-pin", {
		...(await withSession()),
		body: { pin },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The PIN could not be changed"),
		};
	return { ok: true, data: null };
}
