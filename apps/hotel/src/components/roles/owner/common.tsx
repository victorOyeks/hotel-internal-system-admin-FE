"use client";

import { DownloadIcon, FileTextIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { ChoiceCards, SelectField, ToggleField } from "@hospio/ui/shared/field";
import { nairaShort } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
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

/** "Download report" modal shared by every owner screen: pick a format, a period, and send. */
export function DownloadModal({
	open,
	onOpenChange,
	title = "Download report",
	what,
	periods = ["This month", "Last month", "This quarter", "Year to date"],
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	title?: string;
	what: string;
	periods?: string[];
}) {
	const [format, setFormat] = useState<"PDF" | "EXCEL" | "CSV">("PDF");
	const [period, setPeriod] = useState(periods[0]);
	const [email, setEmail] = useState(false);
	const pending = false;
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			subtitle={what}
			icon={FileTextIcon}
			size="confirm"
			footerInfo="Not connected yet · nothing is downloaded or emailed"
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
						disabled={pending}
						onClick={() => {
							toast.info(
								`Downloading ${what} is not connected yet · nothing was downloaded`,
							);
							onOpenChange(false);
						}}
					>
						<DownloadIcon className="size-4" /> Download{" "}
						{format === "EXCEL" ? "Excel" : format}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<ChoiceCards
					label="Format"
					value={format}
					onChange={setFormat}
					columns={3}
					options={[
						{ value: "PDF", label: "PDF", hint: "To read or print" },
						{ value: "EXCEL", label: "Excel", hint: "To work with" },
						{ value: "CSV", label: "CSV", hint: "For other tools" },
					]}
				/>
				<SelectField
					label="Period"
					value={period}
					onChange={setPeriod}
					options={periods}
				/>
				<ToggleField
					label="Email me a copy"
					hint="godwin@royalsuites.ng"
					checked={email}
					onChange={setEmail}
				/>
			</div>
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
