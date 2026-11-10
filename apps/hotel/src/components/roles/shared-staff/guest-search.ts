"use client";

import { useEffect, useState } from "react";
import { searchGuests } from "@hospio/api/actions/reservation";
import type { GuestRow } from "@hospio/api/data/types";

/**
 * Returning guests matching what was typed (name, phone or email), asked of reservation-service once typing stops: the
 * new-booking pickers no longer load every guest of the business. At most 8; empty for a blank query.
 */
export function useGuestSearch(query: string, delayMs = 250) {
	const [rows, setRows] = useState<GuestRow[]>([]);
	const [loading, setLoading] = useState(false);
	useEffect(() => {
		const q = query.trim();
		if (q.length < 2) {
			setRows([]);
			setLoading(false);
			return;
		}
		let alive = true;
		setLoading(true);
		const t = setTimeout(() => {
			searchGuests(q)
				.then((found) => {
					if (alive) setRows(found);
				})
				.catch(() => {
					if (alive) setRows([]);
				})
				.finally(() => {
					if (alive) setLoading(false);
				});
		}, delayMs);
		return () => {
			alive = false;
			clearTimeout(t);
		};
	}, [query, delayMs]);
	return { rows, loading };
}
