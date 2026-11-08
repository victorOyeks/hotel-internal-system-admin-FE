"use client";

import { FileSpreadsheetIcon } from "lucide-react";

type Props = {
	selectedFile?: File | null;
	steps?: string[];
};

export function FileUploadLoader({
	selectedFile,
	steps = ["Reading file data", "Validating entries", "Creating records"],
}: Props) {
	return (
		<div className="flex flex-col items-center justify-center gap-8 py-10">
			{/* Spinning ring with file icon */}
			<div className="relative size-24">
				<svg
					className="absolute inset-0 size-24 animate-spin"
					style={{ animationDuration: "1.2s" }}
					viewBox="0 0 96 96"
					fill="none"
				>
					<circle
						cx="48"
						cy="48"
						r="40"
						stroke="currentColor"
						strokeWidth="5"
						className="text-muted-foreground/10"
					/>
					<path
						d="M 48 8 A 40 40 0 0 1 88 48"
						stroke="currentColor"
						strokeWidth="5"
						strokeLinecap="round"
						className="text-primary"
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
						<FileSpreadsheetIcon className="size-7 text-primary" />
					</div>
				</div>
			</div>

			{/* Title + filename */}
			<div className="text-center space-y-1">
				<p className="font-semibold text-foreground">Processing your file</p>
				{selectedFile && (
					<p className="text-xs text-muted-foreground max-w-[200px] truncate mx-auto">
						{selectedFile.name}
					</p>
				)}
			</div>

			{/* Staggered pulsing steps */}
			<div className="flex flex-col gap-3 w-full max-w-[200px]">
				{steps.map((step, i) => (
					<div key={step} className="flex items-center gap-3">
						<span
							className="size-2 shrink-0 rounded-full bg-primary animate-pulse"
							style={{ animationDelay: `${i * 350}ms` }}
						/>
						<span className="text-xs text-muted-foreground">{step}</span>
					</div>
				))}
			</div>
		</div>
	);
}
