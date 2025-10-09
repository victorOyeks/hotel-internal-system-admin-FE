/** biome-ignore-all lint/suspicious/noArrayIndexKey: No array index key */
"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import {
  type ExportData,
  ExportDialog,
  SuccessDialog,
} from "@/components/shared/shared-dialogs";
import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  assignManagerToHotelBranch,
  createHotelBranch,
  deleteHotelBranch,
  editHotelBranch,
} from "@/lib/actions";
import type { GetHotelResponse, HotelManager, Pagination } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useMutation } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Table as TableType,
  useReactTable,
} from "@tanstack/react-table";
import { atom, useAtom, useSetAtom } from "jotai";
import {
  AlertTriangleIcon,
  DoorOpenIcon,
  HotelIcon,
  Loader2Icon,
  MessageCircleMoreIcon,
  MoreVerticalIcon,
  PlusCircleIcon,
  SearchIcon,
  TrashIcon,
  UserPlus2Icon,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

type HotelItem = GetHotelResponse;
const columnHelper = createColumnHelper<HotelItem>();
const successDialogAtom = atom({
  show: false,
  message: "",
});

function HotelListToolbar({
  managers,
  table,
}: {
  table: TableType<HotelItem>;
  managers: HotelManager[];
}) {
  const [searchText, setSearchText] = useQueryState("searchText", parseAsString.withDefault(""));
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const setSuccessDialogOpen = useSetAtom(successDialogAtom);

  const handleExport = useCallback(
    async (data: ExportData) => {
      // Handle the export logic here, e.g., sending data to an API
      console.log("Exporting data with the following details:", data);
      setExportDialogOpen(false);
      setSuccessDialogOpen({
        show: true,
        message: "Data exported successfully!",
      });
    },
    [setSuccessDialogOpen],
  );

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
      <div className="relative">
        <input
          type="text"
          placeholder="Search Hotels"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
        />
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
      </div>

      <div className="flex items-center gap-x-2 ">
        <TableFilter>
        </TableFilter>

        <AddNewHotelDialog
          // @ts-expect-error revalidate is a function
          revalidate={table.options.meta?.revalidate}
          managers={managers}
        />

        <ExportDialog
          open={exportDialogOpen}
          setOpenAction={setExportDialogOpen}
          onSubmitAction={handleExport}
        />
      </div>
    </div>
  );
}

function AddNewHotelDialog({
  managers,
  revalidate,
}: {
  managers: HotelManager[];
  revalidate: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-md md:rounded-xl"
        >
          <PlusCircleIcon />
          <span className="hidden md:inline">Add New Hotel</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="p-4 rounded-2xl">
        <DialogTitle>New Hotel</DialogTitle>
        <DialogDescription className="sr-only">
          Fill in the details below to add a new hotel branch.
        </DialogDescription>
            <SingleHotelForm
              revalidate={revalidate}
              setOpen={setOpen}
              managers={managers}
            />
        <div className="mt-4">

        </div>
      </DialogContent>
    </Dialog>
  );
}

const hotelFormSchema = z.object({
  name: z.string().nonempty("Hotel name is required"),
  hotelAddress: z.string().nonempty("Hotel address is required"),
  location: z.string().nonempty("Location is required"),
  managerId: z.string().nonempty("Manager is required"),
});

function SingleHotelForm({
  setOpen,
  managers,
  revalidate,
}: {
  setOpen: (open: boolean) => void;
  managers: HotelManager[];
  revalidate: () => Promise<void>;
}) {
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof hotelFormSchema>) => {
      const response = await createHotelBranch(data);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: async () => {
      setOpen(false);
      form.reset();
      setShowSuccessDialog({
        show: true,
        message: "Hotel Added successfully",
      });
      await revalidate();
    },
    onError: (e) => {
      toast.error("Failed to add hotel", {
        description: e.message,
      });
    },
  });
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(hotelFormSchema),
    defaultValues: {
      name: "",
      location: "",
      hotelAddress: "",
    },
    progressive: true,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) =>
          mutate({
            hotelAddress: data.hotelAddress,
            location: data.location,
            name: data.name,
            managerId: data.managerId,
          }),
        )}
      >
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Hotel Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g Gibson Hotel Ajah" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hotelAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hotel Address</FormLabel>
              <FormControl>
                <Input
                  autoComplete="address-line1"
                  placeholder="e.g 123 Main St, Lagos"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input
                  autoComplete="address-level2"
                  placeholder="e.g Ajah, Lagos"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="managerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Manager</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Branch Manager" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <span>Creating, please wait...</span>
            </>
          ) : (
            "Create Hotel Branch"
          )}
        </Button>
      </form>
    </Form>
  );
}

