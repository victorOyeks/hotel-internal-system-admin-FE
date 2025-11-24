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
import { Checkbox } from "@/components/ui/checkbox";
import { PackageCheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

const returnSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  hasDamage: z.boolean(),
  damageDescription: z.string().optional(),
  damageFee: z.number().min(0).optional(),
  lateFee: z.number().min(0).optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.hasDamage && !data.damageDescription) {
    return false;
  }
  return true;
}, {
  message: "Damage description is required when item has damage",
  path: ["damageDescription"],
});

type ReturnFormData = z.infer<typeof returnSchema>;

type ReturnDialogProps = {
  trigger?: React.ReactNode;
  orderId?: string;
  onSuccess?: () => void;
};

export function ReturnDialog({ trigger, orderId, onSuccess }: ReturnDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      orderId: orderId || "",
      hasDamage: false,
      damageDescription: "",
      damageFee: 0,
      lateFee: 0,
      notes: "",
    },
  });

  const hasDamage = form.watch("hasDamage");

  const mutation = useMutation({
    mutationFn: async (data: ReturnFormData) => {
      return await $fetch("@post/api/hotels/rentals/orders/:orderId/return", {
        params: { orderId: data.orderId },
        input: {
          hasDamage: data.hasDamage,
          damageDescription: data.damageDescription,
          damageFee: data.damageFee,
          lateFee: data.lateFee,
          notes: data.notes,
        },
        throw: true,
      });
    },
    onSuccess: () => {
      toast.success("Rental return processed successfully");
      queryClient.invalidateQueries({ queryKey: ["rentals", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["rentals", "dashboard-stats"] });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to process return");
    },
  });

  const onSubmit = (data: ReturnFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <PackageCheckIcon className="w-4 h-4 mr-2" />
            Process Return
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Process Rental Return</DialogTitle>
          <DialogDescription>
            Mark items as returned and assess any damage or late fees
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

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <FormField
                  control={form.control}
                  name="hasDamage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-semibold">
                          Item(s) have damage
                        </FormLabel>
                        <FormDescription>
                          Check this if any returned items are damaged
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {hasDamage && (
              <>
                <FormField
                  control={form.control}
                  name="damageDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Damage Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the damage..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="damageFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Damage Fee</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Amount to charge for damage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="lateFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Late Fee</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Fee for late return (if applicable)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the return..."
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
                Complete Return
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
