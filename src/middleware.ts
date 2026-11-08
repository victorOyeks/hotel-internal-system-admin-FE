import { type NextRequest, NextResponse } from "next/server";
import { DEMO_AUTH } from "./lib/demo/mode";
import { isHotelRole, rolePaths } from "./lib/roles";
import { COOKIES, decodeSession } from "./lib/session";

const PREFIX = "/dashboard";
/** Screens every role shares (Figma "Everywhere" / Staff · Shared): served from /shared/* for any role. */
const SHARED = ["/notifications", "/profile", "/help", "/shifts"];
const PUBLIC = ["/auth", "/forgot-password", "/reset-password"];
const ROLE_FREE = ["/select-role"];

function startsWithAny(pathname: string, paths: string[]) {
	return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
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
		login.searchParams.set("from", pathname);
		return NextResponse.redirect(login);
	}

	const role = request.cookies.get(COOKIES.role)?.value;
	if (!role || !isHotelRole(role)) {
		if (startsWithAny(pathname, ROLE_FREE)) return NextResponse.next();
		if (DEMO_AUTH) return NextResponse.redirect(new URL("/select-role", request.url));
		// First sign-in with a temporary password: change it before anything else.
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/identity/users/me`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const body = await res.json();
				if (body?.data?.changedPassword === false) {
					return NextResponse.redirect(new URL("/reset-password", request.url));
				}
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
		const target = new URL(base + (rest === "/" ? "" : rest), request.nextUrl);
		target.search = request.nextUrl.search;
		return NextResponse.rewrite(target);
	}
	if ([...Object.values(rolePaths), "/shared"].some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
		// Role areas are only reachable through /dashboard.
		return new NextResponse(null, { status: 404 });
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|icon|.*\\.(?:png|svg|ico)$).*)"],
};
