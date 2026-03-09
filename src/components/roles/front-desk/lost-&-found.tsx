"use client";

import { TableFilter } from "@/components/shared/table-filter";
import {
	SearchIcon,
	RotateCcwIcon,
	XIcon,
	BedIcon,
	Loader2Icon,
	PenIcon,
	PlusIcon,
} from "lucide-react";
import {
	useState,
	useMemo,
	useCallback,
	useEffect,
	type Dispatch,
	type SetStateAction,
} from "react";
import {
	useQueryStates,
	parseAsString,
	parseAsStringLiteral,
	type ParserBuilder,
	type SetValues,
} from "nuqs";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
	type CellContext,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type Table as TableType,
} from "@tanstack/react-table";
import type { LostItem, Pagination } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/shared/pagination";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/shared/date-picker";
import { formatDate } from "date-fns";
import type { APIOutput } from "@/lib/action-utils";
import { cn } from "@/lib/utils";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { atom, useSetAtom } from "jotai";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { revalidateRoute, uploadImage } from "@/lib/actions";
import z from "zod";
import {
	claimLostItem,
	deleteLostItem,
	reportLostItem,
} from "@/lib/front-desk-actions";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";

const successDialogAtom = atom({
	show: false,
	message: "",
});

const reportLostItemSchema = z.object({
	itemName: z.string().nonempty("Item name is required"),
	description: z.string().nonempty("Description is required"),
	imageUrl: z.url("Please enter a valid URL").optional().or(z.literal("")),
	location: z.string().nonempty("Location is required for the lost item"),
	dateFound: z.string().nonempty("Date found is required"),
});

