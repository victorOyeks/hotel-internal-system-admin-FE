import { HOTEL_ROLES } from "@hospio/api/roles";
import type { SessionClaims } from "@hospio/api/types";

function base64url(input: string) {
	return Buffer.from(input, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * An unsigned token in the shape identity-service issues. Only read by this app's cookie code in
 * demo mode; the real backend signs its own and rejects this one.
 */
export function mintDemoToken(email: string, name: string, businessId: string, hotelIds: string[], roles = HOTEL_ROLES as readonly string[]) {
	const now = Math.floor(Date.now() / 1000);
	const claims: SessionClaims = {
		sub: "demo-user",
		email,
		name,
		bid: businessId,
		hotels: hotelIds,
		roles: roles.map((r) => `${r}:FULL`),
		scope: "business",
		iat: now,
		exp: now + 12 * 3600,
	};
	return `${base64url(JSON.stringify({ alg: "none", typ: "JWT" }))}.${base64url(JSON.stringify(claims))}.`;
}

/** "tunde.bakare@simpashotels.com" → "Tunde Bakare"; anything unreadable → "Tunde Bakare". */
export function nameFromEmail(email: string) {
	const local = email.split("@")[0] ?? "";
	const words = local.split(/[._\-+]/).filter((w) => /^[a-z]+$/i.test(w));
	if (words.length === 0) return "Tunde Bakare";
	return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}
