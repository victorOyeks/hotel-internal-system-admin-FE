"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createStorageLocation, revalidateRoute } from "@/lib/actions";
import {
    InventoryLocations,
} from "@/lib/fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// We need to redefine the schema here for the form because the one in fetch.ts
// might be a bit too strict or loose for the form state (e.g. optional fields)
// But ideally we should use the one from fetch.ts.
// Let's try to reconstruct it to match the form needs.

const formSchema = z.object({
    locationCode: z.string().min(1, "Location Code is required").max(50, "Max 50 characters"),
    locationName: z.string().min(1, "Location Name is required").max(200, "Max 200 characters"),
    locationType: InventoryLocations,
    description: z.string().max(500, "Max 500 characters").optional(),
    building: z.string().max(200, "Max 200 characters").optional(),
    floor: z.string().max(100, "Max 100 characters").optional(),
    room: z.string().max(100, "Max 100 characters").optional(),
    physicalAddress: z.string().max(500, "Max 500 characters").optional(),
    totalCapacity: z.coerce.number().optional(),
    capacityUnit: z.string().optional(),
    temperatureControlled: z.boolean().default(false),
    minTemperature: z.coerce.number().optional(),
    maxTemperature: z.coerce.number().optional(),
    humidityControlled: z.boolean().default(false),
    minHumidity: z.coerce.number().optional(),
    maxHumidity: z.coerce.number().optional(),
    accessRestrictions: z.string().max(200, "Max 200 characters").optional(),
    managerUserId: z.string().max(200).optional(),
    contactPerson: z.string().max(200, "Max 200 characters").optional(),
    contactPhone: z.string().max(50, "Max 50 characters").optional(),
    isPrimary: z.boolean().default(false),
    allowNegativeStock: z.boolean().default(false),
    operatingHours: z.string().max(1000, "Max 1000 characters").optional(),
    specialInstructions: z.string().max(1000, "Max 1000 characters").optional(),
    notes: z.string().max(1000, "Max 1000 characters").optional(),
});

export function CreateLocationForm({
    onSuccess,
}: { onSuccess?: () => void }) {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            locationCode: "",
            locationName: "",
            locationType: "MAIN_WAREHOUSE",
            description: "",
            building: "",
            floor: "",
            room: "",
            physicalAddress: "",
            totalCapacity: 0,
            capacityUnit: "",
            temperatureControlled: false,
            minTemperature: 0,
            maxTemperature: 0,
            humidityControlled: false,
            minHumidity: 0,
            maxHumidity: 0,
            accessRestrictions: "",
            managerUserId: "",
            contactPerson: "",
            contactPhone: "",
            isPrimary: false,
            allowNegativeStock: false,
            operatingHours: "",
            specialInstructions: "",
            notes: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const response = await createStorageLocation(values);
            if (!response.success) {
                throw new Error(response.error);
            }
            return response.data;
        },
        onSuccess: () => {
            toast.success("Storage location created successfully");
            form.reset();
            onSuccess?.();
            revalidateRoute("/dashboard/locations")
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create storage location");
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        createMutation.mutate(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="locationCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location Code *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., WH-MAIN" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="locationName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Main Warehouse" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="locationType"
                            render={({ field }) => (
                                <FormItem className="col-span-full">
                                    <FormLabel>Location Type *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(InventoryLocations.enum).map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type.replace(/_/g, " ")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="col-span-2">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Brief description..."
                                                rows={2}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Configuration</h3>
                    <div className="flex flex-row gap-4">
                        <FormField
                            control={form.control}
                            name="isPrimary"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 flex-1">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Primary Location</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Mark this as the main storage location
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="allowNegativeStock"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 flex-1">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Allow Negative Stock</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Allow stock level to go below zero
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Physical Location */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Physical Location</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="building"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Building</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="floor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Floor</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="room"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Room</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="col-span-3">
                            <FormField
                                control={form.control}
                                name="physicalAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Physical Address</FormLabel>
                                        <FormControl>
                                            <Textarea rows={2} className="resize-none" placeholder="Full physical address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Capacity */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Capacity</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="totalCapacity"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Total Capacity</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" {...form.register("totalCapacity", { valueAsNumber: true })} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="capacityUnit"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Capacity Unit</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., m3, kg, pallets" {...form.register("capacityUnit")} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Climate Control */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Climate Control</h3>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="temperatureControlled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Temperature Controlled</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {form.watch("temperatureControlled") && (
                            <div className="grid grid-cols-2 gap-4 pl-6">
                                <FormField
                                    control={form.control}
                                    name="minTemperature"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Min Temperature (°C)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...form.register("minTemperature", { valueAsNumber: true })} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="maxTemperature"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Max Temperature (°C)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...form.register("maxTemperature", { valueAsNumber: true })} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="humidityControlled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Humidity Controlled</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {form.watch("humidityControlled") && (
                            <div className="grid grid-cols-2 gap-4 pl-6">
                                <FormField
                                    control={form.control}
                                    name="minHumidity"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Min Humidity (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" max="100" {...form.register("minHumidity", { valueAsNumber: true })} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="maxHumidity"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Max Humidity (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" max="100" {...form.register("maxHumidity", { valueAsNumber: true })} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Management */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Management & Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="contactPerson"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Person</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contactPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Phone</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="col-span-2">
                            <FormField
                                control={form.control}
                                name="operatingHours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Operating Hours</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g., 24/7 or 9:00 AM - 5:00 PM"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Access & Instructions */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Access & Instructions</h3>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="accessRestrictions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Access Restrictions</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Who can access this location..."
                                            rows={2}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="specialInstructions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Special Instructions</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Special handling, safety protocols..."
                                            rows={3}
                                            {...field}
                                        />
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
                                    <FormLabel>Internal Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Internal notes about this location..."
                                            rows={2}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                        type="submit"
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? (
                            <>
                                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Location"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
