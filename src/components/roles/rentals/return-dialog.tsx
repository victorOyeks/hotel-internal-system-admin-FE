"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { processReturn } from "@/lib/rental-actions";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PackageCheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const returnInspectionSchema = z.object({
	inspectionType: z.literal("RETURN"),
	notes: z.string().optional(),
	condition: z.enum([
		"EXCELLENT",
		"GOOD",
		"FAIR",
		"POOR",
		"DAMAGED",
		"OUT_OF_SERVICE",
	]),
	damaged: z.boolean(),
	lost: z.boolean(),
	damageDescription: z.string().optional(),
	damageCharge: z.number().min(0).optional(),
	replacementCharge: z.number().min(0).optional(),
	inspectionNotes: z.string().optional(),
});

type ReturnInspectionFormData = z.infer<typeof returnInspectionSchema>;

type ReturnDialogProps = {
	trigger?: React.ReactNode;
	orderId: string;
	onSuccess?: () => void;
};

const conditionLabels: Record<string, string> = {
	EXCELLENT: "Excellent - Like new",
	GOOD: "Good - Minor wear",
	FAIR: "Fair - Visible wear",
	POOR: "Poor - Limited functionality",
	DAMAGED: "Damaged - Needs repair",
	OUT_OF_SERVICE: "Out of Service",
};

export function ReturnDialog({
	trigger,
	orderId,
	onSuccess,
}: ReturnDialogProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<ReturnInspectionFormData>({
		resolver: zodResolver(returnInspectionSchema),
		defaultValues: {
			inspectionType: "RETURN",
			notes: "",
			condition: "GOOD",
			damaged: false,
			lost: false,
			damageDescription: "",
			damageCharge: 0,
			replacementCharge: 0,
			inspectionNotes: "",
		},
	});

	const isDamaged = form.watch("damaged");
	const isLost = form.watch("lost");

	const inspectionMutation = useMutation({
		mutationFn: async (data: ReturnInspectionFormData) => {
			const result = await processReturn(orderId, {
				inspectionType: "RETURN",
				notes: data.notes,
				items: [
					{
						condition: data.condition,
						inspectionNotes: data.inspectionNotes,
						damaged: data.damaged,
						lost: data.lost,
						damageDescription: data.damageDescription,
						damageCharge: data.damageCharge,
						replacementCharge: data.replacementCharge,
					},
				],
			});
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			toast.success("Return processed successfully");
			queryClient.invalidateQueries({ queryKey: ["rentals", "orders"] });
			queryClient.invalidateQueries({
				queryKey: ["rentals", "dashboard-stats"],
			});
			setOpen(false);
			form.reset();
			onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to process return");
		},
	});

	const onSubmit = (data: ReturnInspectionFormData) => {
		inspectionMutation.mutate(data);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline">
						<PackageCheckIcon className="w-4 h-4 mr-2" />
						Process Return
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="text-2xl">Process Rental Return</DialogTitle>
					<DialogDescription>
						Inspect returned items and record their condition
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{/* Item Condition */}
						<FormField
							control={form.control}
							name="condition"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Item Condition *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select condition" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.entries(conditionLabels).map(
												([value, label]) => (
													<SelectItem key={value} value={value}>
														{label}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Damage/Loss Checkboxes */}
						<Card className="bg-blue-50 border-blue-200">
							<CardContent className="pt-4 space-y-3">
								<FormField
									control={form.control}
									name="damaged"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel className="font-semibold">
													Item(s) have damage
												</FormLabel>
												<FormDescription>
													Check this if any returned items are damaged
												</FormDescription>
											</div>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="lost"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel className="font-semibold">
													Item(s) are lost
												</FormLabel>
												<FormDescription>
													Check if any items are missing or not returned
												</FormDescription>
											</div>
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Damage Details */}
						{isDamaged && (
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-medium text-red-700">
										Damage Details
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<FormField
										control={form.control}
										name="damageDescription"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Damage Description *</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Describe the damage..."
														className="min-h-[80px]"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="damageCharge"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Damage Charge (NGN)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														{...field}
														onChange={(e) =>
															field.onChange(parseFloat(e.target.value) || 0)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						)}

						{/* Lost Item Charges */}
						{isLost && (
							<FormField
								control={form.control}
								name="replacementCharge"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Replacement Charge (NGN)</FormLabel>
										<FormControl>
											<Input
												type="number"
												min="0"
												step="0.01"
												placeholder="0.00"
												{...field}
												onChange={(e) =>
													field.onChange(parseFloat(e.target.value) || 0)
												}
											/>
										</FormControl>
										<FormDescription>
											Charge for lost/unreturned items
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* Inspection Notes */}
						<FormField
							control={form.control}
							name="inspectionNotes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Inspection Notes</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Additional inspection notes..."
											className="min-h-[60px]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Overall Notes</FormLabel>
									<FormControl>
										<Textarea
											placeholder="General return notes..."
											className="min-h-[60px]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-3 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={inspectionMutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={inspectionMutation.isPending}
								className="bg-gradient-to-r from-blue-600 to-indigo-600"
							>
								{inspectionMutation.isPending && (
									<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
								)}
								Complete Return
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
