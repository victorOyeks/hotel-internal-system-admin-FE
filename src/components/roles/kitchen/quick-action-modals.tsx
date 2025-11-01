
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2Icon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/shared/date-picker";

const receiveStockItemSchema = z.object({
  name: z.string().nonempty("Item name is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().nonempty("Unit is required"),
  note: z.string().optional(),
  department: z.enum([
    "BAR",
    "KITCHEN",
    "HOUSEKEEPING",
    "FRONT_DESK",
    "MAINTENANCE",
    "MANAGEMENT",
    "INVENTORY",
    "OTHER",
  ]),
  date: z.string().nonempty("Date is required"),
  time: z.string().nonempty("Time is required"),
});

export function ReceiveStockItem({ setOpen }: { setOpen: (open: boolean) => void }) {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const form = useForm({
    resolver: zodResolver(receiveStockItemSchema),
    defaultValues: {
      name: "",
      quantity: 0,
      unit: "",
      note: "",
      department: "BAR" as const,
      date: currentDate,
      time: currentTime,
    },
    progressive: true,
    reValidateMode: "onBlur",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof receiveStockItemSchema>) => {
      // Combine date and time into ISO string
      const dateTimeReceived = new Date(`${data.date}T${data.time}`).toISOString();
      
      const payload = {
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        note: data.note,
        department: data.department,
        dateTimeReceived,
      };
      
      // TODO: Replace with actual API call
      console.log("Receiving stock item:", payload);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return payload;
    },
    onSuccess: async () => {
      form.reset();
      setOpen(false);
      toast.success("Stock item received successfully");
      // TODO: Add revalidation if needed
      // await revalidateRoute("/kitchen");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to receive stock item",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => mutate(data))}
      >
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g Rice" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BAR">Bar</SelectItem>
                  <SelectItem value="KITCHEN">Kitchen</SelectItem>
                  <SelectItem value="HOUSEKEEPING">Housekeeping</SelectItem>
                  <SelectItem value="FRONT_DESK">Front Desk</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="MANAGEMENT">Management</SelectItem>
                  <SelectItem value="INVENTORY">Inventory</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={() => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g 50"
                    {...form.register("quantity", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input placeholder="e.g Kg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Add any notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Received</FormLabel>
                <FormControl>
                  <DatePicker
                    initialDate={field.value}
                    onChange={field.onChange}
                    placeholder="Select date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Received</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    step="1"
                    {...field}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="mt-4 w-full font-semibold"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2Icon className="animate-spin" />
              <span>Receiving, please wait...</span>
            </>
          ) : (
            "Receive Item"
          )}
        </Button>
      </form>
    </Form>
  );
}

export function ReportWastage({ setOpen }: { setOpen: (open: boolean) => void }) {
  return (
    <div>
      
    </div>
  );
}

const requestRestockSchema = z.object({
  barItemId: z.string().nonempty("Item is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
});

export function RequestRestock({ setOpen }: { setOpen: (open: boolean) => void }) {
  const form = useForm({
    resolver: zodResolver(requestRestockSchema),
    defaultValues: {
      barItemId: "",
      quantity: 0,
    },
    progressive: true,
    reValidateMode: "onBlur",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof requestRestockSchema>) => {
      // TODO: Replace with actual API call
      console.log("Requesting restock:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: async () => {
      form.reset();
      setOpen(false);
      toast.success("Restock request submitted successfully");
      // TODO: Add revalidation if needed
      // await revalidateRoute("/kitchen");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to submit restock request",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => mutate(data))}
      >
        <FormField
          name="barItemId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g ITEM-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={() => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g 50"
                  {...form.register("quantity", { valueAsNumber: true })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="mt-4 w-full font-semibold"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2Icon className="animate-spin" />
              <span>Submitting, please wait...</span>
            </>
          ) : (
            "Submit Request"
          )}
        </Button>
      </form>
    </Form>
  );
}