import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";
import { mockSuppliers } from "./grn-mock";

export function CreateGRNForm({ onClose }: { onClose: () => void }) {
	const [formData, setFormData] = useState({
		/* ... */
	});
	const [items, setItems] = useState<any[]>([]);

	return (
		<div className="space-y-6">
			{/* 1. Basic Info Section */}
			<div className="grid grid-cols-2 gap-4">
				{/* Inputs for Supplier, Location, Date, Time... */}
				<div className="space-y-2">
					<Label>Supplier *</Label>
					<Select
						onValueChange={(v) => setFormData({ ...formData, supplierId: v })}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select supplier" />
						</SelectTrigger>
						<SelectContent>
							{mockSuppliers.map((s) => (
								<SelectItem key={s.id} value={s.id}>
									{s.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{/* ... Other Basic Inputs ... */}
			</div>

			<Separator />

			{/* 2. Items Manager Section */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">Received Items</h3>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => {
							/* handleAddItem logic */
						}}
					>
						<PlusIcon className="w-4 h-4 mr-2" /> Add Item
					</Button>
				</div>

				<div className="space-y-4">
					{/* Map items here using Card components as in original */}
					{items.map((item, index) => (
						<Card key={item.id}>
							<CardContent className="pt-6">
								{/* ... Item Inputs ... */}
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* 3. Footer Actions */}
			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button
					onClick={() => {
						/* handleSubmit logic */
					}}
				>
					Create GRN
				</Button>
			</div>
		</div>
	);
}
