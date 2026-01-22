"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

// Mock locations - in a real app this would come from props or API
const mockStorageLocations = [
	{ id: "1", name: "Main Warehouse", code: "WH-MAIN" },
	{ id: "2", name: "Cold Storage Unit 1", code: "CS-01" },
	{ id: "3", name: "Dry Storage Room", code: "DS-01" },
	{ id: "4", name: "Bar Storage", code: "BAR-ST" },
];

interface CreateStockTakeFormProps {
	onClose: () => void;
}

export function CreateStockTakeForm({ onClose }: CreateStockTakeFormProps) {
	const [formData, setFormData] = useState({
		locationId: "",
		scheduledDate: new Date().toISOString().split("T")[0],
		stockTakeType: "FULL",
		supervisorName: "",
		acceptableVariancePercentage: 5,
		notes: "",
	});

	const handleSubmit = () => {
		console.log("Creating stock take:", formData);
		// API call would go here
		alert(
			"Stock take created successfully! Items auto-generated from location.",
		);
		onClose();
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="location">Storage Location *</Label>
					<Select
						value={formData.locationId}
						onValueChange={(value) =>
							setFormData({ ...formData, locationId: value })
						}
					>
						<SelectTrigger id="location">
							<SelectValue placeholder="Select location" />
						</SelectTrigger>
						<SelectContent>
							{mockStorageLocations.map((location) => (
								<SelectItem key={location.id} value={location.id}>
									{location.name} ({location.code})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="scheduledDate">Scheduled Date *</Label>
					<Input
						id="scheduledDate"
						type="date"
						value={formData.scheduledDate}
						onChange={(e) =>
							setFormData({ ...formData, scheduledDate: e.target.value })
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="type">Stock Take Type *</Label>
					<Select
						value={formData.stockTakeType}
						onValueChange={(value) =>
							setFormData({
								...formData,
								stockTakeType: value,
							})
						}
					>
						<SelectTrigger id="type">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="FULL">Full Count</SelectItem>
							<SelectItem value="PARTIAL">Partial Count</SelectItem>
							<SelectItem value="CYCLE_COUNT">Cycle Count</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="supervisor">Supervisor Name *</Label>
					<Input
						id="supervisor"
						value={formData.supervisorName}
						onChange={(e) =>
							setFormData({ ...formData, supervisorName: e.target.value })
						}
						placeholder="Enter supervisor name"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="variance">Acceptable Variance % *</Label>
					<Input
						id="variance"
						type="number"
						min="0"
						max="100"
						step="0.1"
						value={formData.acceptableVariancePercentage}
						onChange={(e) =>
							setFormData({
								...formData,
								acceptableVariancePercentage: parseFloat(e.target.value) || 0,
							})
						}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="notes">Notes</Label>
				<Textarea
					id="notes"
					value={formData.notes}
					onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
					placeholder="Additional notes or instructions..."
					rows={3}
				/>
			</div>

			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={!formData.locationId || !formData.supervisorName}
				>
					Create Stock Take
				</Button>
			</div>
		</div>
	);
}
