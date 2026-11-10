import "server-only";

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "./api/client";
import { isAppRole } from "./app";
import type { Me } from "./api/schema";
import { clearActiveRole, COOKIES, createSession, deleteSession, setActiveRole } from "./session";
import type { Session } from "./types";

/** Set for a few seconds after a refresh, so a token that still disagrees with the server ends the session instead of looping. */
export const REFRESHED_COOKIE = "hms.refreshed";
export const SESSION_REFRESH_PATH = "/api/session/refresh";

/** Roles and levels as `ROLE:LEVEL`, the highest level per role, sorted. */
function signature(entries: [string, string][]): string {
	const order = ["VIEW", "EDIT", "FULL"];
	const best = new Map<string, string>();
	for (const [role, level] of entries) {
		const had = best.get(role);
		if (!had || order.indexOf(level) > order.indexOf(had)) best.set(role, level);
	}
	return [...best.entries()].map(([r, l]) => `${r}:${l}`).sort().join(",");
}

/**
 * True when the signed-in token no longer matches the person's roles on the server (a manager gave, changed,
 * paused or removed one since the token was issued). The services refuse such a token anyway (401 "Your
 * access has changed"); this catches it on the next page so the token can be swapped before anything fails.
 */
export function tokenIsStale(session: Session, me: Me): boolean {
	if (session.actedBy) return false;
	const token = signature(Object.entries(session.levels).map(([r, l]) => [r, l ?? "FULL"]));
	const server = signature(me.roleLevels.map((g) => [g.role, g.level]));
	return token !== server;
}

/**
 * A redirect with a path-only Location. Behind nginx the standalone server sees itself as 0.0.0.0:<port>, so
 * an absolute URL built from request.url would send the browser there.
 */
function go(path: string) {
	return new NextResponse(null, { status: 303, headers: { Location: path, "Cache-Control": "no-store" } });
}

/** Where the shell sends a stale session: here, then back to the page. */
const safeBack = (from: string | null | undefined) => (from?.startsWith("/dashboard") || from === "/select-role" ? (from as string) : "/dashboard");

export function refreshUrl(from: string | null | undefined): string {
	const back = safeBack(from);
	return `${SESSION_REFRESH_PATH}?from=${encodeURIComponent(back)}`;
}

/**
 * GET /api/session/refresh?from=: swaps the access token for one with the person's current roles (identity
 * POST /auth/refresh with the refresh cookie) and goes back to `from`. The active role is kept when it is
 * still held, set when exactly one is left, and otherwise cleared so the role picker opens. When the refresh
 * fails (signed out elsewhere, account paused) or already ran a moment ago, the session ends at sign-in.
 */
export async function refreshSessionRoute(request: NextRequest) {
	const jar = await cookies();
	const from = request.nextUrl.searchParams.get("from");
	const back = safeBack(from);
	const toSignIn = async (reason: string) => {
		await deleteSession();
		// A shared device goes back to its lock screen, where the next person unlocks (docs/shared-devices.md).
		if (jar.get("hms.device")?.value) return go(`/lock?reason=${encodeURIComponent(reason)}`);
		return go(`/auth?reason=${encodeURIComponent(reason)}`);
	};
	const refreshToken = jar.get(COOKIES.refresh)?.value;
	if (!refreshToken || jar.get(REFRESHED_COOKIE)?.value) return toSignIn("access-changed");
	const { data, error } = await api("@post/identity/auth/refresh", { body: { refreshToken } });
	if (error || !data) return toSignIn("access-changed");
	const session = await createSession(data.data.accessToken, data.data.refreshToken);
	jar.set(REFRESHED_COOKIE, "1", { httpOnly: true, path: "/", maxAge: 15, sameSite: "lax" });
	const active = jar.get(COOKIES.role)?.value;
	const mine = session.roleSet.filter((r) => isAppRole(r));
	if (!active || !mine.includes(active as (typeof mine)[number])) {
		if (mine.length === 1) await setActiveRole(mine[0]);
		else {
			await clearActiveRole();
			return go("/select-role");
		}
		return go("/dashboard");
	}
	return go(back);
}
