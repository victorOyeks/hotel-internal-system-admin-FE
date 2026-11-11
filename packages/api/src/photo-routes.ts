import "server-only";

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { MAX_PHOTO_BYTES } from "./profile-options";
import { COOKIES } from "./session";

/**
 * Profile photos (docs/profile.md in hospio-backend) through the app's own server: the browser has no bearer token, so
 * the session's is added here. Re-exported by both apps as /api/people/[id]/photo (GET) and /api/profile/photo (POST).
 * The upload is a route rather than a server action because server actions stop at 1 MB and a photo may be 2 MB.
 */

async function bearer() {
	const jar = await cookies();
	return {
		token: jar.get(COOKIES.token)?.value,
		hotel: jar.get(COOKIES.hotel)?.value,
	};
}

/** GET: someone's photo, for an <img>. Who may see it is decided by identity (the person, their business, Hospio360). */
export async function personPhoto(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const { token, hotel } = await bearer();
	if (!token) return new NextResponse(null, { status: 401 });
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_API_URL}/identity/users/${encodeURIComponent(id)}/photo`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				...(hotel ? { "X-Hotel-Id": hotel } : {}),
			},
			cache: "no-store",
		},
	).catch(() => null);
	if (!res?.ok) return new NextResponse(null, { status: res?.status ?? 502 });
	// The URL carries ?v=<photoVersion>, so a browser may keep it for a while; a new photo is a new URL.
	return new NextResponse(await res.arrayBuffer(), {
		headers: {
			"Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
			"Cache-Control": "private, max-age=86400",
		},
	});
}

/** POST multipart `file`: the signed-in person's new photo. Answers `{ ok, data: Me }` or `{ ok: false, error }`. */
export async function uploadMyPhoto(req: NextRequest) {
	const { token, hotel } = await bearer();
	if (!token)
		return NextResponse.json(
			{ ok: false, error: "Sign in again" },
			{ status: 401 },
		);
	const form = await req.formData().catch(() => null);
	const file = form?.get("file");
	if (!(file instanceof File) || file.size === 0)
		return NextResponse.json(
			{ ok: false, error: "Pick a photo" },
			{ status: 400 },
		);
	if (file.size > MAX_PHOTO_BYTES)
		return NextResponse.json(
			{ ok: false, error: "The photo is too big · keep it under 2 MB" },
			{ status: 400 },
		);
	const body = new FormData();
	body.set("file", file, file.name || "photo.jpg");
	try {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/identity/users/me/photo`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					...(hotel ? { "X-Hotel-Id": hotel } : {}),
				},
				body,
			},
		);
		const json = (await res.json().catch(() => null)) as {
			message?: string;
			data?: unknown;
		} | null;
		if (!res.ok || !json?.data) {
			return NextResponse.json(
				{ ok: false, error: json?.message || "The photo could not be saved" },
				{ status: res.ok ? 502 : res.status },
			);
		}
		return NextResponse.json({ ok: true, data: json.data });
	} catch {
		return NextResponse.json(
			{ ok: false, error: "Can't reach the server. Check your connection" },
			{ status: 502 },
		);
	}
}
