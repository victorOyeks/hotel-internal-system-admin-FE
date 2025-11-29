"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import type {
	InventoryResponse,
	InventorySummaryResponse,
	Pagination,
} from "@/lib/fetch";
import {
	ArchiveIcon,
	CheckIcon,
	ChevronRightIcon,
	ChevronsUpDownIcon,
	Loader2Icon,
	PackageCheckIcon,
	PlusIcon,
	TriangleAlert,
	TruckIcon,
} from "lucide-react";
import { InventoryOfficerInventoryTable } from "./dashboard-table";
import {
	useEffect,
	useState,
	type PropsWithChildren,
	type ReactNode,
} from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { revalidateRoute } from "@/lib/actions";
import { toast } from "sonner";
import { atom, useAtom, useSetAtom } from "jotai";
import { addToInventory, issueStockItem } from "@/lib/inventory-actions";
import { SuccessDialog } from "@/components/shared/shared-dialogs";
import Link from "next/link";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
} from "@/components/ui/command";
import { useQueryState, parseAsString } from "nuqs";

const successDialogAtom = atom({
	show: false,
	message: "",
});

export function InventoryStat({ data }: { data: InventorySummaryResponse }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-blue-600/10 rounded-full flex items-center justify-center">
					<ArchiveIcon className="size-6 text-blue-600" />
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
					<ArchiveIcon className="size-6 text-green-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Available Items</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.available}
					</p>
				</div>
			</div>

			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-yellow-600/10 rounded-full flex items-center justify-center">
					<ArchiveIcon className="size-6 text-yellow-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Low in Stock</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.lowInStock}
					</p>
				</div>
			</div>

			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-red-600/10 rounded-full flex items-center justify-center">
					<TriangleAlert className="size-6 text-red-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Out of Stock</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.outOfStock}
					</p>
				</div>
			</div>
		</div>
	);
}

const actions = [
	{
		title: "Add New Stock Item",
		heading: "Add new item",
		Component: AddNewItemForm,
		icon: PlusIcon,
		key: "add-stock-item",
	},
	{
		title: "Issue Stock Item",
		heading: "Issue stock item",
		Component: IssueStockItemForm,
		icon: PackageCheckIcon,
		key: "issue-stock-item",
	},
	{
		title: "Request Restock",
		icon: TruckIcon,
		key: "request-restock",
	},
];

const issueStockItemFormSchema = z.object({
	itemId: z.string().nonempty(),
	quantity: z.number().min(1).default(1),
	department: z.string().nonempty(),
	receivingStaff: z.string().nonempty(),
	remarks: z.string().optional(),
});

