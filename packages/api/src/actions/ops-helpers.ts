import { revalidatePath } from "next/cache";
import type { Delivery } from "@hospio/api/api/routes-admin";

/**
 * Shared by actions/{workforce,finance,housekeeping,approvals}.ts. Not a "use server" module: plain
 * helpers the action files call on the server.
 */

/** The operating day touches most screens (a till close moves the dashboard, finance and the audit), so refresh them all. */
export function revalidateOps() {
	revalidatePath("/", "layout");
}

/** What a call answered as `deliveries`: on the envelope or on the saved record. */
export function deliveriesOf(res: {
	deliveries?: Delivery[] | null;
	data?: unknown;
}): Delivery[] | null {
	if (res.deliveries?.length) return res.deliveries;
	const inner =
		res.data && typeof res.data === "object"
			? (res.data as { deliveries?: Delivery[] | null }).deliveries
			: null;
	return inner?.length ? inner : null;
}

/** A result's data plus the messages the platform would have sent, for `withDeliveries`. */
export type WithDeliveries<T> = T & { deliveries?: Delivery[] | null };
