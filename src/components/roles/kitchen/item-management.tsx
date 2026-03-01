"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
	MoreVerticalIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	UploadIcon,
	DownloadIcon,
	FileSpreadsheetIcon,
	UtensilsIcon,
	XIcon,
	CheckCircle2Icon,
	XCircleIcon,
	Trash2Icon,
} from "lucide-react";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/shared/pagination";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState, useMemo, useRef, useCallback } from "react";
import type { APIOutput } from "@/lib/action-utils";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { revalidateRoute } from "@/lib/actions";
import {
	addFoodItem,
	addBarItem,
	bulkUploadFoodItems,
	bulkUploadBarItems,
	toggleBarItemStock,
	toggleFoodItemStock,
	updateFoodItem,
	updateBarItem,
	deleteFoodItem,
	deleteBarItem,
} from "@/lib/restaurant-actions";
import { Switch } from "@/components/ui/switch";
import type { BulkUploadResult } from "@/lib/bulk-upload-types";

export type FoodDrinkItem =
	APIOutput<"@get/api/restaurants/items/all">["data"][number];

// ==================== BULK ADD FOOD ITEMS DIALOG ====================

function BulkAddFoodItemDialog({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="rounded-4xl max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-y-auto">
				<DialogTitle>Add Food Items</DialogTitle>
				<DialogDescription className="sr-only">
					Add food items individually or upload a file for bulk import.
				</DialogDescription>
				<FoodItemAddContent setOpen={setOpen} />
			</DialogContent>
		</Dialog>
	);
}

