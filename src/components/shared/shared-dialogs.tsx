import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2Icon } from "lucide-react";

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
      <DialogContent className="gap-0 !max-w-sm"  showCloseButton={false}>
        <CheckCircle2Icon className="size-16 mx-auto text-green-600" strokeWidth={1} />
        <DialogTitle className="text-center text-2xl">Success!</DialogTitle>
        <DialogDescription className="text-center text-lg">
            {message}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}