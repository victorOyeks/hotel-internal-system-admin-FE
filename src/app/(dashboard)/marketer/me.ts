import { data } from "@/lib/data";

/** The demo marketer: whoever signs in walks through Kunle Oshodi's portal. */
export async function demoMarketer() {
	const marketers = await data.platform.marketers();
	return marketers.find((m) => m.id === "mk-1") ?? marketers[0];
}
