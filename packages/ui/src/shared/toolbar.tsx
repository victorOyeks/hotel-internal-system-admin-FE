"use client";

import { DownloadIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@hospio/ui/primitives/select";
import { cn } from "@hospio/ui/utils";
import { btn } from "./ui";

/** The row between the page header and the list: tabs or search on the left, filters and actions on the right. */
export function Toolbar({
	left,
	right,
	className,
}: {
	left?: ReactNode;
	right?: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center justify-between gap-3",
				className,
			)}
		>
			<div className="flex flex-wrap items-center gap-2">{left}</div>
			<div className="flex flex-wrap items-center gap-2">{right}</div>
		</div>
	);
}

export function SearchBox({
	value,
	onChange,
	placeholder = "Search…",
	className,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	className?: string;
}) {
	return (
		<label
			className={cn(
				"flex h-[38px] w-[280px] items-center gap-2 rounded-control border border-line bg-card px-3",
				className,
			)}
		>
			<SearchIcon className="size-4 text-ink-3" />
			<input
				type="search"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3"
			/>
		</label>
	);
}

/** A compact filter dropdown ("All rooms", "Deluxe"…). `all` is the label for the empty choice. */
export function FilterSelect({
	value,
	onChange,
	options,
	all,
	className,
}: {
	value: string;
	onChange: (v: string) => void;
	options: { value: string; label: string }[];
	all: string;
	className?: string;
}) {
	return (
		<Select
			value={value || "__all"}
			onValueChange={(v) => onChange(v === "__all" ? "" : v)}
		>
			<SelectTrigger
				className={cn(
					"h-[38px] w-auto min-w-[140px] gap-2 rounded-control border-line bg-card text-[13px] font-medium text-ink shadow-none focus:ring-0",
					className,
				)}
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent className="rounded-xl">
				<SelectItem value="__all">{all}</SelectItem>
				{options.map((o) => (
					<SelectItem key={o.value} value={o.value}>
						{o.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

export function FilterButton({
	onClick,
	count = 0,
}: {
	onClick?: () => void;
	count?: number;
}) {
	return (
		<button
			type="button"
			// No export behind it yet: say so rather than doing nothing.
			onClick={
				onClick ??
				(() =>
					toast.info("Export is not connected yet · nothing was downloaded"))
			}
			className={cn(btn.secondary, "flex items-center gap-2 py-[9px]")}
		>
			<SlidersHorizontalIcon className="size-4" /> Filters
			{count > 0 && (
				<span className="rounded-pill bg-brand px-[6px] text-[10px] text-white">
					{count}
				</span>
			)}
		</button>
	);
}

/** Without `onClick` there is no export behind it yet: shown disabled with a "Not connected yet" tooltip. */
export function ExportButton({
	onClick,
	label = "Export",
}: {
	onClick?: () => void;
	label?: string;
}) {
	const connected = !!onClick;
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={!connected}
			title={connected ? undefined : "Export is not connected yet"}
			aria-label={connected ? undefined : `${label} · not connected yet`}
			className={cn(
				btn.secondary,
				"flex items-center gap-2 py-[9px]",
				!connected && "cursor-not-allowed opacity-50",
			)}
		>
			<DownloadIcon className="size-4" /> {label}
		</button>
	);
}
