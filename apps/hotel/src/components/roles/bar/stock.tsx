"use client";

import { ClipboardCheckIcon, WineOffIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextareaField } from "@hospio/ui/shared/field";
import { naira, plural } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import type { StockItemRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { cn } from "@hospio/ui/utils";
import { StoreScreen } from "../shared-staff/store-screen";
import { BigButton, Stepper } from "../shared-staff/tablet";

/** Bar · Bar stock (3264:12805) = the shared store screen plus breakage (3264:13155) and the end-of-night count (3264:13329). */
export function BarStockScreen({ items }: { items: StockItemRow[] }) {
	const [tab, setTab] = useQueryState("tab", parseAsString);
	const [breaking, setBreaking] = useState(false);
	const [counting, setCounting] = useState(false);
	const [broken, setBroken] = useState({ id: items[0]?.id ?? "", qty: 1, how: "Dropped", note: "" });
	const [counts, setCounts] = useState<Record<string, number>>({});
	const { run, pending } = useDemoAction();

	useEffect(() => { if (tab === "count") { setCounts(Object.fromEntries(items.map((i) => [i.id, i.quantity]))); setCounting(true); } }, [tab, items]);
	const closeCount = () => { setCounting(false); void setTab(null); };
	const variance = items.reduce((s, i) => s + ((counts[i.id] ?? i.quantity) - i.quantity) * i.unitCost, 0);
	const item = items.find((i) => i.id === broken.id);

	return (
		<>
			<StoreScreen items={items} title="Bar stock" subtitle="Drinks behind the bar and in the bar store · counted every night" extraActions={<><BigButton tone="dangerSoft" onClick={() => setBreaking(true)}><WineOffIcon className="size-5" /> Breakage</BigButton><BigButton tone="secondary" onClick={() => { setCounts(Object.fromEntries(items.map((i) => [i.id, i.quantity]))); setCounting(true); }}><ClipboardCheckIcon className="size-5" /> End-of-night count</BigButton></>} />

			<Modal open={breaking} onOpenChange={setBreaking} title="Breakage" subtitle="Bottles broken or spilled · the manager sees it" icon={WineOffIcon} tone="danger" size="form"
				footer={<><BigButton tone="secondary" onClick={() => setBreaking(false)}>Cancel</BigButton><BigButton tone="danger" pending={pending} onClick={() => run("Breakage recorded · manager told", () => setBreaking(false), { tone: "warning" })}>Record breakage</BigButton></>}>
				<div className="flex flex-col gap-4">
					<SelectField label="What" value={broken.id} onChange={(v) => setBroken({ ...broken, id: v })} options={items.map((i) => ({ value: i.id, label: i.name }))} />
					<div className="flex items-center justify-between rounded-control border border-line px-4 py-3"><span className="text-[15px] font-medium text-ink">How many ({item?.unit})</span><Stepper value={broken.qty} onChange={(v) => setBroken({ ...broken, qty: v })} min={1} /></div>
					<SelectField label="How" value={broken.how} onChange={(v) => setBroken({ ...broken, how: v })} options={["Dropped", "Spilled", "Guest knocked it", "Faulty bottle"]} setupLink="reasons" />
					<TextareaField label="Note" value={broken.note} onChange={(v) => setBroken({ ...broken, note: v })} rows={2} />
					<WhatHappens tone="warning" items={[`${naira((item?.unitCost ?? 0) * broken.qty)} of stock is written off`, "Shows on the stock movement report with your name"]} />
				</div>
			</Modal>

			<SidePanel open={counting} onOpenChange={(o) => !o && closeCount()} title="End-of-night count" subtitle="Count what's behind the bar; the system compares it with sales" icon={ClipboardCheckIcon} width="lg"
				footerInfo={<span className={cn(variance < 0 ? "text-danger" : "text-success")}>{variance === 0 ? "No variance" : `${variance < 0 ? "Short" : "Over"} by ${naira(Math.abs(variance))}`}</span>}
				footer={<><BigButton tone="secondary" onClick={closeCount}>Later</BigButton><BigButton pending={pending} onClick={() => run("Count saved · variance sent to the manager", closeCount)}>Save count</BigButton></>}>
				<div className="flex flex-col gap-5">
					<PanelSection title={plural(items.length, "line")}>
						<ul className="divide-y divide-line rounded-control border border-line">
							{items.map((i) => {
								const diff = (counts[i.id] ?? i.quantity) - i.quantity;
								return <li key={i.id} className="flex items-center gap-3 px-4 py-2"><span className="min-w-0 flex-1"><span className="block text-[15px] font-medium text-ink">{i.name}</span><span className="block text-xs text-ink-3">System says {i.quantity} {i.unit}</span></span>{diff !== 0 && <span className={cn("text-xs font-semibold", diff < 0 ? "text-danger" : "text-success")}>{diff > 0 ? "+" : ""}{diff}</span>}<Stepper value={counts[i.id] ?? i.quantity} onChange={(v) => setCounts({ ...counts, [i.id]: v })} max={999} /></li>;
							})}
						</ul>
					</PanelSection>
					<Note tone="info">Anything short is checked against breakage and sales before the manager sees it as a variance.</Note>
				</div>
			</SidePanel>
		</>
	);
}
