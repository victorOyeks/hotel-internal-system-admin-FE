import { HomeIcon } from "@/components/svgs/home";
import { LayoutProps } from "@/lib/types";
import React from "react";

function AuthLayout({ children }: LayoutProps) {
  return (
    <main className="flex min-h-screen bg-primary text-primary-foreground">
      <div className="min-h-full w-full flex flex-col items-center justify-center space-y-6">
        <div className="flex items-center justify-center gap-x-2">
          <HomeIcon />
          <span className="font-bold text-3xl">H.M.S</span>
        </div>
        {children}
      </div>
    </main>
  );
}

export default AuthLayout;
