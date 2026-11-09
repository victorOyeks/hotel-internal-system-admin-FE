import { DEMO } from "@hospio/api/demo/mode";

/**
 * Which backend domains the screens read from and write to for real. Everything else still comes from
 * the fixtures, so the backend can be wired in one module at a time.
 *
 * NEXT_PUBLIC_LIVE_DOMAINS is a comma-separated list, e.g. "property,reservation". When demo data is
 * off altogether (NEXT_PUBLIC_DEMO_MODE=false) every domain is live.
 */
export type LiveDomain =
	| "property"
	| "reservation"
	| "folio"
	| "payment"
	| "tenant"
	| "identity"
	| "hotel-config"
	| "housekeeping"
	| "maintenance"
	| "inventory"
	| "finance"
	| "messaging"
	| "platform"
	| "fnb";

const configured = new Set(
	(process.env.NEXT_PUBLIC_LIVE_DOMAINS ?? "")
		.split(",")
		.map((d) => d.trim())
		.filter(Boolean),
);

export function live(domain: LiveDomain): boolean {
	return !DEMO || configured.has(domain);
}

/** True once any backend domain is wired (staging, production): actions without a route must not pretend. */
export function anyLive(): boolean {
	return !DEMO || configured.size > 0;
}
