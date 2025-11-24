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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

const rentalItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  category: z.enum([
    "SPORTS_EQUIPMENT",
    "ELECTRONICS",
    "VEHICLES",
    "RECREATION",
    "CONFERENCE_EQUIPMENT",
    "BABY_ITEMS",
    "MOBILITY_AIDS",
    "OTHER",
  ]),
  hourlyRate: z.number().min(0).optional(),
  dailyRate: z.number().min(0).optional(),
  weeklyRate: z.number().min(0).optional(),
  monthlyRate: z.number().min(0).optional(),
  depositAmount: z.number().min(0, "Deposit amount is required"),
  totalQuantity: z.number().min(1, "At least 1 item required"),
  minRentalDuration: z.number().min(1).optional(),
  maxRentalDuration: z.number().min(1).optional(),
  replacementCost: z.number().min(0).optional(),
  specialInstructions: z.string().optional(),
  active: z.boolean(),
});

type RentalItemFormData = z.infer<typeof rentalItemSchema>;

type RentalItemDialogProps = {
  trigger?: React.ReactNode;
  item?: RentalItemFormData & { id: string };
  onSuccess?: () => void;
};

export function RentalItemDialog({ trigger, item, onSuccess }: RentalItemDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEditing = !!item;

  const form = useForm<RentalItemFormData>({
    resolver: zodResolver(rentalItemSchema),
    defaultValues: item || {
      name: "",
      description: "",
      category: "OTHER",
      hourlyRate: 0,
      dailyRate: 0,
      weeklyRate: 0,
      monthlyRate: 0,
      depositAmount: 0,
      totalQuantity: 1,
      minRentalDuration: 1,
      maxRentalDuration: 720,
      replacementCost: 0,
      specialInstructions: "",
      active: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RentalItemFormData) => {
      if (isEditing) {
        return await $fetch("@put/api/hotels/rentals/items/:itemId", {
          params: { itemId: item.id },
          input: data,
          throw: true,
        });
      } else {
        return await $fetch("@post/api/hotels/rentals/items", {
          input: data,
          throw: true,
        });
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing ? "Rental item updated successfully" : "Rental item created successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["rentals", "items"] });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save rental item");
    },
  });

  const onSubmit = (data: RentalItemFormData) => {
    mutation.mutate(data);
  };

  const categoryLabels = {
    SPORTS_EQUIPMENT: "Sports Equipment",
    ELECTRONICS: "Electronics",
    VEHICLES: "Vehicles",
    RECREATION: "Recreation",
    CONFERENCE_EQUIPMENT: "Conference Equipment",
    BABY_ITEMS: "Baby Items",
    MOBILITY_AIDS: "Mobility Aids",
    OTHER: "Other",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <PackageIcon className="w-4 h-4 mr-2" />
            Add Rental Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditing ? "Edit Rental Item" : "Add New Rental Item"}
          </DialogTitle>
          <DialogDescription>
            Configure rental item details, pricing, and availability
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Mountain Bike" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categoryLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the rental item..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include condition, features, or special notes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Quantity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Units available to rent</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="depositAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Refundable deposit amount</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Set different rates for various rental durations. The system automatically
                    selects the best rate based on rental length.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormDescription>For rentals under 24 hours</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dailyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormDescription>For 1-6 day rentals</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weeklyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weekly Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormDescription>For 7-29 day rentals</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormDescription>For 30+ day rentals</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minRentalDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Rental (hours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormDescription>Minimum rental duration</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxRentalDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Rental (hours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="720"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormDescription>Maximum rental duration</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="replacementCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Replacement Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormDescription>Cost if item is lost or destroyed</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Usage instructions, care guidelines, etc."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Instructions for staff or customers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                {isEditing ? "Update Item" : "Create Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
