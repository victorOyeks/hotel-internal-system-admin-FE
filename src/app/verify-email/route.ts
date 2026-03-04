import { env } from "@/env";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const appUrl = new URL(env.NEXT_PUBLIC_APP_URL);
	const token = request.nextUrl.searchParams.get("token");

	if (!token) {
		return Response.redirect(
			new URL("/auth?error=missing_token", appUrl),
		);
	}

	try {
		const apiUrl = new URL(
			`/api/auth/verify-email`,
			env.NEXT_PUBLIC_API_URL,
		);
		apiUrl.searchParams.set("token", token);

		const response = await fetch(apiUrl.toString(), { method: "GET" });

		if (!response.ok) {
			const body = await response.json().catch(() => ({}));
			const message = body?.message ?? "Verification failed";
			return Response.redirect(
				new URL(
					`/auth?error=${encodeURIComponent(message)}`,
					appUrl,
				),
			);
		}

		return Response.redirect(new URL("/auth?verified=true", appUrl));
	} catch {
		return Response.redirect(
			new URL("/auth?error=server_error", appUrl),
		);
	}
}
