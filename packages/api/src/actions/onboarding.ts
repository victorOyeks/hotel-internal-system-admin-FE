"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { Delivery } from "@hospio/api/api/routes-admin";
import type { Business, Invite } from "@hospio/api/api/schema";
import { withSession } from "@hospio/api/api/server";
import { APP_ROLES, isAppRole } from "@hospio/api/app";
import { live } from "@hospio/api/data/live";
import { toOnboardingRow } from "@hospio/api/data/mappers/tenant";
import type { OnboardingRow } from "@hospio/api/data/types";
import {
	BUSINESS_ID,
	demoBusiness,
	demoHotels,
} from "@hospio/api/demo/fixtures/hotel";
import { DEMO_AUTH, demoDelay } from "@hospio/api/demo/mode";
import { mintDemoToken } from "@hospio/api/demo/token";
import {
	COOKIES,
	createSession,
	decodeSession,
	setActiveHotel,
	setActiveRole,
} from "@hospio/api/session";
import {
	OWNER_ONBOARDING_STEPS,
	type OwnerOnboardingData,
	type OwnerOnboardingStep,
	ownerStepNumber,
} from "@hospio/api/types";

/**
 * Self-serve onboarding (apps/hotel): sign-up, phone check, invites, the owner's four-step wizard and
 * the handover an owner onboarded by H.M.S accepts. Sign-up and accept-invite create the session the
 * same way `login` does.
 */

const OWNER_PATHS = [
	"/onboarding",
	"/handover",
	"/hotel-owner",
	"/hotel-owner/hotels",
	"/hotel-owner/users",
	"/hotel-owner/settings",
	"/select-role",
];
function revalidateOwner() {
	for (const p of OWNER_PATHS) revalidatePath(p);
}

/** After a token lands: one role skips the picker, the first hotel is the active one. */
async function settleSession(accessToken: string, refreshToken: string) {
	const session = await createSession(accessToken, refreshToken);
	const mine = session.roleSet.filter((r) => isAppRole(r));
	if (mine.length === 1) await setActiveRole(mine[0]);
	if (session.hotels.length >= 1) await setActiveHotel(session.hotels[0]);
	return session;
}

export type SignUpInput = {
	fullName: string;
	email: string;
	phone: string;
	password: string;
	businessName: string;
	city?: string;
};