const editHotelFormSchema = hotelFormSchema.omit({ managerId: true });

function EditHotelForm({
  initialValues,
  setOpen,
  hotelId,
  // managers,
  revalidate,
}: {
  initialValues: z.infer<typeof editHotelFormSchema>;
  hotelId: string;
  setOpen: (open: boolean) => void;
  revalidate: () => Promise<void>;
}) {
  const { isPending, mutateAsync } = useMutation({
    mutationKey: ["edit-hotel", hotelId],
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: z.infer<typeof editHotelFormSchema>;
    }) => {
      const response = await editHotelBranch(id, payload);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: async () => {
      setOpen(false);
      setShowSuccessDialog({
        show: true,
        message: "Hotel updated successfully",
      });
      // Invalidate and refetch
      await revalidate();
    },
    onError: (e) => {
      toast.error("Failed to update hotel", {
        description: e.message,
      });
    },
  });
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(editHotelFormSchema),
    defaultValues: initialValues,
    progressive: true,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const handleSubmit = useCallback(
    async (data: z.infer<typeof editHotelFormSchema>) => {
      await mutateAsync({ id: hotelId, payload: data });
    },
    [mutateAsync, hotelId],
  );

  return (
    <DialogContent className="p-4 rounded-2xl">
      <DialogTitle>Edit hotel</DialogTitle>
      <DialogDescription className="sr-only">
        Edit hotel details
      </DialogDescription>
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch Hotel Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g Gibson Hotel Ajah" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch Hotel Location</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="address-level2"
                    placeholder="e.g Ajah, Lagos"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hotelAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hotel Address</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="address-line1"
                    placeholder="e.g 123 Main St, Lagos"
                    {...field}
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
                <span>Creating, please wait...</span>
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}

const assignManagerFormSchema = z.object({
  managerId: z.string().nonempty("Manager is required"),
});

