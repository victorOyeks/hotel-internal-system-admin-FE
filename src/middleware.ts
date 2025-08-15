import { type NextRequest, NextResponse } from "next/server";
import { paths } from "@/lib/shared";
import { $fetch } from "@/lib/fetch";
import { fromPromise } from "neverthrow";

const tokenKey = "hms.jwt.session_token";

// It's good practice to define your protected routes explicitly.
// Assuming `paths` contains routes for authenticated users like '/owner', '/admin', etc.
const protectedPages = Object.values(paths);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(tokenKey)?.value;

  const isAuthPage = pathname.startsWith("/auth");
  const isProtectedPage = protectedPages.some((p) => pathname.startsWith(p));

  if (!token) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
  }

  const response = await fromPromise($fetch("@get/api/users/me", {
    auth: { type: "Bearer", token },
    cache: "force-cache",
  }), (error) => new Error("Fetch failed", { cause: error }));

  if (!response.isOk()) {
    return NextResponse.error();
  }

  if (isProtectedPage || isAuthPage) {

    if (response.value.error) {
      const response = NextResponse.redirect(new URL("/auth", request.url));
      response.cookies.delete(tokenKey);
      return response;
    }

    const data = response.value.data

    if (isAuthPage) {
      return NextResponse.redirect(new URL(paths[data.data.role], request.url));
    }
    
    return NextResponse.next();
  }

  if (response.value.data) {
    const data = response.value.data;

    return NextResponse.rewrite(new URL(`${paths[data.data.role]}${pathname}`, request.url))
  }

  return NextResponse.next();
}