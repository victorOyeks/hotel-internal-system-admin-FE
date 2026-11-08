import { type NextRequest, NextResponse } from "next/server";
import { APP_ROLES, isAppRole, OTHER_APP_URL } from "./app";
import { DEMO_AUTH } from "./demo/mode";
import { rolePaths } from "./roles";
import { COOKIES, decodeSession } from "./session";

const PREFIX = "/dashboard";
const PUBLIC = ["/auth", "/forgot-password", "/reset-password"];
const ROLE_FREE = ["/select-role"];
/** Screens every role shares (Figma "Everywhere" / Staff · Shared): served from /shared/* for any role. */
const SHARED = ["/notifications", "/profile", "/help", "/shifts"];

function startsWithAny(pathname: string, paths: string[]) {
	return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * The one middleware both apps run: sign-in gate, first-password change, role picker, and the
 * rewrite of /dashboard/* onto the active role's area. A session that holds none of this app's roles
 * is sent to the other app.
 */
export async function appMiddleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get(COOKIES.token)?.value;
	const session = token ? decodeSession(token) : null;

	if (startsWithAny(pathname, PUBLIC)) {
		return session && pathname !== "/reset-password"
			? NextResponse.redirect(new URL("/dashboard", request.url))
			: NextResponse.next();
	}
	if (!session) {
		const login = new URL("/auth", request.url);
		if (pathname.startsWith(PREFIX)) login.searchParams.set("from", pathname + request.nextUrl.search);
		return NextResponse.redirect(login);
	}
	if (pathname === "/") return NextResponse.redirect(new URL("/dashboard", request.url));

	const mine = session.roleSet.filter((r) => isAppRole(r));
	if (mine.length === 0 && session.roleSet.length > 0) {
		// Signed in on the wrong app: hand over with the session cookie's twin on the other host.
		return NextResponse.redirect(new URL(`/auth?switch=${encodeURIComponent(session.email)}`, OTHER_APP_URL));
	}

	const role = request.cookies.get(COOKIES.role)?.value;
	if (!role || !isAppRole(role)) {
		if (startsWithAny(pathname, ROLE_FREE)) return NextResponse.next();
		if (DEMO_AUTH) return NextResponse.redirect(new URL("/select-role", request.url));
		// First sign-in with a temporary password: change it before anything else.
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/identity/users/me`, { headers: { Authorization: `Bearer ${token}` } });
			if (res.ok) {
				const body = await res.json();
				if (body?.data?.changedPassword === false) return NextResponse.redirect(new URL("/reset-password", request.url));
			}
		} catch {
			// fall through to the role picker
		}
		return NextResponse.redirect(new URL("/select-role", request.url));
	}

	const rolePath = rolePaths[role];
	if (pathname.startsWith(PREFIX)) {
		const rest = pathname.slice(PREFIX.length) || "/";
		const base = SHARED.some((p) => rest === p || rest.startsWith(`${p}/`)) ? "/shared" : rolePath;
		// Only the path changes. A rewrite whose host differs from the request's (behind nginx, or when
		// the server is bound to 127.0.0.1) is proxied as an external URL and lands on the guard below as a 404.
		const target = request.nextUrl.clone();
		target.pathname = base + (rest === "/" ? "" : rest);
		return NextResponse.rewrite(target);
	}
	if ([...Object.values(rolePaths), "/shared"].some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
		// Role areas are only reachable through /dashboard.
		return new NextResponse(null, { status: 404 });
	}
	return NextResponse.next();
}

export { APP_ROLES };