function AssignManagerForm({
  hotelId,
  managers,
  currentlyAssignedManagerId,
  setOpen,
  revalidate,
}: {
  hotelId: string;
  currentlyAssignedManagerId: string;
  managers: HotelManager[];
  setOpen: (open: boolean) => void;
  revalidate: () => Promise<void>;
}) {
  const { isPending, mutate } = useMutation({
    mutationKey: ["assign-manager-to-hotel", hotelId],
    mutationFn: async ({
      managerId
    }: z.infer<typeof assignManagerFormSchema>) => {
      const response = await assignManagerToHotelBranch({ hotelId, managerId }, "ASSIGN");
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: async () => {
      setOpen(false);
      setShowSuccessDialog({
        show: true,
        message: "Hotel updated successfully",
      });
      // Invalidate and refetch
      await revalidate();
    },
    onError: (e) => {
      toast.error("Failed to assign manager", {
        description: e.message,
      });
    },
  });
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(assignManagerFormSchema),
    defaultValues: {
      managerId: currentlyAssignedManagerId || "",
    },
    progressive: true,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  return (
    <DialogContent className="p-4 rounded-2xl">
      <DialogTitle>Assign Manager</DialogTitle>
      <DialogDescription className="sr-only">
        Assign a manager to this hotel branch
      </DialogDescription>

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit((data) => mutate(data))}>
          <FormField
            control={form.control}
            name="managerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Branch Manager</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Branch Manager" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full font-semibold">
            {isPending ? (
              <>
                <Loader2Icon className="animate-spin" />
                <span>Creating, please wait...</span>
              </>
            ) : (
              "Assign Manager"
            )}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}

const contactManagerFormSchema = z.object({
  title: z.string().nonempty("Title is required"),
  message: z.string().nonempty("Message is required"),
});

function ContactManagerForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(contactManagerFormSchema),
    defaultValues: {
      title: "",
      message: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof contactManagerFormSchema>) => {
    console.log("Message sent:", data.message);
    setOpen(false);
    setShowSuccessDialog({
      show: true,
      message: "Message delivered",
    });
    form.reset();
  };

  return (
    <DialogContent className="p-4 rounded-2xl">
      <DialogTitle>Contact Branch Manager</DialogTitle>
      <DialogDescription className="sr-only">
        Fill in the details below to send a message to the branch manager.
      </DialogDescription>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Message Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    className="resize-none"
                    placeholder="Type your message here..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full font-semibold">
            Send Message
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}

const deleteHotelSchema = z.object({
  confirmationText: z
    .string()
    .nonempty("Confirmation text is required")
    .refine((s) => s === "DELETE", { error: 'Type "DELETE" to confirm.' }),
});

function DeleteHotel({
  setOpen,
  id,
  revalidate,
}: {
  setOpen: (open: boolean) => void;
  id: string;
  revalidate: () => Promise<void>;
}) {
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (id: string) => {
        const response = await deleteHotelBranch(id);
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
    },
    onSuccess: async () => {
      setOpen(false);
      setShowSuccessDialog({
        show: true,
        message: "Hotel deleted successfully",
      });
      await revalidate();
    },
    onError: async (e) => {
      toast.error("Failed to delete hotel", {
        description: e.message,
      });
      await revalidate();
    },
  });
  const form = useForm({
    resolver: zodResolver(deleteHotelSchema),
    defaultValues: {
      confirmationText: "",
    },
    reValidateMode: "onSubmit",
    mode: "onSubmit",
  });

  const handleDelete = useCallback(async () => {
    const isValid = await form.trigger();

    if (!isValid) return;
    await mutateAsync(id);
  }, [form, mutateAsync, id]);

  return (
    <DialogContent className="p-4 rounded-2xl">
      <DialogTitle className="sr-only">Delete Hotel</DialogTitle>
      <DialogDescription className="sr-only">
        Type "DELETE" to confirm
      </DialogDescription>

      <div className="flex flex-col items-center justify-center">
        <AlertTriangleIcon className="text-destructive-2 size-12" />
        <h2 className="text-destructive-2">Warning!</h2>
        <p className="text-gray-600 text-center">
          This action Cannot be Undone, to confirm this action is deliberate
          “type delete below”
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleDelete)} className="space-y-4">
          <FormField
            control={form.control}
            name="confirmationText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmation Text</FormLabel>
                <FormControl>
                  <Input placeholder="Type DELETE to confirm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2Icon className="animate-spin" />
                <span>Deleting, please wait...</span>
              </>
            ) : (
              "Delete Hotel"
            )}
          </Button>
          <Button
            type="button"
            className="w-full font-semibold bg-gray-100"
            variant={"ghost"}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}