/** POST /identity/auth/sign-up: the owner account and business are created and the owner is signed in. */
export async function signUp(
	input: SignUpInput,
): Promise<ActionResult<{ roles: string[]; deliveries?: Delivery[] | null }>> {
	if (DEMO_AUTH) {
		await demoDelay(500);
		const token = mintDemoToken(
			input.email,
			input.fullName,
			BUSINESS_ID,
			demoHotels.map((h) => h.id),
			APP_ROLES.includes("OWNER") ? ["OWNER"] : APP_ROLES,
		);
		await createSession(token, "demo-refresh");
		await setActiveRole("OWNER");
		await setActiveHotel(demoHotels[0].id);
		return { ok: true, data: { roles: ["OWNER"] } };
	}
	const { data, error } = await api("@post/identity/auth/sign-up", {
		body: { ...input, city: input.city ?? null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				error?.status === 409
					? "An account with this email already exists"
					: "We couldn't create your account",
			),
		};
	await settleSession(data.data.accessToken, data.data.refreshToken);
	return {
		ok: true,
		data: { roles: data.data.roles, deliveries: data.data.deliveries },
	};
}

/** POST /identity/auth/phone/send-code: a 6-digit code (logged on the service; staging accepts 123456). */
export async function sendPhoneCode(): Promise<
	ActionResult<{ expiresAt: string; deliveries?: Delivery[] | null }>
> {
	const { auth } = await withSession();
	if (!auth) return { ok: false, error: "Sign in again" };
	if (DEMO_AUTH || !live("identity")) {
		await demoDelay(400);
		return {
			ok: true,
			data: { expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() },
		};
	}
	const { data, error } = await api("@post/identity/auth/phone/send-code", {
		auth,
		body: {},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The code could not be sent"),
		};
	return { ok: true, data: data.data };
}

/** POST /identity/auth/phone/verify. */
export async function verifyPhone(code: string): Promise<ActionResult<null>> {
	const { auth } = await withSession();
	if (!auth) return { ok: false, error: "Sign in again" };
	if (DEMO_AUTH || !live("identity")) {
		await demoDelay(400);
		return code.trim().length === 6
			? { ok: true, data: null }
			: { ok: false, error: "That code is not right" };
	}
	const { error } = await api("@post/identity/auth/phone/verify", {
		auth,
		body: { code: code.trim() },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "That code is not right or has expired"),
		};
	revalidatePath("/verify-phone");
	revalidatePath("/onboarding");
	return { ok: true, data: null };
}

/** GET /identity/auth/invites/{token}: who the invite is for, so the accept screen can show it. */
export async function getInvite(token: string): Promise<ActionResult<Invite>> {
	if (DEMO_AUTH) {
		await demoDelay(300);
		return {
			ok: true,
			data: {
				fullName: "Tunde Bakare",
				email: "tunde@simpashotels.com",
				role: "MANAGER",
				businessName: "Royal Suites Ltd",
				hotelName: "Simpas Ikeja",
				expiresAt: new Date(Date.now() + 6 * 86_400_000).toISOString(),
				accepted: false,
			},
		};
	}
	const { data, error } = await api("@get/identity/auth/invites/:token", {
		params: { token },
	});
	if (error || !data) {
		const why =
			error?.status === 404
				? "This invite link is not valid"
				: error?.status === 410
					? "This invite has expired or was already used"
					: "The invite could not be loaded";
		return { ok: false, error: errorMessage(error, why) };
	}
	return { ok: true, data: data.data };
}

/** POST /identity/auth/accept-invite: sets the password and signs the invited person in. */
export async function acceptInvite(input: {
	token: string;
	password: string;
}): Promise<ActionResult<{ roles: string[] }>> {
	if (DEMO_AUTH) {
		await demoDelay(500);
		const token = mintDemoToken(
			"tunde@simpashotels.com",
			"Tunde Bakare",
			BUSINESS_ID,
			[demoHotels[0].id],
			APP_ROLES.includes("MANAGER") ? ["MANAGER"] : APP_ROLES,
		);
		await createSession(token, "demo-refresh");
		if (APP_ROLES.includes("MANAGER")) await setActiveRole("MANAGER");
		await setActiveHotel(demoHotels[0].id);
		return { ok: true, data: { roles: ["MANAGER"] } };
	}
	const { data, error } = await api("@post/identity/auth/accept-invite", {
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The invite could not be accepted"),
		};
	await settleSession(data.data.accessToken, data.data.refreshToken);
	return { ok: true, data: { roles: data.data.roles } };
}

/**
 * POST /identity/auth/refresh with the refresh cookie: a new access token that carries the current
 * hotel list (after a hotel is added). The role and hotel cookies are kept.
 */
export async function refreshSession(): Promise<ActionResult<null>> {
	const jar = await cookies();
	const refreshToken = jar.get(COOKIES.refresh)?.value;
	const current = jar.get(COOKIES.token)?.value;
	if (!refreshToken || !current) return { ok: false, error: "Sign in again" };
	if (DEMO_AUTH) {
		const session = decodeSession(current);
		if (!session) return { ok: false, error: "Sign in again" };
		await createSession(
			mintDemoToken(
				session.email,
				session.name,
				session.bid ?? BUSINESS_ID,
				demoHotels.map((h) => h.id),
				session.roleSet,
			),
			"demo-refresh",
		);
		return { ok: true, data: null };
	}
	const { data, error } = await api("@post/identity/auth/refresh", {
		body: { refreshToken },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Your session could not be refreshed"),
		};
	const session = await createSession(
		data.data.accessToken,
		data.data.refreshToken,
	);
	const chosen = jar.get(COOKIES.hotel)?.value;
	if (!chosen || !session.hotels.includes(chosen)) {
		if (session.hotels.length >= 1) await setActiveHotel(session.hotels[0]);
	}
	return { ok: true, data: null };
}

/**
 * PUT /tenant/onboarding/mine/step: save one step of the owner's wizard so they can leave and return.
 * `step` is the step key or its number (1..4); `data` is that step's form, merged under the key.
 */
export async function saveMyOnboardingStep<K extends OwnerOnboardingStep>(
	step: K | number,
	data: NonNullable<OwnerOnboardingData[K]>,
): Promise<ActionResult<OnboardingRow>> {
	const key =
		typeof step === "number" ? OWNER_ONBOARDING_STEPS[step - 1] : step;
	const number = typeof step === "number" ? step : ownerStepNumber(step);
	if (!key || number < 1 || number > OWNER_ONBOARDING_STEPS.length)
		return { ok: false, error: "Unknown step" };
	if (!live("tenant")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: BUSINESS_ID,
				businessId: BUSINESS_ID,
				businessName: demoBusiness.name,
				source: "SELF_SERVE",
				step: Math.min(number + 1, 4),
				totalSteps: 4,
				completedSteps: OWNER_ONBOARDING_STEPS.slice(0, number),
				assignedTo: "—",
				startedAt: new Date().toISOString(),
				status: number >= 4 ? "READY_FOR_HANDOVER" : "IN_PROGRESS",
				nextAction: "—",
				data: { [key]: data },
			},
		};
	}
	const { data: res, error } = await api("@put/tenant/onboarding/mine/step", {
		...(await withSession()),
		body: { step: number, data: data as Record<string, unknown> },
	});
	if (error || !res)
		return {
			ok: false,
			error: errorMessage(error, "Your progress could not be saved"),
		};
	revalidatePath("/onboarding");
	return { ok: true, data: toOnboardingRow(res.data) };
}

/** POST /tenant/onboarding/mine/complete: the business goes LIVE and the wizard is done. */
export async function completeMyOnboarding(): Promise<ActionResult<Business>> {
	if (!live("tenant")) {
		await demoDelay(500);
		return { ok: true, data: demoBusiness };
	}
	const { data, error } = await api(
		"@post/tenant/onboarding/mine/complete",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Onboarding could not be completed"),
		};
	revalidateOwner();
	return { ok: true, data: data.data };
}

/** POST /tenant/handover/accept: an owner onboarded by H.M.S accepts the handover; the business goes LIVE. */
export async function acceptHandover(): Promise<ActionResult<Business>> {
	if (!live("tenant")) {
		await demoDelay(500);
		return { ok: true, data: demoBusiness };
	}
	const { data, error } = await api(
		"@post/tenant/handover/accept",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The handover could not be accepted"),
		};
	revalidateOwner();
	return { ok: true, data: data.data };
}
