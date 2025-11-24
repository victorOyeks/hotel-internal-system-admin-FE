"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { $fetch } from "@/lib/fetch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { ClockIcon, Loader2Icon, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const extensionSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  newReturnDate: z.date({
    error: "New return date is required",
  }),
  extensionReason: z.string().optional(),
  notes: z.string().optional(),
});

type ExtensionFormData = z.infer<typeof extensionSchema>;

type ExtensionDialogProps = {
  trigger?: React.ReactNode;
  orderId?: string;
  currentReturnDate?: Date;
  onSuccess?: () => void;
};

export function ExtensionDialog({
  trigger,
  orderId,
  currentReturnDate,
  onSuccess,
}: ExtensionDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ExtensionFormData>({
    resolver: zodResolver(extensionSchema),
    defaultValues: {
      orderId: orderId || "",
      extensionReason: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ExtensionFormData) => {
      return await $fetch("@post/api/hotels/rentals/orders/:orderId/extend", {
        params: { orderId: data.orderId },
        input: {
          newReturnDate: data.newReturnDate.toISOString(),
          extensionReason: data.extensionReason,
          notes: data.notes,
        },
        throw: true,
      });
    },
    onSuccess: (response) => {
      toast.success("Rental extended successfully", {
        description: `New return date: ${format(form.watch("newReturnDate"), "PPP")}`,
      });
      queryClient.invalidateQueries({ queryKey: ["rentals", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["rentals", "dashboard-stats"] });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to extend rental");
    },
  });

  const onSubmit = (data: ExtensionFormData) => {
    if (currentReturnDate && data.newReturnDate <= currentReturnDate) {
      toast.error("New return date must be after current return date");
      return;
    }
    mutation.mutate(data);
  };

  const calculateExtension = () => {
    const newDate = form.watch("newReturnDate");
    if (currentReturnDate && newDate) {
      const hours = Math.ceil(
        (newDate.getTime() - currentReturnDate.getTime()) / (1000 * 60 * 60)
      );
      const days = Math.ceil(hours / 24);
      return { hours, days };
    }
    return null;
  };

  const extension = calculateExtension();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <ClockIcon className="w-4 h-4 mr-2" />
            Extend Rental
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Extend Rental Period</DialogTitle>
          <DialogDescription>
            Extend the rental period for this order
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!orderId && (
              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order ID *</FormLabel>
                    <FormControl>
                      <Input placeholder="RNT-20250122-0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentReturnDate && (
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Current Return Date:</p>
                    <p className="font-semibold text-lg mt-1">
                      {format(currentReturnDate, "PPP")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <FormField
              control={form.control}
              name="newReturnDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>New Return Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < (currentReturnDate || new Date())
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Must be after the current return date
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {extension && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-blue-900">
                      Extension Details:
                    </p>
                    <p className="text-sm text-blue-800">
                      Additional {extension.days} day{extension.days !== 1 ? "s" : ""} (
                      {extension.hours} hours)
                    </p>
                    <p className="text-xs text-blue-700 mt-2">
                      Extension fees will be calculated based on the rental rates
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <FormField
              control={form.control}
              name="extensionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Extension</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Customer request" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {mutation.isPending && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
                Extend Rental
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
