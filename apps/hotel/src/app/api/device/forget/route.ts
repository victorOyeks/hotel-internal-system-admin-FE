import { NextResponse } from "next/server";
import { checkDevice } from "@hospio/api/actions/devices";

/** A device removed in Hotel setup: forget its token and the session here, then the normal sign-in page (docs/shared-devices.md). */
export const dynamic = "force-dynamic";

export async function GET() {
	await checkDevice();
	return new NextResponse(null, {
		status: 303,
		headers: {
			Location: "/auth?reason=device-removed",
			"Cache-Control": "no-store",
		},
	});
}
