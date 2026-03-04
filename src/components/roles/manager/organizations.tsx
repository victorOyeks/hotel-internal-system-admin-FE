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
  Loader2Icon,
  MoreVerticalIcon,
  PlusCircleIcon,
  SearchIcon,
  TrashIcon,
  AlertTriangleIcon,
  EyeIcon,
  PencilIcon,
} from "lucide-react";
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
import { SuccessDialog } from "@/components/shared/shared-dialogs";
import { Textarea } from "@/components/ui/textarea";
import type { OrganizationResponse } from "@/lib/api-routes/corporate";
import { useMutation } from "@tanstack/react-query";
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from "@/lib/corporate-actions";
import { revalidateRoute } from "@/lib/actions";
import { toast } from "sonner";
import { parseAsString, useQueryStates } from "nuqs";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { useRouter } from "next/navigation";
import Link from "next/link";

const columnHelper = createColumnHelper<OrganizationResponse>();
const successDialogAtom = atom({
  show: false,
  message: "",
});

function OrganizationsToolbar({
  table,
  hotelId,
  readOnly = false,
}: {
  table: TableType<OrganizationResponse>;
  hotelId: string;
  readOnly?: boolean;
}) {
  const [searchParam, setSearchParam] = useQueryStates({
    search: parseAsString.withDefault(""),
  });

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
      <div>
        <p>All organizations({table.getRowCount()})</p>
      </div>

      <div className="flex items-center gap-x-2">
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

        {!readOnly && <AddOrganizationDialog hotelId={hotelId} />}
      </div>
    </div>
  );
}

const organizationFormSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
});

function AddOrganizationDialog({ hotelId }: { hotelId: string }) {
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
          <span className="hidden md:inline">Add Organization</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="p-4 rounded-2xl">
        <DialogTitle>Add new organization</DialogTitle>
        <DialogDescription className="sr-only">
          Fill in the details below to add a new organization.
        </DialogDescription>

        <div className="mt-4">
          <OrganizationForm hotelId={hotelId} setOpen={setOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrganizationForm({
  hotelId,
  setOpen,
  initialValues,
  organizationId,
}: {
  hotelId: string;
  setOpen: (open: boolean) => void;
  initialValues?: z.infer<typeof organizationFormSchema>;
  organizationId?: string;
}) {
  const isEdit = !!organizationId;
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: initialValues ?? {
      name: "",
      email: "",
      phoneNumber: "",
      address: "",
    },
    progressive: true,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof organizationFormSchema>) => {
      if (isEdit) {
        const response = await updateOrganization(
          organizationId,
          hotelId,
          data,
        );
        if (!response.success) {
          throw new Error(response.error);
        }
        return response.data;
      }
      const response = await createOrganization({ ...data, hotelId });
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
        message: isEdit
          ? "Organization updated successfully"
          : "Organization created successfully",
      });
      revalidateRoute("/hotel-owner/organizations");
      revalidateRoute("/manager/organizations");
    },
    onError: (e) => {
      toast.error("Something went wrong", {
        description:
          e.message || `Failed to ${isEdit ? "update" : "create"} organization`,
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
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g Zenith Bank PLC" {...field} />
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
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="e.g contact@organization.com" {...field} />
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
                <Input
                  type="tel"
                  placeholder="e.g +234 800 000 0000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea
                  className="resize-none"
                  placeholder="Organization address"
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
              <span>{isEdit ? "Updating..." : "Creating..."}</span>
            </>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Add Organization"
          )}
        </Button>
      </form>
    </Form>
  );
}

const deleteOrgSchema = z.object({
  confirmationText: z
    .string()
    .min(1, "Confirmation text is required")
    .refine((s) => s === "DELETE", { message: 'Type "DELETE" to confirm.' }),
});

function DeleteOrganizationDialog({
  setOpen,
  id,
  hotelId,
}: {
  setOpen: (open: boolean) => void;
  id: string;
  hotelId: string;
}) {
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const response = await deleteOrganization(id, hotelId);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      setOpen(false);
      setShowSuccessDialog({
        show: true,
        message: "Organization deleted successfully",
      });
      revalidateRoute("/hotel-owner/organizations");
      revalidateRoute("/manager/organizations");
    },
    onError: (e) => {
      toast.error("Something went wrong", {
        description: e.message || "Failed to delete organization",
      });
    },
  });
  const form = useForm({
    resolver: zodResolver(deleteOrgSchema),
    defaultValues: {
      confirmationText: "",
    },
    reValidateMode: "onSubmit",
    mode: "onSubmit",
  });

  const handleDelete = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    await mutateAsync();
  }, [form, mutateAsync]);

  return (
    <DialogContent className="p-4 rounded-2xl">
      <DialogTitle className="sr-only">Delete Organization</DialogTitle>
      <DialogDescription className="sr-only">
        Type &quot;DELETE&quot; to confirm
      </DialogDescription>

      <div className="flex flex-col items-center justify-center">
        <AlertTriangleIcon className="text-destructive-2 size-12" />
        <h2 className="text-destructive-2">Warning!</h2>
        <p className="text-gray-600 text-center">
          This action cannot be undone. To confirm this action is deliberate,
          type &quot;DELETE&quot; below.
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
            variant="destructive"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2Icon className="animate-spin" />
                <span>Deleting, please wait...</span>
              </>
            ) : (
              "Delete Organization"
            )}
          </Button>
          <Button
            type="button"
            className="w-full font-semibold bg-gray-100"
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}

