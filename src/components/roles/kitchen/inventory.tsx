"use client";

import {
  BoxIcon,
  ChevronRightIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import {
  type InventoryResponse,
  type InventoryRestockRequest,
  RestaurantInventoryTable,
} from "./inventory-table";
import { breadcrumbAtom, type Breadcrumb } from "@/lib/store";
import type { Pagination } from "@/lib/fetch";
import { useSetAtom } from "jotai";
import {
  type PropsWithChildren,
  type ReactNode,
  useLayoutEffect,
  useState,
} from "react";
import type { APIOutput } from "@/lib/action-utils";
import {
  DialogTitle,
  DialogDescription,
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import { useForm, useFieldArray } from "react-hook-form";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type InventorySummaryResponse =
  APIOutput<"@get/api/restaurants/bar-inventory-summary">["data"];

function InventoryStat({ data }: { data: InventorySummaryResponse }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
        <div className="size-10 aspect-square bg-blue-600/10 rounded-full flex items-center justify-center">
          <BoxIcon className="size-6 text-blue-600" />
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="text-xs text-muted-foreground">Total Items</h3>
          <p className="text-xl font-semibold leading-tight">
            {data.totalItems}
          </p>
        </div>
      </div>

      <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
        <div className="size-10 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
          <BoxIcon className="size-6 text-green-600" />
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="text-xs text-muted-foreground">Available Items</h3>
          <p className="text-xl font-semibold leading-tight">
            {data.availableItems}
          </p>
        </div>
      </div>

      <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
        <div className="size-10 aspect-square bg-yellow-600/10 rounded-full flex items-center justify-center">
          <BoxIcon className="size-6 text-yellow-600" />
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="text-xs text-muted-foreground">Low in Stock</h3>
          <p className="text-xl font-semibold leading-tight">
            {data.lowInStockItems}
          </p>
        </div>
      </div>

      <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
        <div className="size-10 aspect-square bg-red-600/10 rounded-full flex items-center justify-center">
          <BoxIcon className="size-6 text-red-600" />
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="text-xs text-muted-foreground">Out of Stock</h3>
          <p className="text-xl font-semibold leading-tight">
            {data.outOfStockItems}
          </p>
        </div>
      </div>
    </div>
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

function LogBarSale({ setOpen }: { setOpen: (open: boolean) => void }) {
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

const actions = [
  {
    title: "Log bar sale",
    heading: "Log Bar Sale",
    Component: LogBarSale,
    icon: PlusIcon,
    key: "log-bar-sale",
  },
];

function QuickActions() {
  const [open, setOpen] = useState<false | string>(false);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map(({ icon: Icon, title, key, heading, Component }) => {
        return (
          <BaseModal
            key={key}
            open={open === key}
            setOpen={(open) => setOpen(open ? key : false)}
            trigger={
              <div className="flex flex-row items-center gap-x-2 bg-white p-2 rounded-4xl border border-primary-5/50">
                <div className="flex items-center gap-x-2 flex-1">
                  <div className="size-8 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
                    <Icon className="size-5 text-green-600" />
                  </div>

                  <p className="text-sm font-medium">{title}</p>
                </div>

                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </div>
            }
          >
            <DialogTitle>{heading || title}</DialogTitle>
            <DialogDescription className="sr-only">{title}</DialogDescription>
            {Component && (
              <Component setOpen={(open) => setOpen(open ? key : false)} />
            )}
          </BaseModal>
        );
      })}
    </div>
  );
}

function BaseModal({
  children,
  open,
  setOpen,
  trigger,
}: PropsWithChildren<{
  trigger: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
}>) {
  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>

      <DialogContent className="rounded-4xl max-w-md max-h-[90vh] flex flex-col p-6 overflow-y-scroll scrollbar-hidden">
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function RestaurantInventoryPage({
  breadcrumbs,
  section,
  statData,
  inventoryData,
  paginationMeta,
}: {
  breadcrumbs: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
  section: "restock" | null;
  inventoryData: InventoryResponse[] | InventoryRestockRequest[];
  statData: InventorySummaryResponse;
  paginationMeta: Pagination;
}) {
  const setBreadcrumb = useSetAtom(breadcrumbAtom);

  useLayoutEffect(() => {
    setBreadcrumb(breadcrumbs);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumbs]);

  return (
    <div className="p-4 md:p-6 space-y-2 md:space-y-4">
      <InventoryStat data={statData} />
      <QuickActions />
      <RestaurantInventoryTable
        data={inventoryData}
        section={section}
        paginationMeta={paginationMeta}
      />
    </div>
  );
}
