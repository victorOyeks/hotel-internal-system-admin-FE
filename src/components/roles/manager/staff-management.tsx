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
  Loader2Icon,
  MoreVerticalIcon,
  PlusCircleIcon,
  SearchIcon,
  AlertTriangleIcon,
  UserXIcon,
  ReplaceIcon,
  EyeOffIcon,
  EyeIcon,
  CalendarIcon,
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
import {
  type CustomPageStaffResponse,
  type Pagination,
  Role,
} from "@/lib/fetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseAsString, useQueryStates } from "nuqs";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { Badge } from "@/components/ui/badge";
import {
  editStaffDetails,
  onboardStaffToHotel,
  resetPasswordForStaff,
  suspendStaffAccount,
} from "@/lib/manager-actions";
import type { HotelRole } from "@/lib/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { revalidateRoute } from "@/lib/actions";

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
        <DialogTitle>New Staff</DialogTitle>
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
  staffName: z.string().nonempty("Staff name is required"),
  email: z.email("Invalid email address"),
  phoneNumber: z.string().nonempty("Phone number is required"),
  role: z.string().refine((val) => Role.safeParse(val).success, {
    message: "Invalid role",
  }),
});

function AddStaffForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: onboardStaffToHotel,
    onSuccess: async () => {
      setOpen(false);
      form.reset();
      setShowSuccessDialog({
        show: true,
        message: "Staff added successfully",
      });
      await queryClient.invalidateQueries({
        exact: true,
        queryKey: ["staffs"],
      });
      await revalidateRoute("/manager/staff-management");
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
      staffName: "",
      email: "",
      role: "FRONT_DESK",
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
        onSubmit={form.handleSubmit((data) =>
          mutate({
            fullName: data.staffName,
            email: data.email,
            role: data.role as HotelRole,
            phoneNumber: "",
            staffId: "",
          })
        )}
      >
        <FormField
          name="staffName"
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
                <Input
                  type="tel"
                  placeholder="e.g +234 801 234 5678"
                  {...field}
                />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

const hotelOwnerStaffEditSchema = newStaffFormSchema;
// .omit({ role: true });

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

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof hotelOwnerStaffEditSchema>) => {
      const changes: Partial<z.infer<typeof hotelOwnerStaffEditSchema>> = {};

      for (const key in data) {
        if (
          data[key as keyof typeof data] ===
          initialValues[key as keyof typeof data]
        )
          continue;
        changes[key as keyof typeof data] = data[key as keyof typeof data];
      }
      return editStaffDetails(staffId, changes);
    },
    onSuccess: async () => {
      setOpen(false);
      setShowSuccessDialog({
        show: true,
        message: "Staff details updated successfully",
      });
      revalidateRoute("/manager/staff-management");
    },
  });
  const handleSubmit = useCallback(
    (data: z.infer<typeof hotelOwnerStaffEditSchema>) => {
      toast.promise(mutateAsync(data), {
        loading: "Updating staff details...",
        success: "Staff details updated successfully",
        error: "Failed to update staff details",
      });
    },
    [mutateAsync]
  );

  return (
    <DialogContent className="p-4 rounded-2xl">
      <DialogTitle>Edit staff details</DialogTitle>
      <DialogDescription className="sr-only">
        Edit staff details
      </DialogDescription>
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            control={form.control}
            name="staffName"
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
                  <Input
                    type="tel"
                    placeholder="e.g +234 801 234 5678"
                    {...field}
                  />
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
                  disabled
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

const resetPasswordFormSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
  });

function ResetPasswordForm({
  setOpen,
  staffId,
}: {
  setOpen: (open: boolean) => void;
  staffId: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    progressive: true,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: z.infer<typeof resetPasswordFormSchema>) => {
      return resetPasswordForStaff(staffId, payload);
    },
    onError: async () => {
      toast.error("Something went wrong", {
        description: "Failed to reset password",
      });
    },
    onSuccess: async () => {
      setOpen(false);
      setShowSuccessDialog({
        show: true,
        message: "Password reset successfully",
      });
      form.reset();
    },
  });

  const handleSubmit = useCallback(
    (data: z.infer<typeof resetPasswordFormSchema>) => {
      toast.promise(mutateAsync(data), {
        loading: "Resetting password...",
        success: "Password reset successfully",
        error: "Failed to reset password",
      });
    },
    [mutateAsync]
  );

  return (
    <DialogContent className="p-4 rounded-2xl">
      <DialogTitle>Reset password</DialogTitle>
      <DialogDescription className="sr-only">
        Fill in the details below to reset staff password.
      </DialogDescription>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pr-10"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    variant="link"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pr-10"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    variant="link"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </Button>
                </div>
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
                <span>Resetting, please wait...</span>
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}

const suspendStaffSchema = z.object({
  reason: z.string().nonempty(),
  fromDate: z.date().refine((date) => date <= new Date(), {
    message: "From date cannot be in the past",
  }),
  toDate: z.date().refine((date) => date >= new Date(), {
    message: "To date cannot be in the past",
  }),
});

