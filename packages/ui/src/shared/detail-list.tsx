import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@hospio/ui/primitives/avatar";
import { cn } from "@hospio/ui/utils";
import { initials } from "./format";

/** Label / value rows for details panels. */
export function DetailList({ items, columns = 1, className }: { items: { label: string; value: ReactNode }[]; columns?: 1 | 2; className?: string }) {
	return (
		<dl className={cn("grid gap-x-6 gap-y-3", columns === 2 && "grid-cols-2", className)}>
			{items.map((it) => (
				<div key={it.label} className="flex flex-col gap-[2px]">
					<dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">{it.label}</dt>
					<dd className="text-[13px] font-medium text-ink">{it.value ?? "—"}</dd>
				</div>
			))}
		</dl>
	);
}

/** Totals block: label left, value right, with an emphasised last line. */
export function TotalsList({ rows, className }: { rows: { label: string; value: ReactNode; strong?: boolean; tone?: "danger" | "success" }[]; className?: string }) {
	return (
		<div className={cn("flex flex-col gap-2 rounded-xl bg-subtle/70 px-4 py-3", className)}>
			{rows.map((r) => (
				<div key={r.label} className={cn("flex items-center justify-between text-[13px]", r.strong ? "border-t border-line pt-2 font-bold text-ink" : "text-ink-2")}>
					<span>{r.label}</span>
					<span className={cn(r.strong && "text-base", r.tone === "danger" && "text-danger", r.tone === "success" && "text-success")}>{r.value}</span>
				</div>
			))}
		</div>
	);
}

/** `photo`: a person's profile photo URL (initials when absent or while it fails to load). */
export function AvatarName({ name, secondary, size = "md", className, photo }: { name: string; secondary?: ReactNode; size?: "sm" | "md" | "lg"; className?: string; photo?: string | null }) {
	const sz = { sm: "size-7 text-[10px]", md: "size-9 text-xs", lg: "size-12 text-sm" }[size];
	return (
		<div className={cn("flex min-w-0 items-center gap-[10px]", className)}>
			<Avatar className={sz}>
				{photo && <AvatarImage src={photo} alt="" className="object-cover" />}
				<AvatarFallback className="bg-brand-soft font-semibold text-brand">{initials(name)}</AvatarFallback>
			</Avatar>
			<div className="min-w-0">
				<p className="truncate text-[13px] font-semibold text-ink">{name}</p>
				{secondary && <p className="truncate text-xs text-ink-3">{secondary}</p>}
			</div>
		</div>
	);
}

/** A timeline of updates / notes. */
export function Timeline({ items, className }: { items: { at: ReactNode; by?: string; text: ReactNode }[]; className?: string }) {
	return (
		<ol className={cn("flex flex-col", className)}>
			{items.map((it, i) => (
				<li key={i} className="relative flex gap-3 pb-4 last:pb-0">
					<span className="relative mt-[6px] flex size-2 shrink-0 rounded-full bg-brand">
						{i < items.length - 1 && <span className="absolute left-1/2 top-3 h-[calc(100%+8px)] w-px -translate-x-1/2 bg-line" />}
					</span>
					<div className="min-w-0 flex-1">
						<p className="text-[13px] text-ink">{it.text}</p>
						<p className="text-xs text-ink-3">
							{it.by && <span className="font-medium">{it.by} · </span>}
							{it.at}
						</p>
					</div>
				</li>
			))}
		</ol>
	);
}

/** Inline note card (amber by default) for warnings in panels. */
export function Note({ children, tone = "warning", className }: { children: ReactNode; tone?: "warning" | "info" | "danger" | "success"; className?: string }) {
	const cls = { warning: "bg-warning-soft text-warning", info: "bg-info-soft text-info", danger: "bg-danger-soft text-danger", success: "bg-success-soft text-success" }[tone];
	return <p className={cn("rounded-[10px] px-3 py-[10px] text-xs font-medium", cls, className)}>{children}</p>;
}
