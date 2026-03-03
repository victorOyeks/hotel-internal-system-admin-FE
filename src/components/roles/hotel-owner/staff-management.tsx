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
	PlusCircleIcon,
	SearchIcon,
	AlertTriangleIcon,
	UserXIcon,
	ReplaceIcon,
	EyeOffIcon,
	EyeIcon,
	CalendarIcon,
	TrashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RotateCcwIcon, XIcon } from "lucide-react";
import {
	deleteStaffMember,
	onboardManagerToHotel,
	revalidateRoute,
	updateStaffDetailsByOwner,
} from "@/lib/actions";
import {
	resetPasswordForStaffOwner,
	suspendStaffAccountOwner,
} from "@/lib/hotel-owner-actions";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
	MultiSelect,
	MultiSelectContent,
	MultiSelectItem,
	MultiSelectTrigger,
	MultiSelectValue,
} from "@/components/ui/multi-select";

const columnHelper = createColumnHelper<CustomPageStaffResponse>();
const successDialogAtom = atom({
	show: false,
	message: "",
});

function StaffFilter({
	queryState,
	setQueryState,
	setOpen,
}: {
	queryState: {
		search: string | null;
		status: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED" | null;
		role:
			| "HOTEL_OWNER"
			| "MANAGER"
			| "FRONT_DESK"
			| "INVENTORY"
			| "RESTAURANT"
			| "MARKETER"
			| "RENTALS"
			| "LAUNDRY"
			| "FINANCIALS"
			| "SUPER_ADMIN"
			| null;
	};
	setQueryState: (state: Partial<typeof queryState>) => void;
	setOpen: (open: boolean) => void;
}) {
	const [tempFilters, setTempFilters] = useState({
		status: queryState.status,
		role: queryState.role,
	});

	const applyFilters = useCallback(() => {
		setQueryState({
			...queryState,
			status: tempFilters.status,
			role: tempFilters.role,
		});
		setOpen(false);
	}, [
		queryState,
		tempFilters.status,
		tempFilters.role,
		setQueryState,
		setOpen,
	]);

	const clearFilters = useCallback(() => {
		const clearedFilters = {
			status: null,
			role: null,
		};
		setTempFilters(clearedFilters);
		setQueryState({
			search: queryState.search,
			status: null,
			role: null,
		});
		setOpen(false);
	}, [queryState.search, setQueryState, setOpen]);

	const filterStates = useMemo(() => {
		const hasActiveFilters = tempFilters.status || tempFilters.role;
		const hasAppliedFilters = queryState.status || queryState.role;
		const appliedFiltersCount = [queryState.status, queryState.role].filter(
			Boolean,
		).length;

		return {
			hasActiveFilters,
			hasAppliedFilters,
			appliedFiltersCount,
		};
	}, [
		tempFilters.status,
		tempFilters.role,
		queryState.status,
		queryState.role,
	]);

	const statusOptions = [
		{ value: "ACTIVE", label: "Active", color: "bg-green-500" },
		{ value: "INACTIVE", label: "Inactive", color: "bg-gray-500" },
		{ value: "PENDING", label: "Pending", color: "bg-yellow-500" },
		{ value: "SUSPENDED", label: "Suspended", color: "bg-red-500" },
	];

	const roleOptions = [
		{ value: "MANAGER", label: "Manager" },
		{ value: "FRONT_DESK", label: "Front Desk" },
		{ value: "INVENTORY", label: "Inventory" },
		{ value: "RESTAURANT", label: "Restaurant" },
		{ value: "MARKETER", label: "Marketer" },
		{ value: "RENTALS", label: "Rentals" },
		{ value: "LAUNDRY", label: "Laundry" },
		{ value: "FINANCIALS", label: "Financials" },
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="font-semibold text-sm">Filter Staff</h4>
				<Button
					variant="ghost"
					size="sm"
					onClick={clearFilters}
					className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
				>
					<RotateCcwIcon className="h-3 w-3 mr-1" />
					Clear all
				</Button>
			</div>

			{/* Status Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Status</Label>
				<Select
					value={tempFilters.status || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							status:
								value === "all" ? null : (value as typeof tempFilters.status),
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{statusOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								<div className="flex items-center gap-2">
									<div className={`w-2 h-2 ${option.color} rounded-full`}></div>
									{option.label}
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Role Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Role</Label>
				<Select
					value={tempFilters.role || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							role: value === "all" ? null : (value as typeof tempFilters.role),
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All roles" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All roles</SelectItem>
						{roleOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Filter Summary */}
			{filterStates.hasActiveFilters && (
				<div className="pt-2 border-t">
					<p className="text-xs text-muted-foreground mb-2">Active filters:</p>
					<div className="flex flex-wrap gap-1">
						{tempFilters.status && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								Status: {tempFilters.status.toLowerCase()}
							</span>
						)}
						{tempFilters.role && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								Role:{" "}
								{roleOptions.find((r) => r.value === tempFilters.role)?.label}
							</span>
						)}
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex gap-2 pt-2">
				<Button
					variant="outline"
					size="sm"
					onClick={clearFilters}
					className="flex-1"
				>
					Clear
				</Button>
				<Button size="sm" onClick={applyFilters} className="flex-1">
					Apply Filters
				</Button>
			</div>
		</div>
	);
}

