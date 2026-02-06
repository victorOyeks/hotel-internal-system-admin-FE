"use client";

import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LogoutButtonProps {
    logoutAction: () => Promise<void>;
}

export function LogoutButton({ logoutAction }: LogoutButtonProps) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            toast.promise(logoutAction(), {
                loading: "Logging out...",
                success: "Logged out successfully",
                error: "Failed to log out",
            });
        } finally {
            // Note: If logout succeeds, redirect happens and this won't execute
            // This is only for error cases
            setIsLoggingOut(false);
        }
    };

    return (
        <Button
            type="button"
            className="w-full"
            onClick={handleLogout}
            disabled={isLoggingOut}
        >
            {isLoggingOut ? (
                <>
                    Logging out
                    <Loader2 className="animate-spin" />
                </>
            ) : (
                <>
                    Log out
                    <LogOut />
                </>
            )}
        </Button>
    );
}
