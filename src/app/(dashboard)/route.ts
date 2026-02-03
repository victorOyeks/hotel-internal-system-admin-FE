import { verifySession } from "@/lib/dal";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const res = await verifySession();
	console.log(
		res,
		"Session verified in /dashboard route",
		request.nextUrl.toString(),
	);
	return Response.redirect(new URL("/dashboard", request.nextUrl));
}
