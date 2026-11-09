import { createHash } from "node:crypto";

/**
 * Staging API log: every backend call made through `api()` (server components and server actions, which
 * the browser's Network tab cannot see) is kept in memory per session so it can be read from the app.
 * Only active when NEXT_PUBLIC_API_LOG=true. Entries live 2 hours, 200 per session; secrets are masked.
 */
export type ApiLogEntry = {
	at: string;
	method: string;
	path: string;
	status: number;
	ms: number;
	request: unknown;
	response: unknown;
};

const MAX = 200;
const TTL_MS = 2 * 60 * 60 * 1000;
const BODY_LIMIT = 20 * 1024;
const SECRET =
	/^(password|newPassword|currentPassword|pin|token|refreshToken|accessToken|temporaryPassword|inviteToken|cardNumber|cvv|otp|code)$/i;

export const apiLogEnabled = () => process.env.NEXT_PUBLIC_API_LOG === "true";

type Store = Map<string, { entries: ApiLogEntry[]; touched: number }>;
const g = globalThis as unknown as { __apiLog?: Store };
g.__apiLog ??= new Map();
const store: Store = g.__apiLog;

function mask(value: unknown, depth = 0): unknown {
	if (depth > 8 || value === null || typeof value !== "object") return value;
	if (Array.isArray(value)) return value.map((v) => mask(v, depth + 1));
	return Object.fromEntries(
		Object.entries(value).map(([k, v]) => [
			k,
			SECRET.test(k) ? "***" : mask(v, depth + 1),
		]),
	);
}

function parse(text: string | null | undefined): unknown {
	if (!text) return null;
	try {
		return mask(JSON.parse(text));
	} catch {
		return text.length > BODY_LIMIT ? `${text.slice(0, BODY_LIMIT)}…` : text;
	}
}

function truncate(value: unknown): unknown {
	const text = JSON.stringify(value);
	if (text === undefined || text.length <= BODY_LIMIT) return value;
	return `${text.slice(0, BODY_LIMIT)}… (truncated, ${text.length} chars)`;
}

async function sessionKey(): Promise<string | null> {
	try {
		const { cookies } = await import("next/headers");
		const token = (await cookies()).get("hms.session")?.value;
		return createHash("sha256")
			.update(token ?? "anonymous")
			.digest("hex")
			.slice(0, 24);
	} catch {
		return null; // no request scope
	}
}

function sweep(now: number) {
	for (const [k, v] of store) if (now - v.touched > TTL_MS) store.delete(k);
}

export async function recordApiCall(call: {
	method: string;
	url: string;
	body?: unknown;
	status: number;
	ms: number;
	responseText?: string;
}) {
	if (!apiLogEnabled()) return;
	const key = await sessionKey();
	if (!key) return;
	const now = Date.now();
	sweep(now);
	let path = call.url;
	try {
		const u = new URL(call.url);
		path = u.pathname + u.search;
	} catch {}
	const bucket = store.get(key) ?? { entries: [], touched: now };
	bucket.touched = now;
	bucket.entries.push({
		at: new Date(now).toISOString(),
		method: call.method,
		path,
		status: call.status,
		ms: call.ms,
		request: truncate(typeof call.body === "string" ? parse(call.body) : null),
		response: truncate(parse(call.responseText)),
	});
	if (bucket.entries.length > MAX)
		bucket.entries.splice(0, bucket.entries.length - MAX);
	store.set(key, bucket);
}

/** GET handler body: this session's entries, newest first. */
export async function readApiLog(
	since?: string | null,
): Promise<ApiLogEntry[] | null> {
	if (!apiLogEnabled()) return null;
	const key = await sessionKey();
	const bucket = key ? store.get(key) : undefined;
	if (!bucket) return [];
	const t = since ? Date.parse(since) : Number.NaN;
	return bucket.entries
		.filter((e) => Number.isNaN(t) || Date.parse(e.at) > t)
		.reverse();
}

export async function clearApiLog(): Promise<boolean> {
	if (!apiLogEnabled()) return false;
	const key = await sessionKey();
	if (key) store.delete(key);
	return true;
}

const json = (body: unknown, status = 200) =>
	Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Shared route handlers for each app's api/debug/calls route. */
export async function debugCallsGET(req: Request) {
	const entries = await readApiLog(new URL(req.url).searchParams.get("since"));
	return entries ? json(entries) : json({ message: "Not found" }, 404);
}
export async function debugCallsDELETE() {
	return (await clearApiLog())
		? json({ ok: true })
		: json({ message: "Not found" }, 404);
}
