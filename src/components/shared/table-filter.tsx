import { FilterIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { PropsWithChildren } from "react";

export function TableFilter({
	children,
	open,
	setOpen,
	count = 0,
}: PropsWithChildren<{
	open?: boolean;
	setOpen?: (open: boolean) => void;
	count?: number;
}>) {
	return (
		<Popover open={open} onOpenChange={setOpen} modal>
			<PopoverTrigger asChild>
				<Button
					size={"sm"}
					variant={"ghost"}
					className="rounded-md md:rounded-xl bg-gray-100 relative"
				>
					<FilterIcon />
					<span className="hidden md:inline">Filter</span>
					{count > 0 && (
						<span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
							{count}
						</span>
					)}
				</Button>
			</PopoverTrigger>

			<PopoverContent
				align="end"
				side="bottom"
				sideOffset={16}
				className="p-3 rounded-xl w-auto bg-white min-w-[260px]"
			>
				{children}
			</PopoverContent>
		</Popover>
	);
}
