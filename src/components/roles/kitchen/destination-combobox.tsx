"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { APIOutput } from "@/lib/action-utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createDestination } from "@/lib/restaurant-actions";
import { revalidateRoute } from "@/lib/actions";

type Destination =
	APIOutput<"@get/api/restaurants/destinations">["data"][number];

interface DestinationComboboxProps {
	value: string;
	onValueChange: (value: string) => void;
	destinations: Destination[];
}

export function DestinationCombobox({
	value,
	onValueChange,
	destinations,
}: DestinationComboboxProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const { mutate, isPending } = useMutation({
		mutationFn: async (name: string) => {
			const response = await createDestination({ name });

			if (response.error) {
				throw Error(response.error);
			}

			return response.data!;
		},
		onSuccess: async (newDestination) => {
			onValueChange(newDestination.id);
			setOpen(false);
			setSearchQuery("");
			toast.success("Destination created");
			await revalidateRoute("/dashboard/create-order");
		},
		onError: (e) => {
			toast.error(e.message);
		},
	});

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					{value
						? destinations.find((destination) => destination.id === value)
								?.name || value
						: "Select destination..."}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command>
					<CommandInput
						placeholder="Search destination..."
						value={searchQuery}
						onValueChange={setSearchQuery}
					/>
					<CommandList>
						<CommandEmpty>
							<div className="p-2">
								<p className="text-sm text-muted-foreground mb-2">
									No destination found.
								</p>
								<Button
									variant="outline"
									size="sm"
									onClick={() => mutate(searchQuery)}
									disabled={!searchQuery || isPending}
								>
									<PlusIcon />
									Create {!searchQuery ? "" : `"${searchQuery}"`}
								</Button>
							</div>
						</CommandEmpty>
						<CommandGroup>
							{destinations.map((destination) => (
								<CommandItem
									key={destination.id}
									value={destination.id}
									onSelect={(currentValue) => {
										onValueChange(currentValue === value ? "" : currentValue);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											value === destination.id ? "opacity-100" : "opacity-0",
										)}
									/>
									{destination.name}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
