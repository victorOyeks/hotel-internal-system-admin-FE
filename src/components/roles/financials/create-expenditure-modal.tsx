"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createExpenditure } from "@/lib/financials-actions";
import { Loader2 } from "lucide-react";

const EXPENDITURE_CATEGORIES = [
    // Utilities
    { value: "ELECTRICITY", label: "Electricity" },
    { value: "WATER", label: "Water" },
    { value: "GAS", label: "Gas" },
    { value: "INTERNET_AND_PHONE", label: "Internet & Phone" },
    // Maintenance
    { value: "BUILDING_MAINTENANCE", label: "Building Maintenance" },
    { value: "ROOM_MAINTENANCE", label: "Room Maintenance" },
    { value: "HVAC_MAINTENANCE", label: "HVAC Maintenance" },
    { value: "ELEVATOR_MAINTENANCE", label: "Elevator Maintenance" },
    { value: "POOL_MAINTENANCE", label: "Pool Maintenance" },
    { value: "ELECTRICAL_WORK", label: "Electrical Work" },
    { value: "PLUMBING", label: "Plumbing" },
    { value: "PAINTING_AND_DECORATION", label: "Painting & Decoration" },
    { value: "EQUIPMENT_REPAIR", label: "Equipment Repair" },
    { value: "LANDSCAPING", label: "Landscaping" },
    { value: "PEST_CONTROL", label: "Pest Control" },
    { value: "FIRE_SAFETY", label: "Fire Safety" },
    { value: "WASTE_MANAGEMENT", label: "Waste Management" },
    // Supplies
    { value: "OFFICE_SUPPLIES", label: "Office Supplies" },
    { value: "CLEANING_SUPPLIES", label: "Cleaning Supplies" },
    { value: "KITCHEN_SUPPLIES", label: "Kitchen Supplies" },
    { value: "LAUNDRY_SUPPLIES", label: "Laundry Supplies" },
    { value: "GUEST_AMENITIES", label: "Guest Amenities" },
    // Food & Beverage
    { value: "FOOD_AND_BEVERAGE", label: "Food & Beverage" },
    { value: "STAFF_MEALS", label: "Staff Meals" },
    // Staff & HR
    { value: "SALARIES_AND_WAGES", label: "Salaries & Wages" },
    { value: "STAFF_BENEFITS", label: "Staff Benefits" },
    { value: "STAFF_TRAINING", label: "Staff Training" },
    { value: "STAFF_UNIFORMS", label: "Staff Uniforms" },
    { value: "RECRUITMENT", label: "Recruitment" },
    { value: "EMPLOYEE_INSURANCE", label: "Employee Insurance" },
    // Marketing
    { value: "DIGITAL_MARKETING", label: "Digital Marketing" },
    { value: "SOCIAL_MEDIA_MARKETING", label: "Social Media Marketing" },
    { value: "PRINT_ADVERTISING", label: "Print Advertising" },
    { value: "PROMOTIONS", label: "Promotions" },
    { value: "PHOTOGRAPHY", label: "Photography" },
    // Technology
    { value: "SOFTWARE_LICENSES", label: "Software Licenses" },
    { value: "HARDWARE_PURCHASE", label: "Hardware Purchase" },
    { value: "IT_SERVICES", label: "IT Services" },
    { value: "WEBSITE_MAINTENANCE", label: "Website Maintenance" },
    { value: "BOOKING_SYSTEM", label: "Booking System" },
    { value: "POS_SYSTEM", label: "POS System" },
    // Vehicle
    { value: "VEHICLE_FUEL", label: "Vehicle Fuel" },
    { value: "VEHICLE_MAINTENANCE", label: "Vehicle Maintenance" },
    { value: "VEHICLE_INSURANCE", label: "Vehicle Insurance" },
    { value: "SHUTTLE_SERVICE", label: "Shuttle Service" },
    // Insurance & Legal
    { value: "PROPERTY_INSURANCE", label: "Property Insurance" },
    { value: "LIABILITY_INSURANCE", label: "Liability Insurance" },
    { value: "LEGAL_FEES", label: "Legal Fees" },
    { value: "REGULATORY_FEES", label: "Regulatory Fees" },
    { value: "BUSINESS_LICENSE", label: "Business License" },
    // Financial
    { value: "BANK_CHARGES", label: "Bank Charges" },
    { value: "CREDIT_CARD_FEES", label: "Credit Card Fees" },
    { value: "LOAN_INTEREST", label: "Loan Interest" },
    { value: "PROPERTY_TAX", label: "Property Tax" },
    { value: "ACCOUNTING_FEES", label: "Accounting Fees" },
    { value: "AUDIT_FEES", label: "Audit Fees" },
    { value: "CONSULTING_FEES", label: "Consulting Fees" },
    // Guest Services
    { value: "GUEST_ENTERTAINMENT", label: "Guest Entertainment" },
    { value: "GUEST_TRANSPORTATION", label: "Guest Transportation" },
    { value: "COMPLIMENTARY_SERVICES", label: "Complimentary Services" },
    { value: "DELIVERY_CHARGES", label: "Delivery Charges" },
    // Security
    { value: "SECURITY_SERVICES", label: "Security Services" },
    // Other
    { value: "SUBSCRIPTIONS", label: "Subscriptions" },
    { value: "MEMBERSHIPS", label: "Memberships" },
    { value: "CHARITABLE_DONATIONS", label: "Charitable Donations" },
    { value: "CONTINGENCY", label: "Contingency" },
    { value: "OTHERS", label: "Others" },
];

interface CreateExpenditureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateExpenditureModal({
    open,
    onOpenChange,
}: CreateExpenditureModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
        vendor: "",
        invoiceNumber: "",
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!formData.description || !formData.amount || !formData.category || !formData.date || !formData.vendor) {
                throw new Error("Please fill in all required fields.");
            }

            await createExpenditure({
                description: formData.description,
                amount: parseFloat(formData.amount),
                category: formData.category,
                expenseDate: formData.date,
                vendorName: formData.vendor,
                invoiceNumber: formData.invoiceNumber,
            });
        },
        onSuccess: () => {
            toast.success("Expenditure recorded successfully");
            queryClient.invalidateQueries({ queryKey: ["financials", "expenditures"] });
            onOpenChange(false);
            setFormData({
                description: "",
                amount: "",
                category: "",
                date: new Date().toISOString().split("T")[0],
                vendor: "",
                invoiceNumber: "",
            });
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to record expenditure");
            console.error(error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Record Expenditure</DialogTitle>
                    <DialogDescription>
                        Record a new business expense. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({ ...formData, date: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">₦</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    className="pl-7"
                                    value={formData.amount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, amount: e.target.value })
                                    }
                                    required
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="vendor">Vendor <span className="text-red-500">*</span></Label>
                            <Input
                                id="vendor"
                                value={formData.vendor}
                                onChange={(e) =>
                                    setFormData({ ...formData, vendor: e.target.value })
                                }
                                required
                                placeholder="e.g., Utility Co."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNumber">Invoice No.</Label>
                            <Input
                                id="invoiceNumber"
                                value={formData.invoiceNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, invoiceNumber: e.target.value })
                                }
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Category <span className="text-red-500">*</span></Label>
                        <Combobox
                            options={EXPENDITURE_CATEGORIES}
                            value={formData.category}
                            onSelect={(value) => setFormData({ ...formData, category: value })}
                            placeholder="Search categories..."
                            emptyText="No category found."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            required
                            placeholder="Brief description of the expense"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Expenditure
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
