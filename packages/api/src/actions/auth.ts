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
import { createSession, deleteSession, setActiveHotel, setActiveRole } from "@hospio/api/session";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

export async function login(input: { email: string; password: string }): Promise<
	ActionResult<{ mustChangePassword: boolean; roles: string[] }>
> {
	if (DEMO_AUTH) {
		// Any email and password sign in, with every role, so the whole UI can be walked through.
		await demoDelay(400);
		const token = mintDemoToken(input.email, nameFromEmail(input.email), BUSINESS_ID, demoHotels.map((h) => h.id), APP_ROLES);
		await createSession(token, "demo-refresh");
		await setActiveHotel(demoHotels[0].id);
		return { ok: true, data: { mustChangePassword: false, roles: [...APP_ROLES] } };
	}
	const { data, error } = await api("@post/identity/auth/sign-in", { body: input });
	if (error || !data) return { ok: false, error: errorMessage(error, "Email or password is wrong") };
	const session = await createSession(data.data.accessToken, data.data.refreshToken);
	// One role: skip the picker. The chosen hotel defaults to the first granted.
	const mine = session.roleSet.filter((r) => isAppRole(r));
	if (mine.length === 1) await setActiveRole(mine[0]);
	if (session.hotels.length >= 1) await setActiveHotel(session.hotels[0]);
	return { ok: true, data: { mustChangePassword: data.data.mustChangePassword, roles: data.data.roles } };
}

export async function logout() {
	const { auth } = await withSession();
	if (auth && !DEMO_AUTH) await api("@post/identity/auth/logout", { auth }).catch(() => undefined);
	await deleteSession();
	redirect("/auth");
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

export async function changePassword(input: { currentPassword: string; newPassword: string }): Promise<ActionResult> {
	const { auth } = await withSession();
	if (!auth) return { ok: false, error: "Sign in again" };
	if (DEMO_AUTH) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@post/identity/auth/change-password", { auth, body: input });
	if (error) return { ok: false, error: errorMessage(error, "Password could not be changed") };
	await deleteSession();
	return { ok: true, data: null };
}
