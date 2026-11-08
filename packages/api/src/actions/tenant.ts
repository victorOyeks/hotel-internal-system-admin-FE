"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { refreshSession } from "@hospio/api/actions/onboarding";
import { api, errorMessage } from "@hospio/api/api/client";
import type {
	Business,
	BusinessRequest,
	BusinessStage,
	Handover,
	Hotel,
	HotelRequest,
	HotelStatus,
	MyBusinessRequest,
} from "@hospio/api/api/schema";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import { toOnboardingRow } from "@hospio/api/data/mappers/tenant";
import type { OnboardingRow } from "@hospio/api/data/types";
import {
	BUSINESS_ID,
	demoBusiness,
	demoHotels,
} from "@hospio/api/demo/fixtures/hotel";
import { demoDelay } from "@hospio/api/demo/mode";
import {
	ADMIN_ONBOARDING_STEPS,
	type AdminOnboardingData,
	type AdminOnboardingStep,
	adminStepNumber,
} from "@hospio/api/types";

/**
 * tenant-service writes: the owner's business and hotels (apps/hotel) and the platform's businesses,
 * hotels and back-office onboarding (apps/admin). Platform callers name the business with `businessId`.
 */

const OWNER_PATHS = [
	"/hotel-owner",
	"/hotel-owner/hotels",
	"/hotel-owner/settings",
	"/onboarding",
	"/select-role",
];
const ADMIN_PATHS = ["/admin", "/admin/businesses", "/admin/onboarding"];
function revalidate(paths: string[], ...more: string[]) {
	for (const p of [...paths, ...more]) revalidatePath(p);
}

const demoHotel = (input: HotelRequest, id = `hotel-${Date.now()}`): Hotel => ({
	id,
	businessId: input.businessId ?? BUSINESS_ID,
	name: input.name,
	city: input.city ?? null,
	address: input.address ?? null,
	phone: input.phone ?? null,
	email: input.email ?? null,
	timezone: input.timezone ?? "Africa/Lagos",
	status: "ACTIVE",
	roomCount: 0,
	checkInTime: input.checkInTime ?? "14:00",
	checkOutTime: input.checkOutTime ?? "12:00",
	starRating: input.starRating ?? null,
	managerUserId: null,
});

// ---- owner -------------------------------------------------------------------------------------------

/** PUT /tenant/businesses/mine: the owner's company profile (Settings → Company, wizard step 1). */
export async function updateMyBusiness(
	input: MyBusinessRequest,
): Promise<ActionResult<Business>> {
	if (!live("tenant")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				...demoBusiness,
				...input,
				timezone: input.timezone ?? demoBusiness.timezone,
			},
		};
	}
	const { data, error } = await api("@put/tenant/businesses/mine", {
		...(await withSession()),
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The business could not be saved"),
		};
	revalidate(OWNER_PATHS);
	return { ok: true, data: data.data };
}

/**
 * POST /tenant/hotels. Owners create inside their business and the session is refreshed so the new
 * hotel is selectable at once; platform callers pass `businessId` and act on that business.
 */
