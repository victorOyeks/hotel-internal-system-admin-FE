"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	UploadIcon,
	DownloadIcon,
	FileSpreadsheetIcon,
	XIcon,
	CheckCircle2Icon,
	XCircleIcon,
	Loader2Icon,
	PlusCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { bulkUploadLaundryItems } from "@/lib/laundry-actions";
import { revalidateRoute } from "@/lib/actions";
import type { BulkUploadResult } from "@/lib/bulk-upload-types";

// ─── Constants ─────────────────────────────────────────────────

const CSV_HEADERS = [
	"Name",
	"Category",
	"Description",
	"Wash Only Price",
	"Wash And Iron Price",
	"Wash And Fold Price",
	"Dry Clean Price",
	"Iron Only Price",
	"Steam Press Price",
	"Stain Removal Price",
	"Hand Wash Price",
	"Wash Iron And Pack Price",
	"Express Multiplier",
	"Same Day Multiplier",
	"Urgent Multiplier",
	"Special Instructions",
];

const CSV_EXAMPLE_ROW =
	"T-Shirt,CLOTHING,Regular cotton t-shirt,500,800,600,1500,300,500,400,700,1000,1.5,1.3,2.0,Handle with care";

// ─── Component ─────────────────────────────────────────────────

export function LaundryBulkUploadDialog() {
	const [open, setOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
		null,
	);

	const fileUploadMutation = useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			const result = await bulkUploadLaundryItems(formData);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: (data) => {
			setUploadResult(data);
			const { successCount, failedCount } = data.summary;
			if (failedCount === 0) {
				toast.success(`All ${successCount} items uploaded successfully`);
			} else {
				toast.warning(
					`${successCount} succeeded, ${failedCount} failed`,
				);
			}
			revalidateRoute("/");
		},
		onError: (error: Error) => {
			toast.error(error.message || "File upload failed");
		},
	});

	function handleDownloadTemplate() {
		const csvContent = [CSV_HEADERS.join(","), CSV_EXAMPLE_ROW].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "laundry-items-template.csv";
		link.click();
		URL.revokeObjectURL(url);
	}

	function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			setUploadResult(null);
		}
	}

	function handleFileUpload() {
		if (!selectedFile) return;
		fileUploadMutation.mutate(selectedFile);
	}

	function handleRemoveFile() {
		setSelectedFile(null);
		setUploadResult(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	function handleOpenChange(isOpen: boolean) {
		setOpen(isOpen);
		if (!isOpen) {
			setSelectedFile(null);
			setUploadResult(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant="outline">
					<PlusCircleIcon className="w-4 h-4 mr-2" />
					Bulk Add Items
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
				<DialogTitle className="text-2xl">
					Bulk Add Laundry Items
				</DialogTitle>

				<div className="flex flex-col gap-4">
					{/* Template download */}
					<div className="flex items-center justify-between p-3 bg-muted/50 border rounded-md">
						<div className="flex items-center gap-3">
							<FileSpreadsheetIcon className="w-5 h-5 text-green-600" />
							<p className="text-sm text-muted-foreground">
								Download the template, fill it in, and upload it below
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleDownloadTemplate}
						>
							<DownloadIcon className="w-4 h-4 mr-2" />
							Download Template
						</Button>
					</div>

					{/* File picker */}
					<div className="border-2 border-dashed rounded-lg p-6 text-center">
						{!selectedFile ? (
							<div className="flex flex-col items-center gap-2">
								<UploadIcon className="w-8 h-8 text-muted-foreground" />
								<p className="text-sm text-muted-foreground">
									Select a CSV or Excel file to upload
								</p>
								<input
									ref={fileInputRef}
									type="file"
									accept=".csv,.xlsx,.xls"
									onChange={handleFileSelect}
									className="hidden"
								/>
								<Button
									variant="outline"
									size="sm"
									onClick={() => fileInputRef.current?.click()}
								>
									Choose File
								</Button>
							</div>
						) : (
							<div className="flex items-center justify-center gap-3">
								<FileSpreadsheetIcon className="w-5 h-5 text-green-600" />
								<div className="text-left">
									<p className="text-sm font-medium">{selectedFile.name}</p>
									<p className="text-xs text-muted-foreground">
										{(selectedFile.size / 1024).toFixed(1)} KB
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={handleRemoveFile}
									disabled={fileUploadMutation.isPending}
								>
									<XIcon className="w-4 h-4" />
								</Button>
							</div>
						)}
					</div>

					{/* Upload results */}
					{uploadResult && (
						<div className="border rounded-md">
							<div className="p-3 border-b bg-muted/50">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-semibold">Upload Results</h4>
									<div className="flex gap-2">
										<Badge
											variant="outline"
											className="bg-green-50 text-green-700 border-green-200"
										>
											<CheckCircle2Icon className="w-3 h-3 mr-1" />
											{uploadResult.summary.successCount} succeeded
										</Badge>
										{uploadResult.summary.failedCount > 0 && (
											<Badge
												variant="outline"
												className="bg-red-50 text-red-700 border-red-200"
											>
												<XCircleIcon className="w-3 h-3 mr-1" />
												{uploadResult.summary.failedCount} failed
											</Badge>
										)}
									</div>
								</div>
							</div>
							<ScrollArea className="max-h-[200px]">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-12">Row</TableHead>
											<TableHead>Item</TableHead>
											<TableHead className="w-24 text-center">
												Status
											</TableHead>
											<TableHead>Error</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{uploadResult.results.map((row) => (
											<TableRow key={row.rowNumber}>
												<TableCell className="text-xs font-mono">
													{row.rowNumber}
												</TableCell>
												<TableCell className="text-sm">
													{row.itemIdentifier || "-"}
												</TableCell>
												<TableCell className="text-center">
													{row.success ? (
														<CheckCircle2Icon className="w-4 h-4 text-green-600 mx-auto" />
													) : (
														<XCircleIcon className="w-4 h-4 text-red-600 mx-auto" />
													)}
												</TableCell>
												<TableCell className="text-xs text-red-600">
													{row.errorMessage || ""}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</ScrollArea>
						</div>
					)}

					<div className="flex justify-end gap-3 pt-2">
						<Button
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={fileUploadMutation.isPending}
						>
							Close
						</Button>
						<Button
							onClick={handleFileUpload}
							disabled={!selectedFile || fileUploadMutation.isPending}
						>
							{fileUploadMutation.isPending ? (
								<>
									<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
									Uploading...
								</>
							) : (
								<>
									<UploadIcon className="w-4 h-4 mr-2" />
									Upload File
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
