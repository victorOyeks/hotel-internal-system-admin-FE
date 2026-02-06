"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordRentalInspection } from "@/lib/rentals-actions";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const inspectionSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  passed: z.boolean(),
  inspectorName: z.string().min(1, "Inspector name is required"),
  inspectionDate: z.string(),
  issuesFound: z.string().optional(), // We'll convert comma separated to array or just send as description
  notes: z.string().optional(),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

type InspectionDialogProps = {
  trigger?: React.ReactNode;
  orderId?: string;
  onSuccess?: () => void;
};

export function InspectionDialog({
  trigger,
  orderId,
  onSuccess,
}: InspectionDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      orderId: orderId || "",
      passed: true,
      inspectorName: "",
      inspectionDate: new Date().toISOString().split("T")[0],
      issuesFound: "",
      notes: "",
    },
  });

  const passed = form.watch("passed");

  const mutation = useMutation({
    mutationFn: async (data: InspectionFormData) => {
      // Convert single string issues to array if present
      const payload = {
        ...data,
        issuesFound: data.issuesFound
          ? data.issuesFound.split(",").map((s) => s.trim())
          : undefined,
      };

      const res = await recordRentalInspection({
        ...payload,
      });

      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Inspection recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["rentals", "orders"] });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to record inspection");
    },
  });

  const onSubmit = (data: InspectionFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <ClipboardCheckIcon className="w-4 h-4" />
            Record Inspection
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Record Inspection</DialogTitle>
          <DialogDescription>
            Log an inspection result for this rental order.
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
                    <FormLabel>Order ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inspectorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspector Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inspectionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspection Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="passed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Inspection Passed
                    </FormLabel>
                    <FormDescription>
                      Did the items pass the quality check?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!passed && (
              <FormField
                control={form.control}
                name="issuesFound"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issues Found</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Scratch on surface, missing cable (comma separated)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      List specific defects or missing parts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any other observations..."
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
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Record
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