function ItemSelectorCombobox({
	items,
	value,
	onValueChange,
}: {
	items: InventoryResponse[];
	value: string;
	onValueChange: (value: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useQueryState(
		"item:search",
		parseAsString.withDefault(""),
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					{value
						? items.find((item) => item.id === value)?.name
						: "Select item..."}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search items..."
						value={searchQuery}
						onValueChange={(value) => setSearchQuery(value)}
					/>
					<CommandList className="w-full">
						<CommandEmpty>No item found.</CommandEmpty>
						<CommandGroup>
							{items.map((item) => (
								<CommandItem
									key={item.id}
									value={item.id}
									onSelect={(currentValue) => {
										onValueChange(currentValue === value ? "" : currentValue);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											value === item.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<div>
										<div className="font-medium">{item.customId}</div>
										<div className="text-sm text-gray-500">{item.name}</div>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

function IssueStockItemForm({
	data,
	setOpen,
}: {
	setOpen: (open: boolean) => void;
	data: InventoryResponse[];
}) {
	const form = useForm({
		resolver: zodResolver(issueStockItemFormSchema),
		defaultValues: {
			itemId: "",
			quantity: 1,
			department: "",
			receivingStaff: "",
			remarks: "",
		},
		progressive: true,
		reValidateMode: "onBlur",
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (payload: z.infer<typeof issueStockItemFormSchema>) => {
			const response = await issueStockItem(payload);

			if (!response.success) {
				throw new Error(response.error);
			}

			return response.data;
		},
		onSuccess: async (data) => {
			form.reset();
			setOpen(false);
			setShowSuccessDialog({
				show: true,
				message: data,
			});
			await revalidateRoute("/inventory");
		},
		onError: (e) => {
			toast.error("Something went wrong", {
				description: e.message,
			});
		},
	});

	const setShowSuccessDialog = useSetAtom(successDialogAtom);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((data) => mutate(data))}
				className="space-y-6"
			>
				<FormField
					control={form.control}
					name="itemId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Item</FormLabel>
							<FormControl>
								<ItemSelectorCombobox
									items={data}
									value={field.value}
									onValueChange={field.onChange}
								/>
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
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="quantity"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Quantity</FormLabel>
							<FormControl>
								<Input type="number" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="receivingStaff"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Receiving Staff</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="remarks"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Remarks</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={isPending} className="w-full">
					{isPending ? (
						<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
					) : null}
					Issue Stock Item
				</Button>
			</form>
		</Form>
	);
}

const inventoryItemFormSchema = z.object({
	name: z.string().nonempty(),
	category: z.string().nonempty(),
	unit: z.string().optional(),
	quantity: z.number(),
});

function AddNewItemForm({ setOpen }: { setOpen: (open: boolean) => void }) {
	const form = useForm({
		resolver: zodResolver(inventoryItemFormSchema),
		defaultValues: {
			category: "",
			name: "",
			quantity: 0,
			unit: "",
		},
		progressive: true,
		reValidateMode: "onBlur",
	});

	const { mutate, isPending } = useMutation({
		mutationFn: addToInventory,
		onSuccess: async () => {
			form.reset();
			setOpen(false);
			setShowSuccessDialog({
				show: true,
				message: "Item added successfully",
			});
			await revalidateRoute("/inventory");
		},
		onError: () => {
			toast.error("Something went wrong", {
				description: "Failed to add item",
			});
		},
	});
	const setShowSuccessDialog = useSetAtom(successDialogAtom);
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
								<Input placeholder="e.g Tissues" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="category"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Item Category</FormLabel>
							<FormControl>
								<Input placeholder="e.g Electronics" {...field} />
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
								<Input placeholder="e.g Pieces" {...field} />
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
									placeholder="e.g 100"
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
							<span>Adding, please wait...</span>
						</>
					) : (
						"Add Item"
					)}
				</Button>
			</form>
		</Form>
	);
}

export function QuickActions({ data }: { data: InventoryResponse[] }) {
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
							<Component
								data={data}
								setOpen={(open) => setOpen(open ? key : false)}
							/>
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

			<DialogContent className="rounded-4xl max-w-sm">{children}</DialogContent>
		</Dialog>
	);
}

function InventoryDashboardToolbar() {
	return (
		<section className="flex flex-row items-center justify-between mb-4">
			<div className="flex items-center gap-x-2">
				<h2 className="text-lg font-semibold">Inventory</h2>
				<TableFilter>
					<form className="flex flex-col gap-2">
						<label htmlFor="" className="text-sm font-medium">
							Status
						</label>
						<select className="border border-gray-300 rounded-md p-1">
							<option value="all">All</option>
							<option value="available">Available</option>
							<option value="low-in-stock">Low in Stock</option>
							<option value="out-of-stock">Out of Stock</option>
						</select>
					</form>
				</TableFilter>
			</div>

			<Button variant={"link"} size={"sm"} asChild>
				<Link href="/dashboard/inventory">View All</Link>
			</Button>
		</section>
	);
}

export function InventoryDashboard({
	content,
	paginationMeta,
	breadcrumb,
}: {
	content: InventoryResponse[];
	paginationMeta: Pagination;
	breadcrumb: { title: string; breadcrumbs: Breadcrumb[] };
}) {
	const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);
	const setBreadcrumb = useSetAtom(breadcrumbAtom);

	useEffect(() => {
		setBreadcrumb(breadcrumb);
	}, [setBreadcrumb, breadcrumb]);

	return (
		<div>
			<InventoryDashboardToolbar />
			<InventoryOfficerInventoryTable
				data={content}
				paginationMeta={paginationMeta}
			/>
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
