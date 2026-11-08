"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { fmtWhen, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import type { StockItemRow } from "@hospio/api/data/types";
import type { OwnerHotelFinance } from "@hospio/api/demo/fixtures/owner";
import { cn } from "@hospio/ui/utils";
import { DownloadModal, HotelFilter, useParam } from "./common";

export function OwnerInventory({ items, hotels }: { items: StockItemRow[]; hotels: OwnerHotelFinance[] }) {
	const [hotel, setHotel] = useParam("hotel");
	const [search, setSearch] = useState("");
	const [store, setStore] = useState("");
	const [exportOpen, setExportOpen] = useState(false);
	const perHotel = hotels.map((h, i) => ({ ...h, items: items.length * (i === 0 ? 1 : 1), low: [4, 3, 2, 5][i], value: [8400000, 5200000, 3100000, 1900000][i] }));
	const rows = items.filter((it) => !store || it.storeId === store);
	const cols: ColumnDef<StockItemRow, unknown>[] = [
		{ accessorKey: "name", header: "Item", cell: ({ row }) => <TwoLine primary={row.original.name} secondary={`${row.original.category} · ${row.original.storeName}`} /> },
		{ accessorKey: "quantity", header: "In stock", cell: ({ row }) => { const low = row.original.quantity <= row.original.minLevel; return <div className="flex items-center gap-2"><ProgressBar value={row.original.quantity} max={row.original.minLevel * 2} className="w-16" tone={low ? (row.original.quantity <= row.original.minLevel * 0.4 ? "danger" : "warning") : "success"} /><span className={cn(low && "font-semibold text-danger")}>{row.original.quantity} {row.original.unit}</span></div>; } },
		{ accessorKey: "minLevel", header: "Minimum", cell: ({ row }) => `${row.original.minLevel} ${row.original.unit}` },
		{ accessorKey: "unitCost", header: "Unit cost", cell: ({ row }) => naira(row.original.unitCost) },
		{ id: "value", header: "Value", accessorFn: (i) => i.quantity * i.unitCost, cell: ({ row }) => <span className="font-semibold">{naira(row.original.quantity * row.original.unitCost)}</span> },
		{ accessorKey: "supplierName", header: "Supplier" },
		{ accessorKey: "lastMovement", header: "Last movement", cell: ({ row }) => fmtWhen(row.original.lastMovement) },
	];
	const current = hotels.find((h) => h.hotelId === hotel);
	return (
		<>
			<PageHeader title="Inventory" subtitle={current ? `${current.name} · stock on hand` : "Stock across your hotels · managed by each storekeeper"}>
				<ExportButton onClick={() => setExportOpen(true)} />
			</PageHeader>
			{!current && (
				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					{perHotel.map((h) => (
						<button key={h.hotelId} type="button" onClick={() => setHotel(h.hotelId)} className="flex flex-col gap-2 rounded-card border border-line bg-card p-4 text-left hover:border-brand">
							<div className="flex items-center justify-between"><p className="text-sm font-bold text-ink">{h.name}</p><StatusPill tone={h.low >= 5 ? "danger" : h.low >= 3 ? "warning" : "success"}>{plural(h.low, "low item")}</StatusPill></div>
							<p className="text-lg font-bold text-ink">{nairaShort(h.value)}<span className="text-xs font-normal text-ink-3"> stock value</span></p>
							<p className="text-xs text-ink-3">4 stores · {h.items} items</p>
						</button>
					))}
				</div>
			)}
			<Toolbar left={<><HotelFilter hotels={hotels} value={hotel ?? ""} onChange={(v) => setHotel(v || null)} /><FilterSelect value={store} onChange={setStore} all="All stores" options={[...new Map(items.map((i) => [i.storeId, i.storeName])).entries()].map(([value, label]) => ({ value, label }))} /></>} right={<SearchBox value={search} onChange={setSearch} placeholder="Item or supplier" />} />
			<DataTable columns={cols} data={rows} search={search} pageSize={12} rowClassName={(r) => (r.quantity <= r.minLevel ? "bg-warning-soft/30" : undefined)} />
			<DownloadModal open={exportOpen} onOpenChange={setExportOpen} title="Download stock" what={current ? `${current.name} · stock` : "Stock across hotels"} />
		</>
	);
}
