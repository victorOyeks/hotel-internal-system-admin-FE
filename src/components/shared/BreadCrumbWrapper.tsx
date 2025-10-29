"use client";

import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { useSetAtom } from "jotai";
import { type PropsWithChildren, useEffect } from "react";

export function BreadCrumbWrapper({
  breadcrumbs,
  children,
}: PropsWithChildren<{
  breadcrumbs: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
}>) {
  const setBreadcrumb = useSetAtom(breadcrumbAtom);

  useEffect(() => {
    setBreadcrumb(breadcrumbs);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumbs]);

  return <>{children}</>;
}