export function FoodItemsFileUpload({
	setOpen,
}: {
	setOpen: (open: boolean) => void;
}) {
	const [file, setFile] = useState<File | null>(null);
	const [dragActive, setDragActive] = useState(false);
	const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
		null,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { mutate, isPending } = useMutation({
		mutationFn: async (selectedFile: File) => {
			const formData = new FormData();
			formData.append("file", selectedFile);
			const res = await bulkUploadFoodItems(formData);
			if (!res.success) {
				throw new Error(res.error || "Bulk upload failed");
			}
			return res.data;
		},
		onSuccess: async (data) => {
			setUploadResult(data);
			toast.success(
				`Uploaded: ${data.summary.successCount} succeeded, ${data.summary.failedCount} failed`,
			);
			await revalidateRoute("/restaurant/item-management");
		},
		onError: (error: Error) => {
			toast.error("Upload failed", { description: error.message });
		},
	});

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(false);
		const droppedFile = e.dataTransfer.files[0];
		if (droppedFile) setFile(droppedFile);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setDragActive(false);
	}, []);

	const downloadTemplate = () => {
		const headers = ["Name", "Price"];
		const rows = [
			["Jollof Rice", "5000"],
			["Fried Rice", "4500"],
		];
		const csvContent = [headers, ...rows]
			.map((row) => row.map((cell) => `"${cell}"`).join(","))
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "food_items_template.csv";
		a.click();
		URL.revokeObjectURL(url);
	};

	if (uploadResult) {
		return (
			<BulkResultsDisplay
				results={uploadResult.results}
				summary={uploadResult.summary}
				onClose={() => setOpen(false)}
				onReset={() => {
					setUploadResult(null);
					setFile(null);
				}}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between p-3 bg-muted/50 border rounded-md">
				<div className="flex items-center gap-3">
					<FileSpreadsheetIcon className="w-5 h-5 text-green-600 shrink-0" />
					<p className="text-sm text-muted-foreground">
						Download the template, fill it in, and upload it below
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="shrink-0 ml-3"
					onClick={downloadTemplate}
				>
					<DownloadIcon className="h-4 w-4 mr-2" />
					Download Template
				</Button>
			</div>

			<div
				className={cn(
					"border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
					dragActive
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25 hover:border-primary/50",
				)}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onClick={() => fileInputRef.current?.click()}
			>
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					accept=".csv,.xlsx,.xls"
					onChange={(e) => {
						const selectedFile = e.target.files?.[0];
						if (selectedFile) setFile(selectedFile);
					}}
				/>
				<FileSpreadsheetIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
				<p className="text-sm font-medium">
					{file ? file.name : "Drag and drop your file here"}
				</p>
				<p className="text-xs text-muted-foreground mt-1">
					{file
						? `${(file.size / 1024).toFixed(1)} KB`
						: "Supports CSV, XLS, XLSX"}
				</p>
			</div>

			{file && (
				<div className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
					<div className="flex items-center gap-2">
						<FileSpreadsheetIcon className="h-4 w-4 text-green-600" />
						<span className="text-sm truncate max-w-[250px]">{file.name}</span>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={() => {
							setFile(null);
							if (fileInputRef.current) fileInputRef.current.value = "";
						}}
					>
						<XIcon className="h-4 w-4" />
					</Button>
				</div>
			)}

			<div className="flex gap-2 justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={() => setOpen(false)}
					disabled={isPending}
				>
					Cancel
				</Button>
				<Button
					disabled={!file || isPending}
					onClick={() => file && mutate(file)}
				>
					{isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
					Upload File
				</Button>
			</div>
		</div>
	);
}

// ==================== BULK ADD BAR ITEMS DIALOG ====================

function BulkAddBarItemDialog({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="rounded-4xl max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-y-auto">
				<DialogTitle>Add Bar Items</DialogTitle>
				<DialogDescription className="sr-only">
					Add bar items individually or upload a file for bulk import.
				</DialogDescription>
				<BarItemAddContent setOpen={setOpen} />
			</DialogContent>
		</Dialog>
	);
}

export function BarItemsFileUpload({
	setOpen,
}: {
	setOpen: (open: boolean) => void;
}) {
	const [file, setFile] = useState<File | null>(null);
	const [dragActive, setDragActive] = useState(false);
	const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
		null,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { mutate, isPending } = useMutation({
		mutationFn: async (selectedFile: File) => {
			const formData = new FormData();
			formData.append("file", selectedFile);
			const res = await bulkUploadBarItems(formData);
			if (!res.success) {
				throw new Error(res.error || "Bulk upload failed");
			}
			return res.data;
		},
		onSuccess: async (data) => {
			setUploadResult(data);
			toast.success(
				`Uploaded: ${data.summary.successCount} succeeded, ${data.summary.failedCount} failed`,
			);
			await revalidateRoute("/restaurant/item-management");
		},
		onError: (error: Error) => {
			toast.error("Upload failed", { description: error.message });
		},
	});

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(false);
		const droppedFile = e.dataTransfer.files[0];
		if (droppedFile) setFile(droppedFile);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setDragActive(false);
	}, []);

	const downloadTemplate = () => {
		const headers = ["Name", "Price"];
		const rows = [
			["Heineken", "2000"],
			["Chapman", "1500"],
		];
		const csvContent = [headers, ...rows]
			.map((row) => row.map((cell) => `"${cell}"`).join(","))
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "bar_items_template.csv";
		a.click();
		URL.revokeObjectURL(url);
	};

	if (uploadResult) {
		return (
			<BulkResultsDisplay
				results={uploadResult.results}
				summary={uploadResult.summary}
				onClose={() => setOpen(false)}
				onReset={() => {
					setUploadResult(null);
					setFile(null);
				}}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between p-3 bg-muted/50 border rounded-md">
				<div className="flex items-center gap-3">
					<FileSpreadsheetIcon className="w-5 h-5 text-green-600 shrink-0" />
					<p className="text-sm text-muted-foreground">
						Download the template, fill it in, and upload it below
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="shrink-0 ml-3"
					onClick={downloadTemplate}
				>
					<DownloadIcon className="h-4 w-4 mr-2" />
					Download Template
				</Button>
			</div>

			<div
				className={cn(
					"border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
					dragActive
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25 hover:border-primary/50",
				)}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onClick={() => fileInputRef.current?.click()}
			>
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					accept=".csv,.xlsx,.xls"
					onChange={(e) => {
						const selectedFile = e.target.files?.[0];
						if (selectedFile) setFile(selectedFile);
					}}
				/>
				<FileSpreadsheetIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
				<p className="text-sm font-medium">
					{file ? file.name : "Drag and drop your file here"}
				</p>
				<p className="text-xs text-muted-foreground mt-1">
					{file
						? `${(file.size / 1024).toFixed(1)} KB`
						: "Supports CSV, XLS, XLSX"}
				</p>
			</div>

			{file && (
				<div className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
					<div className="flex items-center gap-2">
						<FileSpreadsheetIcon className="h-4 w-4 text-green-600" />
						<span className="text-sm truncate max-w-[250px]">{file.name}</span>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={() => {
							setFile(null);
							if (fileInputRef.current) fileInputRef.current.value = "";
						}}
					>
						<XIcon className="h-4 w-4" />
					</Button>
				</div>
			)}

			<div className="flex gap-2 justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={() => setOpen(false)}
					disabled={isPending}
				>
					Cancel
				</Button>
				<Button
					disabled={!file || isPending}
					onClick={() => file && mutate(file)}
				>
					{isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
					Upload File
				</Button>
			</div>
		</div>
	);
}

// ==================== MANUAL ADD FORMS (MULTI-ROW) ====================

const foodItemListSchema = z.object({
	items: z
		.array(
			z.object({
				name: z.string().min(1, "Name is required"),
				price: z.number().positive("Price must be greater than 0"),
			}),
		)
		.min(1, "At least one item is required"),
});

function FoodItemManualAdd({
	setOpen,
}: {
	setOpen: (open: boolean) => void;
}) {
	const form = useForm({
		resolver: zodResolver(foodItemListSchema),
		defaultValues: {
			items: [{ name: "", price: 0 }],
		},
		reValidateMode: "onBlur",
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (data: z.infer<typeof foodItemListSchema>) => {
			let successCount = 0;
			let failedCount = 0;
			for (const item of data.items) {
				const res = await addFoodItem(item);
				if (res.success) successCount++;
				else failedCount++;
			}
			return { successCount, failedCount, total: data.items.length };
		},
		onSuccess: async ({ successCount, failedCount }) => {
			if (failedCount === 0) {
				toast.success(`All ${successCount} food items added successfully`);
			} else {
				toast.warning(
					`${successCount} succeeded, ${failedCount} failed`,
				);
			}
			form.reset();
			setOpen(false);
			await revalidateRoute("/restaurant/item-management");
		},
		onError: () => {
			toast.error("Something went wrong", {
				description: "Failed to add food items",
			});
		},
	});

	return (
		<Form {...form}>
			<form
				className="space-y-4"
				onSubmit={form.handleSubmit((data) => mutate(data))}
			>
				<div className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
					{fields.map((field, index) => (
						<div
							key={field.id}
							className="flex items-end gap-2 p-3 border rounded-lg"
						>
							<FormField
								control={form.control}
								name={`items.${index}.name`}
								render={({ field }) => (
									<FormItem className="flex-1">
										<FormLabel className="text-xs">Name</FormLabel>
										<FormControl>
											<Input
												placeholder="e.g Jollof Rice"
												{...field}
												className="h-9"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`items.${index}.price`}
								render={() => (
									<FormItem className="w-28">
										<FormLabel className="text-xs">Price</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="0"
												className="h-9"
												{...form.register(`items.${index}.price`, {
													valueAsNumber: true,
												})}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{fields.length > 1 && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600"
									onClick={() => remove(index)}
								>
									<Trash2Icon className="h-4 w-4" />
								</Button>
							)}
						</div>
					))}
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-full"
					onClick={() => append({ name: "", price: 0 })}
				>
					<PlusIcon className="h-4 w-4 mr-2" />
					Add Another Item
				</Button>

				<div className="flex gap-2 justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
						Add {fields.length} {fields.length === 1 ? "Item" : "Items"}
					</Button>
				</div>
			</form>
		</Form>
	);
}

const barItemListSchema = z.object({
	items: z
		.array(
			z.object({
				name: z.string().min(1, "Name is required"),
				price: z.number().positive("Price must be greater than 0"),
			}),
		)
		.min(1, "At least one item is required"),
});

function BarItemManualAdd({
	setOpen,
}: {
	setOpen: (open: boolean) => void;
}) {
	const form = useForm({
		resolver: zodResolver(barItemListSchema),
		defaultValues: {
			items: [{ name: "", price: 0 }],
		},
		reValidateMode: "onBlur",
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (data: z.infer<typeof barItemListSchema>) => {
			let successCount = 0;
			let failedCount = 0;
			for (const item of data.items) {
				const res = await addBarItem(item);
				if (res.success) successCount++;
				else failedCount++;
			}
			return { successCount, failedCount, total: data.items.length };
		},
		onSuccess: async ({ successCount, failedCount }) => {
			if (failedCount === 0) {
				toast.success(`All ${successCount} bar items added successfully`);
			} else {
				toast.warning(
					`${successCount} succeeded, ${failedCount} failed`,
				);
			}
			form.reset();
			setOpen(false);
			await revalidateRoute("/restaurant/item-management");
		},
		onError: () => {
			toast.error("Something went wrong", {
				description: "Failed to add bar items",
			});
		},
	});

	return (
		<Form {...form}>
			<form
				className="space-y-4"
				onSubmit={form.handleSubmit((data) => mutate(data))}
			>
				<div className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
					{fields.map((field, index) => (
						<div
							key={field.id}
							className="flex items-end gap-2 p-3 border rounded-lg"
						>
							<FormField
								control={form.control}
								name={`items.${index}.name`}
								render={({ field }) => (
									<FormItem className="flex-1">
										<FormLabel className="text-xs">Name</FormLabel>
										<FormControl>
											<Input
												placeholder="e.g Heineken"
												{...field}
												className="h-9"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`items.${index}.price`}
								render={() => (
									<FormItem className="w-28">
										<FormLabel className="text-xs">Price</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="0"
												className="h-9"
												{...form.register(`items.${index}.price`, {
													valueAsNumber: true,
												})}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{fields.length > 1 && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600"
									onClick={() => remove(index)}
								>
									<Trash2Icon className="h-4 w-4" />
								</Button>
							)}
						</div>
					))}
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-full"
					onClick={() => append({ name: "", price: 0 })}
				>
					<PlusIcon className="h-4 w-4 mr-2" />
					Add Another Item
				</Button>

				<div className="flex gap-2 justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
						Add {fields.length} {fields.length === 1 ? "Item" : "Items"}
					</Button>
				</div>
			</form>
		</Form>
	);
}

// ==================== COMBINED CONTENT (TABS: UPLOAD + MANUAL ADD) ====================

export function FoodItemAddContent({
	setOpen,
}: {
	setOpen: (open: boolean) => void;
}) {
	return (
		<Tabs defaultValue="manual" className="w-full">
			<TabsList className="grid w-full grid-cols-2">
				<TabsTrigger value="manual">Add Manually</TabsTrigger>
				<TabsTrigger value="upload">Upload File</TabsTrigger>
			</TabsList>
			<TabsContent value="manual" className="mt-4">
				<FoodItemManualAdd setOpen={setOpen} />
			</TabsContent>
			<TabsContent value="upload" className="mt-4">
				<FoodItemsFileUpload setOpen={setOpen} />
			</TabsContent>
		</Tabs>
	);
}

export function BarItemAddContent({
	setOpen,
}: {
	setOpen: (open: boolean) => void;
}) {
	return (
		<Tabs defaultValue="manual" className="w-full">
			<TabsList className="grid w-full grid-cols-2">
				<TabsTrigger value="manual">Add Manually</TabsTrigger>
				<TabsTrigger value="upload">Upload File</TabsTrigger>
			</TabsList>
			<TabsContent value="manual" className="mt-4">
				<BarItemManualAdd setOpen={setOpen} />
			</TabsContent>
			<TabsContent value="upload" className="mt-4">
				<BarItemsFileUpload setOpen={setOpen} />
			</TabsContent>
		</Tabs>
	);
}

// ==================== SHARED RESULTS DISPLAY ====================

function BulkResultsDisplay({
	results,
	summary,
	onClose,
	onReset,
}: {
	results: Array<{
		rowNumber: number;
		success: boolean;
		itemIdentifier: string | null;
		errorMessage: string | null;
	}>;
	summary?: BulkUploadResult["summary"];
	onClose: () => void;
	onReset: () => void;
}) {
	const successCount = summary?.successCount ?? results.filter((r) => r.success).length;
	const failedCount = summary?.failedCount ?? results.filter((r) => !r.success).length;
	const total = summary?.totalRows ?? results.length;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
				<p className="text-sm text-muted-foreground">
					{total} {total === 1 ? "item" : "items"} processed
				</p>
				<div className="flex items-center gap-3 text-xs">
					<span className="flex items-center gap-1 text-green-600">
						<CheckCircle2Icon className="h-3.5 w-3.5" />
						{successCount} succeeded
					</span>
					{failedCount > 0 && (
						<span className="flex items-center gap-1 text-destructive">
							<XCircleIcon className="h-3.5 w-3.5" />
							{failedCount} failed
						</span>
					)}
				</div>
			</div>

			<div className="max-h-[280px] overflow-y-auto border rounded-md divide-y">
				{results.map((result) => (
					<div
						key={result.rowNumber}
						className="flex items-center gap-3 px-3 py-2 text-sm"
					>
						<span className="text-xs text-muted-foreground tabular-nums w-6 shrink-0">
							{result.rowNumber}
						</span>
						{result.success ? (
							<CheckCircle2Icon className="h-3.5 w-3.5 text-green-600 shrink-0" />
						) : (
							<XCircleIcon className="h-3.5 w-3.5 text-destructive shrink-0" />
						)}
						<span className="truncate text-sm">
							{result.itemIdentifier || "Unknown"}
						</span>
						{result.errorMessage && (
							<span className="text-xs text-muted-foreground ml-auto truncate max-w-[180px]">
								{result.errorMessage}
							</span>
						)}
					</div>
				))}
			</div>

			<div className="flex gap-2 justify-end">
				<Button type="button" variant="outline" size="sm" onClick={onReset}>
					Add More
				</Button>
				<Button size="sm" onClick={onClose}>Done</Button>
			</div>
		</div>
	);
}

// ==================== EDIT ITEM FORM (UNCHANGED) ====================

const editItemSchema = z.object({
	name: z.string().min(1, "Item name is required"),
	price: z.number().positive("Price must be greater than 0"),
});

function EditItemForm({
	item,
	setOpen,
}: {
	item: FoodDrinkItem;
	setOpen: (open: boolean) => void;
}) {
	const form = useForm({
		resolver: zodResolver(editItemSchema),
		defaultValues: {
			name: item.name,
			price: item.price,
		},
		progressive: true,
		reValidateMode: "onBlur",
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (data: z.infer<typeof editItemSchema>) => {
			const updateFn =
				item.itemType === "FOOD" ? updateFoodItem : updateBarItem;
			const res = await updateFn({
				itemId: item.id,
				name: data.name,
				price: data.price,
			});
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: async (msg) => {
			form.reset();
			setOpen(false);
			toast.success(msg);
			await revalidateRoute("/restaurant/item-management");
		},
		onError: (err: Error) => {
			toast.error("Failed to update item", {
				description: err.message,
			});
		},
	});

	return (
		<Form {...form}>
			<form
				className="space-y-4"
				onSubmit={form.handleSubmit((data) => mutate(data))}
			>
				<FormField
					name="name"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Item Name</FormLabel>
							<FormControl>
								<Input placeholder="e.g Jollof Rice" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="price"
					render={() => (
						<FormItem>
							<FormLabel>Price</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="0.01"
									placeholder="e.g 2500"
									{...form.register("price", { valueAsNumber: true })}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex gap-2 justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
						Save Changes
					</Button>
				</div>
			</form>
		</Form>
	);
}

// ==================== ITEM ACTIONS CELL (UNCHANGED) ====================

function ItemActionsCell({ item }: { item: FoodDrinkItem }) {
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const { mutate: deleteItem, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			const deleteFn =
				item.itemType === "FOOD" ? deleteFoodItem : deleteBarItem;
			const res = await deleteFn({ itemId: item.id });
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: async (msg) => {
			setDeleteOpen(false);
			toast.success(msg);
			await revalidateRoute("/restaurant/item-management");
		},
		onError: (err: Error) => {
			toast.error("Failed to delete item", {
				description: err.message,
			});
		},
	});

	return (
		<>
			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon">
							<MoreVerticalIcon className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DialogTrigger asChild>
							<DropdownMenuItem>Edit Item</DropdownMenuItem>
						</DialogTrigger>
					</DropdownMenuContent>
				</DropdownMenu>

				<DialogContent>
					<DialogTitle>
						Edit {item.itemType === "FOOD" ? "Food" : "Drink"} Item
					</DialogTitle>
					<DialogDescription>
						Update the details of this {item.itemType.toLowerCase()} item.
					</DialogDescription>
					<EditItemForm item={item} setOpen={setEditOpen} />
				</DialogContent>
			</Dialog>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete "{item.name}" from the system. This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								deleteItem();
							}}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting && (
								<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
							)}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

// ==================== STOCK TOGGLE CELL ====================

function StockToggleCell({ item }: { item: FoodDrinkItem }) {
	const { mutate, isPending } = useMutation({
		mutationFn: async (newInStock: boolean) => {
			const toggleFn =
				item.itemType === "FOOD" ? toggleFoodItemStock : toggleBarItemStock;
			const res = await toggleFn({ itemId: item.id, inStock: newInStock });
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: async (msg) => {
			toast.success(msg);
			await revalidateRoute("/restaurant/item-management");
		},
		onError: (err: Error) => {
			toast.error("Failed to update stock status", {
				description: err.message,
			});
		},
	});

	return (
		<div className="flex items-center gap-2">
			<Switch
				checked={item.inStock}
				onCheckedChange={(checked) => mutate(checked)}
				disabled={isPending}
				className="data-[state=checked]:bg-green-600"
			/>
			<span
				className={cn(
					"text-xs font-medium",
					item.inStock ? "text-green-600" : "text-red-500",
				)}
			>
				{isPending ? "..." : item.inStock ? "In Stock" : "Out of Stock"}
			</span>
		</div>
	);
}

// ==================== TABLE COLUMNS ====================

const columnHelper = createColumnHelper<FoodDrinkItem>();

const columns = [
	columnHelper.accessor("customId", {
		header: "Item ID",
		cell: (info) => (
			<span className="font-medium text-muted-foreground">
				{info.getValue()}
			</span>
		),
	}),
	columnHelper.accessor("name", {
		header: "Name",
		cell: (info) => <span className="font-medium">{info.getValue()}</span>,
	}),
	columnHelper.accessor("itemType", {
		header: "Type",
		cell: (info) => (
			<Badge variant={info.getValue() === "FOOD" ? "blue" : "green"}>
				{info.getValue()}
			</Badge>
		),
	}),
	columnHelper.accessor("price", {
		header: "Price",
		cell: (info) => (
			<span className="font-medium">{info.getValue().toLocaleString()}</span>
		),
	}),
	columnHelper.accessor("inStock", {
		header: "Status",
		cell: (info) => <StockToggleCell item={info.row.original} />,
	}),
	columnHelper.accessor("createdAt", {
		header: "Created At",
		cell: (info) => (
			<span className="text-sm text-muted-foreground">
				{new Date(info.getValue()).toLocaleDateString("en-US", {
					year: "numeric",
					month: "short",
					day: "numeric",
				})}
			</span>
		),
	}),
	columnHelper.display({
		id: "actions",
		header: "Actions",
		cell: (info) => <ItemActionsCell item={info.row.original} />,
	}),
];

// ==================== MAIN COMPONENT (UPDATED) ====================

type FoodItemsManagementProps = {
	items: FoodDrinkItem[];
};

export function FoodItemsManagement({ items }: FoodItemsManagementProps) {
	const [itemType, setItemType] = useQueryState(
		"itemType",
		parseAsStringLiteral(["FOOD", "DRINK"]).withDefault("FOOD"),
	);
	const [search, setSearch] = useQueryState("search");
	const [filterOpen, setFilterOpen] = useState(false);
	const [addFoodOpen, setAddFoodOpen] = useState(false);
	const [addBarOpen, setAddBarOpen] = useState(false);

	// Client-side filtering based on search
	const filteredItems = useMemo(() => {
		if (!search) return items;
		const searchLower = search.toLowerCase();
		return items.filter(
			(item) =>
				item.name.toLowerCase().includes(searchLower) ||
				item.customId.toLowerCase().includes(searchLower),
		);
	}, [items, search]);

	const table = useReactTable({
		data: filteredItems,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: { pageSize: 20 },
		},
	});

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
				<div className="flex items-center gap-x-2">
					<Button
						size="sm"
						variant="outline"
						onClick={() => setItemType("FOOD")}
						className={cn(
							"shadow-none text-xs hover:border-transparent rounded-full transition-colors",
							itemType === "FOOD"
								? "bg-primary text-primary-foreground border-primary"
								: "",
						)}
					>
						Food Items
						{itemType === "FOOD" && ` (${filteredItems.length})`}
					</Button>

					<Button
						size="sm"
						variant="outline"
						onClick={() => setItemType("DRINK")}
						className={cn(
							"shadow-none text-xs hover:border-transparent rounded-full transition-colors",
							itemType === "DRINK"
								? "bg-primary text-primary-foreground border-primary"
								: "",
						)}
					>
						Drink Items
						{itemType === "DRINK" && ` (${filteredItems.length})`}
					</Button>
				</div>

				<div className="flex items-center gap-x-2">
					<div className="relative">
						<input
							type="text"
							placeholder="Search items..."
							value={search ?? ""}
							onChange={(e) => setSearch(e.target.value || null)}
							className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-xl"
						/>
						<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
					</div>

					<TableFilter open={filterOpen} setOpen={setFilterOpen}>
						<div className="p-4">
							<p className="text-sm text-muted-foreground">
								Additional filters can be added here
							</p>
						</div>
					</TableFilter>

					<Button
						size="sm"
						className="rounded-md md:rounded-xl"
						onClick={() =>
							itemType === "FOOD"
								? setAddFoodOpen(true)
								: setAddBarOpen(true)
						}
					>
						<PlusIcon className="h-4 w-4 mr-2" />
						Add {itemType === "FOOD" ? "Food" : "Drink"}
					</Button>
				</div>
			</div>

			<div className="rounded-md border bg-card">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-48 text-center"
								>
									<div className="flex flex-col items-center justify-center text-muted-foreground">
										<UtensilsIcon className="size-10 mb-3 opacity-40" />
										<p className="font-medium text-gray-900">No menu items found</p>
										<p className="text-sm mt-1">
											Add food or bar items to get started with your menu.
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{filteredItems.length > 0 && <DataTablePagination table={table} />}

			{/* Bulk Add Dialogs */}
			<BulkAddFoodItemDialog open={addFoodOpen} setOpen={setAddFoodOpen} />
			<BulkAddBarItemDialog open={addBarOpen} setOpen={setAddBarOpen} />
		</div>
	);
}
