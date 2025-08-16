import {
	BookTextIcon,
	ChartNoAxesCombined,
	FolderIcon,
	HomeIcon,
	HotelIcon,
	IdCardIcon,
	IdCardLanyardIcon,
	MessagesSquare,
	MonitorDot,
	ToolCaseIcon,
} from "lucide-react";

export const links = [
	{ title: "Dashboard", icon: <HomeIcon />, url: "/owner" },
	{ title: "Hotels", icon: <HotelIcon />, url: "/owner/hotels" },
	{ title: "Bookings", icon: <BookTextIcon />, url: "/owner/bookings" },
	{ title: "Staff Management", icon: <IdCardIcon />, url: "/owner/staff-management" },
	{ title: "Financials", icon: <ChartNoAxesCombined />, url: "/owner/financials" },
	{ title: "Messages", icon: <MessagesSquare />, url: "/owner/messages" },
	{ title: "Inventory", icon: <ToolCaseIcon />, url: "/owner/inventory" },
	{ title: "Reports", icon: <FolderIcon />, url: "/owner/reports" },
	{ title: "Roles & Permissions", icon: <IdCardLanyardIcon />, url: "/owner/roles" },
	{ title: "Audit Log", icon: <MonitorDot />, url: "/owner/audit" },
];
