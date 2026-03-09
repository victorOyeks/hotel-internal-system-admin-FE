import type { HotelRole } from "@/lib/types";
import {
	Briefcase,
	ConciergeBell,
	Key,
	LayoutDashboard,
	Megaphone,
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
	INVENTORY: Package,
	RESTAURANT: Utensils,
	MARKETER: Megaphone,
	RENTALS: Key,
	SUPER_ADMIN: ShieldAlert,
	LAUNDRY: WashingMachine,
	FINANCIALS: PiggyBank,
};

export const roleLabels: Record<HotelRole, string> = {
	HOTEL_OWNER: "Hotel Owner",
	MANAGER: "Manager",
	FRONT_DESK: "Front Desk",
	INVENTORY: "Stores",
	RESTAURANT: "Food & Beverages",
	MARKETER: "Marketer",
	RENTALS: "Guest Services",
	SUPER_ADMIN: "Super Admin",
	LAUNDRY: "Laundry & Valet",
	FINANCIALS: "Financials",
};

export const roleDescriptions: Record<HotelRole, string> = {
	HOTEL_OWNER: "Manage properties and business operations",
	MANAGER: "Oversee hotel operations and staff",
	FRONT_DESK: "Handle guest check-ins and reservations",
	INVENTORY: "Manage stores, stock and supplies",
	RESTAURANT: "Oversee food and beverage services",
	MARKETER: "Handle marketing and promotions",
	RENTALS: "Manage guest equipment and services",
	SUPER_ADMIN: "Full system administration access",
	LAUNDRY: "Manage laundry and valet services",
	FINANCIALS: "Manage financial operations",
};
