"use client";

import { PlusIcon, WineIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	loadMinibarPrices,
	saveMinibarPrice,
} from "@hospio/api/actions/hotel-config";
import { useAction } from "@hospio/api/actions/use-action";
import type { MinibarPrice } from "@hospio/api/data/types";
import { Note } from "@hospio/ui/shared/detail-list";
import { MoneyField, TextField } from "@hospio/ui/shared/field";
import { naira } from "@hospio/ui/shared/format";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/**
 * Hotel setup · Housekeeping · Minibar prices: the hotel's MINIBAR price list in hotel-config. Attendants pick from the active
 * items on My rooms → Minibar and the total goes on the guest's folio. A price is switched off, never deleted.
 */
export function MinibarPricesSection({
	hotelId,
	locked,
}: {
	hotelId?: string;
	locked?: boolean;
}) {
	const [items, setItems] = useState<MinibarPrice[] | null>(null);
	const [failed, setFailed] = useState<string | null>(null);
	const [draft, setDraft] = useState<{
		id?: string;
		name: string;
		price: number | "";
	} | null>(null);
	const { run, pending } = useAction();

	const load = useCallback(() => {
		loadMinibarPrices(hotelId)
			.then((r) => {
				if (r.ok) {
					setItems(r.data);
					setFailed(null);
				} else {
					setItems([]);
					setFailed(r.error);
				}
			})
			.catch(() => setItems([]));
	}, [hotelId]);
	useEffect(load, [load]);

	const save = (
		input: { name: string; price: number; active?: boolean },
		id?: string,
		message = "Price saved",
	) =>
		run(
			() => saveMinibarPrice(input, id, hotelId),
			message,
			(list) => {
				setItems(list);
				setDraft(null);
			},
		);

	return (
		<section className="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-card p-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="flex items-center gap-2 text-base font-bold text-ink">
						<WineIcon className="size-4" /> Minibar prices
					</h2>
					<p className="text-[13px] text-ink-3">
						What attendants can post from a room's minibar. The total goes on
						the guest's bill.
					</p>
				</div>
				{!locked && (
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-1")}
						onClick={() => setDraft({ name: "", price: "" })}
					>
						<PlusIcon className="size-4" /> Add item
					</button>
				)}
			</div>
			{failed && <Note tone="danger">{failed}</Note>}
			{items === null ? (
				<p className="text-[13px] text-ink-3">Loading…</p>
			) : items.length === 0 && !draft ? (
				<Note tone="info">
					No minibar prices yet. Add the drinks and snacks in your rooms'
					minibars so attendants can post what guests used.
				</Note>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-[13px]">
						<thead>
							<tr className={tableHead}>
								<th className={cell}>Item</th>
								<th className={cell}>Price</th>
								<th className={cell}>Status</th>
								<th className={cell} />
							</tr>
						</thead>
						<tbody>
							{items.map((i) => (
								<tr
									key={i.id}
									className={cn(tableRow, !i.active && "opacity-60")}
								>
									<td className={cn(cell, "font-semibold text-ink")}>
										{i.name}
									</td>
									<td className={cell}>{naira(i.price)}</td>
									<td className={cell}>
										{i.active ? "Offered" : "Switched off"}
									</td>
									<td className={cn(cell, "text-right")}>
										{!locked && (
											<span className="inline-flex gap-2">
												<button
													type="button"
													className={cn(btn.secondary, btn.small)}
													onClick={() =>
														setDraft({ id: i.id, name: i.name, price: i.price })
													}
												>
													Edit
												</button>
												<button
													type="button"
													className={cn(btn.secondary, btn.small)}
													disabled={pending}
													onClick={() =>
														save(
															{
																name: i.name,
																price: i.price,
																active: !i.active,
															},
															i.id,
															i.active
																? `${i.name} switched off`
																: `${i.name} offered again`,
														)
													}
												>
													{i.active ? "Switch off" : "Offer again"}
												</button>
											</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			{draft && (
				<div className="flex flex-col gap-3 rounded-control border border-line p-4">
					<div className="grid gap-3 sm:grid-cols-2">
						<TextField
							label="Item"
							value={draft.name}
							onChange={(v) => setDraft({ ...draft, name: v })}
							placeholder="e.g. Water · 75cl"
							required
						/>
						<MoneyField
							label="Price"
							value={draft.price}
							onChange={(v) => setDraft({ ...draft, price: v })}
							required
						/>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setDraft(null)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={
								pending ||
								!draft.name.trim() ||
								draft.price === "" ||
								draft.price < 0
							}
							onClick={() =>
								draft.price !== "" &&
								save(
									{
										name: draft.name,
										price: draft.price,
										active:
											items?.find((x) => x.id === draft.id)?.active ?? true,
									},
									draft.id,
									draft.id ? "Price saved" : `${draft.name.trim()} added`,
								)
							}
						>
							{draft.id ? "Save price" : "Add item"}
						</button>
					</div>
				</div>
			)}
		</section>
	);
}
