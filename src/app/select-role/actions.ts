"use server";

import { setActiveRole } from "@/lib/dal";
import type { HotelRole } from "@/lib/types";
import { redirect } from "next/navigation";

export async function selectRole(role: HotelRole) {
	await setActiveRole(role);

	redirect("/dashboard");
}
