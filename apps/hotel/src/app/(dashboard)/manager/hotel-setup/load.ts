import { data } from "@hospio/api/data";
import { demoSetupExtras } from "@hospio/api/demo/fixtures/manager-admin";

/** The setup sections in sidebar order: brand first, hotel sections, then the owner-only ones. */
export async function loadSetup() {
	const base = await data.hotels.setup();
	const extras = demoSetupExtras.filter((e) => !base.some((b) => b.key === e.key));
	// Brand first, hotel sections, then the owner-only ones at the end.
	const brand = extras.filter((e) => e.key === "brand");
	const rest = extras.filter((e) => e.key !== "brand");
	return [...brand, ...base.filter((s) => !s.ownerOnly), ...rest.filter((s) => !s.ownerOnly), ...base.filter((s) => s.ownerOnly), ...rest.filter((s) => s.ownerOnly)];
}
