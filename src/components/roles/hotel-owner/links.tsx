import { BookTextIcon, ChartNoAxesCombined, FolderIcon, HomeIcon, HotelIcon, IdCardIcon, IdCardLanyardIcon, MessagesSquare, MonitorDot, ToolCaseIcon } from "lucide-react";

export const links = [
  { title: "Dashboard", icon: <HomeIcon />, url: "/home" },
  { title: "Hotels", icon: <HotelIcon />, url: "/hotels" },
  { title: "Bookings", icon: <BookTextIcon />, url: "/bookings" },
  { title: "Staff Management", icon: <IdCardIcon />,  url: "/staff-management" },
  { title: "Financials", icon: <ChartNoAxesCombined />, url: "/financials" },
  { title: "Messaging", icon: <MessagesSquare />, url: "/messaging" },
  { title: "Inventory", icon: <ToolCaseIcon />, url: "/inventory" },
  { title: "Reports", icon: <FolderIcon />, url: "/reports" },
  { title: "Roles & Permissions", icon: <IdCardLanyardIcon />, url: "/roles" },
  { title: "Audit Log",  icon: <MonitorDot />, url: "/audit" },
];