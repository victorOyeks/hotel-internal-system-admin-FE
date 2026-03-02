"use client";

import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { BulkUploadResult } from "@/lib/bulk-upload-types";

type BulkUploadResultDisplayProps = {
	result: BulkUploadResult;
	/** Label for the entity, e.g. "items", "rooms", "suppliers" */
	entityName?: string;
	/** Called when the user clicks "Done" / "Close" */
	onClose?: () => void;
	/** Called when the user clicks "Add More" / "Upload Another" — shows a reset button */
	onReset?: () => void;
	/** Custom label for the reset button */
	resetLabel?: string;
};

export function BulkUploadResultDisplay({
	result,
	entityName = "items",
	onClose,
	onReset,
	resetLabel = "Upload Another",
}: BulkUploadResultDisplayProps) {
	const { successCount, failedCount, totalRows } = result.summary;
	const allSucceeded = failedCount === 0;
	const successPercent =
		totalRows > 0 ? Math.round((successCount / totalRows) * 100) : 0;
	const failedRows = result.results.filter((r) => !r.success);

	return (
		<div className="flex flex-col gap-4">
			<div className="border rounded-lg overflow-hidden">
				{/* Summary banner */}
				<div
					className={cn(
						"px-4 py-3",
						allSucceeded ? "bg-green-50" : "bg-amber-50",
					)}
				>
					<div className="flex items-center gap-3">
						{allSucceeded ? (
							<div className="p-2 bg-green-100 rounded-full shrink-0">
								<CheckCircle2Icon className="w-5 h-5 text-green-600" />
							</div>
						) : (
							<div className="p-2 bg-amber-100 rounded-full shrink-0">
								<XCircleIcon className="w-5 h-5 text-amber-600" />
							</div>
						)}
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold">
								{allSucceeded
									? `All ${successCount} ${entityName} uploaded successfully`
									: `${successCount} of ${totalRows} ${entityName} uploaded`}
							</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								{allSucceeded
									? `All ${entityName} are now available in your catalog`
									: `${failedCount} ${failedCount !== 1 ? entityName : entityName.replace(/s$/, "")} failed \u2014 see details below`}
							</p>
						</div>
					</div>

					{/* Progress bar */}
					<div className="mt-3 flex items-center gap-3">
						<div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
							<div
								className="h-full rounded-full transition-all bg-green-500"
								style={{ width: `${successPercent}%` }}
							/>
						</div>
						<span className="text-xs font-medium text-muted-foreground shrink-0">
							{successPercent}%
						</span>
					</div>

					{/* Stat pills */}
					<div className="flex gap-4 mt-2.5">
						<div className="flex items-center gap-1.5 text-xs text-green-700">
							<span className="w-2 h-2 rounded-full bg-green-500" />
							{successCount} succeeded
						</div>
						{failedCount > 0 && (
							<div className="flex items-center gap-1.5 text-xs text-red-700">
								<span className="w-2 h-2 rounded-full bg-red-500" />
								{failedCount} failed
							</div>
						)}
					</div>
				</div>

				{/* Failed items detail */}
				{failedRows.length > 0 && (
					<div className="border-t">
						<div className="px-4 py-2 bg-red-50/50">
							<p className="text-xs font-semibold text-red-800">
								Failed {entityName.charAt(0).toUpperCase() + entityName.slice(1)}
							</p>
						</div>
						<ScrollArea className="max-h-[180px]">
							<div>
								{failedRows.map((row, idx) => (
									<div
										key={row.rowNumber}
										className={cn(
											"flex items-start gap-3 px-4 py-2.5",
											idx > 0 && "border-t",
										)}
									>
										<span className="text-xs font-mono text-muted-foreground shrink-0 w-8 pt-0.5">
											Row {row.rowNumber}
										</span>
										<div className="min-w-0 flex-1">
											<p className="text-sm font-medium">
												{row.itemIdentifier || "-"}
											</p>
											<p className="text-xs text-red-600 mt-0.5 break-words">
												{row.errorMessage}
											</p>
										</div>
									</div>
								))}
							</div>
						</ScrollArea>
					</div>
				)}
			</div>

			{/* Action buttons */}
			{(onClose || onReset) && (
				<div className="flex gap-2 justify-end">
					{onReset && (
						<Button variant="outline" onClick={onReset}>
							{resetLabel}
						</Button>
					)}
					{onClose && <Button onClick={onClose}>Done</Button>}
				</div>
			)}
		</div>
	);
}
