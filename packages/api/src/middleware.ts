import { type NextRequest, NextResponse } from "next/server";
import { APP, APP_ROLES, isAppRole, OTHER_APP_URL } from "./app";
import { DEMO_AUTH } from "./demo/mode";
import { rolePaths } from "./roles";
import { COOKIES, cookieOptions, decodeSession } from "./session";

const PREFIX = "/dashboard";
const PUBLIC = [
	"/auth",
	"/lock",
	"/auth/support",
	"/forgot-password",
	"/reset-password",
	"/sign-up",
	"/accept-invite",
];
/**
 * Public screens a signed-in user may still open: the invite flow signs a different user in, and the
 * support link (/auth/support?token=) replaces whatever session the browser holds with the owner view.
 */
const PUBLIC_WHEN_SIGNED_IN = [
	"/auth/support",
	"/reset-password",
	"/sign-up",
	"/accept-invite",
];
/** Need a session but no role cookie: the role picker, phone check, the owner's wizard and handover. */
const ROLE_FREE = ["/select-role", "/verify-phone", "/onboarding", "/handover"];
/** Screens every role shares (Figma "Everywhere" / Staff · Shared): served from /shared/* for any role. */
const SHARED = ["/notifications", "/profile", "/help", "/shifts", "/inbox"];

function startsWithAny(pathname: string, paths: string[]) {
	return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

type Tokens = { access: string; refresh: string };

/** How long before the access token expires the middleware swaps it for a new one. */
const RENEW_BEFORE_MS = 60_000;

/**
 * One refresh per refresh token in this process: identity rotates refresh tokens (the old one is revoked on use),
 * so two requests racing with the same expired session would see the second refused. They share the first's answer.
 */
const renewing = new Map<string, Promise<Tokens | null>>();

function renew(refreshToken: string): Promise<Tokens | null> {
	let pending = renewing.get(refreshToken);
	if (!pending) {
		pending = (async () => {
			try {
				const res = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/identity/auth/refresh`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ refreshToken }),
						cache: "no-store",
					},
				);
				if (!res.ok) return null;
				const body = await res.json();
				const access = body?.data?.accessToken;
				const refresh = body?.data?.refreshToken;
				return access && refresh && decodeSession(access)
					? { access, refresh }
					: null;
			} catch {
				return null;
			}
		})();
		renewing.set(refreshToken, pending);
		setTimeout(() => renewing.delete(refreshToken), 60_000);
	}
	return pending;
}

/**
 * The one middleware both apps run. The access token lives an hour and its cookie with it: past that, a page left
 * open sent its next save (a server action) to the sign-in redirect, and Next showed "An unexpected response was
 * received from the server". So an expired, expiring (under a minute left) or missing access token with a refresh cookie is renewed here first, the
 * new pair forwarded to the page and set on the response, and the request goes on as if nothing happened.
 */
export async function appMiddleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get(COOKIES.token)?.value;
	const refreshToken = request.cookies.get(COOKIES.refresh)?.value;
	let fresh: Tokens | null = null;
	const current = token ? decodeSession(token) : null;
	// Renewed a minute before it runs out, not after: a page that reads several services after this check would
	// otherwise send a token that expires mid-render and see 401s.
	const expiring = !current || current.exp * 1000 - Date.now() < RENEW_BEFORE_MS;
	if (refreshToken && expiring && !startsWithAny(pathname, PUBLIC)) {
		fresh = await renew(refreshToken);
		if (fresh) {
			request.cookies.set(COOKIES.token, fresh.access);
			request.cookies.set(COOKIES.refresh, fresh.refresh);
		}
	}
	const response = await gate(request);
	if (fresh) {
		const session = decodeSession(fresh.access);
		response.cookies.set(
			COOKIES.token,
			fresh.access,
			cookieOptions(new Date((session?.exp ?? 0) * 1000)),
		);
		response.cookies.set(
			COOKIES.refresh,
			fresh.refresh,
			cookieOptions(new Date(Date.now() + 30 * 86_400_000)),
		);
	}
	return response;
}

/** Passes the request on with its (possibly renewed) cookies. */
const next = (request: NextRequest) =>
	NextResponse.next({ request: { headers: request.headers } });

/**
 * Sign-in gate, first-password change, role picker, and the rewrite of /dashboard/* onto the active role's area.
 * A session that holds none of this app's roles is sent to the other app.
 */
async function gate(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get(COOKIES.token)?.value;
	const session = token ? decodeSession(token) : null;

	if (startsWithAny(pathname, PUBLIC)) {
		return session && !startsWithAny(pathname, PUBLIC_WHEN_SIGNED_IN)
			? NextResponse.redirect(new URL("/dashboard", request.url))
			: next(request);
	}
	if (!session) {
		// A shared device (docs/shared-devices.md) shows its lock screen instead of the sign-in page.
		if (APP === "hotel" && request.cookies.get("hms.device")?.value)
			return NextResponse.redirect(new URL("/lock", request.url));
		const login = new URL("/auth", request.url);
		if (pathname.startsWith(PREFIX))
			login.searchParams.set("from", pathname + request.nextUrl.search);
		return NextResponse.redirect(login);
	}
	if (pathname === "/")
		return NextResponse.redirect(new URL("/dashboard", request.url));

	const mine = session.roleSet.filter((r) => isAppRole(r));
	if (mine.length === 0 && session.roleSet.length > 0) {
		// Signed in on the wrong app: hand over with the session cookie's twin on the other host.
		return NextResponse.redirect(
			new URL(
				`/auth?switch=${encodeURIComponent(session.email)}`,
				OTHER_APP_URL,
			),
		);
	}

	const role = request.cookies.get(COOKIES.role)?.value;
	if (!role || !isAppRole(role)) {
		if (startsWithAny(pathname, ROLE_FREE)) return next(request);
		if (DEMO_AUTH)
			return NextResponse.redirect(new URL("/select-role", request.url));
		// First sign-in with a temporary password: change it before anything else.
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/identity/users/me`,
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			if (res.ok) {
				const body = await res.json();
				if (body?.data?.changedPassword === false)
					return NextResponse.redirect(new URL("/reset-password", request.url));
			}
		} catch {
			// fall through to the role picker
		}
		return NextResponse.redirect(new URL("/select-role", request.url));
	}

	const rolePath = rolePaths[role];
	if (pathname.startsWith(PREFIX)) {
		const rest = pathname.slice(PREFIX.length) || "/";
		const base = SHARED.some((p) => rest === p || rest.startsWith(`${p}/`))
			? "/shared"
			: rolePath;
		// Only the path changes. A rewrite whose host differs from the request's (behind nginx, or when
		// the server is bound to 127.0.0.1) is proxied as an external URL and lands on the guard below as a 404.
		const target = request.nextUrl.clone();
		target.pathname = base + (rest === "/" ? "" : rest);
		// The shell sends a stale session through /api/session/refresh and back to this page.
		const forwarded = new Headers(request.headers);
		forwarded.set("x-hospio-path", pathname + request.nextUrl.search);
		return NextResponse.rewrite(target, { request: { headers: forwarded } });
	}
	if (
		[...Object.values(rolePaths), "/shared"].some(
			(p) => pathname === p || pathname.startsWith(`${p}/`),
		)
	) {
		// Role areas are only reachable through /dashboard.
		return new NextResponse(null, { status: 404 });
	}
	return next(request);
}

export { APP_ROLES };