const columns = [
  columnHelper.display({
    header: "S/N",
    cell: (info) => (
      <span className="text-foreground">{info.row.index + 1}</span>
    ),
  }),
  columnHelper.accessor("name", {
    header: "Hotel Name",
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  columnHelper.accessor("address", {
    header: "Location",
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  columnHelper.accessor("totalRoom", {
    header: "Total Rooms",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("occupancyRate", {
    header: "Occupancy Rate",
    cell: (info) => `${info.getValue()}%`,
  }),
  columnHelper.accessor("grossRevenue", {
    header: "Gross Revenue",
    cell: (info) => formatCurrency(parseFloat(info.getValue())),
  }),
  columnHelper.accessor("expenses", {
    header: "Expenses",
    cell: (info) => formatCurrency(parseFloat(info.getValue())),
  }),
  columnHelper.display({
    id: "actions",
    cell: (info) => {
      const [open, setOpen] = useState<
        | "contact-manager"
        | "delete-hotel"
        | "edit-hotel"
        | "assign-manager"
        | false
      >(false);

      const dialog = useMemo(() => {
        switch (open) {
          case "contact-manager":
            return (
              <ContactManagerForm
                setOpen={(isOpen) =>
                  setOpen(isOpen ? "contact-manager" : false)
                }
              />
            );
          case "edit-hotel": {
            const rowData = info.row.original;
            return (
              <EditHotelForm
                hotelId={rowData.id!}
                // @ts-expect-error managers is passed as meta
                managers={info.table.options.meta?.managers || []}
                initialValues={{
                  name: rowData.name!,
                  hotelAddress: rowData.address!,
                  location: rowData.address,
                }}
                revalidate={
                  // @ts-expect-error revalidate is a function
                  info.table.options.meta?.revalidate ||
                  (() => Promise.resolve())
                }
                setOpen={(isOpen) => setOpen(isOpen ? "edit-hotel" : false)}
              />
            );
          }

          case "assign-manager": {
            const rowData = info.row.original;

            return (
              <AssignManagerForm
                hotelId={rowData.id!}
                currentlyAssignedManagerId={rowData.manager?.id || ""}
                managers={
                  // @ts-expect-error managers is passed as meta
                  info.table.options.meta?.managers || []
                }
                revalidate={
                  // @ts-expect-error revalidate is a function
                  info.table.options.meta?.revalidate ||
                  (() => Promise.resolve())
                }
                setOpen={(isOpen) => setOpen(isOpen ? "assign-manager" : false)}
              />
            );
          }

          case "delete-hotel":
            return (
              <DeleteHotel
                setOpen={(isOpen) => setOpen(isOpen ? "delete-hotel" : false)}
                id={info.row.original.id!}
                revalidate={
                  // @ts-expect-error revalidate is a function
                  info.table.options.meta?.revalidate ||
                  (() => Promise.resolve())
                }
              />
            );
          default:
            return null;
        }
      }, [
        open,
        info.row.original,
        // @ts-expect-error revalidate is a function
        info.table.options.meta?.revalidate,
        // @ts-expect-error managers is passed as meta
        info.table.options.meta?.managers,
      ]);

      return (
        <Dialog
          open={typeof open === "string"}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(false);
          }}
        >
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white" align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/hotels/${info.row.original.id}`}>
                  <HotelIcon />
                  View Branch Hotel
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <DialogTrigger
                  className="w-full"
                  onClick={() => setOpen("edit-hotel")}
                >
                  <DoorOpenIcon />
                  Edit Hotel
                </DialogTrigger>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <DialogTrigger
                  className="w-full"
                  onClick={() => setOpen("assign-manager")}
                >
                  <UserPlus2Icon />
                  Assign Manager
                </DialogTrigger>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <DialogTrigger
                  className="w-full"
                  onClick={() => setOpen("contact-manager")}
                >
                  <MessageCircleMoreIcon />
                  Contact Branch Manager
                </DialogTrigger>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="hover:bg-red-500/10 text-red-500 focus:text-red-500"
                asChild
              >
                <DialogTrigger
                  className="w-full"
                  onClick={() => setOpen("delete-hotel")}
                >
                  <TrashIcon className="text-red-500" />
                  Delete Hotel
                </DialogTrigger>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {dialog}
        </Dialog>
      );
    },
  }),
];

function HotelList({ table }: { table: TableType<HotelItem> }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="text-gray-500">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-gray-600">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={columns.length}>
              <div className="w-full flex items-center justify-between">
                <p>
                  {table.getFilteredSelectedRowModel().rows.length} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected.
                </p>

                <DataTablePagination table={table} />
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

export function HotelOwnerHotels({
  breadcrumb,
  data,
  paginationMeta,
  managers,
  revalidateAction: revalidate,
}: {
  breadcrumb: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
  data: HotelItem[];
  paginationMeta: Pagination;
  managers: HotelManager[];
  revalidateAction: () => Promise<void>;
}) {
  const [pagination, setPagination] = usePaginationSearchParams()
  const table = useReactTable({
    data,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: paginationMeta.totalPages,
    state: {
      pagination,
    },
    meta: {
      revalidate,
      managers,
    },
  });
  const setBreadcrumb = useSetAtom(breadcrumbAtom);
  const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);

  useLayoutEffect(() => {
    setBreadcrumb(breadcrumb);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumb]);

  return (
    <div className="p-4 space-y-2 md:space-y-4">
      <HotelListToolbar table={table} managers={managers} />
      <HotelList table={table} />
      <SuccessDialog
        open={successDialogOpen.show}
        setOpenAction={(show) => setSuccessDialogOpen({ ...successDialogOpen, show })}
        message={successDialogOpen.message}
      />
    </div>
  );
}
