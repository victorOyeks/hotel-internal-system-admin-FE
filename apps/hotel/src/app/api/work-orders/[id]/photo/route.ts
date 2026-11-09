import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { COOKIES } from "@hospio/api/session";

/**
 * A work order's photo (maintenance-service GET /repairs/{id}/photo) for an <img>: the browser has no bearer token,
 * so the bytes come through here with the session's. Whoever may read the work order may see its photo.
 */
export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const jar = await cookies();
	const token = jar.get(COOKIES.token)?.value;
	const hotel = jar.get(COOKIES.hotel)?.value;
	if (!token) return new NextResponse(null, { status: 401 });
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_API_URL}/maintenance/repairs/${encodeURIComponent(id)}/photo`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				...(hotel ? { "X-Hotel-Id": hotel } : {}),
			},
			cache: "no-store",
		},
	).catch(() => null);
	if (!res?.ok) return new NextResponse(null, { status: res?.status ?? 502 });
	return new NextResponse(await res.arrayBuffer(), {
		headers: {
			"Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
			"Cache-Control": "private, no-store",
		},
	});
}
