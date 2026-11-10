import type { NextRequest } from "next/server";
import { refreshSessionRoute } from "@hospio/api/session-refresh";

/** A fresh token with the person's current roles after a manager changed them; see packages/api/src/session-refresh.ts. */
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
	return refreshSessionRoute(request);
}
