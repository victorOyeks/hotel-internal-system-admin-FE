"use client";

import { BuildingIcon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useTransition } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Hotel } from "@/lib/api/schema";
import { selectHotel } from "@/lib/actions";
import { cn } from "@/lib/utils";

/** The branch card under the logo: which hotel the manager is working in, and a switch between branches. */
export function BranchSwitcher({ hotels, active }: { hotels: Hotel[]; active: Hotel | null }) {
	const [pending, startTransition] = useTransition();
	if (!active) return null;
	const index = Math.max(0, hotels.findIndex((h) => h.id === active.id)) + 1;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					disabled={pending}
					className={cn(
						"w-full rounded-xl border border-white/[0.18] bg-white/10 p-[10px] text-left text-white",
						"group-data-[collapsible=icon]:hidden transition-colors hover:bg-white/[0.14]",
					)}
				>
					<div className="flex items-center gap-[10px]">
						<span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.16]">
							<BuildingIcon className="size-4" />
						</span>
						<span className="flex min-w-0 flex-1 flex-col">
							<span className="text-[9px] font-semibold uppercase tracking-wide text-white/60">Branch</span>
							<span className="truncate text-sm font-bold">{active.name}</span>
						</span>
						<ChevronsUpDownIcon className="size-[14px] text-white/70" />
					</div>
					<p className="mt-2 text-[10px] font-medium text-white/60">
						{index} of {hotels.length} {hotels.length === 1 ? "branch" : "branches"}
					</p>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[220px] rounded-xl">
				<DropdownMenuLabel className="text-xs text-ink-3">Switch branch</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{hotels.map((hotel) => (
					<DropdownMenuItem
						key={hotel.id}
						className="gap-2 rounded-lg"
						onSelect={() => startTransition(() => selectHotel(hotel.id))}
					>
						<span className="flex-1 truncate">{hotel.name}</span>
						{hotel.id === active.id && <CheckIcon className="size-4 text-brand" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
