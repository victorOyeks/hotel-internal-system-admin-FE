"use client";

import { DownloadIcon, FileTextIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { nairaShort } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { type CsvCell, csvName, downloadCsv } from "@hospio/ui/shared/csv";
import { FilterSelect } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { toast } from "sonner";
import type { OwnerHotelFinance } from "@hospio/api/demo/fixtures/owner";
import { cn } from "@hospio/ui/utils";

/** `?open=<id>` style URL state with a null-clearing setter. */
export function useParam(key: string) {
	const [value, setValue] = useQueryState(key, parseAsString);
	return [value, (v: string | null) => void setValue(v)] as const;
}

export function HotelFilter({
	hotels,
	value,
	onChange,
	all = "All hotels",
}: {
	hotels: Pick<OwnerHotelFinance, "hotelId" | "name">[];
	value: string;
	onChange: (v: string) => void;
	all?: string;
}) {
	return (
		<FilterSelect
			value={value}
			onChange={onChange}
			all={all}
			options={hotels.map((h) => ({ value: h.hotelId, label: h.name }))}
		/>
	);
}

/** Vertical bars drawn with divs — enough for a demo trend. */
export function MiniBars({
	series,
	labels,
	height = 160,
	tone = "bg-brand",
	secondary,
	secondaryTone = "bg-[#f29ab0]",
	format = nairaShort,
	highlightLast = true,
}: {
	series: number[];
	labels: string[];
	height?: number;
	tone?: string;
	secondary?: number[];
	secondaryTone?: string;
	format?: (n: number) => string;
	highlightLast?: boolean;
}) {
	const max = Math.max(...series, ...(secondary ?? []), 1);
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-end gap-2" style={{ height }}>
				{series.map((v, i) => (
					<div
						key={labels[i]}
						className="group relative flex flex-1 items-end justify-center gap-[3px]"
						title={`${labels[i]} · ${format(v)}`}
					>
						<div
							className={cn(
								"w-full max-w-[18px] rounded-t-[4px]",
								tone,
								highlightLast && i === series.length - 1
									? "opacity-100"
									: "opacity-85",
							)}
							style={{ height: `${(v / max) * 100}%` }}
						/>
						{secondary && (
							<div
								className={cn(
									"w-full max-w-[18px] rounded-t-[4px]",
									secondaryTone,
								)}
								style={{ height: `${(secondary[i] / max) * 100}%` }}
							/>
						)}
					</div>
				))}
			</div>
			<div className="flex gap-2">
				{labels.map((l, i) => (
					<span
						key={l}
						className={cn(
							"flex-1 text-center text-[10px]",
							highlightLast && i === labels.length - 1
								? "font-semibold text-ink"
								: "text-ink-3",
						)}
					>
						{l}
					</span>
				))}
			</div>
		</div>
	);
}

/**
 * "Export" on every owner screen: what is on screen (the tab, the hotel filter and the search) as a CSV file the browser
 * saves. Money is in naira without the sign so a spreadsheet can add it up. PDF and Excel files are not made.
 */
export function DownloadModal({
	open,
	onOpenChange,
	title = "Download",
	what,
	rows,
	load,
	total,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	title?: string;
	what: string;
	/** Header first, then one array per row. Called when the person downloads. */
	rows?: () => CsvCell[][];
	/**
	 * A server-paged list: every row over the whole filtered range (all pages), read when the person downloads.
	 * `total` is the list's count, shown before downloading. Header first.
	 */
	load?: () => Promise<
		{ ok: true; rows: CsvCell[][] } | { ok: false; error: string }
	>;
	total?: number;
}) {
	const [busy, setBusy] = useState(false);
	const count = load
		? (total ?? 0)
		: open && rows
			? Math.max(0, rows().length - 1)
			: 0;
	const download = async () => {
		if (!load) {
			if (rows) downloadCsv(csvName(what), rows());
			toast.success(`${what} downloaded`);
			onOpenChange(false);
			return;
		}
		setBusy(true);
		try {
			const r = await load();
			if (!r.ok) {
				toast.error(r.error);
				return;
			}
			downloadCsv(csvName(what), r.rows);
			toast.success(
				`${what} downloaded · ${Math.max(0, r.rows.length - 1).toLocaleString("en-NG")} rows`,
			);
			onOpenChange(false);
		} finally {
			setBusy(false);
		}
	};
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			subtitle={what}
			icon={FileTextIcon}
			size="confirm"
			footerInfo="A CSV file opens in Excel, Numbers or Google Sheets"
			footer={
				<>
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={count === 0 || busy}
						onClick={() => void download()}
					>
						<DownloadIcon className="size-4" />{" "}
						{busy ? "Preparing…" : "Download CSV"}
					</Button>
				</>
			}
		>
			<p className="text-[13px] text-ink-2">
				{count === 0
					? "There is nothing to download with these filters."
					: load
						? `${count === 1 ? "1 row" : `${count.toLocaleString("en-NG")} rows`}: every page of the list with these filters (tab, hotel and search).`
						: `${count === 1 ? "1 row" : `${count.toLocaleString("en-NG")} rows`}, as you see them on screen (tab, hotel and search).`}
			</p>
		</Modal>
	);
}

export function DeltaPill({
	value,
	suffix = "%",
	invert = false,
}: {
	value: number;
	suffix?: string;
	invert?: boolean;
}) {
	const good = invert ? value <= 0 : value >= 0;
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-pill px-[6px] py-[2px] text-[11px] font-semibold",
				good ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
			)}
		>
			{value >= 0 ? "▲" : "▼"} {Math.abs(value)}
			{suffix}
		</span>
	);
}

export const hotelStatusTone = {
	ACTIVE: "success",
	PAUSED: "warning",
	CLOSED: "grey",
	RENOVATION: "warning",
	INACTIVE: "grey",
} as const;
export const hotelStatusLabel = {
	ACTIVE: "Active",
	PAUSED: "Paused",
	CLOSED: "Closed",
	RENOVATION: "Renovation",
	INACTIVE: "Inactive",
} as const;
