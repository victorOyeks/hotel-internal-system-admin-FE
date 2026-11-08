import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({ title, hint, className, children }: { title: string; hint?: string; className?: string; children?: ReactNode }) {
	return (
		<div className={cn("flex flex-col items-center justify-center gap-1 rounded-[10px] bg-subtle/60 px-4 py-8 text-center", className)}>
			<p className="text-sm font-semibold text-ink">{title}</p>
			{hint && <p className="max-w-xs text-xs text-ink-3">{hint}</p>}
			{children}
		</div>
	);
}
