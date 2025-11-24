import { getUser } from "@/lib/dal";
import { redirect } from "next/navigation";
import { type PropsWithChildren, use } from "react";

export default function Layout({ children }: PropsWithChildren) {
	const user = use(getUser());

	if (!user) {
		redirect("/auth");
	}

	if (user.changedPassword) {
		redirect("/dashboard");
	}

	return children;
}
