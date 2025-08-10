import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type PropsWithChildren, use } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
	const cookieStore = use(cookies());
	const tok = cookieStore.get("hms.jwt.session_token");

	if (tok) {
		redirect("/home");
	}

	return children;
}
