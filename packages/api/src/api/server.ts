import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { COOKIES } from "@hospio/api/session";

/** Auth and hotel header for a server-side call, read from the session cookies. */
export const withSession = cache(async () => {
	const jar = await cookies();
	const token = jar.get(COOKIES.token)?.value;
	const hotelId = jar.get(COOKIES.hotel)?.value;
	return {
		auth: token ? ({ type: "Bearer", token } as const) : undefined,
		headers: hotelId ? { "X-Hotel-Id": hotelId } : undefined,
	};
});
