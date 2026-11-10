"use server";

import { redirect } from "next/navigation";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { getHotels } from "@hospio/api/dal";
import { BUSINESS_ID, demoHotels } from "@hospio/api/demo/fixtures/hotel";
import { DEMO_AUTH, demoDelay } from "@hospio/api/demo/mode";
import { mintDemoToken, nameFromEmail } from "@hospio/api/demo/token";
import { APP_ROLES, isAppRole } from "@hospio/api/app";
import type { HotelRole } from "@hospio/api/roles";
import { lockDevice } from "@hospio/api/actions/devices";
import { clientAgentHeaders } from "@hospio/api/client-agent";
import { askForPin, getDeviceToken, getSharedDevice } from "@hospio/api/device";
import { createSession, decodeSession, deleteSession, setActiveHotel, setActiveRole } from "@hospio/api/session";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

export type SignInResult = { mustChangePassword: boolean; roles: string[]; twoStepToken?: undefined } | { twoStepToken: string; mustChangePassword?: undefined; roles?: undefined };

export async function login(input: { email: string; password: string }): Promise<ActionResult<SignInResult>> {
	if (DEMO_AUTH) {
		// Any email and password sign in, with every role, so the whole UI can be walked through.
		await demoDelay(400);
		const token = mintDemoToken(input.email, nameFromEmail(input.email), BUSINESS_ID, demoHotels.map((h) => h.id), APP_ROLES);
		await createSession(token, "demo-refresh");
		await setActiveHotel(demoHotels[0].id);
		return { ok: true, data: { mustChangePassword: false, roles: [...APP_ROLES] } };
	}
	const { data, error } = await api("@post/identity/auth/sign-in", { body: input, headers: await clientAgentHeaders() });
	if (error || !data) return { ok: false, error: errorMessage(error, "Email or password is wrong") };
	// 2-step sign-in is on (docs/profile.md): no tokens yet, the code step comes next.
	if (data.data.twoStepRequired && !data.data.accessToken) {
		if (!data.data.twoStepToken) return { ok: false, error: "Sign-in needs a code but none was asked for. Try again" };
		return { ok: true, data: { twoStepToken: data.data.twoStepToken } };
	}
	if (!data.data.accessToken) return { ok: false, error: "Email or password is wrong" };
	return { ok: true, data: await settleSignIn(data.data.accessToken, data.data.refreshToken, data.data.mustChangePassword, data.data.roles) };
}

/** The code step of 2-step sign-in: an authenticator code or a recovery code, then the same landing as a normal sign-in. */
export async function loginWithCode(input: { twoStepToken: string; code: string }): Promise<ActionResult<{ mustChangePassword: boolean; roles: string[] }>> {
	if (DEMO_AUTH) return { ok: false, error: "2-step sign-in needs the live services" };
	const code = input.code.trim();
	if (!code) return { ok: false, error: "Enter the code from your authenticator app" };
	const { data, error } = await api("@post/identity/auth/sign-in/two-step", {
		body: { twoStepToken: input.twoStepToken, code },
		headers: await clientAgentHeaders(),
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "That code is wrong") };
	return { ok: true, data: await settleSignIn(data.data.accessToken, data.data.refreshToken, data.data.mustChangePassword, data.data.roles) };
}

async function settleSignIn(accessToken: string, refreshToken: string | null, mustChangePassword: boolean, roles: string[]) {
	const session = await createSession(accessToken, refreshToken);
	// One role: skip the picker. The chosen hotel defaults to the first granted.
	const mine = session.roleSet.filter((r) => isAppRole(r));
	if (mine.length === 1) await setActiveRole(mine[0]);
	if (session.hotels.length >= 1) await setActiveHotel(session.hotels[0]);
	// The PIN prompt after a sign-in on a shared device (that hotel first) or a first sign-in (docs/shared-devices.md).
	const { device } = await getSharedDevice();
	if (device && session.hotels.includes(device.hotelId)) await setActiveHotel(device.hotelId);
	if (device || mustChangePassword) await askForPin();
	return { mustChangePassword, roles };
}

/** Signs out. `notice: "saved"` (onboarding's "Save and finish later") tells the sign-in page to say the setup was kept. */
export async function logout(notice?: unknown) {
	// On a shared device signing out is locking: only this session ends, and the lock screen opens.
	if (!DEMO_AUTH && (await getDeviceToken())) {
		await lockDevice("button");
		redirect("/lock");
	}
	const { auth } = await withSession();
	if (auth && !DEMO_AUTH) await api("@post/identity/auth/logout", { auth }).catch(() => undefined);
	await deleteSession();
	redirect(notice === "saved" ? "/auth?saved=1" : "/auth");
}

export async function selectRole(role: string) {
	if (!isAppRole(role)) return;
	await setActiveRole(role as HotelRole);
	redirect("/dashboard");
}

export async function selectHotel(hotelId: string) {
	const hotels = await getHotels();
	if (hotels.some((h) => h.id === hotelId)) await setActiveHotel(hotelId);
	redirect("/dashboard");
}

/**
 * Change one's own password with the current one (docs/profile.md): every other session ends, this one carries on with the
 * fresh tokens the server sends back (role and hotel cookies kept). The temporary-password screen uses it too.
 */
export async function changePassword(input: { currentPassword: string; newPassword: string }): Promise<ActionResult> {
	const { auth } = await withSession();
	if (!auth) return { ok: false, error: "Sign in again" };
	if (DEMO_AUTH) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { data, error } = await api("@post/identity/auth/change-password", { auth, body: input });
	if (error) return { ok: false, error: errorMessage(error, "Password could not be changed") };
	if (data?.data?.accessToken) await createSession(data.data.accessToken, data.data.refreshToken);
	// An older server ended every session, this one included.
	else await deleteSession();
	return { ok: true, data: null };
}

/**
 * "View as owner" from the admin portal: the hotel app is opened at /auth/support?token=… with a
 * support-access token (`act` = the admin, roles OWNER:VIEW, expiring with the grant). The token
 * becomes the session as it is, with no refresh token, the owner role and the first hotel; the
 * dashboard shows the read-only bar while `actedBy` is set.
 */
export async function startSupportSession(token: string): Promise<ActionResult<null>> {
	const session = decodeSession(token);
	if (!session || !session.actedBy) return { ok: false, error: "This support link has expired. Ask for a new one from the admin portal." };
	await createSession(token, null);
	await setActiveRole("OWNER");
	if (session.hotels.length >= 1) await setActiveHotel(session.hotels[0]);
	redirect("/dashboard");
}
