"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon, TagIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DataTable } from "@hospio/ui/shared/data-table";
import {
	MoneyField,
	SelectField,
	TextField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { naira } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { saveLaundryPrice } from "@hospio/api/actions/laundry";
import { useAction } from "@hospio/api/actions/use-action";
import type { LaundryPriceRow } from "@hospio/api/data/types";
import { BigButton } from "../shared-staff/tablet";

const CATS = [
	{ value: "WASH_IRON", label: "Wash & iron" },
	{ value: "DRY_CLEAN", label: "Dry clean" },
	{ value: "IRON_ONLY", label: "Iron only" },
	{ value: "OTHER", label: "Other" },
];

/** Manager · the guest laundry price list (normal and express price per item). */
export function LaundryPricesScreen({
	prices: p0,
	canEdit,
}: {
	prices: LaundryPriceRow[];
	canEdit: boolean;
}) {
	const [prices, setPrices] = useState(p0);
	useEffect(() => setPrices(p0), [p0]);
	const [editing, setEditing] = useState<LaundryPriceRow | "new" | null>(null);
	const columns: ColumnDef<LaundryPriceRow, unknown>[] = [
		{
			id: "name",
			header: "Item",
			cell: ({ row: { original: p } }) => (
				<span className="font-semibold text-ink">{p.name}</span>
			),
		},
		{
			id: "cat",
			header: "Service",
			cell: ({ row: { original: p } }) =>
				CATS.find((c) => c.value === p.category)?.label ?? p.category,
		},
		{
			id: "price",
			header: "Price",
			cell: ({ row: { original: p } }) => naira(p.price),
		},
		{
			id: "express",
			header: "Express",
			cell: ({ row: { original: p } }) => naira(p.expressPrice),
		},
		{
			id: "active",
			header: "",
			cell: ({ row: { original: p } }) =>
				p.active ? (
					<StatusPill tone="success">On the list</StatusPill>
				) : (
					<StatusPill tone="grey">Off</StatusPill>
				),
		},
	];
	return (
		<SectionCard
			title="Laundry prices"
			subtitle="What guests pay per item · express defaults to one and a half times"
			flush
			headerRight={
				canEdit ? (
					<BigButton
						tone="secondary"
						className="h-10"
						onClick={() => setEditing("new")}
					>
						<PlusIcon className="size-4" /> Add price
					</BigButton>
				) : undefined
			}
		>
			<DataTable
				columns={columns}
				data={prices}
				onRowClick={canEdit ? (p) => setEditing(p) : undefined}
				emptyTitle="No prices yet"
			/>
			<PriceModal
				price={editing}
				onClose={() => setEditing(null)}
				onSaved={(p) => {
					setPrices((ps) =>
						ps.some((x) => x.id === p.id)
							? ps.map((x) => (x.id === p.id ? p : x))
							: [...ps, p],
					);
					setEditing(null);
				}}
			/>
		</SectionCard>
	);
}

function PriceModal({
	price,
	onClose,
	onSaved,
}: {
	price: LaundryPriceRow | "new" | null;
	onClose: () => void;
	onSaved: (p: LaundryPriceRow) => void;
}) {
	const editing = price && price !== "new" ? price : null;
	const [name, setName] = useState("");
	const [category, setCategory] = useState("WASH_IRON");
	const [amount, setAmount] = useState<number | "">("");
	const [express, setExpress] = useState<number | "">("");
	const [active, setActive] = useState(true);
	const { run, pending } = useAction();
	useEffect(() => {
		if (!price) return;
		const p = price === "new" ? null : price;
		setName(p?.name ?? "");
		setCategory(p?.category ?? "WASH_IRON");
		setAmount(p?.price ?? "");
		setExpress(p?.expressPrice ?? "");
		setActive(p?.active ?? true);
	}, [price]);
	const expressLow = express !== "" && amount !== "" && express < amount;
	return (
		<Modal
			open={!!price}
			onOpenChange={(o) => !o && onClose()}
			title={editing ? `Edit ${editing.name}` : "Add price"}
			icon={TagIcon}
			size="confirm"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Cancel
					</BigButton>
					<BigButton
						pending={pending}
						disabled={
							!name.trim() || amount === "" || amount <= 0 || expressLow
						}
						onClick={() =>
							amount !== "" &&
							run(
								() =>
									saveLaundryPrice({
										id: editing?.id,
										name,
										category,
										price: amount,
										expressPrice: express === "" ? null : express,
										active,
									}),
								editing ? "Price saved" : "Price added",
								onSaved,
							)
						}
					>
						{editing ? "Save" : "Add"}
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Item"
					value={name}
					onChange={setName}
					placeholder="e.g. Shirt"
					required
				/>
				<SelectField
					label="Service"
					value={category}
					onChange={setCategory}
					options={CATS}
				/>
				<div className="grid grid-cols-2 gap-3">
					<MoneyField
						label="Price"
						value={amount}
						onChange={setAmount}
						required
					/>
					<MoneyField
						label="Express price"
						value={express}
						onChange={setExpress}
						hint="Blank: 1.5 × the price"
						error={expressLow ? "Can't be below the price" : undefined}
					/>
				</div>
				{editing && (
					<ToggleField
						label="On the list"
						hint="Off: can't be picked for new orders"
						checked={active}
						onChange={setActive}
					/>
				)}
			</div>
		</Modal>
	);
}
