import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarIcon, CheckCircle2Icon, X } from "lucide-react";
import { Button } from "../ui/button";
import z from "zod";
import { Popover, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";

export function SuccessDialog({
  open,
  setOpen,
  message = "Changes saved.",
}: {
  open: boolean;
  message?: string;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen} modal>
      <DialogContent className="gap-0 !max-w-sm" showCloseButton={false}>
        <CheckCircle2Icon
          className="size-16 mx-auto text-green-600"
          strokeWidth={1}
        />
        <DialogTitle className="text-center text-2xl">Success!</DialogTitle>
        <DialogDescription className="text-center text-lg">
          {message}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

const exportSchema = z.object({
  from_data: z.date(),
  to_data: z.date(),
  export_type: z.enum(["pdf", "csv"]),
  destination: z.email(),
});

export function ExportDialog() {
  return (
    <Dialog modal>
      <Popover>
        <DialogTrigger asChild>
          <Button size={"sm"} className="rounded-md md:rounded-xl">
            Export
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Export file</DialogTitle>
          <DialogDescription className="sr-only">
            Export your data
          </DialogDescription>

          <div className="grid grid-cols-2">
            <div className="col-span-1">
              <p className="font-semibold">From</p>
              <PopoverTrigger>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
                    // !field.value && "text-muted-foreground"
                  )}
                >
                  {/* {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                  )} */}
                  <span>Pick a date</span>
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
            </div>
            <div className="col-span-1">
              <p className="font-semibold">To</p>
              <PopoverTrigger>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
                    // !field.value && "text-muted-foreground"
                  )}
                >
                  {/* {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                  )} */}
                  <span>Pick a date</span>
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
            </div>
          </div>
        </DialogContent>
      </Popover>
    </Dialog>
  );
}
