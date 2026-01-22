import { type NextRequest, NextResponse } from "next/server";
import type { HotelRole } from "./lib/types";
import { tokenKey } from "./lib/server-fns";
import { decrypt } from "./lib/session";

const PREFIX_PATH = "/dashboard";

const roleToPath: Record<HotelRole, string> = {
	RESTAURANT: "/restaurant",
	FRONT_DESK: "/front-desk",
	HOTEL_OWNER: "/hotel-owner",
	MANAGER: "/manager",
	INVENTORY: "/inventory",
	MAINTENANCE: "/maintenance",
	RENTALS: "/rentals",
	SUPER_ADMIN: "/admin",
};

const publicPaths = ["/auth", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const isPublicRoute = publicPaths.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);
	const token = request.cookies.get(tokenKey)?.value;

	if (!token) {
		const redirectUrl = new URL("/auth", request.url);
		redirectUrl.searchParams.set("from", pathname);

		if (!isPublicRoute) {
			return NextResponse.redirect(redirectUrl);
		}

		return NextResponse.next();
	}

	const session = decrypt(token);

	if (!isPublicRoute && !session) {
		const redirectUrl = new URL("/auth", request.url);
		redirectUrl.searchParams.set("from", pathname);
		return NextResponse.redirect(redirectUrl);
	}

	const userRole = session?.role as HotelRole;
	const expectedPath = roleToPath[userRole];

	if (pathname.startsWith(PREFIX_PATH)) {
		const actualPath = pathname.slice(PREFIX_PATH.length) || "/";
		const query = request.nextUrl.search;
		const hashed = request.nextUrl.hash;

		const rewriteUrl = new URL(expectedPath + actualPath, request.nextUrl);
		rewriteUrl.search = query;
		rewriteUrl.hash = hashed;

		console.log("Rewriting to:", rewriteUrl.toString());

		return NextResponse.rewrite(rewriteUrl);
	}

	if (pathname.startsWith(expectedPath)) {
		return new NextResponse(null, {
			status: 404,
			statusText: "Not Found",
		});
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