function OrganizationsTable({
  table,
}: {
  table: TableType<OrganizationResponse>;
  hotelId: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-gray-500">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                // className="cursor-pointer hover:bg-gray-50/80"
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
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                No organizations found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={table.getAllColumns().length}>
              <div className="w-full flex items-center justify-between">
                <p>
                  Showing{" "}
                  {table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length,
                  )}{" "}
                  of {table.getFilteredRowModel().rows.length} results
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

function createColumns(hotelId: string, readOnly = false) {
  return [
    columnHelper.display({
      header: "S/N",
      cell: (info) => (
        <span className="text-foreground">{info.row.index + 1}</span>
      ),
    }),
    columnHelper.accessor("customId", {
      header: "ID",
      cell: (info) => (
        <span className="font-mono text-xs">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("name", {
      header: "Organization Name",
      cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => <span>{info.getValue()}</span>,
    }),
    columnHelper.accessor("phoneNumber", {
      header: "Phone Number",
      cell: (info) => <span>{info.getValue() ?? "-"}</span>,
    }),
    columnHelper.accessor("address", {
      header: "Address",
      cell: (info) => (
        <span className="max-w-[200px] truncate block" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Created",
      cell: (info) => {
        const value = info.getValue();
        if (!value) return <span>N/A</span>;
        const date = new Date(value);
        return (
          <span>
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => {
        const [open, setOpen] = useState<"edit-org" | "delete-org" | false>(
          false,
        );
        const rowData = info.row.original;
        const router = useRouter();

        const dialog = useMemo(() => {
          switch (open) {
            case "edit-org":
              return (
                <DialogContent className="p-4 rounded-2xl">
                  <DialogTitle>Edit organization</DialogTitle>
                  <DialogDescription className="sr-only">
                    Edit organization details
                  </DialogDescription>
                  <div className="mt-4">
                    <OrganizationForm
                      hotelId={hotelId}
                      organizationId={rowData.id}
                      initialValues={{
                        name: rowData.name,
                        email: rowData.email,
                        phoneNumber: rowData.phoneNumber,
                        address: rowData.address,
                      }}
                      setOpen={(isOpen) => setOpen(isOpen ? "edit-org" : false)}
                    />
                  </div>
                </DialogContent>
              );
            case "delete-org":
              return (
                <DeleteOrganizationDialog
                  setOpen={(isOpen) => setOpen(isOpen ? "delete-org" : false)}
                  id={rowData.id}
                  hotelId={hotelId}
                />
              );
            default:
              return null;
          }
        }, [open, rowData, router]);

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
                  <Link href={`/dashboard/organizations/${rowData.id}`}>
                    <EyeIcon />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {!readOnly && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setOpen("edit-org")}>
                      <PencilIcon />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="hover:bg-red-500/10 text-red-500 focus:text-red-500"
                      onSelect={() => setOpen("delete-org")}
                    >
                      <TrashIcon className="text-red-500" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {dialog}
          </Dialog>
        );
      },
    }),
  ];
}

export function OrganizationsPage({
  breadcrumb,
  organizations,
  paginationMeta,
  hotelId,
  readOnly = false,
}: {
  breadcrumb: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
  organizations: OrganizationResponse[];
  paginationMeta: { totalPages: number; totalElements: number };
  hotelId: string;
  readOnly?: boolean;
}) {
  const [pagination, setPagination] = usePaginationSearchParams();
  const columns = useMemo(
    () => createColumns(hotelId, readOnly),
    [hotelId, readOnly],
  );
  const table = useReactTable({
    data: organizations,
    columns,
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
      <OrganizationsToolbar
        table={table}
        hotelId={hotelId}
        readOnly={readOnly}
      />
      <OrganizationsTable table={table} hotelId={hotelId} />
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
