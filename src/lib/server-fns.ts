import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { decrypt, tokenKey } from "./session";

// Keys moved to session.ts to avoid circular dependency

export const getCookieData = cache(async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get(tokenKey)?.value;

	if (!token) {
		return null;
	}

	const cookieData = decrypt(token);

	return cookieData
		? {
				...cookieData,
				token,
			}
		: null;
});
