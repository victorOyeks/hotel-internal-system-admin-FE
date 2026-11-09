import { data } from "@hospio/api/data";
import { demoSetupExtras } from "@hospio/api/demo/fixtures/manager-admin";

/** The setup sections in sidebar order: brand first, hotel sections, then the owner-only ones. */
export async function loadSetup() {
	const setup = await data.hotels.setup();
	// "Restaurants & tables" follows "Restaurant & bar" (the demo's setup does not carry it).
	const base = setup.some((s) => s.key === "restaurants")
		? setup
		: setup.flatMap((s) => (s.key === "outlets" ? [s, { key: "restaurants", title: "Restaurants & tables", description: "Your kitchens and bars, the store each draws from, and their tables", icon: "chef", fields: [] }] : [s]));
	const extras = demoSetupExtras.filter((e) => !base.some((b) => b.key === e.key));
	// Brand first, hotel sections, then the owner-only ones at the end.
	const brand = extras.filter((e) => e.key === "brand");
	const rest = extras.filter((e) => e.key !== "brand");
	return [...brand, ...base.filter((s) => !s.ownerOnly), ...rest.filter((s) => !s.ownerOnly), ...base.filter((s) => s.ownerOnly), ...rest.filter((s) => s.ownerOnly)];
}

/** The outlets with their tables, and the stores an outlet can draw from, for Restaurants & tables. */
export async function loadOutlets() {
	const [outlets, stores] = await Promise.all([data.outlets.list(), data.inventory.stores()]);
	return { outlets, stores };
}
