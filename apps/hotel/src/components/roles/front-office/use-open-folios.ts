"use client";

import { useEffect, useState } from "react";
import { openFolios } from "@hospio/api/actions/booking-context";
import type { FolioSummary } from "@hospio/api/data/types";

/**
 * The open folios (without lines) for a take-payment picker, read when the panel opens instead of with every render of
 * a payments list (each search keystroke or page used to re-read every open folio with every line).
 */
export function useOpenFolios(open: boolean): FolioSummary[] {
	const [folios, setFolios] = useState<FolioSummary[]>([]);
	useEffect(() => {
		if (!open) return;
		let live = true;
		void openFolios()
			.then((r) => {
				if (live && r.ok) setFolios(r.data);
			})
			.catch(() => undefined);
		return () => {
			live = false;
		};
	}, [open]);
	return folios;
}
