"use client";

import { MinusIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { ChoiceCards, TextareaField } from "@hospio/ui/shared/field";
import { Modal } from "@hospio/ui/shared/modal";
import { naira } from "@hospio/ui/shared/format";
import type { MenuItemRow } from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { BigButton, Stepper } from "./tablet";

export type CartLine = { key: string; item: MenuItemRow; qty: number; option?: string; note?: string };

export const cartTotal = (lines: CartLine[]) => lines.reduce((s, l) => s + l.item.price * l.qty, 0);

/**
 * The menu picker inside Kitchen "New order" and Bar "New sale": category pills, a grid of items,
 * an "item with choices" modal (Figma 3253:11586 / 3262:12174) and the running cart.
 */
export function MenuPicker({ menu, lines, onChange }: { menu: MenuItemRow[]; lines: CartLine[]; onChange: (lines: CartLine[]) => void }) {
	const categories = useMemo(() => Array.from(new Set(menu.map((m) => m.category))), [menu]);
	const [category, setCategory] = useState(categories[0] ?? "");
	const [q, setQ] = useState("");
	const [choosing, setChoosing] = useState<MenuItemRow | null>(null);
	const [option, setOption] = useState("");
	const [note, setNote] = useState("");

	const items = menu.filter((m) => (q ? m.name.toLowerCase().includes(q.toLowerCase()) : m.category === category));

	const add = (item: MenuItemRow, opt?: string, n?: string) => {
		const key = `${item.id}:${opt ?? ""}:${n ?? ""}`;
		const existing = lines.find((l) => l.key === key);
		onChange(existing ? lines.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l)) : [...lines, { key, item, qty: 1, option: opt, note: n }]);
	};
	const setQty = (key: string, qty: number) => onChange(qty <= 0 ? lines.filter((l) => l.key !== key) : lines.map((l) => (l.key === key ? { ...l, qty } : l)));
	const qtyOf = (item: MenuItemRow) => lines.filter((l) => l.item.id === item.id).reduce((s, l) => s + l.qty, 0);

	return (
		<div className="flex flex-col gap-4">
			<label className="flex h-11 items-center gap-2 rounded-control border border-line bg-card px-3">
				<SearchIcon className="size-4 text-ink-3" />
				<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the menu…" className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3" />
			</label>
			{!q && (
				<div className="flex flex-wrap gap-2">
					{categories.map((c) => (
						<button key={c} type="button" onClick={() => setCategory(c)} className={cn("rounded-pill px-4 py-2 text-[13px] font-semibold", category === c ? "bg-brand text-white" : "bg-subtle text-ink-2 hover:text-ink")}>
							{c}
						</button>
					))}
				</div>
			)}
			<div className="grid grid-cols-2 gap-2">
				{items.map((item) => {
					const n = qtyOf(item);
					return (
						<button
							key={item.id}
							type="button"
							disabled={!item.available}
							onClick={() => {
								if (item.options?.length) {
									setChoosing(item);
									setOption(item.options[0]);
									setNote("");
								} else add(item);
							}}
							className={cn("flex min-h-[72px] items-center gap-3 rounded-control border px-4 py-3 text-left disabled:opacity-50", n > 0 ? "border-brand bg-brand-soft/30" : "border-line bg-card hover:bg-subtle")}
						>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-[15px] font-semibold text-ink">{item.name}</span>
								<span className="block text-[13px] text-ink-3">
									{item.available ? naira(item.price) : "Sold out"}
									{item.options?.length ? " · choices" : ""}
								</span>
							</span>
							{n > 0 ? <span className="flex size-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{n}</span> : <PlusIcon className="size-5 text-ink-3" />}
						</button>
					);
				})}
			</div>

			{lines.length > 0 && (
				<div className="flex flex-col gap-2 rounded-card border border-line bg-subtle/60 p-3">
					{lines.map((l) => (
						<div key={l.key} className="flex items-center gap-3 rounded-control bg-card px-3 py-2">
							<span className="min-w-0 flex-1">
								<span className="block text-[15px] font-semibold text-ink">{l.item.name}</span>
								<span className="block text-xs text-ink-3">
									{[l.option, l.note].filter(Boolean).join(" · ") || naira(l.item.price)}
								</span>
							</span>
							<span className="text-[15px] font-semibold text-ink">{naira(l.item.price * l.qty)}</span>
							<span className="inline-flex items-center rounded-control border border-line">
								<button type="button" onClick={() => setQty(l.key, l.qty - 1)} className="flex size-9 items-center justify-center text-ink-2 hover:bg-subtle" aria-label="Less">
									<MinusIcon className="size-4" />
								</button>
								<span className="w-7 text-center text-[15px] font-semibold">{l.qty}</span>
								<button type="button" onClick={() => setQty(l.key, l.qty + 1)} className="flex size-9 items-center justify-center text-ink-2 hover:bg-subtle" aria-label="More">
									<PlusIcon className="size-4" />
								</button>
							</span>
						</div>
					))}
					<div className="flex items-center justify-between px-1 pt-1 text-[15px] font-bold text-ink">
						<span>Total</span>
						<span>{naira(cartTotal(lines))}</span>
					</div>
				</div>
			)}

			<Modal open={!!choosing} onOpenChange={(o) => !o && setChoosing(null)} title={choosing?.name ?? ""} subtitle={choosing ? `${naira(choosing.price)} · choose how the guest wants it` : undefined} size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setChoosing(null)}>Cancel</BigButton>
						<BigButton onClick={() => { if (choosing) add(choosing, option, note || undefined); setChoosing(null); }}>Add to order</BigButton>
					</>
				}
			>
				{choosing && (
					<div className="flex flex-col gap-4">
						<ChoiceCards label="Choice" value={option} onChange={setOption} options={(choosing.options ?? []).map((o) => ({ value: o, label: o }))} columns={2} />
						<TextareaField label="Note for the kitchen (optional)" value={note} onChange={setNote} placeholder="e.g. no pepper, extra plantain" rows={2} />
					</div>
				)}
			</Modal>
		</div>
	);
}

export { Stepper };
