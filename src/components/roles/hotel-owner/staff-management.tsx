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
  // HotelIcon,
  Loader2Icon,
  MessageCircleMoreIcon,
  MoreVerticalIcon,
  PlusCircleIcon,
  SearchIcon,
  TrashIcon,
  AlertTriangleIcon,
} from "lucide-react";
// import Link from "next/link";
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
import { atom, useAtom, useSetAtom } from "jotai";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
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
import {
  type ExportData,
  ExportDialog,
  SuccessDialog,
} from "@/components/shared/shared-dialogs";
import { Textarea } from "@/components/ui/textarea";
import {
  type Pagination,
  Role,
  type CustomPageStaffResponse,
} from "@/lib/fetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteStaffMember,
  onboardManagerToHotel,
  revalidateRoute,
  updateStaffDetailsByOwner,
} from "@/lib/actions";
import { toast } from "sonner";
import { parseAsString, useQueryStates } from "nuqs";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { Badge } from "@/components/ui/badge";

const columnHelper = createColumnHelper<CustomPageStaffResponse>();
const successDialogAtom = atom({
  show: false,
  message: "",
});

function HotelListToolbar({
  table,
}: {
  table: TableType<CustomPageStaffResponse>;
}) {
  const [searchParam, setSearchParam] = useQueryStates({
    search: parseAsString.withDefault(""),
  });
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
    [setSuccessDialogOpen]
  );

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
      <div>
        <p>All staff({table.getRowCount()})</p>
      </div>

      <div className="flex items-center gap-x-2 ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchParam.search}
            onChange={(e) =>
              setSearchParam((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>
        <TableFilter></TableFilter>

        <AddNewStaffDialog />

        <ExportDialog
          open={exportDialogOpen}
          setOpenAction={setExportDialogOpen}
          onSubmitAction={handleExport}
        />
      </div>
    </div>
  );
}

function AddNewStaffDialog() {
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
          <span className="hidden md:inline">Add Staff</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="p-4 rounded-2xl">
        <DialogTitle>Add new manager</DialogTitle>
        <DialogDescription className="sr-only">
          Fill in the details below to add a new staff member.
        </DialogDescription>

        <div className="mt-4">
          <AddStaffForm setOpen={setOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const newStaffFormSchema = z.object({
  fullName: z.string().nonempty("Staff name is required"),
  email: z.email("Invalid email address"),
  phoneNumber: z.string().nonempty("Phone number is required"),
  // role: z.string().refine((val) => Role.safeParse(val).success, {
  //   message: "Invalid role",
  // }),
});

function AddStaffForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { mutate, isPending } = useMutation({
    mutationFn: onboardManagerToHotel,
    onSuccess: async () => {
      setOpen(false);
      form.reset();
      setShowSuccessDialog({
        show: true,
        message: "Staff added successfully",
      });
      revalidateRoute("/hotel-owner/staff-management");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to add staff",
      });
    },
  });
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(newStaffFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
    },
    progressive: true,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => mutate(data))}
      >
        <FormField
          name="fullName"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Staff Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input placeholder="e.g john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g +123456789" {...field} />
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
            "Add staff"
          )}
        </Button>
      </form>
    </Form>
  );
}

const hotelOwnerStaffEditSchema = newStaffFormSchema.extend({
  role: Role,
});

function UpdateHotelStaffForm({
  initialValues,
  staffId,
  setOpen,
}: {
  initialValues: z.infer<typeof hotelOwnerStaffEditSchema>;
  staffId: string;
  setOpen: (open: boolean) => void;
}) {
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(hotelOwnerStaffEditSchema),
    defaultValues: initialValues,
    progressive: true,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: updateStaffDetailsByOwner,
    onSuccess: async () => {
      setOpen(false);
      form.reset();
      setShowSuccessDialog({
        show: true,
        message: "Changes saved successfully",
      });
      revalidateRoute("/hotel-owner/staff-management");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to update staff details",
      });
    },
  });


  return (
    <DialogContent className="p-4 rounded-2xl">
      <DialogTitle>Edit hotel</DialogTitle>
      <DialogDescription className="sr-only">
        Edit hotel details
      </DialogDescription>
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit((data) => mutate({
          ...data,
          staffId
        }))}>
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Staff Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="e.g +123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FRONT_DESK">Front Desk</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="INVENTORY">Inventory</SelectItem>
                    <SelectItem value="BAR">Bar</SelectItem>
                    <SelectItem value="KITCHEN">Kitchen</SelectItem>
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
                <span>Updating, please wait...</span>
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

const contactManagerFormSchema = z.object({
  title: z.string().nonempty("Title is required"),
  message: z.string().nonempty("Message is required"),
});

