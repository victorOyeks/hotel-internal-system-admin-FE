"use client"

import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

export function SuppliesPage({ breadcrumb }: { breadcrumb: {
    title: string;
    breadcrumbs: Breadcrumb[];
}}) {
    const setBreadcrumb = useSetAtom(breadcrumbAtom);

    useEffect(() => {
        setBreadcrumb(breadcrumb);
        return () => setBreadcrumb(null)
    }, [breadcrumb, setBreadcrumb]);
  return (
    <div className="space-y-4 px-4 py-4">SuppliesPage</div>
  )
}