function HotelListToolbar({
	table,
}: {
	table: TableType<CustomPageStaffResponse>;
}) {
	const [queryState, setQueryState] = useQueryStates({
		search: parseAsString,
		status: parseAsStringLiteral([
			"ACTIVE",
			"INACTIVE",
			"PENDING",
			"SUSPENDED",
		]),
		role: parseAsStringLiteral([
			"HOTEL_OWNER",
			"MANAGER",
			"FRONT_DESK",
			"INVENTORY",
			"RESTAURANT",
			"MARKETER",
			"RENTALS",
			"LAUNDRY",
			"FINANCIALS",
			"SUPER_ADMIN",
		]),
	});
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const setSuccessDialogOpen = useSetAtom(successDialogAtom);

	const handleExport = useCallback(
		async (data: ExportData) => {
			console.log("Exporting data with the following details:", data);
			setExportDialogOpen(false);
			setSuccessDialogOpen({
				show: true,
				message: "Data exported successfully!",
			});
		},
		[setSuccessDialogOpen],
	);

	const [open, setOpen] = useState(false);

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div>
				<p className="text-primary md:pl-2">All staff ({table.getRowCount()})</p>
			</div>

			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search staff..."
						value={queryState.search ?? ""}
						onChange={(e) => setQueryState({ search: e.target.value || null })}
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>

				<div className="flex items-center gap-2">
					<TableFilter open={open} setOpen={setOpen}>
						<StaffFilter
							queryState={queryState}
							setQueryState={setQueryState}
							setOpen={setOpen}
						/>
					</TableFilter>

					{/* Applied Filters Display */}
					{(queryState.status || queryState.role) && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{queryState.status && (
								<>
									<span>Status:</span>
									<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
										{queryState.status}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQueryState({ status: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</>
							)}
							{queryState.role && (
								<>
									<span>Role:</span>
									<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
										{queryState.role.replace("_", " ")}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQueryState({ role: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</>
							)}
						</div>
					)}
				</div>

				<AddNewManagerDialog />

				<ExportDialog
					open={exportDialogOpen}
					setOpenAction={setExportDialogOpen}
					onSubmitAction={handleExport}
				/>
			</div>
		</div>
	);
}

function AddNewManagerDialog() {
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
					<span className="hidden md:inline">Add Manager</span>
				</Button>
			</DialogTrigger>

			<DialogContent className="p-4 rounded-2xl">
				<DialogTitle>Add new manager</DialogTitle>
				<DialogDescription className="sr-only">
					Fill in the details below to add a new manager.
				</DialogDescription>

				<div className="mt-4">
					<AddManagerForm setOpen={setOpen} />
				</div>
			</DialogContent>
		</Dialog>
	);
}

const newManagerFormSchema = z.object({
	fullName: z.string().nonempty("Manager name is required"),
	email: z.email("Invalid email address"),
	phoneNumber: z.string().nonempty("Phone number is required"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

function AddManagerForm({ setOpen }: { setOpen: (open: boolean) => void }) {
	const [showPassword, setShowPassword] = useState(false);

	const queryClient = useQueryClient();
	const setShowSuccessDialog = useSetAtom(successDialogAtom);
	const { mutate, isPending } = useMutation({
		mutationFn: async (data: z.infer<typeof newManagerFormSchema>) => {
			const res = await onboardManagerToHotel(data);
			if (!res.success) {
				throw new Error(res.error || "Failed to add manager");
			}
			return res.data;
		},
		onSuccess: async () => {
			setOpen(false);
			form.reset();
			setShowSuccessDialog({
				show: true,
				message: "Manager added successfully",
			});
			await queryClient.invalidateQueries({ queryKey: ["staffs"] });
			revalidateRoute("/hotel-owner/staff-management");
		},
		onError: (e) => {
			toast.error("Something went wrong", {
				description: e.message || "Failed to add manager",
			});
		},
	});
	const form = useForm({
		resolver: zodResolver(newManagerFormSchema),
		defaultValues: {
			fullName: "",
			email: "",
			phoneNumber: "",
			password: "",
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
							<FormLabel>Manager Name</FormLabel>
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
								<Input
									placeholder="e.g john.doe@example.com"
									autoComplete="new-email"
									data-form-type="other"
									{...field}
								/>
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
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<div className="relative">
								<FormControl>
									<Input
										type={showPassword ? "text" : "password"}
										placeholder="Enter a password"
										autoComplete="new-password"
										data-form-type="other"
										{...field}
									/>
								</FormControl>
								<Button
									type="button"
									variant={"ghost"}
									size={"icon"}
									className="absolute right-0 top-1/2 -translate-y-1/2"
									onClick={() => setShowPassword((prev) => !prev)}
								>
									{showPassword ? (
										<EyeOffIcon className="h-4 w-4" />
									) : (
										<EyeIcon className="h-4 w-4" />
									)}
								</Button>
							</div>
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
						"Add Manager"
					)}
				</Button>
			</form>
		</Form>
	);
}

const editStaffFormSchema = z.object({
	fullName: z.string().nonempty("Staff name is required"),
	email: z.email("Invalid email address"),
	phoneNumber: z.string().nonempty("Phone number is required"),
	staffId: z.string().optional(),
	roles: z.array(Role).min(1, "At least one role is required"),
});

function UpdateHotelStaffForm({
	initialValues,
	staffId,
	setOpen,
}: {
	initialValues: z.infer<typeof editStaffFormSchema>;
	staffId: string;
	setOpen: (open: boolean) => void;
}) {
	const queryClient = useQueryClient();
	const setSelectedStaff = useSetAtom(selectedStaffAtom);
	const setShowSuccessDialog = useSetAtom(successDialogAtom);
	const form = useForm({
		resolver: zodResolver(editStaffFormSchema),
		defaultValues: initialValues,
		progressive: true,
		mode: "onBlur",
		reValidateMode: "onBlur",
	});

	const { mutateAsync, isPending } = useMutation({
		mutationFn: async (data: z.infer<typeof editStaffFormSchema>) => {
			const res = await updateStaffDetailsByOwner({
				staffId,
				fullName: data.fullName,
				email: data.email,
				phoneNumber: data.phoneNumber,
				roles: data.roles as string[],
			});
			if (!res.success) {
				throw new Error(res.error || "Failed to update staff details");
			}
			return res.data;
		},
		onSuccess: async () => {
			setOpen(false);
			setShowSuccessDialog({
				show: true,
				message: "Staff details updated successfully",
			});
			await queryClient.invalidateQueries({ queryKey: ["staffs"] });
			revalidateRoute("/hotel-owner/staff-management");
		},
		onError: (e) => {
			toast.error("Something went wrong", {
				description: e.message || "Failed to update staff details",
			});
		},
	});

	const handleSubmit = useCallback(
		(data: z.infer<typeof editStaffFormSchema>) => {
			toast.promise(mutateAsync(data), {
				loading: "Updating staff details...",
				success: "Staff details updated successfully",
				error: (e) => e.message || "Failed to update staff details",
			});
		},
		[mutateAsync],
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
						name="staffId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Staff ID{" "}
									<span className="text-muted-foreground font-normal">
										(Optional)
									</span>
								</FormLabel>
								<FormControl>
									<Input placeholder="e.g STF-001" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="roles"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Roles</FormLabel>
								<FormControl>
									<MultiSelect
										values={field.value}
										onValuesChange={field.onChange}
									>
										<MultiSelectTrigger className="w-full">
											<MultiSelectValue placeholder="Select roles" />
										</MultiSelectTrigger>
										<MultiSelectContent
											search={{ placeholder: "Search roles..." }}
										>
											<MultiSelectItem value="MANAGER">
												Manager
											</MultiSelectItem>
											<MultiSelectItem value="FRONT_DESK">
												Front Desk
											</MultiSelectItem>
											<MultiSelectItem value="INVENTORY">
												Inventory
											</MultiSelectItem>
											<MultiSelectItem value="RESTAURANT">
												Restaurant
											</MultiSelectItem>
											<MultiSelectItem value="RENTALS">
												Rentals
											</MultiSelectItem>
											<MultiSelectItem value="LAUNDRY">
												Laundry
											</MultiSelectItem>
											<MultiSelectItem value="FINANCIALS">
												Financials
											</MultiSelectItem>
										</MultiSelectContent>
									</MultiSelect>
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
			return resetPasswordForStaffOwner(staffId, payload);
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
		[mutateAsync],
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
											placeholder="Enter password"
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
											placeholder="Enter password"
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
		mutationFn: (data: { reason: string; fromDate: string; toDate: string }) =>
			suspendStaffAccountOwner(id, data),
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
			revalidateRoute("/hotel-owner/staff-management");
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
		[form, mutateAsync],
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
					"type SUSPEND below"
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
														!field.value && "text-muted-foreground",
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
															!field.value && "text-muted-foreground",
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
		mutationFn: async (staffId: string) => {
			const response = await deleteStaffMember(staffId);
			if (!response.success) {
				throw new Error(response.error);
			}
			return response.data;
		},
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
		onError: (e) => {
			toast.error("Something went wrong", {
				description: e.message || "Failed to delete staff",
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
			<DialogTitle className="sr-only">Delete Staff</DialogTitle>
			<DialogDescription className="sr-only">
				Type "DELETE" to confirm
			</DialogDescription>

			<div className="flex flex-col items-center justify-center">
				<AlertTriangleIcon className="text-destructive-2 size-12" />
				<h2 className="text-destructive-2">Warning!</h2>
				<p className="text-gray-600 text-center">
					This action Cannot be Undone, to confirm this action is deliberate
					"type DELETE below"
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

const statusVariantMap = {
	ACTIVE: "green",
	INACTIVE: "yellow",
	SUSPENDED: "destructive",
	PENDING: "blue",
} as const;

function formatRole(role: string) {
	return role
		.replaceAll("_", " ")
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatus(status: string) {
	return status
		.replaceAll("_", " ")
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value: string | null | undefined) {
	if (!value || value === "N/A") return "N/A";
	return new Date(value).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "numeric",
		hour12: true,
	});
}

const selectedStaffAtom = atom<CustomPageStaffResponse | null>(null);

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
			<span className="font-semibold">{info.getValue()}</span>
		),
	}),
	columnHelper.accessor("staffId", {
		header: "Staff ID",
		cell: (info) => <span>{info.getValue() || info.row.original.customId}</span>,
	}),
	columnHelper.accessor("userStatus", {
		header: "Status",
		cell: (info) => {
			const status = (info.getValue() ?? "INACTIVE") as keyof typeof statusVariantMap;
			return (
				<Badge variant={statusVariantMap[status] ?? "outline"}>
					{formatStatus(status)}
				</Badge>
			);
		},
	}),
	columnHelper.accessor("email", {
		header: "Email",
		cell: (info) => <span>{info.getValue()}</span>,
	}),
	columnHelper.accessor("phoneNumber", {
		header: "Phone",
		cell: (info) => <span>{info.getValue() ?? "-"}</span>,
	}),
	columnHelper.accessor("lastLogin", {
		header: "Last Login",
		cell: (info) => (
			<span className="text-gray-500">{formatDate(info.getValue())}</span>
		),
	}),
];

function StaffDetailSheet() {
	const [staff, setStaff] = useAtom(selectedStaffAtom);
	const [dialogOpen, setDialogOpen] = useState<
		"edit-staff" | "reset-password" | "suspend-staff" | "delete-staff" | false
	>(false);

	const dialogContent = useMemo(() => {
		if (!staff) return null;
		switch (dialogOpen) {
			case "edit-staff":
				return (
					<UpdateHotelStaffForm
						staffId={staff.id}
						initialValues={{
							fullName: staff.fullName,
							email: staff.email,
							phoneNumber: staff.phoneNumber ?? "",
							staffId: staff.staffId ?? "",
							roles: (staff.roles ?? []) as z.infer<typeof Role>[],
						}}
						setOpen={(isOpen) => setDialogOpen(isOpen ? "edit-staff" : false)}
					/>
				);
			case "reset-password":
				return (
					<ResetPasswordForm
						staffId={staff.id}
						setOpen={(isOpen) =>
							setDialogOpen(isOpen ? "reset-password" : false)
						}
					/>
				);
			case "suspend-staff":
				return (
					<SuspendStaffDialog
						setOpen={(isOpen) =>
							setDialogOpen(isOpen ? "suspend-staff" : false)
						}
						id={staff.id}
					/>
				);
			case "delete-staff":
				return (
					<DeleteStaffDialog
						setOpen={(isOpen) =>
							setDialogOpen(isOpen ? "delete-staff" : false)
						}
						id={staff.id}
					/>
				);
			default:
				return null;
		}
	}, [dialogOpen, staff]);

	if (!staff) return null;

	const status = (staff.userStatus ?? "INACTIVE") as keyof typeof statusVariantMap;
	const roles = staff.roles ?? [];

	const details = [
		{ label: "Staff ID", value: staff.staffId || staff.customId },
		{ label: "Full Name", value: staff.fullName },
		{ label: "Email", value: staff.email },
		{ label: "Phone Number", value: staff.phoneNumber ?? "-" },
		{ label: "Verified", value: staff.verified ? "Yes" : "No" },
		{ label: "Last Login", value: formatDate(staff.lastLogin) },
	];

	return (
		<>
			<Sheet open={!!staff} onOpenChange={(open) => !open && setStaff(null)}>
				<SheetContent className="overflow-y-auto">
					<SheetHeader>
						<SheetTitle className="text-lg">Staff Details</SheetTitle>
						<SheetDescription className="sr-only">
							View staff member details
						</SheetDescription>
					</SheetHeader>

					<div className="space-y-6 p-4">
						{/* Header */}
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-xl font-semibold">{staff.fullName}</h3>
								<p className="text-sm text-muted-foreground">{staff.email}</p>
							</div>
							<Badge variant={statusVariantMap[status] ?? "outline"}>
								{formatStatus(status)}
							</Badge>
						</div>

						{/* Details Grid */}
						<div className="grid grid-cols-1 gap-4">
							{details.map((item) => (
								<div
									key={item.label}
									className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
								>
									<span className="text-sm text-muted-foreground">
										{item.label}
									</span>
									<span className="text-sm font-medium text-right">
										{item.value}
									</span>
								</div>
							))}
						</div>

						{/* Roles */}
						<div className="space-y-2">
							<span className="text-sm text-muted-foreground">Roles</span>
							<div className="flex flex-wrap gap-2">
								{roles.length > 0 ? roles.map((r) => (
									<Badge key={r} variant="outline">{formatRole(r)}</Badge>
								)) : (
									<span className="text-sm text-muted-foreground">No roles assigned</span>
								)}
							</div>
						</div>

						{/* Actions */}
						<div className="space-y-2 pt-2">
							<Button
								className="w-full"
								variant="outline"
								onClick={() => setDialogOpen("edit-staff")}
							>
								<DoorOpenIcon className="mr-2 h-4 w-4" />
								Edit Staff Details
							</Button>
							<Button
								className="w-full"
								variant="outline"
								onClick={() => setDialogOpen("reset-password")}
							>
								<ReplaceIcon className="mr-2 h-4 w-4" />
								Reset Password
							</Button>
							{staff.userStatus !== "SUSPENDED" && (
								<Button
									className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
									variant="outline"
									onClick={() => setDialogOpen("suspend-staff")}
								>
									<UserXIcon className="mr-2 h-4 w-4" />
									Suspend Staff
								</Button>
							)}
							<Button
								className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
								variant="outline"
								onClick={() => setDialogOpen("delete-staff")}
							>
								<TrashIcon className="mr-2 h-4 w-4" />
								Delete Staff
							</Button>
						</div>
					</div>
				</SheetContent>
			</Sheet>

			<Dialog
				open={typeof dialogOpen === "string"}
				onOpenChange={(isOpen) => isOpen || setDialogOpen(false)}
			>
				{dialogContent}
			</Dialog>
		</>
	);
}

function StaffTable({ table }: { table: TableType<CustomPageStaffResponse> }) {
	const setSelectedStaff = useSetAtom(selectedStaffAtom);

	if (!table.getRowModel().rows?.length) {
		return (
			<div className="overflow-hidden rounded-md border bg-card p-8 text-center">
				<p className="text-gray-500">No staff records found</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-md border bg-card">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-gray-100 text-left text-gray-500">
							{table.getHeaderGroups().map((headerGroup) =>
								headerGroup.headers.map((header) => (
									<th key={header.id} className="px-4 py-3 font-medium">
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</th>
								)),
							)}
						</tr>
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className="border-b last:border-0 cursor-pointer hover:bg-gray-50"
								onClick={() => setSelectedStaff(row.original)}
							>
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-4 py-3 text-gray-600">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function StaffPagination({ table }: { table: TableType<CustomPageStaffResponse> }) {
	if (table.getPageCount() <= 1) return null;

	return (
		<div className="flex items-center justify-between">
			<p className="text-sm text-gray-500">
				Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
			</p>
			<DataTablePagination table={table} />
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
		<div className="h-full w-full p-4 space-y-2 md:space-y-4">
			<HotelListToolbar table={table} />
			<StaffTable table={table} />
			{table.getPageCount() > 1 && <StaffPagination table={table} />}
			<StaffDetailSheet />
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
