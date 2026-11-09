import "server-only";

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
 * Auth and hotel header for a server-side call, read from the session cookies. Pass `{ hotelId }` to
 * act on a hotel the caller is not "in": platform admins setting up a business's hotel, or an owner
 * creating rooms for the hotel the wizard just made.
 */
export async function withSession(opts?: { hotelId?: string | null }): Promise<SessionHeaders> {
	const base = await fromCookies();
	if (!opts?.hotelId) return base;
	return { auth: base.auth, headers: { "X-Hotel-Id": opts.hotelId } };
}
