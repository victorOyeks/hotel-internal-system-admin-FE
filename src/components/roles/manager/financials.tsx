"use client";

import { Button } from "@/components/ui/button";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { type Transaction, ExpensesSection } from "./financials.expenses";
import { ProfitsSection } from "./financials.profits";
import { useLayoutEffect } from "react";
import { breadcrumbAtom } from "@/lib/store";

const sectionAtom = atom<"profits" | "expenses">("profits");

function Toolbar() {
	const [section, setSection] = useAtom(sectionAtom);

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-2xl">
			<div className="flex items-center">
				<Button
					variant={section === "profits" ? "secondary" : "ghost"}
					onClick={() => setSection("profits")}
					className="rounded-none shadow-none"
				>
					Profits
				</Button>
				<Button
					variant={section === "expenses" ? "secondary" : "ghost"}
					onClick={() => setSection("expenses")}
					className="rounded-none shadow-none"
				>
					Expenses
				</Button>
			</div>

			<Button>Export</Button>
		</div>
	);
}

export function Financials({
	revalidateAction: revalidate,
	expenses,
	breadcrumbs,
}: {
	revalidateAction: () => Promise<void>;
	expenses: Transaction[];
	breadcrumbs: {
		title: string;
		breadcrumbs: { label: string; href: string }[];
	};
}) {
	const section = useAtomValue(sectionAtom);

	const setBreadcrumb = useSetAtom(breadcrumbAtom);

	useLayoutEffect(() => {
		setBreadcrumb(breadcrumbs);
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumbs]);

	return (
		<div className="flex flex-col space-y-4 px-2">
			<Toolbar />
			<div className="flex-1">
				{section === "profits" ? (
					<ProfitsSection expenses={expenses} revalidate={revalidate} />
				) : (
					<ExpensesSection expenses={expenses} revalidate={revalidate} />
				)}
			</div>
		</div>
	);
}
