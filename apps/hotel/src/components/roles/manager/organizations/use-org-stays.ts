"use client";

import { useEffect, useState } from "react";
import { loadOrgStays } from "@hospio/api/actions/organizations";
import type { FolioRow } from "@hospio/api/data/types";

/**
 * An account's stays opened between two Lagos days, read from folio-service when asked for (an invoice's period, the
 * new invoice preview) rather than kept for the account's whole history on the page. Off while `on` is false.
 */
export function useOrgStays(
	organizationId: string,
	from: string | undefined,
	to: string | undefined,
	on = true,
) {
	const [rows, setRows] = useState<FolioRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		if (!on || !from || !to || from > to) {
			setRows([]);
			return;
		}
		let alive = true;
		setLoading(true);
		loadOrgStays(organizationId, from, to).then((r) => {
			if (!alive) return;
			setLoading(false);
			if (r.ok) {
				setRows(r.data);
				setError(null);
			} else {
				setRows([]);
				setError(r.error);
			}
		});
		return () => {
			alive = false;
		};
	}, [organizationId, from, to, on]);
	return { rows, loading, error };
}
