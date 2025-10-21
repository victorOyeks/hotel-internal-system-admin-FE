import { FilterIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { PropsWithChildren } from "react";

export function TableFilter({
  children,
  open,
  setOpen,
}: PropsWithChildren<{
  open?: boolean;
  setOpen?: (open: boolean) => void;
}>) {
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          size={"sm"}
          variant={"ghost"}
          className="rounded-md md:rounded-xl bg-gray-100"
        >
          <FilterIcon />
          <span className="hidden md:inline">Filter</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={16}
        className="p-2 rounded-xl w-auto bg-white min-w-md"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
