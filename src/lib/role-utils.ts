import type { HotelRole } from "@/lib/types";
import {
	Briefcase,
	ConciergeBell,
	Hammer,
	Key,
	LayoutDashboard,
	Package,
	ShieldAlert,
	Utensils,
	WashingMachine,
	PiggyBank,
} from "lucide-react";

export const roleIcons: Record<
	HotelRole,
	React.ComponentType<{ className?: string }>
> = {
	HOTEL_OWNER: Briefcase,
	MANAGER: LayoutDashboard,
	FRONT_DESK: ConciergeBell,
	MAINTENANCE: Hammer,
	INVENTORY: Package,
	RESTAURANT: Utensils,
	RENTALS: Key,
	SUPER_ADMIN: ShieldAlert,
	LAUNDRY: WashingMachine,
	FINANCIALS: PiggyBank,
};

export const roleLabels: Record<HotelRole, string> = {
	HOTEL_OWNER: "Hotel Owner",
	MANAGER: "Manager",
	FRONT_DESK: "Front Desk",
	MAINTENANCE: "Maintenance",
	INVENTORY: "Inventory Officer",
	RESTAURANT: "Restaurant",
	RENTALS: "Rentals",
	SUPER_ADMIN: "Super Admin",
	LAUNDRY: "Laundry",
	FINANCIALS: "Financials",
};

export const roleDescriptions: Record<HotelRole, string> = {
	HOTEL_OWNER: "Manage properties and business operations",
	MANAGER: "Oversee hotel operations and staff",
	FRONT_DESK: "Handle guest check-ins and reservations",
	MAINTENANCE: "Maintain facilities and equipment",
	INVENTORY: "Manage stock and supplies",
	RESTAURANT: "Oversee food and beverage services",
	RENTALS: "Manage rental properties",
	SUPER_ADMIN: "Full system administration access",
	LAUNDRY: "Manage laundry services",
	FINANCIALS: "Manage financial operations",
};
