import type { LucideIcon } from "lucide-react";
import {
	BedDoubleIcon,
	BriefcaseIcon,
	ChefHatIcon,
	CoinsIcon,
	ConciergeBellIcon,
	HeadsetIcon,
	LayoutDashboardIcon,
	MegaphoneIcon,
	PackageIcon,
	ShieldAlertIcon,
	SprayCanIcon,
	WashingMachineIcon,
	WineIcon,
	WrenchIcon,
} from "lucide-react";

/** The roles the backend issues. Owner and manager are hotel-wide; the rest are the modules; the last four are H.M.S. */
export const HOTEL_ROLES = [
	"OWNER",
	"MANAGER",
	"FRONT_OFFICE",
	"HOUSEKEEPING",
	"LAUNDRY",
	"MAINTENANCE",
	"KITCHEN",
	"BAR",
	"INVENTORY",
	"FINANCE",
	"SUPER_ADMIN",
	"SUPPORT",
	"FINANCE_ADMIN",
	"MARKETER",
] as const;

export type HotelRole = (typeof HOTEL_ROLES)[number];

export function isHotelRole(value: string): value is HotelRole {
	return (HOTEL_ROLES as readonly string[]).includes(value);
}

/** Where each role lives. `/dashboard/*` is rewritten to this prefix by the middleware. */
export const rolePaths: Record<HotelRole, string> = {
	OWNER: "/hotel-owner",
	MANAGER: "/manager",
	FRONT_OFFICE: "/front-desk",
	HOUSEKEEPING: "/housekeeping",
	LAUNDRY: "/laundry",
	MAINTENANCE: "/maintenance",
	KITCHEN: "/kitchen",
	BAR: "/bar",
	INVENTORY: "/inventory",
	FINANCE: "/financials",
	SUPER_ADMIN: "/admin",
	SUPPORT: "/admin",
	FINANCE_ADMIN: "/admin",
	MARKETER: "/marketer",
};

export const roleLabels: Record<HotelRole, string> = {
	OWNER: "Hotel owner",
	MANAGER: "Manager",
	FRONT_OFFICE: "Front office",
	HOUSEKEEPING: "Housekeeping",
	LAUNDRY: "Laundry",
	MAINTENANCE: "Maintenance",
	KITCHEN: "Kitchen",
	BAR: "Bar",
	INVENTORY: "Inventory",
	FINANCE: "Finance",
	SUPER_ADMIN: "Super admin",
	SUPPORT: "Support",
	FINANCE_ADMIN: "Finance admin",
	MARKETER: "Marketer",
};

export const roleDescriptions: Record<HotelRole, string> = {
	OWNER: "Every hotel in your business, approvals and reports",
	MANAGER: "Run this hotel: rooms, bookings, staff, money",
	FRONT_OFFICE: "Arrivals, departures, folios and payments",
	HOUSEKEEPING: "Rooms to clean, inspections, linen and minibar",
	LAUNDRY: "Guest laundry and hotel linen",
	MAINTENANCE: "Repairs, scheduled jobs and spare parts",
	KITCHEN: "Orders, tickets and the menu",
	BAR: "Sales, tabs and bar stock",
	INVENTORY: "Stores, stock, orders and deliveries",
	FINANCE: "Today's money, expenses, tills and night audit",
	SUPER_ADMIN: "Everything on the platform",
	SUPPORT: "Onboarding, support and hotel setup",
	FINANCE_ADMIN: "Fees, statements and marketer commissions",
	MARKETER: "Businesses you referred and your commissions",
};

export const roleIcons: Record<HotelRole, LucideIcon> = {
	OWNER: BriefcaseIcon,
	MANAGER: LayoutDashboardIcon,
	FRONT_OFFICE: ConciergeBellIcon,
	HOUSEKEEPING: SprayCanIcon,
	LAUNDRY: WashingMachineIcon,
	MAINTENANCE: WrenchIcon,
	KITCHEN: ChefHatIcon,
	BAR: WineIcon,
	INVENTORY: PackageIcon,
	FINANCE: CoinsIcon,
	SUPER_ADMIN: ShieldAlertIcon,
	SUPPORT: HeadsetIcon,
	FINANCE_ADMIN: CoinsIcon,
	MARKETER: MegaphoneIcon,
};

/** Roles that use the desktop web app. Staff roles sign in on the tablets. */
export const DESKTOP_ROLES: HotelRole[] = [
	"OWNER",
	"MANAGER",
	"FRONT_OFFICE",
	"INVENTORY",
	"FINANCE",
	"SUPER_ADMIN",
	"SUPPORT",
	"FINANCE_ADMIN",
	"MARKETER",
];

export const PLATFORM_ROLES: HotelRole[] = ["SUPER_ADMIN", "SUPPORT", "FINANCE_ADMIN"];

export { BedDoubleIcon };
