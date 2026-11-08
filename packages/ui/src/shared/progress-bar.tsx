import { cn } from "@hospio/ui/utils";

const tones = {
	brand: "bg-brand",
	success: "bg-success",
	warning: "bg-[#dbab00]",
	danger: "bg-danger",
	info: "bg-info",
} as const;

export function ProgressBar({ value, max, tone = "brand", className }: { value: number; max: number; tone?: keyof typeof tones; className?: string }) {
	const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
	return (
		<div className={cn("h-[6px] w-full overflow-hidden rounded-[3px] bg-subtle", className)}>
			<div className={cn("h-full rounded-[3px]", tones[tone])} style={{ width: `${pct}%` }} />
		</div>
	);
}
