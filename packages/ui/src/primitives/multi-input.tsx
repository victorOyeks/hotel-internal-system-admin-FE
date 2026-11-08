"use client";

import { XIcon } from "lucide-react";
import { cn } from "@hospio/ui/utils";
import { Badge } from "@hospio/ui/primitives/badge";
import {
	type ComponentProps,
	createContext,
	use,
	useCallback,
	useRef,
	useState,
	type KeyboardEvent,
	type PropsWithChildren,
} from "react";

type MultiInputContextType = {
	values: string[];
	addValue: (value: string) => void;
	removeValue: (value: string) => void;
};
const MultiInputContext = createContext<MultiInputContextType | null>(null);

export function MultiInputTag({
	value, // RHF controlled value
	defaultValues,
	onChange, // RHF onChange
	className,
	children,
}: PropsWithChildren<{
	value?: string[];
	defaultValues?: string[];
	onChange?: (values: string[]) => void;
	className?: string;
}>) {
	const [internalValues, setInternalValues] = useState<string[]>(
		value ?? defaultValues ?? [],
	);
	const selectedValues = value ?? internalValues;

	const addValue = useCallback(
		(newValue: string) => {
			const trimmed = newValue.trim();
			if (!trimmed || selectedValues.includes(trimmed)) return;
			const updated = [...selectedValues, trimmed];
			setInternalValues(updated);
			onChange?.(updated);
		},
		[selectedValues, onChange],
	);

	const removeValue = useCallback(
		(val: string) => {
			const updated = selectedValues.filter((v) => v !== val);
			setInternalValues(updated);
			onChange?.(updated);
		},
		[selectedValues, onChange],
	);

	return (
		<MultiInputContext.Provider
			value={{ values: selectedValues, addValue, removeValue }}
		>
			<div
				className={cn(
					"flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
					"aria-invalid:ring-destructive-2/20 dark:aria-invalid:ring-destructive-2/40 aria-invalid:border-destructive-2",
					className,
				)}
			>
				{selectedValues.map((val) => (
					<Badge
						key={val}
						variant="default"
						className="group flex items-center gap-1 bg-primary-5/30 text-primary-1 hover:text-white"
					>
						{val}
						<XIcon
							className="cursor-pointer group-hover:text-destructive size-3"
							onClick={() => removeValue(val)}
						/>
					</Badge>
				))}
				{children}
			</div>
		</MultiInputContext.Provider>
	);
}

function useMultiInputContext() {
	const context = use(MultiInputContext);
	if (!context) {
		throw new Error(
			"MultiInput components must be used within a MultiInputTag",
		);
	}
	return context;
}

export function MultiInput(props: ComponentProps<"input">) {
	const { addValue, removeValue, values } = useMultiInputContext();
	const inputRef = useRef<HTMLInputElement>(null);

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const input = inputRef.current;
			if (input?.value.trim()) {
				addValue(input.value);
				input.value = "";
			}
		}
		if (e.key === "Backspace" && !inputRef.current?.value) {
			removeValue(values[values.length - 1]);
		}
	};

	return (
		<input
			{...props}
			ref={inputRef}
			onKeyDown={handleKeyDown}
			className={cn(
				"flex-1 bg-transparent outline-none placeholder:text-muted-foreground",
				"aria-invalid:ring-destructive-2/20 dark:aria-invalid:ring-destructive-2/40 aria-invalid:border-destructive-2",
			)}
		/>
	);
}
