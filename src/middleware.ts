import { type NextRequest, NextResponse } from "next/server";
import type { HotelRole } from "./lib/types";
import {
  tokenKey,
  refreshTokenKey,
  decrypt,
  createSession,
  deleteSession,
} from "./lib/session";
import { $fetch } from "./lib/fetch";

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

  // 1. Check if public route
  const isPublicRoute = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // 2. Initialize Redirect URL
  const loginUrl = new URL("/auth", request.url);
  loginUrl.searchParams.set("from", pathname);

  // 3. Get Tokens
  let accessToken = request.cookies.get(tokenKey)?.value;
  const refreshToken = request.cookies.get(refreshTokenKey)?.value;

  // 4. Verify Access Token (Decrypt returns null if expired/invalid)
  let session = accessToken ? decrypt(accessToken) : null;

  // Flag to track if we need to set new cookies on the response
  let newTokens: { accessToken: string; refreshToken: string } | null = null;

  // 5. REFRESH LOGIC: If session is invalid/missing BUT we have a refresh token
  if (!session && refreshToken) {
    const response = await $fetch("@post/api/auth/refresh", {
      body: { refreshToken },
    });

    if (response.data && !response.error) {
      // Success! Capture new tokens
      newTokens = {
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
      };

      // Update the local accessToken so RBAC below works with the new user
      accessToken = newTokens.accessToken;
      session = decrypt(accessToken);
    } else {
      console.error(
        "Token refresh failed inside middleware",
        refreshToken,
        response.error,
      );
      await deleteSession();
      // Fall through to the auth check below
    }
  }

  // 6. Auth Check: If still no valid session, redirect (unless public)
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(loginUrl);
  }

  // 7. Allow public routes to pass if they have no session
  if (isPublicRoute && !session) {
    return NextResponse.next();
  }

  // --- RBAC & REWRITES (Only runs if we have a valid session) ---

  const userRole = session?.role as HotelRole;
  const expectedPath = roleToPath[userRole];

  // Handle Rewrite Logic
  if (pathname.startsWith(PREFIX_PATH)) {
    const actualPath = pathname.slice(PREFIX_PATH.length) || "/";
    const query = request.nextUrl.search;
    const hashed = request.nextUrl.hash;

    // Special case for shared routes that don't need role prefix
    let rewritePath;
    if (actualPath.startsWith("/rentals")) {
      rewritePath = actualPath;
    } else {
      rewritePath = expectedPath + actualPath;
    }

    const rewriteUrl = new URL(rewritePath, request.nextUrl);
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
  if (newTokens) {
    console.log("attaching new tokens", newTokens);
    await createSession(newTokens.accessToken, newTokens.refreshToken);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
