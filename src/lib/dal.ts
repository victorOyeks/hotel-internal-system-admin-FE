import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { getCookieData } from "./server-fns";
import { activeRoleKey, decrypt, tokenKey } from "./session";
import { redirect } from "next/navigation";
import { $fetch } from "./fetch";
import type { HotelRole } from "./types";
import { env } from "@/env";

export const verifySession = cache(async (role?: HotelRole) => {
	const cookie = (await cookies()).get(tokenKey)?.value;

	if (!cookie) {
		redirect("/auth");
	}

	const session = decrypt(cookie);

	if (!session?.userId) {
		redirect("/login");
	}

	if (role && !session.roles.includes(role)) {
		redirect("/unauthorized");
	}

	return {
		...session,
		token: cookie,
	};
});

export const getUser = cache(async () => {
	const cookieData = await getCookieData();

	if (!cookieData) {
		return null;
	}

	const { data, error } = await $fetch("@get/api/users/me", {
		auth: {
			type: "Bearer",
			token: cookieData.token,
		},
	});

	if (error) {
		console.error(error);
		return null;
	}

	return data.data;
});

export const getManagerCurrentHotel = cache(async () => {
	const user = await getUser();

	if (!user) {
		return null;
	}

	if (!user.roles.includes("MANAGER")) {
		return null;
	}

	if (!user.hotels || user.hotels.length === 0) {
		return null;
	}

	const jar = await cookies();
	const hotelId = jar.get(`${user.id}:currentHotel`)?.value;

	const currentHotel = user.hotels.find((hotel) => hotel.id === hotelId);

	if (!currentHotel) {
		const firstHotel = user.hotels[0];
		return firstHotel;
	}
	return currentHotel;
});

export const getOwnerCurrentHotel = cache(async () => {
	const user = await getUser();

	if (!user) {
		return null;
	}

	if (!user.roles.includes("HOTEL_OWNER")) {
		return null;
	}

	if (!user.hotels || user.hotels.length === 0) {
		return null;
	}

	const jar = await cookies();
	const hotelId = jar.get(`${user.id}:currentOwnerHotel`)?.value;

	const currentHotel = user.hotels.find((hotel) => hotel.id === hotelId);

	if (!currentHotel) {
		const firstHotel = user.hotels[0];
		return firstHotel;
	}
	return currentHotel;
});

export const setActiveRole = cache(async (role: HotelRole) => {
	const session = await verifySession();
	if (!session) {
		return null;
	}

	const userHasRole = session.roles.includes(role);

	if (!userHasRole) {
		return null;
	}

	const cookieStore = await cookies();
	cookieStore.set(activeRoleKey, role, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		expires: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
		sameSite: "lax",
		domain: process.env.NODE_ENV === "production" ? env.DOMAIN_URL : undefined,
	});
});

export const getActiveRole = cache(async () => {
	await verifySession();
	const cookieStore = await cookies();
	return cookieStore.get(activeRoleKey)?.value;
});
