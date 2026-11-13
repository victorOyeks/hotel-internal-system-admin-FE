"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	type BookingContext,
	bookingContext,
} from "@hospio/api/actions/booking-context";

/**
 * The booking panels' support data (rooms, room types, open folios without lines, accounts, terminals, card payments
 * still with the POS), read with a server action instead of with every render of the bookings page: a search keystroke,
 * a new page or a tab no longer re-reads it. Kept per hotel for the browser tab; read again when a panel opens and the
 * copy is older than `FRESH_MS`, and after a save (`reload`).
 */
const FRESH_MS = 20_000;
type Entry = { at: number; data: BookingContext };
const kept = new Map<string, Entry>();
const loading = new Map<string, Promise<BookingContext | null>>();

function load(key: string, hotelId?: string): Promise<BookingContext | null> {
	let pending = loading.get(key);
	if (!pending) {
		pending = bookingContext(hotelId)
			.then((r) => {
				if (!r.ok) {
					toast.error(r.error);
					return null;
				}
				kept.set(key, { at: Date.now(), data: r.data });
				return r.data;
			})
			.catch(() => null)
			.finally(() => loading.delete(key));
		loading.set(key, pending);
	}
	return pending;
}

/**
 * `key` names the hotel the copy belongs to (the sidebar's hotel, or the owner's chosen one); `hotelId` is sent only when
 * the panels act at a hotel other than the sidebar's (the owner). `enabled` false reads nothing (the owner before a
 * booking is opened). `panelOpen` going true re-reads a copy older than `FRESH_MS`.
 */
export function useBookingContext({
	key,
	hotelId,
	enabled = true,
	panelOpen = false,
}: {
	key: string;
	hotelId?: string;
	enabled?: boolean;
	panelOpen?: boolean;
}) {
	const [ctx, setCtx] = useState<BookingContext | null>(
		() => kept.get(key)?.data ?? null,
	);
	const current = useRef(key);
	current.current = key;

	const fetchNow = useCallback(() => {
		const k = key;
		void load(k, hotelId).then((d) => {
			if (d && current.current === k) setCtx(d);
		});
	}, [key, hotelId]);

	// First use for this hotel (or another hotel chosen): take what is kept, read it if there is none.
	useEffect(() => {
		if (!enabled) return;
		const entry = kept.get(key);
		setCtx(entry?.data ?? null);
		if (!entry) fetchNow();
	}, [enabled, key, fetchNow]);

	// A panel opened: make sure what it shows is recent.
	useEffect(() => {
		if (!enabled || !panelOpen) return;
		const entry = kept.get(key);
		if (!entry || Date.now() - entry.at > FRESH_MS) fetchNow();
	}, [enabled, panelOpen, key, fetchNow]);

	/** Something was saved (check-in, payment, new booking): read it again. */
	const reload = useCallback(() => {
		kept.delete(key);
		// A read already on its way may predate the save: read once more after it.
		void (loading.get(key) ?? Promise.resolve()).then(fetchNow);
	}, [key, fetchNow]);

	return { ctx, reload };
}