function ContactStaffForm({ setOpen }: { setOpen: (open: boolean) => void }) {
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
      <DialogTitle>Contact Staff</DialogTitle>
      <DialogDescription className="sr-only">
        Fill in the details below to send a message to the staff.
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

const deleteStaffSchema = z.object({
  confirmationText: z
    .string()
    .nonempty("Confirmation text is required")
    .refine((s) => s === "DELETE", { error: 'Type "DELETE" to confirm.' }),
});

function DeleteStaffDialog({
  setOpen,
  id,
}: {
  setOpen: (open: boolean) => void;
  id: string;
}) {
  const queryClient = useQueryClient();
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: deleteStaffMember,
    onSuccess: () => {
      setOpen(false);
      setShowSuccessDialog({
        show: true,
        message: "Staff deleted successfully",
      });
      queryClient.invalidateQueries({
        exact: true,
        queryKey: ["staffs"],
      });
      revalidateRoute("/hotel-owner/staff-management");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to delete staff",
      });
    },
  });
  const form = useForm({
    resolver: zodResolver(deleteStaffSchema),
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
              "Delete Staff"
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
  columnHelper.accessor("fullName", {
    header: "Staff Name",
    cell: (info) => (
      <div className="flex items-center gap-x-2">
        {/* <Image
          src={info.row.original.profilePicture}
          alt={info.row.original.fullName}
          className="w-10 h-10 rounded-full"
          width={40}
          height={40}
        /> */}
        <span className="font-semibold">{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor("role", {
    header: "Role",
    cell: (info) => {
      const role = info.getValue();
      const refinedRole = role
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return <Badge variant={"outline"}>{refinedRole}</Badge>;
    },
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  // columnHelper.accessor("status", {
  //   header: "Status",
  //   cell: (info) => <span>{info.getValue()}</span>,
  // }),
  columnHelper.accessor("phoneNumber", {
    header: "Phone Number",
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  columnHelper.display({
    id: "actions",
    cell: (info) => {
      const [open, setOpen] = useState<
        "contact-staff" | "delete-staff" | "edit-staff" | false
      >(false);

      const dialog = useMemo(() => {
        switch (open) {
          case "contact-staff":
            return (
              <ContactStaffForm
                setOpen={(isOpen) => setOpen(isOpen ? "contact-staff" : false)}
              />
            );
          case "edit-staff": {
            const rowData = info.row.original;
            return (
              <UpdateHotelStaffForm
                initialValues={{
                  fullName: rowData.fullName,
                  email: rowData.email,
                  role: rowData.role,
                  phoneNumber: rowData.phoneNumber,
                }}
                staffId={rowData.id}
                setOpen={(isOpen) => setOpen(isOpen ? "edit-staff" : false)}
              />
            );
          }
          case "delete-staff":
            return (
              <DeleteStaffDialog
                setOpen={(isOpen) => setOpen(isOpen ? "delete-staff" : false)}
                id={info.row.original.id}
              />
            );
          default:
            return null;
        }
      }, [open, info.row.original]);

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
              {/* <DropdownMenuItem asChild>
                <Link href={`/dashboard/hotels/${info.row.original.id}`}>
                  <HotelIcon />
                  View Branch Hotel
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator /> */}
              <DropdownMenuItem asChild>
                <DialogTrigger
                  className="w-full"
                  onClick={() => setOpen("edit-staff")}
                >
                  <DoorOpenIcon />
                  Edit Staff
                </DialogTrigger>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <DialogTrigger
                  className="w-full"
                  onClick={() => setOpen("contact-staff")}
                >
                  <MessageCircleMoreIcon />
                  Contact Staff
                </DialogTrigger>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="hover:bg-red-500/10 text-red-500 focus:text-red-500"
                asChild
              >
                <DialogTrigger
                  className="w-full"
                  onClick={() => setOpen("delete-staff")}
                >
                  <TrashIcon className="text-red-500" />
                  Delete Staff
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

function HotelList({ table }: { table: TableType<CustomPageStaffResponse> }) {
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

export function HotelOwnerStaff({
  breadcrumb,
  staffs,
  paginationMeta,
}: {
  breadcrumb: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
  staffs: CustomPageStaffResponse[];
  paginationMeta: Pagination;
}) {
  const [pagination, setPagination] = usePaginationSearchParams();
  const table = useReactTable({
    data: staffs,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: paginationMeta.totalPages,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
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
      <SuccessDialog
        open={successDialogOpen.show}
        setOpenAction={(show) =>
          setSuccessDialogOpen({ ...successDialogOpen, show })
        }
        message={successDialogOpen.message}
      />
    </div>
  );
}
