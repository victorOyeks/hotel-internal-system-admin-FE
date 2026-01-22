"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PlusIcon } from "lucide-react";

interface CreatePOFormProps {
    onClose: () => void;
}

export function CreatePOForm({ onClose }: CreatePOFormProps) {
    return (
        <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Supplier *</Label>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sup1">Premium Food Suppliers Inc.</SelectItem>
                            <SelectItem value="sup2">Hotel Supplies Co.</SelectItem>
                            <SelectItem value="sup3">Linen World</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Expected Delivery Date *</Label>
                    <Input type="date" />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input placeholder="e.g., Net 30" />
            </div>

            <Separator />

            <div>
                <h3 className="font-semibold mb-4">Add Items</h3>
                <Button type="button" variant="outline" size="sm">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Product
                </Button>
            </div>

            <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit">Create Purchase Order</Button>
            </div>
        </form>
    );
}