function SuspendStaffDialog({
  setOpen,
  id,
}: {
  setOpen: (open: boolean) => void;
  id: string;
}) {
  const queryClient = useQueryClient();
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: {
      reason: string;
      fromDate: string;
      toDate: string;
    }) => suspendStaffAccount(id, data),
    onSuccess: () => {
      setOpen(false);
      setShowSuccessDialog({
        show: true,
        message: "Staff suspended successfully",
      });
      queryClient.invalidateQueries({
        exact: true,
        queryKey: ["staffs"],
      });
      revalidateRoute("/manager/staff-management");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to suspend staff",
      });
    },
  });
  const form = useForm({
    resolver: zodResolver(suspendStaffSchema),
    defaultValues: {
      fromDate: new Date(),
      toDate: new Date(),
      reason: "",
    },
    reValidateMode: "onSubmit",
    mode: "onSubmit",
  });

  const handleSubmit = useCallback(
    async (data: z.infer<typeof suspendStaffSchema>) => {
      const isValid = await form.trigger();
      if (!isValid) return;
      const newData = {
        ...data,
        fromDate: format(data.fromDate, "yyyy-MM-dd"),
        toDate: format(data.toDate, "yyyy-MM-dd"),
      };
      await mutateAsync(newData);
    },
    [form, mutateAsync]
  );

  return (
    <DialogContent className="p-4 rounded-2xl">
      <DialogTitle className="sr-only">Suspend Staff</DialogTitle>
      <DialogDescription className="sr-only">
        Type "SUSPEND" to confirm
      </DialogDescription>

      <div className="flex flex-col items-center justify-center">
        <AlertTriangleIcon className="text-destructive-2 size-12" />
        <h2 className="text-destructive-2">Warning!</h2>
        <p className="text-gray-600 text-center">
          This action Cannot be Undone, to confirm this action is deliberate
          “type SUSPEND below”
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for suspension</FormLabel>
                <FormControl>
                  <Input placeholder="Type reason for suspension" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-4">
            <FormField
              control={form.control}
              name="fromDate"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>From Date</FormLabel>

                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a starting date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          // Date must be today or later
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        captionLayout="dropdown-months"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toDate"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>To Date</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick an ending date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            // Date must be today or later
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          captionLayout="dropdown-months"
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2Icon className="animate-spin" />
                <span>Suspending, please wait...</span>
              </>
            ) : (
              "Suspend Staff"
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
  columnHelper.accessor("userStatus", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue() as
        | "ACTIVE"
        | "INACTIVE"
        | "SUSPENDED"
        | "PENDING";

      const refinedStatus = status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const variantMap = {
        ACTIVE: "green",
        INACTIVE: "yellow",
        SUSPENDED: "destructive",
        PENDING: "blue",
      } as const;

      return (
        <Badge variant={variantMap[status] ?? "outline"}>{refinedStatus}</Badge>
      );
    },
  }),
  columnHelper.accessor("phoneNumber", {
    header: "Phone Number",
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  columnHelper.display({
    id: "actions",
    cell: (info) => {
      const [open, setOpen] = useState<
        "reset-password" | "suspend-staff" | "edit-staff" | false
      >(false);

      const dialog = useMemo(() => {
        switch (open) {
          case "reset-password":
            return (
              <ResetPasswordForm
                staffId={info.row.original.id}
                setOpen={(isOpen) => setOpen(isOpen ? "reset-password" : false)}
              />
            );
          case "edit-staff": {
            const rowData = info.row.original;
            return (
              <UpdateHotelStaffForm
                staffId={rowData.id}
                initialValues={{
                  staffName: rowData.fullName,
                  email: rowData.email,
                  role: rowData.role,
                  phoneNumber: rowData.phoneNumber,
                }}
                setOpen={(isOpen) => setOpen(isOpen ? "edit-staff" : false)}
              />
            );
          }
          case "suspend-staff":
            return (
              <SuspendStaffDialog
                setOpen={(isOpen) => setOpen(isOpen ? "suspend-staff" : false)}
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
          onOpenChange={(isOpen) => isOpen || setOpen(false)}
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
              <DialogTrigger
                className="w-full"
                onClick={() => setOpen("edit-staff")}
                asChild
              >
                <DropdownMenuItem>
                  <DoorOpenIcon />
                  Edit Staff
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuSeparator />
              <DialogTrigger
                className="w-full"
                onClick={() => setOpen("reset-password")}
                asChild
              >
                <DropdownMenuItem>
                  <ReplaceIcon />
                  Reset password
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuSeparator />
              <DialogTrigger
                className="w-full"
                onClick={() => setOpen("suspend-staff")}
                disabled={info.row.original.userStatus === "SUSPENDED"}
                asChild
              >
                <DropdownMenuItem className="hover:bg-red-500/10 text-red-500 focus:text-red-500">
                  <UserXIcon className="text-red-500" />
                  Suspend Staff
                </DropdownMenuItem>
              </DialogTrigger>
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

export function HotelManagerStaffsList({
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
