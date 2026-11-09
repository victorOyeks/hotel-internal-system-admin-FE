"use client";

import { atom, createStore } from "jotai";

/**
 * The queue behind <DeliveryNotice />: every message the platform would have sent (email, SMS,
 * WhatsApp) while no provider is connected on staging. Pushed from server-action results that carry
 * `deliveries: Delivery[]`, shown top-centre until the person closes it.
 *
 * The store is its own: `pushDeliveries` is a plain function, so it must not depend on whichever
 * <Provider> the page happens to render under.
 */

export type DeliveryLike = {
	channel: string;
	to: string | null;
	subject?: string | null;
	text: string;
	kind?: string | null;
	ref?: string | null;
};

export type DeliveryBatch = {
	id: string;
	title: string;
	deliveries: DeliveryLike[];
	at: string;
};

export const deliveriesStore = createStore();
export const deliveriesAtom = atom<DeliveryBatch[]>([]);

/** Whether the staging notice is shown at all (NEXT_PUBLIC_SHOW_DELIVERIES=false hides it). */
export const SHOW_DELIVERIES =
	process.env.NEXT_PUBLIC_SHOW_DELIVERIES !== "false";

export function pushDeliveries(
	deliveries: DeliveryLike[] | null | undefined,
	title = "What we would have sent",
) {
	if (!SHOW_DELIVERIES || !deliveries || deliveries.length === 0) return;
	const batch: DeliveryBatch = {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		title,
		deliveries,
		at: new Date().toISOString(),
	};
	deliveriesStore.set(deliveriesAtom, (q) => [...q, batch]);
}

export function dismissDeliveries(id: string) {
	deliveriesStore.set(deliveriesAtom, (q) => q.filter((b) => b.id !== id));
}

export function clearDeliveries() {
	deliveriesStore.set(deliveriesAtom, []);
}

type ResultLike = { ok: true; data: unknown } | { ok: false; error: string };

function deliveriesOf(data: unknown): DeliveryLike[] | undefined {
	if (data && typeof data === "object" && "deliveries" in data) {
		const d = (data as { deliveries?: unknown }).deliveries;
		if (Array.isArray(d)) return d as DeliveryLike[];
	}
	return undefined;
}

/**
 * Wrap a server action's result (or its promise): when it succeeded and carries `deliveries`, they are
 * queued for the notice; the result is returned unchanged so it drops into `useAction`:
 *
 *   run(() => withDeliveries(createUser(input), "Invite for Ada"), "Admin added", after)
 */
export async function withDeliveries<R extends ResultLike>(
	result: R | Promise<R>,
	title?: string,
): Promise<R> {
	const r = await result;
	if (r.ok) pushDeliveries(deliveriesOf(r.data), title);
	return r;
}

/** The same from inside an `after(data)` callback, when the result itself is out of reach. */
export function showDeliveries(data: unknown, title?: string) {
	pushDeliveries(deliveriesOf(data), title);
}
