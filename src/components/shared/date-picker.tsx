"use client";

import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { useState } from "react";

function formatDate(date: Date | undefined) {
	if (!date) {
		return "";
	}

	return date.toLocaleDateString("en-US", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

function isValidDate(date: Date | undefined) {
	if (!date) {
		return false;
	}
	return !Number.isNaN(date.getTime());
}

export function DatePicker({
	initialDate,
	onChange,
	placeholder = "Select date",
	minDate,
}: {
	initialDate: string;
	onChange: (date: string) => void;
	placeholder?: string;
	minDate?: Date;
}) {
	const [open, setOpen] = useState(false);
	const [date, setDate] = useState<Date | undefined>(
		initialDate ? new Date(initialDate) : undefined,
	);
	const [month, setMonth] = useState<Date | undefined>(date || new Date());
	const [value, setValue] = useState(
		initialDate ? formatDate(new Date(initialDate)) : "",
	);

	// Update form when date changes — use local date to avoid UTC timezone shift
	const handleDateChange = (newDate: Date | undefined) => {
		if (newDate && isValidDate(newDate)) {
			const y = newDate.getFullYear();
			const m = String(newDate.getMonth() + 1).padStart(2, "0");
			const d = String(newDate.getDate()).padStart(2, "0");
			onChange(`${y}-${m}-${d}`);
		}
	};

	return (
		<div>
			{" "}
			<div className="relative h-auto">
				<Input
					value={value}
					placeholder={placeholder}
					className="bg-background pr-10 cursor-pointer"
					readOnly
					onClick={() => setOpen(true)}
					onKeyDown={(e) => {
						if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							setOpen(true);
						}
					}}
				/>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
						>
							<CalendarIcon className="size-3.5" />
							<span className="sr-only">Select date</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-auto overflow-hidden p-0"
						align="end"
						alignOffset={-8}
						sideOffset={10}
					>
						<Calendar
							mode="single"
							selected={date}
							captionLayout="dropdown"
							month={month}
							onMonthChange={setMonth}
							disabled={(date) => {
								if (!minDate) return false;
								const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
								const m = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
								return d < m;
							}}
							onSelect={(selectedDate) => {
								setDate(selectedDate);
								setValue(formatDate(selectedDate));
								handleDateChange(selectedDate);
								setOpen(false);
							}}
						/>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}
