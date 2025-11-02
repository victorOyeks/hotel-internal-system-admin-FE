
"use client";

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
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/shared/date-picker";
import { useForm, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

const logBarSaleSchema = z.object({
  destination: z.string().nonempty("Destination is required"),
  items: z
    .array(
      z.object({
        barItemId: z.string().nonempty("Item ID is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        rate: z.number().min(0.1, "Rate must be at least 0.1"),
        note: z.string().optional(),
      })
    )
    .min(1, "At least one item is required"),
  note: z.string().optional(),
  bookingId: z.string().nonempty("Booking ID is required"),
});

export function LogBarSale({ setOpen }: { setOpen: (open: boolean) => void }) {
  const form = useForm({
    resolver: zodResolver(logBarSaleSchema),
    defaultValues: {
      destination: "",
      items: [
        {
          barItemId: "",
          quantity: 1,
          rate: 0,
          note: "",
        },
      ],
      note: "",
      bookingId: "",
    },
    progressive: true,
    reValidateMode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof logBarSaleSchema>) => {
      // TODO: Replace with actual API call
      console.log("Logging bar sale:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: async () => {
      form.reset();
      setOpen(false);
      toast.success("Bar sale logged successfully");
      // TODO: Add revalidation if needed
      // await revalidateRoute("/kitchen/inventory");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to log bar sale",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col h-full gap-4"
        onSubmit={form.handleSubmit((data) => mutate(data))}
      >
        <ScrollArea className="h-full">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                name="bookingId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Booking ID</FormLabel>
                    <FormControl>
                      <Input placeholder="BKG-001" {...field} className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="destination"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Destination</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Room 101"
                        {...field}
                        className="h-9"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs">Items</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    append({
                      barItemId: "",
                      quantity: 1,
                      rate: 0,
                      note: "",
                    })
                  }
                >
                  <PlusIcon className="size-3 mr-1" />
                  Add
                </Button>
              </div>

              <ScrollArea>
                <div className="flex gap-2 pb-2 overflow-y-scroll scrollbar-hidden">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className={cn(
                        "p-2.5 border rounded-lg relative flex-shrink-0 w-full transition-[width]",
                        {
                          "w-3/4": fields.length > 1,
                        }
                      )}
                    >
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 z-10"
                          onClick={() => remove(index)}
                        >
                          <Trash2Icon className="size-3 text-red-500" />
                        </Button>
                      )}

                      <div className="space-y-2">
                        <FormField
                          name={`items.${index}.barItemId`}
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Item ID</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="ITEM-001"
                                  {...field}
                                  className="h-8 text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            name={`items.${index}.quantity`}
                            control={form.control}
                            render={() => (
                              <FormItem>
                                <FormLabel className="text-xs">Qty</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="2"
                                    className="h-8 text-sm"
                                    {...form.register(
                                      `items.${index}.quantity`,
                                      {
                                        valueAsNumber: true,
                                      }
                                    )}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            name={`items.${index}.rate`}
                            control={form.control}
                            render={() => (
                              <FormItem>
                                <FormLabel className="text-xs">Rate</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="10.50"
                                    className="h-8 text-sm"
                                    {...form.register(`items.${index}.rate`, {
                                      valueAsNumber: true,
                                    })}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          name={`items.${index}.note`}
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Note</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Optional"
                                  {...field}
                                  className="h-8 text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <FormField
              name="note"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    Order Note (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add order note..."
                      {...field}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            type="submit"
            className="w-full mt-4 font-semibold"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2Icon className="animate-spin" />
                <span>Logging sale...</span>
              </>
            ) : (
              "Log Sale"
            )}
          </Button>
        </ScrollArea>
      </form>
    </Form>
  );
}


const addFoodItemSchema = z.object({
  name: z.string().nonempty("Food item name is required"),
  price: z.number().positive("Price must be greater than 0"),
});

export function AddFoodItem({ setOpen }: { setOpen: (open: boolean) => void }) {
  const form = useForm({
    resolver: zodResolver(addFoodItemSchema),
    defaultValues: {
      name: "",
      price: 0,
    },
    progressive: true,
    reValidateMode: "onBlur",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof addFoodItemSchema>) => {
      // TODO: Replace with actual API call
      console.log("Adding food item:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: async () => {
      form.reset();
      setOpen(false);
      toast.success("Food item added successfully");
      // TODO: Add revalidation if needed
      // await revalidateRoute("/kitchen");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to add food item",
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
              <FormLabel>Food Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g Chicken Curry" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={() => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g 15.99"
                  {...form.register("price", { valueAsNumber: true })}
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
              <span>Adding, please wait...</span>
            </>
          ) : (
            "Add Food Item"
          )}
        </Button>
      </form>
    </Form>
  );
}

const addBarItemSchema = z.object({
  name: z.string().nonempty("Bar item name is required"),
  quantity: z.number().nonnegative("Quantity must be 0 or greater"),
  price: z.number().positive("Price must be greater than 0"),
});

export function AddBarItem({ setOpen }: { setOpen: (open: boolean) => void }) {
  const form = useForm({
    resolver: zodResolver(addBarItemSchema),
    defaultValues: {
      name: "",
      quantity: 0,
      price: 0,
    },
    progressive: true,
    reValidateMode: "onBlur",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof addBarItemSchema>) => {
      // TODO: Replace with actual API call
      console.log("Adding bar item:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: async () => {
      form.reset();
      setOpen(false);
      toast.success("Bar item added successfully");
      // TODO: Add revalidation if needed
      // await revalidateRoute("/kitchen");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to add bar item",
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
              <FormLabel>Bar Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g Mojito" {...field} />
              </FormControl>
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
            name="price"
            render={() => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g 12.50"
                    {...form.register("price", { valueAsNumber: true })}
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
              <span>Adding, please wait...</span>
            </>
          ) : (
            "Add Bar Item"
          )}
        </Button>
      </form>
    </Form>
  );
}