export async function createHotel(
	input: HotelRequest,
): Promise<ActionResult<Hotel>> {
	if (!live("tenant")) {
		await demoDelay(500);
		return { ok: true, data: demoHotel(input) };
	}
	const { data, error } = await api("@post/tenant/hotels", {
		...(await withSession()),
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The hotel could not be created"),
		};
	if (!input.businessId) await refreshSession();
	revalidate(
		OWNER_PATHS,
		...ADMIN_PATHS,
		`/admin/businesses/${data.data.businessId}`,
		`/admin/onboarding/${data.data.businessId}`,
	);
	return { ok: true, data: data.data };
}

/** PUT /tenant/hotels/{id}: name, address, contacts, times (owner, that hotel's manager, platform). */
export async function updateHotel(
	id: string,
	input: HotelRequest,
): Promise<ActionResult<Hotel>> {
	if (!live("tenant")) {
		await demoDelay(400);
		const current = demoHotels.find((h) => h.id === id);
		return {
			ok: true,
			data: {
				...demoHotel(input, id),
				roomCount: current?.roomCount ?? 0,
				status: current?.status ?? "ACTIVE",
			},
		};
	}
	const { data, error } = await api("@put/tenant/hotels/:id", {
		...(await withSession()),
		params: { id },
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The hotel could not be saved"),
		};
	revalidate(
		OWNER_PATHS,
		`/hotel-owner/hotels/${id}`,
		"/manager/hotel-setup",
		`/admin/businesses/${data.data.businessId}`,
	);
	return { ok: true, data: data.data };
}

/** PUT /tenant/hotels/{id}/status: ACTIVE, PAUSED (no new bookings) or CLOSED. */
export async function setHotelStatus(
	id: string,
	status: HotelStatus,
	reason?: string,
): Promise<ActionResult<Hotel>> {
	if (!live("tenant")) {
		await demoDelay(400);
		const current = demoHotels.find((h) => h.id === id) ?? demoHotels[0];
		return { ok: true, data: { ...current, id, status } };
	}
	const { data, error } = await api("@put/tenant/hotels/:id/status", {
		...(await withSession()),
		params: { id },
		body: { status, reason: reason ?? null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The hotel's status could not be changed"),
		};
	revalidate(
		OWNER_PATHS,
		`/hotel-owner/hotels/${id}`,
		"/manager/hotel-setup",
		`/admin/businesses/${data.data.businessId}`,
	);
	return { ok: true, data: data.data };
}

// ---- platform ----------------------------------------------------------------------------------------

const demoBusinessFrom = (
	input: Partial<BusinessRequest>,
	id = `biz-${Date.now()}`,
): Business => ({
	...demoBusiness,
	id,
	name: input.name ?? demoBusiness.name,
	legalName: input.legalName ?? null,
	registrationNumber: input.registrationNumber ?? null,
	businessType: input.businessType ?? null,
	ownerUserId: null,
	ownerName: input.ownerName ?? null,
	ownerEmail: input.ownerEmail ?? null,
	ownerPhone: input.ownerPhone ?? null,
	stage: "ONBOARDING",
	source: input.source ?? "BACK_OFFICE",
	accountManagerId: input.accountManagerId ?? null,
	marketerId: input.marketerId ?? null,
	feeModel: input.feeModel ?? null,
	feeValue: input.feeValue ?? null,
	currency: input.currency ?? "NGN",
	country: input.country ?? "NG",
	timezone: input.timezone ?? "Africa/Lagos",
	city: input.city ?? null,
	address: input.address ?? null,
	email: input.email ?? null,
	phone: input.phone ?? null,
	logoUrl: input.logoUrl ?? null,
	brandColour: input.brandColour ?? null,
	contractStartsOn: input.contractStartsOn ?? null,
	contractNotes: input.contractNotes ?? null,
	hotelCount: 0,
	createdAt: new Date().toISOString(),
	hotels: [],
	onboarding: { status: "IN_PROGRESS", step: 1, completedSteps: [] },
});

/** POST /tenant/businesses: a back-office business at stage ONBOARDING with its draft at step 1. */
export async function createBusiness(
	input: BusinessRequest,
): Promise<ActionResult<Business>> {
	if (!live("tenant")) {
		await demoDelay(500);
		return { ok: true, data: demoBusinessFrom(input) };
	}
	const { data, error } = await api("@post/tenant/businesses", {
		...(await withSession()),
		body: { ...input, source: input.source ?? "BACK_OFFICE" },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The business could not be created"),
		};
	revalidate(ADMIN_PATHS);
	return { ok: true, data: data.data };
}

/** PUT /tenant/businesses/{id}: every business field (wizard steps 1–3, Edit business). */
export async function updateBusiness(
	id: string,
	input: Partial<BusinessRequest>,
): Promise<ActionResult<Business>> {
	if (!live("tenant")) {
		await demoDelay(400);
		return { ok: true, data: demoBusinessFrom(input, id) };
	}
	const { data, error } = await api("@put/tenant/businesses/:id", {
		...(await withSession()),
		params: { id },
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The business could not be saved"),
		};
	revalidate(ADMIN_PATHS, `/admin/businesses/${id}`, `/admin/onboarding/${id}`);
	return { ok: true, data: data.data };
}

/** PUT /tenant/businesses/{id}/stage. */
export async function changeBusinessStage(
	id: string,
	stage: BusinessStage,
	reason?: string,
): Promise<ActionResult<Business>> {
	if (!live("tenant")) {
		await demoDelay(400);
		return { ok: true, data: { ...demoBusinessFrom({}, id), stage } };
	}
	const { data, error } = await api("@put/tenant/businesses/:id/stage", {
		...(await withSession()),
		params: { id },
		body: { stage, reason: reason ?? null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The stage could not be changed"),
		};
	revalidate(ADMIN_PATHS, `/admin/businesses/${id}`);
	return { ok: true, data: data.data };
}

/** PUT /tenant/businesses/{id}/account-manager?adminId=. */
export async function assignAccountManager(
	id: string,
	adminId: string,
): Promise<ActionResult<Business>> {
	if (!live("tenant")) {
		await demoDelay(400);
		return {
			ok: true,
			data: { ...demoBusinessFrom({}, id), accountManagerId: adminId },
		};
	}
	const { data, error } = await api(
		"@put/tenant/businesses/:id/account-manager",
		{ ...(await withSession()), params: { id }, query: { adminId } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The account manager could not be changed"),
		};
	revalidate(ADMIN_PATHS, `/admin/businesses/${id}`, `/admin/onboarding/${id}`);
	return { ok: true, data: data.data };
}

/**
 * PUT /tenant/onboarding/{businessId}/step: save one step of the back-office wizard. `step` is the
 * step key or its number (1..10); `data` is merged into the draft under the key and the step is marked
 * complete. Step 10 makes the draft READY_FOR_HANDOVER.
 */
export async function saveOnboardingStep<K extends AdminOnboardingStep>(
	businessId: string,
	step: K | number,
	data: NonNullable<AdminOnboardingData[K]>,
	nextAction?: string,
): Promise<ActionResult<OnboardingRow>> {
	const key =
		typeof step === "number" ? ADMIN_ONBOARDING_STEPS[step - 1] : step;
	const number = typeof step === "number" ? step : adminStepNumber(step);
	if (!key || number < 1 || number > ADMIN_ONBOARDING_STEPS.length)
		return { ok: false, error: "Unknown step" };
	if (!live("tenant")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: businessId,
				businessId,
				businessName: "New business",
				source: "BACK_OFFICE",
				step: Math.min(number + 1, 10),
				totalSteps: 10,
				completedSteps: ADMIN_ONBOARDING_STEPS.slice(0, number),
				assignedTo: "You",
				startedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				status: number >= 10 ? "READY_FOR_HANDOVER" : "IN_PROGRESS",
				nextAction: nextAction ?? "—",
				data: { [key]: data },
			},
		};
	}
	const { data: res, error } = await api(
		"@put/tenant/onboarding/:businessId/step",
		{
			...(await withSession()),
			params: { businessId },
			body: {
				step: number,
				data: data as Record<string, unknown>,
				nextAction: nextAction ?? null,
			},
		},
	);
	if (error || !res)
		return {
			ok: false,
			error: errorMessage(error, "The step could not be saved"),
		};
	revalidate(
		ADMIN_PATHS,
		`/admin/onboarding/${businessId}`,
		`/admin/businesses/${businessId}`,
	);
	return { ok: true, data: toOnboardingRow(res.data) };
}

/** PUT /tenant/onboarding/{businessId}/assign?adminId=. */
export async function assignOnboarding(
	businessId: string,
	adminId: string,
): Promise<ActionResult<OnboardingRow>> {
	if (!live("tenant")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: businessId,
				businessId,
				businessName: "Business",
				source: "BACK_OFFICE",
				step: 1,
				totalSteps: 10,
				completedSteps: [],
				assignedTo: "Reassigned",
				assignedToId: adminId,
				startedAt: new Date().toISOString(),
				status: "IN_PROGRESS",
				nextAction: "—",
				data: {},
			},
		};
	}
	const { data: res, error } = await api(
		"@put/tenant/onboarding/:businessId/assign",
		{ ...(await withSession()), params: { businessId }, query: { adminId } },
	);
	if (error || !res)
		return {
			ok: false,
			error: errorMessage(error, "The onboarding could not be reassigned"),
		};
	revalidate(ADMIN_PATHS, `/admin/onboarding/${businessId}`);
	return { ok: true, data: toOnboardingRow(res.data) };
}

/**
 * POST /tenant/onboarding/{businessId}/handover: creates the owner login (temporary password and
 * invite token, shown once), stores the pack and sets the stage HANDED_OVER.
 */
export async function sendHandover(
	businessId: string,
): Promise<ActionResult<Handover>> {
	if (!live("tenant")) {
		await demoDelay(700);
		return {
			ok: true,
			data: {
				id: `ho-${Date.now()}`,
				businessId,
				packKey: null,
				sentAt: new Date().toISOString(),
				sentBy: "demo-user",
				acceptedAt: null,
				ownerLogin: {
					userId: `u-${Date.now()}`,
					fullName: "New owner",
					email: "owner@example.com",
					role: "OWNER",
					temporaryPassword: "Welcome-2847",
					expiresAt: new Date(Date.now() + 72 * 3_600_000).toISOString(),
					inviteToken: "demo-invite-token",
					inviteExpiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
				},
				hotels: [],
				logins: [],
			},
		};
	}
	const { data, error } = await api(
		"@post/tenant/onboarding/:businessId/handover",
		{ ...(await withSession()), params: { businessId } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The handover could not be sent"),
		};
	revalidate(
		ADMIN_PATHS,
		`/admin/onboarding/${businessId}`,
		`/admin/businesses/${businessId}`,
	);
	return { ok: true, data: data.data };
}
