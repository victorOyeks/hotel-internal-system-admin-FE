import { getUser } from "@/lib/dal";
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
import { redirect } from "next/navigation";
import { selectRole } from "./actions";
import { RoleButton } from "./role-button";
import { LogoutButton } from "./logout-button";
import { logout } from "@/lib/actions";

const roleIcons: Record<HotelRole, React.ReactNode> = {
    HOTEL_OWNER: <Briefcase className="size-5" />,
    MANAGER: <LayoutDashboard className="size-5" />,
    FRONT_DESK: <ConciergeBell className="size-5" />,
    MAINTENANCE: <Hammer className="size-5" />,
    INVENTORY: <Package className="size-5" />,
    RESTAURANT: <Utensils className="size-5" />,
    RENTALS: <Key className="size-5" />,
    SUPER_ADMIN: <ShieldAlert className="size-5" />,
    LAUNDRY: <WashingMachine className="size-5" />,
    FINANCIALS: <PiggyBank className="size-5" />,
};

const roleLabels: Record<HotelRole, string> = {
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

const roleDescriptions: Record<HotelRole, string> = {
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

export default async function SelectRolePage() {
    const user = await getUser();

    if (!user) {
        redirect("/auth");
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
            <div className="w-full max-w-lg space-y-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-foreground">
                        Welcome back, {user.fullName!.split(" ")[0]}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Select a role to continue
                    </p>
                </div>

                {/* Role List */}
                <div className="space-y-1">
                    {user.roles.map((role) => (
                        <form
                            key={role}
                            action={async () => {
                                "use server";
                                await selectRole(role);
                            }}
                        >
                            <RoleButton
                                icon={roleIcons[role as HotelRole]}
                                label={roleLabels[role as HotelRole] || role}
                                description={roleDescriptions[role as HotelRole]}
                            />
                        </form>
                    ))}
                </div>

                {/* Logout */}
                <div>
                    <LogoutButton logoutAction={logout} />
                </div>
            </div>
        </div>
    );
}
