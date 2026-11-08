"use client";

import { useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Button } from "@hospio/ui/primitives/button";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@hospio/ui/primitives/popover";
import {
	CalendarIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react";
import { cn } from "@hospio/ui/utils";

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

function getCurrentYearMonth() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthDisplay(value: string) {
	const [year, month] = value.split("-").map(Number);
	return new Date(year, month - 1).toLocaleString("en-US", {
		month: "long",
		year: "numeric",
	});
}

export function MonthYearPicker({
	paramKey = "selectedMonth",
}: {
	paramKey?: string;
}) {
	const [selectedMonth, setSelectedMonth] = useQueryState(
		paramKey,
		parseAsString
			.withDefault(getCurrentYearMonth())
			.withOptions({ shallow: false }),
	);
	const [open, setOpen] = useState(false);

	const [year, month] = selectedMonth.split("-").map(Number);
	const [viewYear, setViewYear] = useState(year);

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	const handleSelect = (monthIndex: number) => {
		const value = `${viewYear}-${String(monthIndex + 1).padStart(2, "0")}`;
		setSelectedMonth(value);
		setOpen(false);
	};

	const isFutureMonth = (monthIndex: number) => {
		return (
			viewYear > currentYear ||
			(viewYear === currentYear && monthIndex + 1 > currentMonth)
		);
	};

	const isSelected = (monthIndex: number) => {
		return viewYear === year && monthIndex + 1 === month;
	};

	const isCurrentMonth = (monthIndex: number) => {
		return viewYear === currentYear && monthIndex + 1 === currentMonth;
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="shadow-none text-gray-500"
				>
					<CalendarIcon className="size-4" />
					<span>{formatMonthDisplay(selectedMonth)}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3" align="end">
				<div className="flex items-center justify-between mb-3">
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						onClick={() => setViewYear((y) => y - 1)}
					>
						<ChevronLeftIcon className="size-4" />
					</Button>
					<span className="text-sm font-semibold">{viewYear}</span>
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						onClick={() =>
							setViewYear((y) => Math.min(y + 1, currentYear))
						}
						disabled={viewYear >= currentYear}
					>
						<ChevronRightIcon className="size-4" />
					</Button>
				</div>
				<div className="grid grid-cols-3 gap-1.5">
					{MONTHS.map((name, index) => (
						<Button
							key={name}
							variant={isSelected(index) ? "default" : "ghost"}
							size="sm"
							disabled={isFutureMonth(index)}
							className={cn(
								"text-xs h-8",
								isCurrentMonth(index) &&
									!isSelected(index) &&
									"ring-1 ring-primary/40",
							)}
							onClick={() => handleSelect(index)}
						>
							{name}
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
