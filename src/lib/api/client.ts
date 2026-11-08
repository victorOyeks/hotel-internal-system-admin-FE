import { env } from "@/env";
import { createFetch } from "@better-fetch/fetch";
import { ApiError, schema } from "./schema";

/**
 * One client for every service behind the gateway. Pass `auth` and the `X-Hotel-Id` header on
 * each call; on the server use `withSession()` from `./server` to fill both from the cookies.
 */
export const api = createFetch({
	baseURL: env.NEXT_PUBLIC_API_URL,
	schema,
	errorSchema: ApiError,
	timeout: 30_000,
	retry: {
		type: "linear",
		attempts: 2,
		delay: 500,
		shouldRetry: (response) => !response || response.status >= 502,
	},
});

export type ApiResult<T> = { data: T; error: null } | { data: null; error: { status: number; message?: string } };

/** A readable message for a failed call. */
export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
	if (error && typeof error === "object") {
		const e = error as { message?: unknown; status?: number };
		if (typeof e.message === "string" && e.message.trim()) return e.message;
		if (e.status === 0) return "Can't reach the server. Check your connection";
	}
	return fallback;
}
