"use client";

import { useState, useMemo } from "react";
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
import { useMutation } from "@tanstack/react-query";
import { placeOrder } from "@/lib/restaurant-actions";
import { parseAsString, useQueryState } from "nuqs";

type FoodItemAPIResponse =
  APIOutput<"@get/api/restaurants/food-items/all">["data"][number];

interface MenuItem extends FoodItemAPIResponse {}

interface CartItem extends MenuItem {
  quantity: number;
  note?: string;
}

interface OrderRequest {
  destination: string;
  orderItems: {
    foodItemId: string;
    quantity: number;
    rate: number;
    note?: string;
  }[];
  bookingId?: string;
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
    parseAsString.withDefault("")
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
                      value === booking.id ? "opacity-100" : "opacity-0"
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

// Search Bar Component
function SearchBar({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  return (
    <div className="mb-6">
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
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col h-full">
        <div className="flex-1 mb-4">
          <h3 className="font-semibold text-base line-clamp-2 mb-2">
            {item.name}
          </h3>
          <p className="font-medium">{formatCurrency(item.price)}</p>
        </div>

        <Button onClick={() => onAddToCart(item)} className="w-full">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}

// Cart Item Component
function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <div>
        <p className="font-medium">{item.name}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          className="h-6 w-6 p-0"
        >
          <MinusIcon className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm">{item.quantity}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="h-6 w-6 p-0"
        >
          <PlusIcon className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="h-6 w-6 p-0 text-red-500"
        >
          <XIcon className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Order Summary Component
function OrderSummary({
  cart,
  destination,
  onDestinationChange,
  orderNote,
  onOrderNoteChange,
  bookingId,
  onBookingIdChange,
  bookings,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  onClearCart,
  total,
  isCreatingOrder,
}: {
  cart: CartItem[];
  destination: string;
  onDestinationChange: (destination: string) => void;
  orderNote: string;
  onOrderNoteChange: (note: string) => void;
  bookingId: string;
  onBookingIdChange: (bookingId: string) => void;
  bookings: CurrentBooking[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: () => void;
  onClearCart: () => void;
  total: number;
  isCreatingOrder: boolean;
}) {
  return (
    <ScrollArea className="max-h-screen pb-12">
      <div className="space-y-4 px-4">
        {/* Destination */}
        <div>
          <Label htmlFor="destination">Destination *</Label>
          <Input
            id="destination"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            placeholder="Room number or location"
            className="mt-1"
          />
        </div>

        {/* Booking Selection (Optional) */}
        <div>
          <Label>Associated Booking (Optional)</Label>
          <div className="mt-1">
            <BookingCombobox
              value={bookingId}
              onValueChange={onBookingIdChange}
              bookings={bookings}
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="space-y-3 max-h-64">
          {cart.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemoveItem}
            />
          ))}
        </div>

        {/* Order Note (Optional) */}
        <div>
          <Label htmlFor="orderNote">Order Note (Optional)</Label>
          <Textarea
            id="orderNote"
            value={orderNote}
            onChange={(e) => onOrderNoteChange(e.target.value)}
            placeholder="Special instructions"
            className="mt-1 resize-none"
          />
        </div>

        {/* Total */}
        {cart.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <div className="space-y-2">
              <Button
                onClick={onPlaceOrder}
                className="w-full"
                disabled={isCreatingOrder}
              >
                {isCreatingOrder ? "Placing Order..." : "Place Order"}
              </Button>
              <Button
                variant="outline"
                onClick={onClearCart}
                className="w-full"
              >
                Clear Cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
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

export function OrderPage({
  foodItems,
  currentBookings,
}: {
  foodItems: MenuItem[];
  currentBookings: CurrentBooking[];
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [bookingId, setBookingId] = useState("");

  // Filter food items based on search query
  const filteredFoodItems = useMemo(() => {
    if (!searchQuery.trim()) return foodItems;

    return foodItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [foodItems, searchQuery]);

  // Calculate cart totals
  const cartSummary = useMemo(() => {
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
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

      if (!destination) {
        throw new Error("Please enter a destination");
      }

      const response = await placeOrder(orderData);

      if (!response.success) {
        throw new Error(response.error || "Failed to place order");
      }

      return response.data;
    },
    onSuccess: (message) => {
      // Simulate order placement
      toast.success(message, {
        description: `Total Amount: ${formatCurrency(cartSummary.total)}`,
      });
      setCart([]);
      setDestination("");
      setOrderNote("");
      setBookingId("");
      setIsCartOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to place order");
    },
  });

  // Add item to cart
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
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
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
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
    const orderData: OrderRequest = {
      destination,
      orderItems: cart.map((item) => ({
        foodItemId: item.id,
        quantity: item.quantity,
        rate: item.price,
        note: item.note || undefined,
      })),
      bookingId: bookingId || undefined,
      note: orderNote || undefined,
    };

    mutate(orderData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Create Order</h1>
            <p className="text-gray-600">Select items to create a new order</p>
          </div>

          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <CartButton
                itemCount={cartSummary.itemCount}
                onClick={() => setIsCartOpen(true)}
              />
            </SheetTrigger>

            <SheetContent>
              <SheetHeader>
                <SheetTitle>Order Summary</SheetTitle>
                <SheetDescription>Review your order items</SheetDescription>
              </SheetHeader>

              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Cart is empty</p>
              ) : (
                <OrderSummary
                  cart={cart}
                  destination={destination}
                  onDestinationChange={setDestination}
                  orderNote={orderNote}
                  onOrderNoteChange={setOrderNote}
                  bookingId={bookingId}
                  onBookingIdChange={setBookingId}
                  bookings={currentBookings}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeFromCart}
                  onPlaceOrder={createOrderRequest}
                  isCreatingOrder={isPending}
                  onClearCart={clearCart}
                  total={cartSummary.total}
                />
              )}
            </SheetContent>
          </Sheet>
        </div>

        <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <MenuGrid items={filteredFoodItems} onAddToCart={addToCart} />
        </div>
      </div>
    </div>
  );
}
