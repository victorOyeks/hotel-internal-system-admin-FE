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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createExpenditure } from "@/lib/financials-actions";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
            // Basic Validation
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
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
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
                        <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) =>
                                setFormData({ ...formData, category: value })
                            }
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Utilities">Utilities</SelectItem>
                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                                <SelectItem value="Supplies">Supplies</SelectItem>
                                <SelectItem value="Salaries">Salaries</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
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
