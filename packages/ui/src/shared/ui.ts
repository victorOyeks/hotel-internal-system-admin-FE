/**
 * Class recipes for the component library (Components page 3313:3841). Use these with <Button>,
 * <Input> and plain elements so every screen gets the same buttons, inputs and cards.
 */

export const btn = {
	primary: "h-auto rounded-control bg-brand px-4 py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90 disabled:opacity-60",
	secondary: "h-auto rounded-control border border-line bg-card px-4 py-[10px] text-[13px] font-semibold text-ink hover:bg-subtle",
	danger: "h-auto rounded-control bg-danger px-4 py-[10px] text-[13px] font-semibold text-white hover:bg-danger/90 disabled:opacity-60",
	dangerSoft: "h-auto rounded-control border border-danger/30 bg-danger-soft px-4 py-[10px] text-[13px] font-semibold text-danger hover:bg-danger-soft/70",
	ghost: "h-auto rounded-control px-3 py-[10px] text-[13px] font-semibold text-ink-2 hover:bg-subtle hover:text-ink",
	link: "h-auto p-0 text-[13px] font-semibold text-brand hover:underline",
	large: "px-5 py-3 text-sm",
	small: "px-3 py-[7px] text-xs",
	icon: "flex size-9 items-center justify-center rounded-[10px] border border-line bg-card text-ink-2 hover:bg-subtle hover:text-ink",
} as const;

export const input = "h-auto w-full rounded-control border border-line bg-card px-[14px] py-[10px] text-sm text-ink shadow-none placeholder:text-ink-3 focus-visible:border-brand focus-visible:ring-0 disabled:bg-subtle";
export const textarea = `${input} min-h-[96px] resize-y`;
export const select = "h-auto w-full rounded-control border border-line bg-card px-[14px] py-[10px] text-sm text-ink shadow-none focus:border-brand focus:ring-0 data-[placeholder]:text-ink-3";

export const card = "rounded-card border border-line bg-card";
export const tableHead = "border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3";
export const tableRow = "border-b border-line last:border-b-0 hover:bg-subtle/50";
export const cell = "px-4 py-3 text-[13px] text-ink align-middle";
