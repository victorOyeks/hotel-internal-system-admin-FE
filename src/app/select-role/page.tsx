import { getUser } from "@/lib/dal";
import type { HotelRole } from "@/lib/types";

import { redirect } from "next/navigation";
import { selectRole } from "./actions";
import { RoleButton } from "./role-button";
import { LogoutButton } from "./logout-button";
import { logout } from "@/lib/actions";

import {
    roleDescriptions,
    roleIcons,
    roleLabels
} from "@/lib/role-utils";

export default async function SelectRolePage() {
    const user = await getUser();

    if (!user) {
        redirect("/auth");
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
            <div className="w-full max-w-lg lg:max-w-4xl space-y-6">
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
                <div className="space-y-1 lg:space-y-0 grid lg:grid-cols-2 lg:gap-px lg:bg-border rounded-lg overflow-hidden">
                    {user.roles.map((role) => (
                        <form
                            key={role}
                            action={async () => {
                                "use server";
                                await selectRole(role);
                            }}
                        >
                            <RoleButton
                                icon={(() => {
                                    const Icon = roleIcons[role as HotelRole];
                                    return <Icon className="size-5" />;
                                })()}
                                label={roleLabels[role as HotelRole] || role}
                                description={roleDescriptions[role as HotelRole]}
                            />
                        </form>
                    ))}
                </div>

                {/* Logout */}
                <div className="max-w-sm mx-auto">
                    <LogoutButton logoutAction={logout} />
                </div>
            </div>
        </div>
    );
}