function ReportLostItemDialog() {
	const [open, setOpen] = useState(false);
	const [showSummary, setShowSummary] = useState(false);
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const form = useForm({
		resolver: zodResolver(reportLostItemSchema),
		defaultValues: {
			itemName: "",
			description: "",
			imageUrl: "",
			location: "",
			dateFound: new Date().toISOString().split("T")[0],
		},
	});

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedImage(file);
			const reader = new FileReader();
			reader.onload = (e) => {
				setImagePreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const { isPending, mutate } = useMutation({
		mutationFn: async (data: z.infer<typeof reportLostItemSchema>) => {
			const finalData = { ...data };
			if (selectedImage) {
				const imgResult = await uploadImage({ file: selectedImage });
				if (imgResult.error) {
					throw new Error(imgResult.error);
				}
				finalData.imageUrl = imgResult.data?.url!;
			}
			const response = await reportLostItem(finalData);
			if (!response.success) {
				throw new Error(response.error || "Failed to report lost item");
			}
			return { message: "Lost item reported successfully" };
		},
		onError: (e) => {
			toast.error("Something went wrong while reporting the lost item.", {
				description: e.message,
			});
		},
		onSuccess: async (data) => {
			toast.success(data.message);
			await revalidateRoute("/front-desk/lost-and-found");
			form.reset();
			setSelectedImage(null);
			setImagePreview(null);
			setShowSummary(false);
			setOpen(false);
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) {
					form.reset();
					setSelectedImage(null);
					setImagePreview(null);
					setShowSummary(false);
				}
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm">
					<PlusIcon className="h-4 w-4 mr-1" />
					Report Item
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Report Forgotten Item</DialogTitle>
					<DialogDescription>
						Log a found item to the forgotten items registry.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={(e) => e.preventDefault()} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="itemName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Item Name</FormLabel>
										<FormControl>
											<Input
												placeholder="e.g. Wallet, Keys, Phone..."
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="location"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Location Found</FormLabel>
										<FormControl>
											<Input placeholder="e.g. 101, Lobby..." {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="dateFound"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Date Found</FormLabel>
									<FormControl>
										<DatePicker
											initialDate={field.value}
											onChange={field.onChange}
											placeholder="Select date found"
											minDate={
												new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Image (Optional)</Label>
								{!imagePreview ? (
									<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
										<Input
											type="file"
											accept="image/*"
											onChange={handleImageUpload}
											className="hidden"
											id="lost-item-image-upload"
										/>
										<label
											htmlFor="lost-item-image-upload"
											className="cursor-pointer flex flex-col items-center gap-2"
										>
											<div className="text-gray-500">
												<svg
													className="w-8 h-8 mx-auto"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													aria-label="Upload image"
												>
													<title>Upload image</title>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
													/>
												</svg>
											</div>
											<div className="text-sm">
												<span className="text-primary font-medium">
													Click to upload
												</span>
												<span className="text-gray-500">
													{" "}
													or drag and drop
												</span>
											</div>
											<div className="text-xs text-gray-400">
												PNG, JPG, GIF up to 10MB
											</div>
										</label>
									</div>
								) : (
									<div className="relative w-full h-40 rounded-lg border overflow-hidden">
										<div
											className="w-full h-full bg-cover bg-center"
											style={{ backgroundImage: `url(${imagePreview})` }}
										/>
										<Button
											type="button"
											variant="destructive"
											size="sm"
											className="absolute top-2 right-2 h-8 w-8 p-0"
											onClick={() => {
												setSelectedImage(null);
												setImagePreview(null);
											}}
										>
											<XIcon className="h-4 w-4" />
										</Button>
									</div>
								)}
							</div>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel className="leading-none">Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Provide detailed description of the item, including color, size, brand, condition, and where exactly it was found..."
												className="resize-none h-full"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Button
							type="button"
							className="w-full font-semibold"
							onClick={() => {
								form.trigger().then((isValid) => {
									if (isValid) setShowSummary(true);
								});
							}}
							disabled={isPending}
						>
							Review & Submit
						</Button>

						<Dialog open={showSummary} onOpenChange={setShowSummary}>
							<DialogContent className="max-w-lg">
								<DialogTitle>Confirm Forgotten Item Report</DialogTitle>
								<DialogDescription>
									Please review the details before submitting the report.
								</DialogDescription>

								<div className="space-y-4">
									<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
										<h3 className="text-sm font-medium text-orange-900 mb-3">
											Forgotten Item Summary
										</h3>
										<div className="space-y-3 text-sm">
											<div className="grid grid-cols-2 gap-4">
												<div>
													<span className="text-orange-700 font-medium block">
														Item:
													</span>
													<span className="text-orange-800">
														{form.watch("itemName")}
													</span>
												</div>
												<div>
													<span className="text-orange-700 font-medium block">
														Location:
													</span>
													<span className="text-orange-800">
														{form.watch("location")}
													</span>
												</div>
											</div>

											<div>
												<span className="text-orange-700 font-medium block">
													Date Found:
												</span>
												<span className="text-orange-800">
													{form.watch("dateFound") &&
														formatDate(
															new Date(form.watch("dateFound")),
															"MMMM d, yyyy",
														)}
												</span>
											</div>

											{form.watch("description") && (
												<div className="pt-2 border-t border-orange-200">
													<span className="text-orange-700 font-medium block mb-2">
														Description:
													</span>
													<p className="text-orange-800 text-sm leading-relaxed bg-white rounded p-2 border border-orange-100">
														{form.watch("description")}
													</p>
												</div>
											)}

											{selectedImage && imagePreview && (
												<div className="pt-2 border-t border-orange-200">
													<span className="text-orange-700 font-medium block mb-2">
														Image:
													</span>
													<div className="w-20 h-20 rounded-lg border overflow-hidden">
														<div
															className="w-full h-full bg-cover bg-center"
															style={{
																backgroundImage: `url(${imagePreview})`,
															}}
														/>
													</div>
												</div>
											)}
										</div>
									</div>

									<div className="flex gap-3 pt-2">
										<Button
											variant="outline"
											onClick={() => setShowSummary(false)}
											className="flex-1"
										>
											Edit Details
										</Button>
										<Button
											onClick={() => mutate(form.getValues())}
											disabled={isPending}
											className="flex-1"
										>
											{isPending ? (
												<>
													<Loader2Icon className="animate-spin mr-2 h-4 w-4" />
													Submitting...
												</>
											) : (
												"Confirm & Submit"
											)}
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

function LostItemFilter({
	queryState,
	setQueryState,
	setOpen,
}: {
	queryState: {
		search: string | null;
		status: "UNCLAIMED" | "CLAIMED" | "DISPOSED" | null;
		dateFrom: string | null;
		dateTo: string | null;
	};
	setQueryState: SetValues<{
		search: ParserBuilder<string>;
		status: ParserBuilder<"UNCLAIMED" | "CLAIMED" | "DISPOSED">;
		dateFrom: ParserBuilder<string>;
		dateTo: ParserBuilder<string>;
	}>;
	setOpen: (open: boolean) => void;
}) {
	const [tempFilters, setTempFilters] = useState({
		status: queryState.status || null,
		dateFrom: queryState.dateFrom || null,
		dateTo: queryState.dateTo || null,
	});

	// Memoized callback functions to prevent unnecessary re-renders
	const applyFilters = useCallback(() => {
		setQueryState({
			...queryState,
			status: tempFilters.status,
			dateFrom: tempFilters.dateFrom,
			dateTo: tempFilters.dateTo,
		});
		setOpen(false);
	}, [queryState, tempFilters, setQueryState, setOpen]);

	const clearFilters = useCallback(() => {
		const clearedFilters = {
			status: null,
			dateFrom: null,
			dateTo: null,
		};
		setTempFilters(clearedFilters);
		setQueryState({
			search: queryState.search,
			status: null,
			dateFrom: null,
			dateTo: null,
		});
	}, [queryState.search, setQueryState]);

	// Memoize filter state computations
	const filterStates = useMemo(() => {
		const hasActiveFilters = !!(
			tempFilters.status ||
			tempFilters.dateFrom ||
			tempFilters.dateTo
		);
		const hasAppliedFilters = !!(
			queryState.status ||
			queryState.dateFrom ||
			queryState.dateTo
		);
		const appliedFiltersCount = [
			queryState.status,
			queryState.dateFrom,
			queryState.dateTo,
		].filter(Boolean).length;

		return {
			hasActiveFilters,
			hasAppliedFilters,
			appliedFiltersCount,
		};
	}, [
		tempFilters.status,
		tempFilters.dateFrom,
		tempFilters.dateTo,
		queryState.status,
		queryState.dateFrom,
		queryState.dateTo,
	]);

	const statusOptions = useMemo(
		() => [
			{ value: "UNCLAIMED", label: "Unclaimed", color: "bg-gray-500" },
			{ value: "CLAIMED", label: "Claimed", color: "bg-green-500" },
			{ value: "DISPOSED", label: "Disposed", color: "bg-red-500" },
		],
		[],
	);

	return (
		<div className="space-y-4 w-80">
			<div className="flex items-center justify-between">
				<h4 className="font-semibold text-sm">Filter Forgotten Items</h4>
				<Button
					variant="ghost"
					size="sm"
					onClick={clearFilters}
					className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
				>
					<RotateCcwIcon className="h-3 w-3 mr-1" />
					Clear all
				</Button>
			</div>

			{/* Status Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Item Status</Label>
				<Select
					value={tempFilters.status || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							status:
								value === "all"
									? null
									: (value as "UNCLAIMED" | "CLAIMED" | "DISPOSED"),
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All Items" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Items</SelectItem>
						{statusOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								<div className="flex items-center gap-2">
									<div className={`w-2 h-2 ${option.color} rounded-full`}></div>
									{option.label}
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Date Range Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Date Found Range</Label>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<Label className="text-xs text-muted-foreground">From</Label>
						<DatePicker
							initialDate={tempFilters.dateFrom || ""}
							onChange={(date) => {
								setTempFilters({
									...tempFilters,
									dateFrom: date || null,
								});
							}}
						/>
					</div>
					<div>
						<Label className="text-xs text-muted-foreground">To</Label>
						<DatePicker
							initialDate={tempFilters.dateFrom || ""}
							onChange={(date) => {
								setTempFilters({
									...tempFilters,
									dateTo: date || null,
								});
							}}
						/>
					</div>
				</div>
			</div>

			{/* Filter Summary */}
			{filterStates.hasActiveFilters && (
				<div className="pt-2 border-t">
					<p className="text-xs text-muted-foreground mb-2">Active filters:</p>
					<div className="flex flex-wrap gap-1">
						{tempFilters.status && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								Status:{" "}
								{
									statusOptions.find((s) => s.value === tempFilters.status)
										?.label
								}
							</span>
						)}
						{tempFilters.dateFrom && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								From:{" "}
								{formatDate(new Date(tempFilters.dateFrom), "MMMM d, yyyy")}
							</span>
						)}
						{tempFilters.dateTo && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								To: {formatDate(new Date(tempFilters.dateTo), "MMMM d, yyyy")}
							</span>
						)}
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex gap-2 pt-2">
				<Button
					variant="outline"
					size="sm"
					onClick={clearFilters}
					className="flex-1"
				>
					Clear
				</Button>
				<Button size="sm" onClick={applyFilters} className="flex-1">
					Apply Filters
				</Button>
			</div>
		</div>
	);
}

function Toolbar({ table: _ }: { table: TableType<LostItem> }) {
	const [queryStates, setQueryStates] = useQueryStates({
		search: parseAsString,
		status: parseAsStringLiteral(["UNCLAIMED", "CLAIMED", "DISPOSED"]),
		dateFrom: parseAsString, // yyyy-mm-dd
		dateTo: parseAsString, // yyyy-mm-dd
	});

	const [open, setOpen] = useState(false);

	return (
		<div className="flex items-center justify-between space-x-2 bg-card border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div>
				<div className="relative">
					<input
						type="text"
						placeholder="Search forgotten items..."
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
						value={queryStates.search ?? ""}
						onChange={(e) => setQueryStates({ search: e.target.value || null })}
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>
			</div>

			<div className="flex items-center gap-x-2">
				<ReportLostItemDialog />
				<div className="flex items-center gap-2">
					<TableFilter open={open} setOpen={setOpen}>
						<LostItemFilter
							queryState={queryStates}
							setQueryState={setQueryStates}
							setOpen={setOpen}
						/>
					</TableFilter>

					{/* Applied Filters Display */}
					{(queryStates.status ||
						queryStates.dateFrom ||
						queryStates.dateTo) && (
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							{queryStates.status && (
								<div className="flex items-center gap-1">
									<span>Status:</span>
									<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium capitalize">
										{queryStates.status.toLowerCase()}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQueryStates({ status: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</div>
							)}
							{queryStates.dateFrom && (
								<div className="flex items-center gap-1">
									<span>From:</span>
									<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
										{new Date(queryStates.dateFrom).toLocaleDateString()}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQueryStates({ dateFrom: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</div>
							)}
							{queryStates.dateTo && (
								<div className="flex items-center gap-1">
									<span>To:</span>
									<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
										{new Date(queryStates.dateTo).toLocaleDateString()}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQueryStates({ dateTo: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function DisplayItemInfo({
	value,
	info,
}: {
	value: string;
	info: CellContext<LostItem, string>;
}) {
	useEffect(() => {
		const img = new Image();
		img.src = info.row.original.imageUrl || "";
	}, [info.row.original.imageUrl]);

	return (
		<Dialog modal>
			<DialogTrigger className="hover:underline cursor-pointer">
				{value}
			</DialogTrigger>

			<DialogContent className="max-w-2xl">
				<div className="space-y-6">
					<div className="border-b pb-4">
						<DialogTitle className="text-xl font-semibold">
							{info.row.original.itemName}
						</DialogTitle>
						<p className="text-sm text-muted-foreground">
							ID: {info.row.original.customId}
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Item Image */}
						{info.row.original.imageUrl && (
							<div className="space-y-2">
								<h3 className="font-medium text-sm">Item Photo</h3>
								{/** biome-ignore lint/performance/noImgElement: Fast preload */}
								<img
									src={info.row.original.imageUrl}
									alt={info.row.original.itemName}
									width={300}
									height={200}
									className="w-full h-48 object-cover rounded-lg border"
								/>
							</div>
						)}

						{/* Item Details */}
						<div className="space-y-4">
							<div>
								<h3 className="font-medium text-sm text-muted-foreground mb-1">
									Description
								</h3>
								<p className="text-sm">{info.row.original.description}</p>
							</div>

							<div>
								<h3 className="font-medium text-sm text-muted-foreground mb-1">
									Found Location
								</h3>
								<p className="text-sm">
									Location: {info.row.original.location}
								</p>
							</div>

							<div>
								<h3 className="font-medium text-sm text-muted-foreground mb-1">
									Date Found
								</h3>
								<p className="text-sm">
									{new Date(info.row.original.dateFound).toLocaleDateString(
										"en-US",
										{
											year: "numeric",
											month: "long",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										},
									)}
								</p>
							</div>

							<div>
								<h3 className="font-medium text-sm text-muted-foreground mb-1">
									Logged By
								</h3>
								<p className="text-sm">{info.row.original.loggedBy}</p>
							</div>

							<div>
								<h3 className="font-medium text-sm text-muted-foreground mb-1">
									Hotel
								</h3>
								<p className="text-sm">{info.row.original.hotelName}</p>
							</div>
						</div>
					</div>

					{/* Claim Status Section */}
					<div className="border-t pt-4 space-y-4">
						<div className="flex items-center gap-2">
							<h3 className="font-medium text-sm text-muted-foreground">
								Status:
							</h3>
							<Badge
								variant={
									info.row.original.claimStatus === "CLAIMED"
										? "green"
										: info.row.original.claimStatus === "UNCLAIMED"
											? "gray"
											: "red"
								}
								className="capitalize"
							>
								{info.row.original.claimStatus.toLowerCase()}
							</Badge>
						</div>

						{/* Claim Details (if claimed) */}
						{info.row.original.claimStatus === "CLAIMED" && (
							<div className="space-y-2 bg-green-50 p-3 rounded-lg">
								{info.row.original.claimedBy && (
									<div>
										<h4 className="font-medium text-sm text-muted-foreground">
											Claimed By
										</h4>
										<p className="text-sm">{info.row.original.claimedBy}</p>
									</div>
								)}

								{info.row.original.claimedDate && (
									<div>
										<h4 className="font-medium text-sm text-muted-foreground">
											Claim Date
										</h4>
										<p className="text-sm">
											{new Date(
												info.row.original.claimedDate,
											).toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
								)}

								{info.row.original.claimNotes && (
									<div>
										<h4 className="font-medium text-sm text-muted-foreground">
											Claim Notes
										</h4>
										<p className="text-sm">{info.row.original.claimNotes}</p>
									</div>
								)}
							</div>
						)}

						{/* Timestamps */}
						<div className="text-xs text-muted-foreground space-y-1">
							<p>
								Created:{" "}
								{new Date(info.row.original.createdAt).toLocaleString()}
							</p>
							<p>
								Last Updated:{" "}
								{new Date(info.row.original.updatedAt).toLocaleString()}
							</p>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

type LostItemDialogSharedProps = {
	open: boolean;
	onOpenChange: Dispatch<SetStateAction<boolean>>;
	info: LostItem;
};

const updateLostItemSchema = z.object({
	claimStatus: z.enum(["UNCLAIMED", "CLAIMED", "DISPOSED"]),
	claimedBy: z
		.string()
		.nonempty("Claimed by is required when marking as claimed")
		.optional(),
	claimNotes: z.string().optional(),
});

function UpdateLostItemDialog({
	onOpenChange,
	info,
}: LostItemDialogSharedProps) {
	const setShowSuccessDialog = useSetAtom(successDialogAtom);

	// We'll need the update mutation here - placeholder for now
	const { mutateAsync, isPending } = useMutation({
		mutationFn: async ({
			claimStatus,
			...payload
		}: z.infer<typeof updateLostItemSchema>) => {
			if (claimStatus === "DISPOSED") {
				const response = await deleteLostItem({ itemId: info.id });

				if (!response.success) {
					throw new Error(response.error || "Failed to dispose lost item");
				}

				return response.data;
			}

			if (claimStatus === "CLAIMED") {
				const response = await claimLostItem({
					itemId: info.id,
					...payload,
					claimedBy: payload.claimedBy || "Unknown",
				});
				if (!response.success) {
					throw new Error(response.error || "Failed to claim lost item");
				}

				return response.data;
			}
		},
		onSuccess: async (data) => {
			setShowSuccessDialog({
				show: true,
				message: data?.data || "Lost item updated successfully",
			});
			await revalidateRoute("/front-desks/lost-and-found");
			onOpenChange(false);
		},
		onError: async (e: Error) => {
			toast.error("Failed to update lost item", {
				description: e.message,
			});
		},
	});

	const form = useForm({
		resolver: zodResolver(updateLostItemSchema),
		defaultValues: {
			claimStatus: info.claimStatus,
			claimedBy: info.claimedBy ?? undefined,
			claimNotes: info.claimNotes || "",
		},
		reValidateMode: "onBlur",
		mode: "onBlur",
	});

	const watchedClaimStatus = form.watch("claimStatus");

	const handleUpdate = useCallback(
		async (data: z.infer<typeof updateLostItemSchema>) => {
			console.log("Submitting update with data:", data);
			// Validate that if status is CLAIMED, claimedBy is required
			if (data.claimStatus === "CLAIMED" && !data.claimedBy?.trim()) {
				form.setError("claimedBy", {
					type: "required",
					message: "Claimed by is required when marking as claimed",
				});
				console.error("Claimed by is required when marking as claimed");
				return;
			}

			await mutateAsync(data);
		},
		[mutateAsync, form],
	);

	return (
		<DialogContent className="max-w-md">
			<DialogHeader>
				<DialogTitle>Update Forgotten Item</DialogTitle>
				<DialogDescription>
					Update claim details for the lost item "{info.itemName}"
				</DialogDescription>
			</DialogHeader>

			{/* Item Summary */}
			<div className="border rounded-lg p-3 bg-muted/30">
				<div className="flex items-start gap-3">
					{info.imageUrl && (
						/** biome-ignore lint/performance/noImgElement: Small preview image */
						<img
							src={info.imageUrl}
							alt={info.itemName}
							className="w-12 h-12 object-cover rounded border"
						/>
					)}
					<div className="flex-1 min-w-0">
						<p className="font-medium text-sm truncate">{info.itemName}</p>
						<p className="text-xs text-muted-foreground">ID: {info.customId}</p>
						<p className="text-xs text-muted-foreground">
							Location: {info.location}
						</p>
					</div>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
					{/* Claim Status */}
					<FormField
						control={form.control}
						name="claimStatus"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Status</FormLabel>
								<FormControl>
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="UNCLAIMED" disabled>
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 bg-gray-500 rounded-full"></div>
													Unclaimed
												</div>
											</SelectItem>
											<SelectItem value="CLAIMED">
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 bg-green-500 rounded-full"></div>
													Claimed
												</div>
											</SelectItem>
											<SelectItem value="DISPOSED">
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 bg-red-500 rounded-full"></div>
													Disposed
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Claimed By - Only show when status is CLAIMED */}
					{watchedClaimStatus === "CLAIMED" && (
						<FormField
							control={form.control}
							name="claimedBy"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Claimed By</FormLabel>
									<FormControl>
										<Input
											autoFocus={false}
											placeholder="Enter claimant's name"
											{...field}
											disabled={info.claimStatus === "CLAIMED"}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{/* Claim Notes - Show for CLAIMED or DISPOSED status */}
					{(watchedClaimStatus === "CLAIMED" ||
						watchedClaimStatus === "DISPOSED") && (
						<FormField
							control={form.control}
							name="claimNotes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{watchedClaimStatus === "CLAIMED"
											? "Claim Notes"
											: "Disposal Notes"}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={
												watchedClaimStatus === "CLAIMED"
													? "Add any notes about the claim (optional)"
													: "Add any notes about disposal (optional)"
											}
											{...field}
											disabled={info.claimStatus === "CLAIMED"}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{/* Current Status Info */}
					<div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
						<p>
							<strong>Current Status:</strong> {info.claimStatus}
						</p>
						{info.claimedBy && (
							<p>
								<strong>Previously Claimed By:</strong> {info.claimedBy}
							</p>
						)}
						{info.claimedDate && (
							<p>
								<strong>Claim Date:</strong>{" "}
								{new Date(info.claimedDate).toLocaleDateString()}
							</p>
						)}
					</div>

					{/* Action Buttons */}
					<div className="flex gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="flex-1"
							disabled={info.claimStatus === "CLAIMED" || isPending}
						>
							{isPending ? (
								<>
									<Loader2Icon className="animate-spin mr-2 h-4 w-4" />
									Updating...
								</>
							) : (
								"Update Item"
							)}
						</Button>
					</div>
				</form>
			</Form>
		</DialogContent>
	);
}

const columnHelper = createColumnHelper<LostItem>();

const columns = [
	columnHelper.accessor("itemName", {
		header: "Item Name",
		cell: (info) => {
			const value = info.getValue();

			return <DisplayItemInfo value={value} info={info} />;
		},
	}),
	columnHelper.accessor("description", {
		header: "Description",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("dateFound", {
		header: "Date Found",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("location", {
		header: "Location",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("loggedBy", {
		header: "Logged By",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("claimStatus", {
		header: "Status",
		cell: (info) => {
			const status = info.getValue();
			const variant =
				status === "CLAIMED"
					? "green"
					: status === "UNCLAIMED"
						? "gray"
						: "red";
			return (
				<Badge variant={variant} className="capitalize">
					{status}
				</Badge>
			);
		},
	}),
	columnHelper.accessor("claimedBy", {
		header: "Claimed By",
		cell: (info) => info.getValue() || "-",
	}),
	columnHelper.display({
		id: "Actions",
		cell: (info) => {
			const [open, setOpen] = useState(false);

			return (
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button variant="ghost" size="icon">
							<PenIcon />
						</Button>
					</DialogTrigger>

					<UpdateLostItemDialog
						open={open}
						onOpenChange={setOpen}
						info={info.row.original}
					/>
				</Dialog>
			);
		},
	}),
];

function LostItemTable({ table }: { table: TableType<LostItem> }) {
	return (
		<div className="overflow-hidden rounded-md border">
			<Table>
				<TableHeader className="bg-gray-100">
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id} className="text-gray-500">
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>

				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id} className="text-gray-600">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell colSpan={columns.length}>
							<div className="w-full flex items-center justify-between">
								<p>
									{table.getFilteredSelectedRowModel().rows.length} of{" "}
									{table.getFilteredRowModel().rows.length} row(s) selected.
								</p>

								<DataTablePagination table={table} />
							</div>
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</div>
	);
}

export function FrontDeskLostItemStats({
	stats,
}: {
	stats: APIOutput<"@get/api/front-desks/lost-and-found/stats">["data"];
}) {
	const data = [
		{
			label: "Total Items",
			value: stats.totalItems,
			color: "text-green-500 bg-green-500/10",
		},
		{
			label: "Total Claimed Items",
			value: stats.claimedItems,
			color: "text-blue-500 bg-blue-500/10",
		},
		{
			label: "Total unclaimed Items",
			value: stats.unclaimedItems,
			color: "text-red-500 bg-red-500/10",
		},
	];

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
			{data.map((stat) => (
				<div
					key={stat.label}
					className="bg-card border border-primary-5/10 rounded-xl md:rounded-2xl p-3 flex flex-col gap-y-4"
				>
					<div
						className={cn(
							"size-10 rounded-full flex items-center justify-center mb-2",
							stat.color,
						)}
					>
						<BedIcon />
					</div>
					<div className="space-y-2">
						<div className="text-sm text-muted-foreground">{stat.label}</div>
						<div className="text-2xl font-medium">{stat.value}</div>
					</div>
				</div>
			))}
		</div>
	);
}

export function LostItemPage({
	data,
	breadcrumbs,
	paginationMeta,
}: {
	data: LostItem[];
	breadcrumbs: {
		title: string;
		breadcrumbs: Breadcrumb[];
	};
	paginationMeta: Pagination;
}) {
	const [pagination, onPaginationChange] = usePaginationSearchParams();
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			pagination,
		},
		onPaginationChange,
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
	});

	const setBreadcrumb = useSetAtom(breadcrumbAtom);

	useEffect(() => {
		setBreadcrumb(breadcrumbs);
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumbs]);

	return (
		<div className="space-y-4">
			<Toolbar table={table} />
			<LostItemTable table={table} />
		</div>
	);
}
