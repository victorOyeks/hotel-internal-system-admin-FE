"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import type { LocationProductResponse } from "@/lib/fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { getProductsByLocation, issueStockItem } from "@/lib/inventory-actions";

const stockIssueItemSchema = z.object({
    productId: z.string().min(1, "Product is required"),
    quantity: z.coerce.number().min(0.0001, "Quantity must be greater than 0"),
    batchId: z.string().optional(),
    notes: z.string().optional(),
});

const stockIssueSchema = z.object({
    locationId: z.string().min(1, "Location is required"),
    issueDate: z.date(),
    issueType: z.enum([
        "INTERNAL_CONSUMPTION",
        "SALES_ISSUE",
        "TRANSFER_OUT",
        "OTHERS",
    ]),
    departmentId: z.string().optional(),
    receivedBy: z.string().optional(),
    toLocationId: z.string().optional(),
    items: z.array(stockIssueItemSchema).min(1, "At least one item is required"),
    notes: z.string().optional(),
    reason: z.string().optional(),
});

type StockIssueFormValues = z.infer<typeof stockIssueSchema>;

interface CreateStockIssueFormProps {
    onClose: () => void;
    locations: { id: string; name: string }[];
}

export function CreateStockIssueForm({
    onClose,
    locations,
}: CreateStockIssueFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locationProducts, setLocationProducts] = useState<LocationProductResponse[]>([]);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [locationFetched, setLocationFetched] = useState(false);
    // Ref so validate functions always read the latest products without stale closure issues
    const locationProductsRef = useRef<LocationProductResponse[]>([]);

    const form = useForm({
        resolver: zodResolver(stockIssueSchema),
        mode: "onSubmit",
        reValidateMode: "onSubmit",
        defaultValues: {
            issueDate: new Date(),
            issueType: "INTERNAL_CONSUMPTION",
            items: [{ productId: "", quantity: 0 }],
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const issueType = form.watch("issueType");
    const watchedItems = form.watch("items");

    const handleLocationChange = async (locationId: string, fieldOnChange: (v: string) => void) => {
        fieldOnChange(locationId);
        setIsLoadingStock(true);
        setLocationFetched(false);
        setLocationProducts([]);
        locationProductsRef.current = [];
        // Reset items when location changes so stale product selections are cleared
        replace([{ productId: "", quantity: 0 }]);

        const result = await getProductsByLocation(locationId);
        if (result.success && result.data) {
            setLocationProducts(result.data);
            locationProductsRef.current = result.data;
        } else {
            toast.error("Failed to load products for this location");
        }
        setLocationFetched(true);
        setIsLoadingStock(false);
    };

    const getLocationProduct = (productId: string): LocationProductResponse | undefined =>
        locationProductsRef.current.find((p) => p.productId === productId);

    async function onSubmit(data: StockIssueFormValues) {
        // Guard: validate quantities against available stock before submitting
        let hasQtyError = false;
        for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];
            const lp = getLocationProduct(item.productId);
            if (lp && item.quantity > lp.quantityAvailable) {
                form.setError(`items.${i}.quantity`, {
                    type: "manual",
                    message: `Exceeds available stock (${lp.quantityAvailable} available)`,
                });
                hasQtyError = true;
            }
        }
        if (hasQtyError) return;

        setIsSubmitting(true);
        try {
            const result = await issueStockItem({
                ...data,
                issueDate: format(data.issueDate, "yyyy-MM-dd'T'HH:mm:ss"),
            });
            if (!result.success) {
                toast.error(result.error ?? "Failed to create stock issue");
                return;
            }
            toast.success("Stock issue created successfully");
            router.refresh();
            onClose();
        } catch (error) {
            toast.error("Failed to create stock issue");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const locationId = form.watch("locationId");
    const hasLocation = !!locationId;
    const hasProducts = locationProducts.length > 0;

    const productOptions = locationProducts.map((lp) => ({
        id: lp.productId,
        label: `${lp.name} (${lp.sku})`,
        available: lp.quantityAvailable,
        outOfStock: lp.isOutOfStock,
    }));

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="locationId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>From Location</FormLabel>
                                <Select
                                    onValueChange={(value) => handleLocationChange(value, field.onChange)}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select location" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {locations.map((location) => (
                                            <SelectItem key={location.id} value={location.id}>
                                                {location.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="issueType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Issue Type</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="INTERNAL_CONSUMPTION">
                                            Internal Consumption
                                        </SelectItem>
                                        <SelectItem value="SALES_ISSUE">Sales Issue</SelectItem>
                                        <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>
                                        <SelectItem value="OTHERS">Others</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {issueType === "TRANSFER_OUT" && (
                        <FormField
                            control={form.control}
                            name="toLocationId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>To Location</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select destination" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {locations.map((location) => (
                                                <SelectItem key={location.id} value={location.id}>
                                                    {location.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground",
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
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
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Items</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!hasLocation || isLoadingStock || !hasProducts}
                            onClick={() => append({ productId: "", quantity: 0 })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </div>

                    {!hasLocation && (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            Select a location above to view available items.
                        </p>
                    )}

                    {hasLocation && isLoadingStock && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading available products for this location…
                        </div>
                    )}

                    {hasLocation && !isLoadingStock && locationFetched && !hasProducts && (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No items are stocked at the selected location.
                        </p>
                    )}

                    {hasLocation && !isLoadingStock && hasProducts && fields.map((field, index) => {
                        const selectedProductId = watchedItems[index]?.productId;
                        const lp = selectedProductId ? getLocationProduct(selectedProductId) : undefined;
                        const availableQty = lp?.quantityAvailable;

                        return (
                            <div key={field.id} className="flex gap-4 items-start">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.productId`}
                                    render={({ field: f }) => (
                                        <FormItem className="flex-1">
                                            <Select
                                                onValueChange={f.onChange}
                                                value={f.value}
                                                disabled={isLoadingStock}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select product" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {productOptions.map((opt) => (
                                                        <SelectItem
                                                            key={opt.id}
                                                            value={opt.id}
                                                            disabled={opt.outOfStock}
                                                        >
                                                            <span>{opt.label}</span>
                                                            {opt.available !== null && (
                                                                <span className={cn("ml-2 text-xs", opt.outOfStock ? "text-destructive" : "text-muted-foreground")}>
                                                                    — {opt.outOfStock ? "out of stock" : `${opt.available} avail.`}
                                                                </span>
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`items.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem className="w-32">
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    {...(availableQty !== undefined ? { max: availableQty } : {})}
                                                    value={field.value as number}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    onBlur={field.onBlur}
                                                    name={field.name}
                                                    ref={field.ref}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        );
                    })}
                </div>

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="receivedBy"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Received By</FormLabel>
                                <FormControl>
                                    <Input placeholder="Name of receiver" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reason</FormLabel>
                                <FormControl>
                                    <Input placeholder="Reason for issue" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Additional notes..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Issue"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
