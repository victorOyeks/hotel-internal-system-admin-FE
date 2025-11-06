"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MoreVerticalIcon, Loader2Icon, PlusIcon, SearchIcon } from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState, useMemo } from "react";
import type { APIOutput } from "@/lib/action-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { revalidateRoute } from "@/lib/actions";
import { addFoodItem, addBarItem } from "@/lib/restaurant-actions";

export type FoodDrinkItem =
  APIOutput<"@get/api/restaurants/items/all">["data"][number];

// Add Food Item Form
const addFoodItemSchema = z.object({
  name: z.string().nonempty("Food item name is required"),
  price: z.number().positive("Price must be greater than 0"),
});

function AddFoodItemForm({ setOpen }: { setOpen: (open: boolean) => void }) {
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
      const res = await addFoodItem(data);
      if (!res.success) {
        throw new Error(res.error || "Failed to add food item");
      }
      return res.data;
    },
    onSuccess: async (data) => {
      form.reset();
      setOpen(false);
      toast.success("Food item added successfully", {
        description: data,
      });
      await revalidateRoute("/restaurant/item-management");
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

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Add Food Item
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Add Bar Item Form
const addBarItemSchema = z.object({
  name: z.string().nonempty("Bar item name is required"),
  quantity: z.number().nonnegative("Quantity must be 0 or greater"),
  price: z.number().positive("Price must be greater than 0"),
});

function AddBarItemForm({ setOpen }: { setOpen: (open: boolean) => void }) {
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
      const res = await addBarItem(data);
      if (!res.success) {
        throw new Error(res.error || "Failed to add bar item");
      }
      return res.data;
    },
    onSuccess: async (data) => {
      form.reset();
      setOpen(false);
      toast.success("Bar item added successfully", {
        description: data,
      });
      await revalidateRoute("/restaurant/item-management");
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

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Add Bar Item
          </Button>
        </div>
      </form>
    </Form>
  );
}

const editItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  price: z.number().positive("Price must be greater than 0"),
  quantity: z.number().nonnegative("Quantity must be 0 or greater").optional(),
});

function EditItemForm({
  item,
  setOpen,
}: {
  item: FoodDrinkItem;
  setOpen: (open: boolean) => void;
}) {
  const form = useForm({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      name: item.name,
      price: item.price,
      quantity: item.quantity || undefined,
    },
    progressive: true,
    reValidateMode: "onBlur",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (_data: z.infer<typeof editItemSchema>) => {
      // TODO: Implement actual API call when endpoint is available
      // For now, just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return "Item updated successfully";
    },
    onSuccess: async (desc) => {
      form.reset();
      setOpen(false);
      toast.success("Item updated successfully", {
        description: desc,
      });
      await revalidateRoute("/restaurant/item-management");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to update item",
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
                <Input placeholder="e.g Jollof Rice" {...field} />
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
                  placeholder="e.g 2500"
                  {...form.register("price", { valueAsNumber: true })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {item.itemType === "DRINK" && (
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
        )}

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ItemActionsCell({ item }: { item: FoodDrinkItem }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { mutate: deleteItem, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      // TODO: Implement actual API call when endpoint is available
      // For now, just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return "Item deleted successfully";
    },
    onSuccess: async (desc) => {
      setDeleteOpen(false);
      toast.success("Item deleted successfully", {
        description: desc,
      });
      await revalidateRoute("/restaurant/item-management");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to delete item",
      });
    },
  });

  return (
    <>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DialogTrigger asChild>
              <DropdownMenuItem>Edit Item</DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              Delete Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent>
          <DialogTitle>
            Edit {item.itemType === "FOOD" ? "Food" : "Drink"} Item
          </DialogTitle>
          <DialogDescription>
            Update the details of this {item.itemType.toLowerCase()} item.
          </DialogDescription>
          <EditItemForm item={item} setOpen={setEditOpen} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{item.name}" from the system. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteItem();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const columnHelper = createColumnHelper<FoodDrinkItem>();

const columns = [
  columnHelper.accessor("customId", {
    header: "Item ID",
    cell: (info) => (
      <span className="font-medium text-muted-foreground">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("itemType", {
    header: "Type",
    cell: (info) => (
      <Badge variant={info.getValue() === "FOOD" ? "blue" : "green"}>
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("price", {
    header: "Price",
    cell: (info) => (
      <span className="font-medium">₦{info.getValue().toLocaleString()}</span>
    ),
  }),
  columnHelper.accessor("quantity", {
    header: "Quantity",
    cell: (info) => {
      const value = info.getValue();
      return (
        <span className={cn(value === 0 && "text-destructive font-medium")}>
          {value ?? "N/A"}
        </span>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Created At",
    cell: (info) => (
      <span className="text-sm text-muted-foreground">
        {new Date(info.getValue()).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => <ItemActionsCell item={info.row.original} />,
  }),
];

type FoodItemsManagementProps = {
  items: FoodDrinkItem[];
};

export function FoodItemsManagement({ items }: FoodItemsManagementProps) {
  const [itemType, setItemType] = useQueryState(
    "itemType",
    parseAsStringLiteral(["FOOD", "DRINK"]).withDefault("FOOD")
  );
  const [search, setSearch] = useQueryState("search");
  const [filterOpen, setFilterOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);

  // Client-side filtering based on search
  const filteredItems = useMemo(() => {
    if (!search) return items;
    const searchLower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.customId.toLowerCase().includes(searchLower)
    );
  }, [items, search]);

  const table = useReactTable({
    data: filteredItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
        <div className="flex items-center gap-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setItemType("FOOD")}
            className={cn(
              "shadow-none text-xs hover:border-transparent rounded-full transition-colors",
              itemType === "FOOD"
                ? "bg-primary text-primary-foreground border-primary"
                : ""
            )}
          >
            Food Items
            {itemType === "FOOD" && ` (${filteredItems.length})`}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setItemType("DRINK")}
            className={cn(
              "shadow-none text-xs hover:border-transparent rounded-full transition-colors",
              itemType === "DRINK"
                ? "bg-primary text-primary-foreground border-primary"
                : ""
            )}
          >
            Drink Items
            {itemType === "DRINK" && ` (${filteredItems.length})`}
          </Button>
        </div>

        <div className="flex items-center gap-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search items..."
              value={search ?? ""}
              onChange={(e) => setSearch(e.target.value || null)}
              className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-xl"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
          </div>

          <TableFilter open={filterOpen} setOpen={setFilterOpen}>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Additional filters can be added here
              </p>
            </div>
          </TableFilter>

          <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-md md:rounded-xl">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add {itemType === "FOOD" ? "Food" : "Drink"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>
                Add {itemType === "FOOD" ? "Food" : "Drink"} Item
              </DialogTitle>
              <DialogDescription>
                Create a new {itemType === "FOOD" ? "food" : "drink"} item in the system.
              </DialogDescription>
              {itemType === "FOOD" ? (
                <AddFoodItemForm setOpen={setAddItemOpen} />
              ) : (
                <AddBarItemForm setOpen={setAddItemOpen} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
