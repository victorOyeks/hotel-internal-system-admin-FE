import { redirect } from "next/navigation";

/** The site root is never a page: signed-in users land on their dashboard, everyone else on sign-in (via the middleware). */
export default function RootPage() {
	redirect("/dashboard");
}
