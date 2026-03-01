import { env } from "@/env";
import { verifySession } from "@/lib/dal";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const res = await verifySession();
	const nextUrl = new URL(request.nextUrl);
	const appUrl = new URL(env.NEXT_PUBLIC_APP_URL);

	// compare the origins of the request and the app URL
	if (nextUrl.origin !== appUrl.origin) {
		console.warn(
			"Origin mismatch in /dashboard route",
			nextUrl.origin,
			appUrl.origin,
		);
	}

	console.log(
		res,
		"Session verified in /dashboard route",
		appUrl.toString()
	);
	return Response.redirect(new URL("/dashboard", appUrl));
}
