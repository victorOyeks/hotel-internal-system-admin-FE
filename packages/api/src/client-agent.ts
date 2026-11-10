import "server-only";

import { headers } from "next/headers";

/**
 * The browser's user agent as `X-Client-Agent`, for the calls that open a session (sign-in, 2-step, accept-invite, sign-up,
 * PIN unlock): identity calls the session "Chrome on macOS" in My profile → Where you're signed in (docs/profile.md).
 * The calls go from this server, so without it every session would read as the server's own agent.
 */
export async function clientAgentHeaders(): Promise<Record<string, string>> {
	try {
		const ua = (await headers()).get("user-agent");
		return ua ? { "X-Client-Agent": ua.slice(0, 400) } : {};
	} catch {
		return {};
	}
}
