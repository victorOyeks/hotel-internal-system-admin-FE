"use client";

import type { LucideIcon } from "lucide-react";
import { MoreHorizontalIcon, ShieldCheckIcon } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@hospio/ui/primitives/dropdown-menu";
import { cn } from "@hospio/ui/utils";

export type RowAction = {
	label: string;
	icon?: LucideIcon;
	onClick: () => void;
	tone?: "default" | "danger";
	/** Manager-only actions carry the shield mark and are logged. */
	managerOnly?: boolean;
	separatorBefore?: boolean;
	disabled?: boolean;
};

/** The "⋯" menu on a table row. Stops the click from opening the row. */
export function RowActions({ actions, align = "end" }: { actions: RowAction[]; align?: "end" | "start" }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button type="button" onClick={(e) => e.stopPropagation()} className="flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-subtle hover:text-ink" aria-label="Row actions">
					<MoreHorizontalIcon className="size-[18px]" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align={align} className="w-56 rounded-xl p-1" onClick={(e) => e.stopPropagation()}>
				{actions.map((a, i) => (
					<div key={a.label}>
						{a.separatorBefore && i > 0 && <DropdownMenuSeparator />}
						<DropdownMenuItem
							disabled={a.disabled}
							onSelect={() => a.onClick()}
							className={cn("rounded-lg text-[13px]", a.tone === "danger" && "text-danger focus:bg-danger-soft focus:text-danger")}
						>
							{a.icon && <a.icon className="size-4" />}
							<span className="flex-1">{a.label}</span>
							{a.managerOnly && <ShieldCheckIcon className="size-[14px] text-ink-3" />}
						</DropdownMenuItem>
					</div>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** The shield that marks a manager-only, logged action. */
export function ManagerMark({ className }: { className?: string }) {
	return (
		<span className={cn("inline-flex items-center gap-1 rounded-pill bg-subtle px-[6px] py-[2px] text-[10px] font-semibold text-ink-2", className)} title="Manager only · logged">
			<ShieldCheckIcon className="size-3" /> Manager
		</span>
	);
}
