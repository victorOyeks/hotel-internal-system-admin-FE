import { env } from "@/env";
import { $fetch } from "@/lib/fetch";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const token = request.nextUrl.searchParams.get("token");

	if (!token) {
		return Response.redirect(
			new URL("/auth?error=missing_token", env.NEXT_PUBLIC_APP_URL),
		);
	}

	try {
		const { error } = await $fetch("@get/api/auth/verify-email", {
			query: { token },
		});

		if (error) {
			const message = error.message ?? "Verification failed";
			return Response.redirect(
				new URL(
					`/auth?error=${encodeURIComponent(message)}`,
					env.NEXT_PUBLIC_APP_URL,
				),
			);
		}

		return Response.redirect(new URL("/auth?verified=true", env.NEXT_PUBLIC_APP_URL));
	} catch {
		return Response.redirect(
			new URL("/auth?error=server_error", env.NEXT_PUBLIC_APP_URL),
		);
	}
}
