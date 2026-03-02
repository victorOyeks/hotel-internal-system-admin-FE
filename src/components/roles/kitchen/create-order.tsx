"use client";

import { useState, useMemo } from "react";
import { DestinationCombobox } from "./destination-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	ShoppingCartIcon,
	PlusIcon,
	MinusIcon,
	XIcon,
	SearchIcon,
	CheckIcon,
	ChevronsUpDownIcon,
	UtensilsIcon,
	GlassWaterIcon,
	PackageIcon,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { APIOutput } from "@/lib/action-utils";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type OrderRequest, placeOrder } from "@/lib/restaurant-actions";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { Badge } from "@/components/ui/badge";

type FoodItemAPIResponse =
	APIOutput<"@get/api/restaurants/items/all">["data"][number];

interface MenuItem extends FoodItemAPIResponse { }

interface CartItem extends MenuItem {
	quantity: number;
	rate?: number;
	note?: string;
}

// Booking Combobox Component
function BookingCombobox({
	value,
	onValueChange,
	bookings,
}: {
	value: string;
	onValueChange: (value: string) => void;
	bookings: CurrentBooking[];
}) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useQueryState(
		"booking:search",
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
						? bookings.find((booking) => booking.id === value)?.customId
						: "Select booking..."}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search bookings..."
						value={searchQuery}
						onValueChange={(value) => setSearchQuery(value)}
					/>
					<CommandList>
						<CommandEmpty>No booking found.</CommandEmpty>
						<CommandGroup>
							{bookings.map((booking) => (
								<CommandItem
									key={booking.id}
									value={booking.id}
									onSelect={(currentValue) => {
										onValueChange(currentValue === value ? "" : currentValue);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											value === booking.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<div>
										<div className="font-medium">{booking.customId}</div>
										<div className="text-sm text-gray-500">
											{booking.guestName} - Room {booking.roomIdentifier}
										</div>
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

// Filter Tabs Component
function FilterTabs({
	activeFilter,
	onFilterChange,
}: {
	activeFilter: "ALL" | "FOOD" | "DRINK";
	onFilterChange: (filter: "ALL" | "FOOD" | "DRINK") => void;
}) {
	return (
		<div className="flex gap-2 mb-4">
			<Button
				variant={activeFilter === "ALL" ? "default" : "outline"}
				onClick={() => onFilterChange("ALL")}
				className="flex items-center gap-2"
			>
				<PackageIcon className="h-4 w-4" />
				All Items
			</Button>
			<Button
				variant={activeFilter === "FOOD" ? "default" : "outline"}
				onClick={() => onFilterChange("FOOD")}
				className="flex items-center gap-2"
			>
				<UtensilsIcon className="h-4 w-4" />
				Food
			</Button>
			<Button
				variant={activeFilter === "DRINK" ? "default" : "outline"}
				onClick={() => onFilterChange("DRINK")}
				className="flex items-center gap-2"
			>
				<GlassWaterIcon className="h-4 w-4" />
				Drinks
			</Button>
		</div>
	);
}

// Search Bar Component
function SearchBar({
	searchQuery,
	onSearchChange,
}: {
	searchQuery: string;
	onSearchChange: (query: string) => void;
}) {
	return (
		<div className="mb-4">
			<div className="relative max-w-md">
				<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
				<Input
					placeholder="Search food items..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-10"
				/>
			</div>
		</div>
	);
}

// Menu Item Card Component
function MenuItemCard({
	item,
	onAddToCart,
}: {
	item: MenuItem;
	onAddToCart: (item: MenuItem) => void;
}) {
	const isOutOfStock = !item.inStock;

	return (
		<div
			className={cn(
				"bg-white border border-gray-200 rounded-xl p-3",
				isOutOfStock && "opacity-60",
			)}
		>
			<div className="flex flex-col h-full">
				<div className="flex-1 mb-4">
					{/* Item Type Badge */}
					<div className="flex items-center justify-between mb-2">
						<Badge
							variant={item.itemType === "FOOD" ? "green" : "blue"}
							className="text-xs"
						>
							{item.itemType === "FOOD" ? (
								<>
									<UtensilsIcon className="h-3 w-3 mr-1" />
									Food
								</>
							) : (
								<>
									<GlassWaterIcon className="h-3 w-3 mr-1" />
									Drink
								</>
							)}
						</Badge>

						{/* Stock Badge */}
						{isOutOfStock ? (
							<Badge variant="destructive" className="text-xs">
								Out of Stock
							</Badge>
						) : (
							<Badge variant="green" className="text-xs">
								In Stock
							</Badge>
						)}
					</div>

					<h3 className="font-semibold text-base line-clamp-2 mb-1">
						{item.name}
					</h3>
					<p className="text-xs text-gray-500 mb-2">ID: {item.customId}</p>
				</div>

				<p className="font-medium text-lg mb-1">{formatCurrency(item.price)}</p>
				<Button
					onClick={() => onAddToCart(item)}
					className="w-full"
					disabled={isOutOfStock}
				>
					<PlusIcon className="h-5 w-5 mr-2" />
					{isOutOfStock ? "Out of Stock" : "Add to Cart"}
				</Button>
			</div>
		</div>
	);
}

// Cart Item Component
function CartItemRow({
	item,
	onUpdateQuantity,
	onUpdateRate,
	onRemove,
}: {
	item: CartItem;
	onUpdateQuantity: (itemId: string, quantity: number) => void;
	onUpdateRate: (itemId: string, rate: number | undefined) => void;
	onRemove: (itemId: string) => void;
}) {
	const [isEditingRate, setIsEditingRate] = useState(false);
	const [rateValue, setRateValue] = useState(
		item.rate ? Math.round(item.rate * 100) : 100,
	);

	const handleRateSubmit = () => {
		const rate = rateValue / 100;
		if (rate >= 0.1 && rate <= 1.0) {
			onUpdateRate(item.id, rate === 1 ? undefined : rate);
			setIsEditingRate(false);
		} else {
			toast.error("Rate must be between 10% and 100%");
		}
	};

	const finalPrice = item.price * (item.rate || 1) * item.quantity;
	const hasDiscount = item.rate && item.rate < 1;

	return (
		<div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
			{/* Item Info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5 mb-0.5">
					<p className="font-medium truncate text-sm">{item.name}</p>
					<Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
						{item.itemType === "FOOD" ? (
							<UtensilsIcon className="h-2.5 w-2.5" />
						) : (
							<GlassWaterIcon className="h-2.5 w-2.5" />
						)}
					</Badge>
				</div>
				<div className="flex items-center gap-2 text-xs text-gray-500">
					<span>
						{formatCurrency(item.price)} × {item.quantity}
					</span>
					{hasDiscount && (
						<Badge
							variant="outline"
							className="text-[10px] px-1 py-0 h-4 text-green-600 border-green-600"
						>
							{Math.round((item.rate || 1) * 100)}% rate
						</Badge>
					)}
					<span className="font-medium text-gray-900">
						= {formatCurrency(finalPrice)}
					</span>
				</div>
			</div>

			{/* Quantity Controls */}
			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
					className="h-6 w-6 p-0"
				>
					<MinusIcon className="h-3 w-3" />
				</Button>
				<span className="w-6 text-center text-xs font-medium">
					{item.quantity}
				</span>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
					className="h-6 w-6 p-0"
				>
					<PlusIcon className="h-3 w-3" />
				</Button>
			</div>

			{/* Rate Button */}
			<Popover open={isEditingRate} onOpenChange={setIsEditingRate}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-6 w-6 p-0 text-blue-600"
						title="Set rate"
					>
						<span className="text-xs font-bold">%</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-48 p-3" align="end">
					<div className="space-y-2">
						<Label htmlFor={`rate-${item.id}`} className="text-xs">
							Rate (10-100%)
						</Label>
						<div className="flex gap-2">
							<Input
								id={`rate-${item.id}`}
								type="number"
								min="10"
								max="100"
								step="1"
								value={rateValue}
								onChange={(e) => setRateValue(Number(e.target.value))}
								className="h-7 text-xs"
							/>
							<Button
								size="sm"
								onClick={handleRateSubmit}
								className="h-7 px-2 text-xs"
							>
								Set
							</Button>
						</div>
						<p className="text-[10px] text-gray-500">
							Final: {formatCurrency(item.price * (rateValue / 100))}
						</p>
					</div>
				</PopoverContent>
			</Popover>

			{/* Remove Button */}
			<Button
				variant="ghost"
				size="sm"
				onClick={() => onRemove(item.id)}
				className="h-6 w-6 p-0 text-red-500"
			>
				<XIcon className="h-3 w-3" />
			</Button>
		</div>
	);
}

// Order Summary Component
function OrderSummary({
	destinations,
	cart,
	orderDetails,
	onOrderDetailsChange,
	bookings,
	onRemoveItem,
	onUpdateQuantity,
	onUpdateRate,
	onPlaceOrder,
	onClearCart,
	total,
	isCreatingOrder,
}: {
	destinations: Destination[];
	cart: CartItem[];
	orderDetails: OrderRequest;
	onOrderDetailsChange: (details: OrderRequest) => void;
	bookings: CurrentBooking[];
	onRemoveItem: (itemId: string) => void;
	onUpdateQuantity: (itemId: string, quantity: number) => void;
	onUpdateRate: (itemId: string, rate: number | undefined) => void;
	onPlaceOrder: () => void;
	onClearCart: () => void;
	total: number;
	isCreatingOrder: boolean;
}) {
	return (
		<div className="flex flex-col h-full relative isolate">
			<ScrollArea className="flex-1 px-4 -mx-4 max-h-[calc(100vh-270px)]">
				<div className="space-y-3 px-2 pb-4">
					<div className="grid grid-cols-2 gap-x-4">
						{/* Destination */}
						<div>
							<Label htmlFor="destination" className="text-xs">
								Destination *
							</Label>
							<DestinationCombobox
								value={orderDetails.destinationId}
								onValueChange={(value) =>
									onOrderDetailsChange({
										...orderDetails,
										destinationId: value,
									})
								}
								destinations={destinations}
							/>
						</div>

						{/* Booking Selection (Optional) */}
						<div>
							<Label className="text-xs">Associated Booking (Optional)</Label>
							<div className="mt-1">
								<BookingCombobox
									value={orderDetails.bookingId || ""}
									onValueChange={(bookingId) =>
										onOrderDetailsChange({ ...orderDetails, bookingId })
									}
									bookings={bookings}
								/>
							</div>
						</div>
					</div>

					{/* Cart Items */}
					<div>
						<Label className="text-xs mb-2 block">Items ({cart.length})</Label>
						<div className="space-y-2 max-h-[300px] overflow-y-auto">
							{cart.map((item) => (
								<CartItemRow
									key={item.id}
									item={item}
									onUpdateQuantity={onUpdateQuantity}
									onUpdateRate={onUpdateRate}
									onRemove={onRemoveItem}
								/>
							))}
						</div>
					</div>

					{/* Order Note (Optional) */}
					<div>
						<Label htmlFor="orderNote" className="text-xs">
							Order Note (Optional)
						</Label>
						<Textarea
							id="orderNote"
							value={orderDetails.note || ""}
							onChange={(e) =>
								onOrderDetailsChange({
									...orderDetails,
									note: e.target.value,
								})
							}
							placeholder="Special instructions"
							className="mt-1 resize-none h-16 text-sm"
						/>
					</div>

					{/* Payment Status */}
					<div className="flex items-center justify-between">
						<Label htmlFor="isPaid" className="text-xs">
							Mark as Paid
						</Label>
						<Switch
							id="isPaid"
							checked={orderDetails.isPaid || false}
							onCheckedChange={(checked) =>
								onOrderDetailsChange({
									...orderDetails,
									isPaid: checked,
									paymentMethod: checked ? orderDetails.paymentMethod : undefined,
									paymentReference: checked
										? orderDetails.paymentReference
										: undefined,
								})
							}
						/>
					</div>

					{/* Payment Method (Conditional) */}
					{orderDetails.isPaid && (
						<>
							<div>
								<Label htmlFor="paymentMethod" className="text-xs">
									Payment Method *
								</Label>
								<Select
									value={orderDetails.paymentMethod || ""}
									onValueChange={(value) =>
										onOrderDetailsChange({
											...orderDetails,
											paymentMethod: value as OrderRequest["paymentMethod"],
										})
									}
								>
									<SelectTrigger className="mt-1 w-full">
										<SelectValue placeholder="Select payment method" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="CASH">Cash</SelectItem>
										<SelectItem value="CARD">Card</SelectItem>
										<SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
										<SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
										<SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
										<SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
										<SelectItem value="CHEQUE">Cheque</SelectItem>
										<SelectItem value="ONLINE_PAYMENT">Online Payment</SelectItem>
										<SelectItem value="PAYPAL">PayPal</SelectItem>
										<SelectItem value="CRYPTOCURRENCY">Cryptocurrency</SelectItem>
										<SelectItem value="DIRECT_DEBIT">Direct Debit</SelectItem>
										<SelectItem value="PETTY_CASH">Petty Cash</SelectItem>
										<SelectItem value="OTHERS">Others</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Payment Reference (Optional) */}
							<div>
								<Label htmlFor="paymentReference" className="text-xs">
									Payment Reference (Optional)
								</Label>
								<Input
									id="paymentReference"
									value={orderDetails.paymentReference || ""}
									onChange={(e) =>
										onOrderDetailsChange({
											...orderDetails,
											paymentReference: e.target.value,
										})
									}
									placeholder="e.g., Transaction ID, Receipt Number"
									className="mt-1"
								/>
							</div>
						</>
					)}
				</div>
			</ScrollArea>

			{/* Footer with Total and Actions */}
			{cart.length > 0 && (
				<div className="border-t pt-3 px-4 absolute bottom-0 left-0 right-0 bg-white z-10">
					<div className="flex justify-between items-center mb-3">
						<span className="font-semibold">Total:</span>
						<span className="font-bold text-lg">{formatCurrency(total)}</span>
					</div>

					<div className="space-y-2">
						<Button
							onClick={onPlaceOrder}
							className="w-full h-9"
							disabled={isCreatingOrder}
						>
							{isCreatingOrder ? "Placing Order..." : "Place Order"}
						</Button>
						<Button
							variant="outline"
							onClick={onClearCart}
							className="w-full h-8 text-sm"
						>
							Clear Cart
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

// Cart Button Component
function CartButton({
	itemCount,
	onClick,
}: {
	itemCount: number;
	onClick: () => void;
}) {
	return (
		<Button variant="outline" className="relative" onClick={onClick}>
			<ShoppingCartIcon className="h-4 w-4 mr-2" />
			Cart ({itemCount})
		</Button>
	);
}

// Menu Grid Component
function MenuGrid({
	items,
	onAddToCart,
}: {
	items: MenuItem[];
	onAddToCart: (item: MenuItem) => void;
}) {
	if (items.length === 0) {
		return (
			<div className="col-span-full text-center py-12 text-gray-500">
				<p className="text-lg">No items found</p>
				<p className="text-sm">Try searching with different keywords</p>
			</div>
		);
	}

	return (
		<>
			{items.map((item) => (
				<MenuItemCard key={item.id} item={item} onAddToCart={onAddToCart} />
			))}
		</>
	);
}

type CurrentBooking =
	APIOutput<"@get/api/restaurants/current-bookings">["data"]["content"][number];

type Destination =
	APIOutput<"@get/api/restaurants/destinations">["data"][number];

export function OrderPage({
	foodItems,
	currentBookings,
	destinations,
}: {
	foodItems: MenuItem[];
	currentBookings: CurrentBooking[];
	destinations: Destination[];
}) {
	const queryClient = useQueryClient();
	const [cart, setCart] = useState<CartItem[]>([]);
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useQueryState(
		"search",
		parseAsString.withDefault("").withOptions({
			shallow: true,
		}),
	);
	const [orderDetails, setOrderDetails] = useState<OrderRequest>({
		destinationId: "",
		bookingId: undefined,
		orderItems: [],
		note: undefined,
	});
	const [itemTypeFilter, setItemTypeFilter] = useQueryState(
		"itemType",
		parseAsStringEnum(["ALL", "FOOD", "DRINK"]).withDefault("ALL"),
	);

	const filteredItems = useMemo(() => {
		return foodItems.filter((item) => {
			const matchesSearch =
				item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.customId.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesSearch;
		});
	}, [foodItems, searchQuery]);
	// Calculate cart totals
	const cartSummary = useMemo(() => {
		const total = cart.reduce(
			(sum, item) => sum + item.price * (item.rate || 1) * item.quantity,
			0,
		);
		const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

		return { total, itemCount };
	}, [cart]);

	const { isPending, mutate } = useMutation({
		mutationKey: ["placeOrder"],
		mutationFn: async (orderData: OrderRequest) => {
			if (cart.length === 0) {
				throw new Error("Your cart is empty");
			}

			if (!orderData.destinationId || orderData.destinationId.trim() === "") {
				throw new Error("Please enter a destination");
			}

			if (orderData.isPaid && !orderData.paymentMethod) {
				throw new Error("Please select a payment method for paid orders");
			}

			const response = await placeOrder(orderData);

			if (!response.success) {
				throw new Error(response.error || "Failed to place order");
			}

			return response.data;
		},
		onSuccess: (message) => {
			toast.success(message, {
				description: `Total Amount: ${formatCurrency(cartSummary.total)}`,
			});
			if (orderDetails.bookingId) {
				queryClient.invalidateQueries({ queryKey: ["folio", orderDetails.bookingId] });
			}
			setCart([]);
			setOrderDetails({
				destinationId: "",
				bookingId: undefined,
				orderItems: [],
				note: undefined,
			});
			setIsCartOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to place order");
		},
	});

	// Add item to cart
	const addToCart = (item: MenuItem) => {
		if (!item.inStock) {
			toast.error(`${item.name} is out of stock`);
			return;
		}

		setCart((prev) => {
			const existingItem = prev.find((cartItem) => cartItem.id === item.id);

			if (existingItem) {
				return prev.map((cartItem) =>
					cartItem.id === item.id
						? { ...cartItem, quantity: cartItem.quantity + 1 }
						: cartItem,
				);
			} else {
				return [...prev, { ...item, quantity: 1 }];
			}
		});

		toast.success(`${item.name} added to cart`);
	};

	// Update cart item quantity
	const updateQuantity = (itemId: string, quantity: number) => {
		if (quantity <= 0) {
			removeFromCart(itemId);
			return;
		}

		setCart((prev) =>
			prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
		);
	};

	// Update cart item rate
	const updateRate = (itemId: string, rate: number | undefined) => {
		setCart((prev) =>
			prev.map((item) => (item.id === itemId ? { ...item, rate } : item)),
		);
		toast.success("Rate updated");
	};

	// Remove item from cart
	const removeFromCart = (itemId: string) => {
		setCart((prev) => prev.filter((item) => item.id !== itemId));
		toast.success("Item removed from cart");
	};

	// Clear cart
	const clearCart = () => {
		setCart([]);
		toast.success("Cart cleared");
	};

	// Place order
	const createOrderRequest = () => {
		// Prepare order data according to API schema
		const orderData = {
			...orderDetails,
			orderItems: cart.map((item) => ({
				itemId: item.id,
				itemType: item.itemType,
				quantity: item.quantity,
				rate: item.rate,
				note: item.note,
			})),
		};

		mutate(orderData);
	};

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
					<div>
						<h1 className="text-3xl font-bold">Create Order</h1>
						<p className="text-gray-600">
							Browse menu and create orders for guests
						</p>
					</div>

					<Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
						<SheetTrigger asChild>
							<CartButton
								itemCount={cartSummary.itemCount}
								onClick={() => setIsCartOpen(true)}
							/>
						</SheetTrigger>

						<SheetContent className="w-full sm:max-w-md flex flex-col p-0">
							<SheetHeader className="border-b">
								<SheetTitle>Order Summary</SheetTitle>
								<SheetDescription className="text-xs">
									Review your order items
								</SheetDescription>
							</SheetHeader>

							{cart.length === 0 ? (
								<p className="text-center text-gray-500 py-12 text-sm">
									Cart is empty
								</p>
							) : (
								<OrderSummary
									destinations={destinations}
									cart={cart}
									orderDetails={orderDetails}
									onOrderDetailsChange={setOrderDetails}
									bookings={currentBookings}
									onRemoveItem={removeFromCart}
									onUpdateQuantity={updateQuantity}
									onUpdateRate={updateRate}
									onPlaceOrder={createOrderRequest}
									isCreatingOrder={isPending}
									onClearCart={clearCart}
									total={cartSummary.total}
								/>
							)}
						</SheetContent>
					</Sheet>
				</div>

				{/* Filters */}
				<div className="bg-white rounded-lg border  p-4 mb-6">
					<div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
						<FilterTabs
							activeFilter={itemTypeFilter}
							onFilterChange={setItemTypeFilter}
						/>
						<SearchBar
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
						/>
					</div>

					{/* Stats */}
					<div className="flex gap-4 mt-4 pt-4 border-t">
						<div className="text-sm text-gray-600">
							<span className="font-medium">{foodItems.length}</span> items
							found
						</div>
						<div className="text-sm text-gray-600">
							<span className="font-medium">
								{foodItems.filter((item) => item.inStock).length}
							</span>{" "}
							in stock
						</div>
						<div className="text-sm text-gray-600">
							<span className="font-medium">
								{foodItems.filter((item) => !item.inStock).length}
							</span>{" "}
							out of stock
						</div>
					</div>
				</div>

				{/* Menu Items Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					<MenuGrid items={filteredItems} onAddToCart={addToCart} />
				</div>
			</div>
		</div>
	);
}