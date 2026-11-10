"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { Me } from "@hospio/api/api/schema";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";
import {
	EMAIL_CATEGORIES,
	type EmailPrefs,
	type ProfileSession,
	type TwoStepState,
} from "@hospio/api/profile-options";
import { createSession } from "@hospio/api/session";

/**
 * My profile & security (docs/profile.md in hospio-backend): every call acts on the signed-in person only. In demo mode
 * the saves pretend; on staging and production they go to identity-service.
 */

const NOT_LIVE: ActionResult<never> = {
	ok: false,
	error: "This needs the live services",
};

function revalidateProfile() {
	revalidatePath("/shared/profile");
	revalidatePath("/dashboard/profile");
}

export async function updateProfile(input: {
	fullName?: string;
	phone?: string;
	language?: string;
}): Promise<ActionResult<Me>> {
	if (!live("identity")) {
		await demoDelay(300);
		return NOT_LIVE;
	}
	const { data, error } = await api("@put/identity/users/me", {
		...(await withSession()),
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Your profile could not be saved"),
		};
	revalidateProfile();
	return { ok: true, data: data.data };
}

export async function removePhoto(): Promise<ActionResult<Me>> {
	if (!live("identity")) return NOT_LIVE;
	const { data, error } = await api(
		"@delete/identity/users/me/photo",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The photo could not be removed"),
		};
	revalidateProfile();
	return { ok: true, data: data.data };
}

// ---- sessions ------------------------------------------------------------------------------------

export async function listSessions(): Promise<ProfileSession[]> {
	if (!live("identity")) return [];
	const { data } = await api(
		"@get/identity/users/me/sessions",
		await withSession(),
	);
	return (data?.data ?? []).map((s) => ({
		id: s.id,
		kind: s.kind === "PIN" ? "PIN" : "PASSWORD",
		device: s.device ?? "Unknown browser",
		deviceName: s.deviceName ?? null,
		location: s.location ?? null,
		signedInAt: s.signedInAt ?? null,
		lastUsedAt: s.lastUsedAt ?? null,
		current: s.current,
	}));
}

export async function endSession(id: string): Promise<ActionResult> {
	if (!live("identity")) return NOT_LIVE;
	const { error } = await api("@delete/identity/users/me/sessions/:id", {
		...(await withSession()),
		params: { id },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "That device could not be signed out"),
		};
	revalidateProfile();
	return { ok: true, data: null };
}

/** Ends every other session; this one carries on with the fresh tokens that come back (role and hotel cookies kept). */
export async function signOutOthers(): Promise<
	ActionResult<{ ended: number }>
> {
	if (!live("identity")) return NOT_LIVE;
	const { data, error } = await api(
		"@post/identity/users/me/sessions/sign-out-others",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The other devices could not be signed out"),
		};
	const fresh = data.data.session;
	if (fresh?.accessToken)
		await createSession(fresh.accessToken, fresh.refreshToken);
	revalidateProfile();
	return { ok: true, data: { ended: data.data.ended } };
}

// ---- 2-step --------------------------------------------------------------------------------------

export async function getTwoStep(): Promise<TwoStepState | null> {
	if (!live("identity")) return null;
	const { data } = await api(
		"@get/identity/users/me/two-step",
		await withSession(),
	);
	const s = data?.data;
	return s
		? {
				enabled: s.enabled,
				enabledAt: s.enabledAt ?? null,
				recoveryCodesLeft: s.recoveryCodesLeft ?? 0,
				required: !!s.required,
			}
		: null;
}

export async function startTwoStep(): Promise<
	ActionResult<{ secret: string; otpauthUri: string; qrSvg: string }>
> {
	if (!live("identity")) return NOT_LIVE;
	const { data, error } = await api(
		"@post/identity/users/me/two-step/setup",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "2-step setup could not start"),
		};
	return { ok: true, data: data.data };
}

export async function enableTwoStep(
	code: string,
): Promise<ActionResult<{ recoveryCodes: string[] }>> {
	if (!live("identity")) return NOT_LIVE;
	const { data, error } = await api("@post/identity/users/me/two-step/enable", {
		...(await withSession()),
		body: { code: code.trim() },
	});
	if (error || !data)
		return { ok: false, error: errorMessage(error, "That code is wrong") };
	revalidateProfile();
	return { ok: true, data: data.data };
}

export async function disableTwoStep(input: {
	password: string;
	code: string;
}): Promise<ActionResult> {
	if (!live("identity")) return NOT_LIVE;
	const { error } = await api("@post/identity/users/me/two-step/disable", {
		...(await withSession()),
		body: { password: input.password, code: input.code.trim() },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "2-step sign-in could not be turned off"),
		};
	revalidateProfile();
	return { ok: true, data: null };
}

export async function newRecoveryCodes(
	code: string,
): Promise<ActionResult<{ recoveryCodes: string[] }>> {
	if (!live("identity")) return NOT_LIVE;
	const { data, error } = await api(
		"@post/identity/users/me/two-step/recovery-codes",
		{
			...(await withSession()),
			body: { code: code.trim() },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "New codes could not be made"),
		};
	revalidateProfile();
	return { ok: true, data: data.data };
}

// ---- notification preferences --------------------------------------------------------------------

const allOn = (): EmailPrefs =>
	Object.fromEntries(EMAIL_CATEGORIES.map((c) => [c.key, true])) as EmailPrefs;

export async function getEmailPrefs(): Promise<EmailPrefs> {
	if (!live("identity")) return allOn();
	const { data } = await api(
		"@get/identity/users/me/notification-preferences",
		await withSession(),
	);
	return { ...allOn(), ...(data?.data.email ?? {}) } as EmailPrefs;
}

export async function saveEmailPrefs(
	email: EmailPrefs,
): Promise<ActionResult<EmailPrefs>> {
	if (!live("identity")) {
		await demoDelay(300);
		return { ok: true, data: email };
	}
	const { data, error } = await api(
		"@put/identity/users/me/notification-preferences",
		{ ...(await withSession()), body: { email } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				"Your notification settings could not be saved",
			),
		};
	revalidateProfile();
	return { ok: true, data: { ...allOn(), ...data.data.email } as EmailPrefs };
}
