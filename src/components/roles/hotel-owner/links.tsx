import {
	BookTextIcon,
	ChartNoAxesCombined,
	FolderIcon,
	HomeIcon,
	HotelIcon,
	IdCardIcon,
	// IdCardLanyardIcon,
	MessagesSquare,
	// MonitorDot,
	ToolCaseIcon,
} from "lucide-react";

export const links = [
	{ title: "Dashboard", icon: <HomeIcon />, url: "/dashboard" },
	{ title: "Hotels", icon: <HotelIcon />, url: "/dashboard/hotels" },
	{ title: "Bookings", icon: <BookTextIcon />, url: "/dashboard/bookings" },
	{ title: "Staff Management", icon: <IdCardIcon />, url: "/dashboard/staff-management" },
	{ title: "Financials", icon: <ChartNoAxesCombined />, url: "/dashboard/financials" },
	{ title: "Messages", icon: <MessagesSquare />, url: "/dashboard/messages" },
	{ title: "Inventory", icon: <ToolCaseIcon />, url: "/dashboard/inventory" },
	// { title: "Reports", icon: <FolderIcon />, url: "/dashboard/reports" },
	// { title: "Roles & Permissions", icon: <IdCardLanyardIcon />, url: "/dashboard/roles" },
	// { title: "Audit Log", icon: <MonitorDot />, url: "/dashboard/audit" },
];
