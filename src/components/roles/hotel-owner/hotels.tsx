/** biome-ignore-all lint/suspicious/noArrayIndexKey: No array index key */
"use client";

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
import {
  DoorOpenIcon,
  HotelIcon,
  Loader2Icon,
  MessageCircleMoreIcon,
  MoreVerticalIcon,
  PlusCircleIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { atom, useAtom, useSetAtom } from "jotai";
import { useCallback, useLayoutEffect, useState } from "react";
import { DataTablePagination } from "@/components/shared/pagination";
import { TableFilter } from "@/components/shared/table-filter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SuccessDialog } from "@/components/shared/shared-dialogs";
import { title } from "process";
import { Textarea } from "@/components/ui/textarea";

type HotelItem = {
  id: number;
  branchName: string;
  location: string;
  totalRooms: number;
  occupancyRate: number;
  grossRevenue: number;
  expenses: number;
};

const columnHelper = createColumnHelper<HotelItem>();
const successDialogAtom = atom(false);

function HotelListToolbar({ table }: { table: TableType<HotelItem> }) {
  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
      <div className="relative">
        <input
          type="text"
          placeholder="Search Hotels"
          className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
        />
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
      </div>

      <div className="flex items-center gap-x-2 ">
        <TableFilter></TableFilter>

        <AddNewHotelDialog />

        <Button size={"sm"} className="rounded-md md:rounded-xl">
          Export
        </Button>
      </div>
    </div>
  );
}

function AddNewHotelDialog() {
  const [section, setSection] = useState<"single" | "multiple">("single");
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

      <DialogContent className="p-4 rounded-2xl max-w-3">
        <DialogTitle>New Hotel</DialogTitle>
        <DialogDescription className="sr-only">
          Fill in the details below to add a new hotel branch.
        </DialogDescription>

        <div className="flex items-center">
          <Button
            variant={section === "single" ? "secondary" : "outline"}
            onClick={() => setSection("single")}
            className="rounded-none"
          >
            Single Hotel
          </Button>
          <Button
            variant={section === "multiple" ? "secondary" : "outline"}
            onClick={() => setSection("multiple")}
            className="rounded-none"
          >
            Bulk Upload
          </Button>
        </div>

        <div className="mt-4">
          {section === "single" ? (
            <SingleHotelForm setOpen={setOpen} />
          ) : (
            <p className="text-gray-500">
              Bulk upload functionality is not yet implemented.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const hotelFormSchema = z.object({
  hotelName: z.string().nonempty("Hotel name is required"),
  location: z.string().nonempty("Location is required"),
  // totalRooms is going to come in as a string from the input, so we parse it to a number
  totalRooms: z
    .string()
    .nonempty("Total rooms is required")
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => val > 0,
      "Total rooms must be greater than 0"
    ) as unknown as z.ZodString,
  branchManager: z.string().nonempty("Branch manager is required"),
});

function SingleHotelForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const [isPending, setIsPending] = useState(false);
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(hotelFormSchema),
    defaultValues: {
      hotelName: "",
      location: "",
      totalRooms: "0",
      branchManager: "",
    },
    progressive: true,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const handleSubmit = useCallback((data: z.infer<typeof hotelFormSchema>) => {
    console.log("Form submitted with data:", data);
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      setOpen(false);
      form.reset();
      setShowSuccessDialog(true);
    }, 3000);
  }, []);

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          name="hotelName"
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
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g Ajah, Lagos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="totalRooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Rooms</FormLabel>
              <FormControl>
                <Input placeholder="100" min={1} type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="branchManager"
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
                  <SelectItem value="manager1">Manager 1</SelectItem>
                  <SelectItem value="manager2">Manager 2</SelectItem>
                  <SelectItem value="manager3">Manager 3</SelectItem>
                  <SelectItem value="manager4">Manager 4</SelectItem>
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

const contactManagerFormSchema = z.object({
  title: z.string().nonempty("Title is required"),
  message: z.string().nonempty("Message is required"),
});

function ContactManagerForm({ setOpen }: { setOpen: (open: boolean) => void }) {
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
    form.reset();
  };

  return (
    <DialogContent className="p-4 rounded-2xl max-w-3">
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

const columns = [
  columnHelper.accessor("id", {
    header: "Hotel ID",
    cell: (info) => <span className="text-foreground">#{info.getValue()}</span>,
  }),
  columnHelper.accessor("branchName", {
    header: "Branch Name",
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  columnHelper.accessor("location", {
    header: "Location",
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  columnHelper.accessor("totalRooms", {
    header: "Total Rooms",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("occupancyRate", {
    header: "Occupancy Rate",
    cell: (info) => `${info.getValue()}%`,
  }),
  columnHelper.accessor("grossRevenue", {
    header: "Gross Revenue",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  columnHelper.accessor("expenses", {
    header: "Expenses",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  columnHelper.display({
    id: "actions",
    cell: (info) => {
      const [open, setOpen] = useState<
        "contact-manager" | "delete-hotel" | "configure-hotel" | false
      >(false);
      return (
        <Dialog
          open={typeof open === "string"}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(false);
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white" align="end">
              <DropdownMenuItem asChild>
                <Link href={`/hotels/${info.row.original.id}`}>
                  <HotelIcon />
                  View Branch Hotel
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <DoorOpenIcon />
                Configure Hotel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <DialogTrigger onClick={() => setOpen("contact-manager")}>
                  <MessageCircleMoreIcon />
                  Contact Branch Manager
                </DialogTrigger>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-red-500/10 text-red-500 focus:text-red-500">
                <TrashIcon className="text-red-500" />
                Delete Hotel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {open === "contact-manager" && (
            <ContactManagerForm
              setOpen={(isOpen) => setOpen(isOpen ? "contact-manager" : false)}
            />
          )}
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
                          header.getContext()
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
  hotels,
}: {
  breadcrumb: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
  hotels: HotelItem[];
}) {
  const table = useReactTable({
    data: hotels,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  const setBreadcrumb = useSetAtom(breadcrumbAtom);
  const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);

  useLayoutEffect(() => {
    setBreadcrumb(breadcrumb);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumb]);

  return (
    <div className="p-4 space-y-2 md:space-y-4">
      <HotelListToolbar table={table} />
      <HotelList table={table} />
      <SuccessDialog open={successDialogOpen} setOpen={setSuccessDialogOpen} />
    </div>
  );
}
