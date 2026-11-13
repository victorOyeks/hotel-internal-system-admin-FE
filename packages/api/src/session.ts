import "server-only";

import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { env } from "@hospio/api/env";
import { isHotelRole, type HotelRole } from "./roles";
import type { Session, SessionClaims } from "./types";

export const COOKIES = {
	token: "hms.session",
	refresh: "hms.refresh",
	role: "hms.role",
	hotel: "hms.hotel",
} as const;

export function cookieOptions(expires: Date) {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		expires,
		sameSite: "lax" as const,
		path: "/",
		domain: process.env.NODE_ENV === "production" ? env.DOMAIN_URL : undefined,
	};
}

/** Decode (not verify) the access token; the backend verifies it on every call. */
export function decodeSession(token: string): Session | null {
	try {
		const claims = decodeJwt(token) as unknown as SessionClaims;
		if (!claims.sub || !claims.exp || claims.exp * 1000 < Date.now())
			return null;
		const roleSet: HotelRole[] = [];
		const levels: Session["levels"] = {};
		for (const entry of claims.roles ?? []) {
			const [role, level] = entry.split(":");
			if (isHotelRole(role)) {
				roleSet.push(role);
				levels[role] = (level as "FULL" | "EDIT" | "VIEW") ?? "FULL";
			}
		}
		return {
			...claims,
			hotels: claims.hotels ?? [],
			token,
			roleSet,
			levels,
			actedBy: claims.act || undefined,
		};
	} catch {
		return null;
	}
}

/**
 * Store the session cookies. A support-access token comes without a refresh token: the session then
 * ends with the token, and any refresh cookie left from an earlier sign-in is cleared.
 */
export async function createSession(
	accessToken: string,
	refreshToken?: string | null,
	refreshDays = 30,
) {
	const session = decodeSession(accessToken);
	if (!session) throw new Error("The server returned a token we couldn't read");
	const jar = await cookies();
	jar.set(
		COOKIES.token,
		accessToken,
		cookieOptions(new Date(session.exp * 1000)),
	);
	if (refreshToken)
		jar.set(
			COOKIES.refresh,
			refreshToken,
			cookieOptions(new Date(Date.now() + refreshDays * 86_400_000)),
		);
	else jar.set(COOKIES.refresh, "", cookieOptions(new Date(0)));
	// The chosen hotel may be left from someone else who used this browser (or a hotel taken away): keep it only
	// when this person has it, else the first of theirs, else none. A stale one made every save fail with a 403.
	const chosen = jar.get(COOKIES.hotel)?.value;
	if (
		session.scope !== "platform" &&
		chosen &&
		!session.hotels.includes(chosen)
	) {
		if (session.hotels[0])
			jar.set(
				COOKIES.hotel,
				session.hotels[0],
				cookieOptions(new Date(Date.now() + 30 * 86_400_000)),
			);
		else jar.set(COOKIES.hotel, "", cookieOptions(new Date(0)));
	}
	return session;
}

export async function setActiveRole(role: HotelRole) {
	const jar = await cookies();
	jar.set(
		COOKIES.role,
		role,
		cookieOptions(new Date(Date.now() + 12 * 3_600_000)),
	);
}

/** Forget the chosen role (it was taken away): the role picker opens next. */
export async function clearActiveRole() {
	const jar = await cookies();
	jar.set(COOKIES.role, "", cookieOptions(new Date(0)));
}

export async function setActiveHotel(hotelId: string) {
	const jar = await cookies();
	jar.set(
		COOKIES.hotel,
		hotelId,
		cookieOptions(new Date(Date.now() + 30 * 86_400_000)),
	);
}

export async function deleteSession() {
	const jar = await cookies();
	for (const name of Object.values(COOKIES)) {
		jar.set(name, "", cookieOptions(new Date(0)));
	}
}
