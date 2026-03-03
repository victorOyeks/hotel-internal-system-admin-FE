import { type NextRequest, NextResponse } from "next/server";
import type { HotelRole } from "./lib/types";
import { tokenKey, decrypt, createSession, activeRoleKey } from "./lib/session";

const PREFIX_PATH = "/dashboard";

const roleToPath: Record<HotelRole, string> = {
	RESTAURANT: "/restaurant",
	FRONT_DESK: "/front-desk",
	HOTEL_OWNER: "/hotel-owner",
	MANAGER: "/manager",
	INVENTORY: "/inventory",
	MARKETER: "/marketer",
	RENTALS: "/rentals",
	SUPER_ADMIN: "/admin",
	LAUNDRY: "/laundry",
	FINANCIALS: "/financials",
};

const publicPaths = ["/auth", "/signup", "/forgot-password", "/reset-password"];

const protectedRoleIndependentRoute = ["/select-role"];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// 1. Check if public route
	const isPublicRoute = publicPaths.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);
	const isProtectedRoleIndependentRoute = protectedRoleIndependentRoute.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);

	// 2. Initialize Redirect URL
	const loginUrl = new URL("/auth", request.url);
	loginUrl.searchParams.set("from", pathname);
	const selectRoleUrl = new URL("/select-role", request.url);

	// 3. Get Tokens
	const accessToken = request.cookies.get(tokenKey)?.value;

	// 4. Verify Access Token (Decrypt returns null if expired/invalid)
	const session = accessToken ? decrypt(accessToken) : null;

	// 6. Allow public routes to pass if they have no session
	if (isPublicRoute && !session) {
		return NextResponse.next();
	}

	// 7. If no session, redirect to login
	if (!session) {
		return NextResponse.redirect(loginUrl);
	}

	// --- RBAC & REWRITES (Only runs if we have a valid session) ---

	const userRole = request.cookies.get(activeRoleKey)?.value;

	if (!userRole && !isPublicRoute && !isProtectedRoleIndependentRoute) {
		// Before showing role selection, check if user needs to change password first
		const resetPasswordUrl = new URL("/reset-password", request.url);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				},
			);
			if (res.ok) {
				const { data } = await res.json();
				if (!data.changedPassword) {
					return NextResponse.redirect(resetPasswordUrl);
				}
			}
		} catch {
			// If fetch fails, fall through to role selection
		}
		return NextResponse.redirect(selectRoleUrl);
	}

	const expectedPath = roleToPath[userRole as HotelRole];

	// Handle Rewrite Logic
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
	// Handle 404 for direct access to protected paths
	else if (expectedPath && pathname.startsWith(expectedPath)) {
		// If user tries to visit /restaurant directly instead of /dashboard/restaurant
		// You might want to allow this or rewrite, currently you 404 it.
		return new NextResponse(null, {
			status: 404,
			statusText: "Not Found",
		});
	}

	// 8. FINAL STEP: Attach new cookies if we refreshed
	if (accessToken) {
		await createSession(accessToken);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
