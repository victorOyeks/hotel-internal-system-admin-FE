"use client";

import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { useSetAtom } from "jotai";
import { type PropsWithChildren, useEffect, useLayoutEffect } from "react";

const useIsomorphicLayoutEffect =
	typeof window !== "undefined" ? useLayoutEffect : useEffect;

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

	useIsomorphicLayoutEffect(() => {
		setBreadcrumb(breadcrumbs);
	}, [setBreadcrumb, breadcrumbs]);

	return <>{children}</>;
}
