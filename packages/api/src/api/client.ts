import { env } from "@hospio/api/env";
import { createFetch } from "@better-fetch/fetch";
import { apiLogEnabled, recordApiCall } from "./debug-log";
import { ApiError, schema } from "./schema";

/** Staging API log (NEXT_PUBLIC_API_LOG=true): records each server-side call, see ./debug-log.ts. */
const loggedFetch: typeof fetch | undefined =
	typeof window === "undefined" && apiLogEnabled()
		? async (input, init) => {
				const started = Date.now();
				const method = (init?.method ?? "GET").toUpperCase();
				const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
				try {
					const res = await fetch(input, init);
					const responseText = await res.clone().text().catch(() => "");
					void recordApiCall({ method, url, body: init?.body, status: res.status, ms: Date.now() - started, responseText }).catch(() => {});
					return res;
				} catch (e) {
					void recordApiCall({ method, url, body: init?.body, status: 0, ms: Date.now() - started, responseText: String(e) }).catch(() => {});
					throw e;
				}
			}
		: undefined;

/**
 * One client for every service behind the gateway. Pass `auth` and the `X-Hotel-Id` header on
 * each call; on the server use `withSession()` from `./server` to fill both from the cookies.
 */
export const api = createFetch({
	baseURL: env.NEXT_PUBLIC_API_URL,
	schema,
	errorSchema: ApiError,
	timeout: 30_000,
	...(loggedFetch ? { customFetchImpl: loggedFetch } : {}),
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
