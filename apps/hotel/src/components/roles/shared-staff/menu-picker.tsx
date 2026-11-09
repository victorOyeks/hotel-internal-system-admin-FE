"use client";

import { MinusIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { TextareaField } from "@hospio/ui/shared/field";
import { Modal } from "@hospio/ui/shared/modal";
import { naira } from "@hospio/ui/shared/format";
import type {
	CategoryRow,
	MenuItemRow,
	OptionGroup,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { BigButton, Stepper } from "./tablet";

/** `option` is what the guest chose as text; `extra` is what the choices add to one portion. */
export type CartLine = {
	key: string;
	item: MenuItemRow;
	qty: number;
	option?: string;
	note?: string;
	extra?: number;
};

/** A menu item's choice groups, from the structured ones or from the flat list of names. */
export const groupsOf = (item: MenuItemRow): OptionGroup[] =>
	item.optionGroups?.length
		? item.optionGroups
		: item.options?.length
			? [
					{
						group: "Choice",
						choices: item.options.map((name) => ({ name, priceDelta: 0 })),
						required: true,
						multiple: false,
					},
				]
			: [];

/** The price of one portion with the choices and any happy hour discount (the service applies the same discount per line). */
export const unitPrice = (l: CartLine, discountPct = 0) =>
	Math.round(((l.item.price + (l.extra ?? 0)) * (100 - discountPct)) / 100);

export const cartTotal = (lines: CartLine[], discountPct = 0) =>
	lines.reduce((s, l) => s + unitPrice(l, discountPct) * l.qty, 0);

/**
 * The menu picker inside Kitchen "New order" and Bar "New sale": category pills, a grid of items,
 * an "item with choices" modal (Figma 3253:11586 / 3262:12174) and the running cart. Choices come in
 * groups (required or optional, one or several, with a price difference); a happy hour discount, when
 * one is on, shows on every price and in the cart.
 */
export function MenuPicker({
	menu,
	lines,
	onChange,
	categories,
	discountPct = 0,
}: {
	menu: MenuItemRow[];
	lines: CartLine[];
	onChange: (lines: CartLine[]) => void;
	categories?: CategoryRow[];
	discountPct?: number;
}) {
	const live = useMemo(() => menu.filter((m) => m.active !== false), [menu]);
	const names = useMemo(() => {
		const used = Array.from(new Set(live.map((m) => m.category)));
		if (!categories?.length) return used;
		const ordered = categories
			.filter((c) => c.active && used.includes(c.name))
			.map((c) => c.name);
		return [...ordered, ...used.filter((u) => !ordered.includes(u))];
	}, [live, categories]);
	const [category, setCategory] = useState(names[0] ?? "");
	const [q, setQ] = useState("");
	const [choosing, setChoosing] = useState<MenuItemRow | null>(null);
	const [picked, setPicked] = useState<Record<string, string[]>>({});
	const [note, setNote] = useState("");

	const items = live.filter((m) =>
		q
			? m.name.toLowerCase().includes(q.toLowerCase())
			: m.category === (names.includes(category) ? category : names[0]),
	);
	const groups = choosing ? groupsOf(choosing) : [];
	const missing = groups.some((g) => g.required && !picked[g.group]?.length);
	const extraOf = (gs: OptionGroup[], sel: Record<string, string[]>) =>
		gs.reduce(
			(sum, g) =>
				sum +
				g.choices
					.filter((c) => sel[g.group]?.includes(c.name))
					.reduce((a, c) => a + c.priceDelta, 0),
			0,
		);
	const priceOf = (m: MenuItemRow) =>
		Math.round((m.price * (100 - discountPct)) / 100);

	const add = (item: MenuItemRow, opt?: string, n?: string, extra?: number) => {
		const key = `${item.id}:${opt ?? ""}:${n ?? ""}`;
		const existing = lines.find((l) => l.key === key);
		onChange(
			existing
				? lines.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
				: [...lines, { key, item, qty: 1, option: opt, note: n, extra }],
		);
	};
	const setQty = (key: string, qty: number) =>
		onChange(
			qty <= 0
				? lines.filter((l) => l.key !== key)
				: lines.map((l) => (l.key === key ? { ...l, qty } : l)),
		);
	const qtyOf = (item: MenuItemRow) =>
		lines.filter((l) => l.item.id === item.id).reduce((s, l) => s + l.qty, 0);
	const toggle = (g: OptionGroup, name: string) =>
		setPicked((p) => {
			const now = p[g.group] ?? [];
			if (g.multiple)
				return {
					...p,
					[g.group]: now.includes(name)
						? now.filter((x) => x !== name)
						: [...now, name],
				};
			return {
				...p,
				[g.group]: now.includes(name) && !g.required ? [] : [name],
			};
		});

	return (
		<div className="flex flex-col gap-4">
			<label className="flex h-11 items-center gap-2 rounded-control border border-line bg-card px-3">
				<SearchIcon className="size-4 text-ink-3" />
				<input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Search the menu…"
					className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
				/>
			</label>
			{!q && (
				<div className="flex flex-wrap gap-2">
					{names.map((c) => (
						<button
							key={c}
							type="button"
							onClick={() => setCategory(c)}
							className={cn(
								"rounded-pill px-4 py-2 text-[13px] font-semibold",
								category === c
									? "bg-brand text-white"
									: "bg-subtle text-ink-2 hover:text-ink",
							)}
						>
							{c}
						</button>
					))}
				</div>
			)}
			{discountPct > 0 && (
				<p className="rounded-control bg-warning-soft px-3 py-2 text-[13px] font-medium text-warning">
					Happy hour on · {discountPct}% off every drink that is added now
				</p>
			)}
			<div className="grid grid-cols-2 gap-2">
				{items.length === 0 && (
					<p className="col-span-2 py-4 text-center text-[13px] text-ink-3">
						Nothing on the menu here yet.
					</p>
				)}
				{items.map((item) => {
					const n = qtyOf(item);
					const g = groupsOf(item);
					return (
						<button
							key={item.id}
							type="button"
							disabled={!item.available}
							onClick={() => {
								if (g.length) {
									setChoosing(item);
									setPicked(
										Object.fromEntries(
											g
												.filter((x) => x.required && !x.multiple)
												.map((x) => [x.group, [x.choices[0].name]]),
										),
									);
									setNote("");
								} else add(item);
							}}
							className={cn(
								"flex min-h-[72px] items-center gap-3 rounded-control border px-4 py-3 text-left disabled:opacity-50",
								n > 0
									? "border-brand bg-brand-soft/30"
									: "border-line bg-card hover:bg-subtle",
							)}
						>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-[15px] font-semibold text-ink">
									{item.name}
								</span>
								<span className="block text-[13px] text-ink-3">
									{item.available ? (
										discountPct > 0 ? (
											<>
												<s>{naira(item.price)}</s> {naira(priceOf(item))}
											</>
										) : (
											naira(item.price)
										)
									) : (
										"Sold out"
									)}
									{g.length ? " · choices" : ""}
								</span>
							</span>
							{n > 0 ? (
								<span className="flex size-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
									{n}
								</span>
							) : (
								<PlusIcon className="size-5 text-ink-3" />
							)}
						</button>
					);
				})}
			</div>

			{lines.length > 0 && (
				<div className="flex flex-col gap-2 rounded-card border border-line bg-subtle/60 p-3">
					{lines.map((l) => (
						<div
							key={l.key}
							className="flex items-center gap-3 rounded-control bg-card px-3 py-2"
						>
							<span className="min-w-0 flex-1">
								<span className="block text-[15px] font-semibold text-ink">
									{l.item.name}
								</span>
								<span className="block text-xs text-ink-3">
									{[l.option, l.note].filter(Boolean).join(" · ") ||
										naira(unitPrice(l, discountPct))}
								</span>
							</span>
							<span className="text-[15px] font-semibold text-ink">
								{naira(unitPrice(l, discountPct) * l.qty)}
							</span>
							<span className="inline-flex items-center rounded-control border border-line">
								<button
									type="button"
									onClick={() => setQty(l.key, l.qty - 1)}
									className="flex size-9 items-center justify-center text-ink-2 hover:bg-subtle"
									aria-label="Less"
								>
									<MinusIcon className="size-4" />
								</button>
								<span className="w-7 text-center text-[15px] font-semibold">
									{l.qty}
								</span>
								<button
									type="button"
									onClick={() => setQty(l.key, l.qty + 1)}
									className="flex size-9 items-center justify-center text-ink-2 hover:bg-subtle"
									aria-label="More"
								>
									<PlusIcon className="size-4" />
								</button>
							</span>
						</div>
					))}
					<div className="flex items-center justify-between px-1 pt-1 text-[15px] font-bold text-ink">
						<span>Total</span>
						<span>{naira(cartTotal(lines, discountPct))}</span>
					</div>
				</div>
			)}

			<Modal
				open={!!choosing}
				onOpenChange={(o) => !o && setChoosing(null)}
				title={choosing?.name ?? ""}
				subtitle={
					choosing
						? `${naira(choosing.price)} · choose how the guest wants it`
						: undefined
				}
				size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setChoosing(null)}>
							Cancel
						</BigButton>
						<BigButton
							disabled={missing}
							onClick={() => {
								if (choosing) {
									const text = groups
										.flatMap((g) => picked[g.group] ?? [])
										.join(", ");
									add(
										choosing,
										text || undefined,
										note || undefined,
										extraOf(groups, picked) || undefined,
									);
								}
								setChoosing(null);
							}}
						>
							Add to order
						</BigButton>
					</>
				}
			>
				{choosing && (
					<div className="flex flex-col gap-4">
						{groups.map((g) => (
							<div key={g.group} className="flex flex-col gap-2">
								<p className="text-[13px] font-medium text-ink-2">
									{g.group}
									{g.required
										? " · choose one"
										: g.multiple
											? " · any number"
											: " · optional"}
								</p>
								<div className="grid grid-cols-2 gap-2">
									{g.choices.map((c) => {
										const on = picked[g.group]?.includes(c.name);
										return (
											<button
												key={c.name}
												type="button"
												onClick={() => toggle(g, c.name)}
												className={cn(
													"flex items-center justify-between gap-2 rounded-control border px-4 py-3 text-left text-[15px] font-semibold",
													on
														? "border-brand bg-brand-soft/40 text-brand"
														: "border-line text-ink hover:bg-subtle",
												)}
											>
												<span>{c.name}</span>
												{c.priceDelta !== 0 && (
													<span className="text-xs font-medium text-ink-3">
														{c.priceDelta > 0 ? "+" : "−"}
														{naira(Math.abs(c.priceDelta))}
													</span>
												)}
											</button>
										);
									})}
								</div>
							</div>
						))}
						<TextareaField
							label="Note for the kitchen (optional)"
							value={note}
							onChange={setNote}
							placeholder="e.g. no pepper, extra plantain"
							rows={2}
						/>
					</div>
				)}
			</Modal>
		</div>
	);
}

export { Stepper };
