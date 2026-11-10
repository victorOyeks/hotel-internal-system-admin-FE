import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { cookies } from "next/headers";
import { cache } from "react";
import { COOKIES } from "@hospio/api/session";

export type SessionHeaders = {
	auth: { type: "Bearer"; token: string } | undefined;
	headers: { "X-Hotel-Id": string } | undefined;
};

const fromCookies = cache(async (): Promise<SessionHeaders> => {
	const jar = await cookies();
	const token = jar.get(COOKIES.token)?.value;
	const hotelId = jar.get(COOKIES.hotel)?.value;
	return {
		auth: token ? ({ type: "Bearer", token } as const) : undefined,
		headers: hotelId ? { "X-Hotel-Id": hotelId } : undefined,
	};
});

/**
 * The hotel a piece of server work acts on when it is not the one in the hotel cookie: the owner portal loads every
 * hotel of the business and acts on a booking at that booking's hotel (docs/owner-portal.md). `null` means "the whole
 * business": no X-Hotel-Id, so the services answer across every hotel.
 */
const hotelScope = new AsyncLocalStorage<{ hotelId: string | null }>();

/** Run `work` with every `withSession()` call inside it sending `hotelId` (or no hotel, for the whole business). */
export function atHotel<T>(
	hotelId: string | null,
	work: () => Promise<T>,
): Promise<T> {
	return hotelScope.run({ hotelId }, work);
}

/**
 * Auth and hotel header for a server-side call, read from the session cookies. Pass `{ hotelId }` to
 * act on a hotel the caller is not "in": platform admins setting up a business's hotel, or an owner
 * creating rooms for the hotel the wizard just made.
 */
export async function withSession(opts?: {
	hotelId?: string | null;
}): Promise<SessionHeaders> {
	const base = await fromCookies();
	const scoped = hotelScope.getStore();
	if (!opts?.hotelId && scoped) {
		return {
			auth: base.auth,
			headers: scoped.hotelId ? { "X-Hotel-Id": scoped.hotelId } : undefined,
		};
	}
	if (!opts?.hotelId) return base;
	return { auth: base.auth, headers: { "X-Hotel-Id": opts.hotelId } };
}
