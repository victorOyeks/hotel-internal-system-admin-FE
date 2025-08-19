import { type NextRequest, NextResponse } from "next/server";
import { paths } from "@/lib/shared";
import { $fetch, type UserInfoResponse } from "@/lib/fetch";
import { tokenKey } from "./lib/server-fns";
import { fromPromise } from "neverthrow";

const TOKEN_KEY = tokenKey;

// Define protected routes explicitly for clarity.
// This assumes `paths` contains role-based routes like: { owner: '/owner', admin: '/admin' }
const protectedPages = Object.values(paths);

export const config = {
  // Run middleware on all paths except for static assets and API routes.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const c = request.cookies.get(TOKEN_KEY);
  const cookieData = c
    ? (JSON.parse(c.value) as { token: string; user: UserInfoResponse })
    : null;

  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) {
    if (!cookieData) {
      // User has no token and is on the auth page, let them proceed.
      // This is the key fix to prevent the redirect loop.
      return NextResponse.next();
    }

    // Check if the token is valid.
    const response = await fromPromise(
      $fetch("@get/api/users/me", {
        auth: { type: "Bearer", token: cookieData.token },
      }),
      (error) => new Error("Failed to validate token", { cause: error })
    );

    if (response.isErr() || response.value.error) {
      const res = NextResponse.next();
      res.cookies.delete(TOKEN_KEY);
      return res;
    }

    const userRole = cookieData.user.role;
    const dashboardUrl = paths[userRole] || "/"; // Fallback to home
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  if (!cookieData) {
    // No cookieData, redirect to the login page with a 'from' parameter.
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!cookieData.token) {
    const loginUrl = new URL("/auth", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(TOKEN_KEY);
    return response;
  }

  const isCorrectlyRouted = protectedPages.some((p) => pathname.startsWith(p));
  if (!isCorrectlyRouted) {
    const userRole = cookieData.user.role;
    const correctPath = paths[userRole];
    return NextResponse.rewrite(
      new URL(`${correctPath}${pathname}`, request.url)
    );
  }

  return NextResponse.next();
}
