import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { api } from "./api/client";
import { withSession } from "./api/server";
import type { Hotel, Me } from "./api/schema";
import { demoHotels, demoMe } from "./demo/fixtures/hotel";
import { DEMO_AUTH } from "./demo/mode";
import { isHotelRole, type HotelRole } from "./roles";
import { COOKIES, decodeSession } from "./session";

/** The signed-in session from the cookie, or a redirect to sign-in. */
export const getSession = cache(async () => {
	const jar = await cookies();
	const token = jar.get(COOKIES.token)?.value;
	const session = token ? decodeSession(token) : null;
	if (!session) redirect("/auth");
	return session;
});

export const getUser = cache(async (): Promise<Me | null> => {
	if (DEMO_AUTH) {
		const session = await getSession();
		return demoMe(session.email, session.name, session.roleSet);
	}
	const { auth } = await withSession();
	if (!auth) return null;
	const { data, error } = await api("@get/identity/users/me", { auth });
	if (error || !data) return null;
	return data.data;
});

/** Hotels the user can see. Platform staff have none of their own. */
export const getHotels = cache(async (): Promise<Hotel[]> => {
	const session = await getSession();
	if (session.scope === "platform") return [];
	if (DEMO_AUTH) return demoHotels;
	const { data } = await api("@get/tenant/hotels", await withSession());
	return data?.data ?? [];
});

export const getActiveRole = cache(async (): Promise<HotelRole | null> => {
	const jar = await cookies();
	const role = jar.get(COOKIES.role)?.value;
	return role && isHotelRole(role) ? role : null;
});

/** The hotel the user is working in: the chosen one, or the first they are granted. */
export const getActiveHotel = cache(async (): Promise<Hotel | null> => {
	const hotels = await getHotels();
	if (hotels.length === 0) return null;
	const jar = await cookies();
	const chosen = jar.get(COOKIES.hotel)?.value;
	return hotels.find((h) => h.id === chosen) ?? hotels[0];
});
