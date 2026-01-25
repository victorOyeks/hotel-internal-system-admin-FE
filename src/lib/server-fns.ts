import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { decrypt, refreshSession, tokenKey } from "./session";

// Keys moved to session.ts to avoid circular dependency

export const getCookieData = cache(async () => {
	const cookieStore = await cookies();
	let token = cookieStore.get(tokenKey)?.value;

	if (!token) {
		const newSession = await refreshSession();
		if (!newSession) {
			return null;
		}
		token = newSession.accessToken;
	}

	const cookieData = decrypt(token);

	return cookieData
		? {
				...cookieData,
				token,
			}
		: null;
});
