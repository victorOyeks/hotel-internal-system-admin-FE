"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createOtherIncome } from "@/lib/financials-actions";
import { Loader2 } from "lucide-react";

interface CreateOtherIncomeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateOtherIncomeModal({
    open,
    onOpenChange,
}: CreateOtherIncomeModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "",
        reference: "",
        date: new Date().toISOString().split("T")[0],
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            await createOtherIncome({
                description: formData.description,
                amount: parseFloat(formData.amount),
                category: formData.category,
                reference: formData.reference,
                date: formData.date
            });
        },
        onSuccess: () => {
            toast.success("Income record created successfully");
            queryClient.invalidateQueries({ queryKey: ["financials", "other-income"] });
            onOpenChange(false);
            setFormData({
                description: "",
                amount: "",
                category: "",
                reference: "",
                date: new Date().toISOString().split("T")[0],
            });
        },
        onError: (error) => {
            toast.error("Failed to create income record");
            console.error(error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Other Income</DialogTitle>
                    <DialogDescription>
                        Record a new income entry here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData({ ...formData, amount: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Category
                            </Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value })
                                }
                                required
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sales">Sales</SelectItem>
                                    <SelectItem value="Service">Service</SelectItem>
                                    <SelectItem value="Rental">Rental</SelectItem>
                                    <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="reference" className="text-right">
                                Reference
                            </Label>
                            <Input
                                id="reference"
                                value={formData.reference}
                                onChange={(e) =>
                                    setFormData({ ...formData, reference: e.target.value })
                                }
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                                Date
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({ ...formData, date: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
