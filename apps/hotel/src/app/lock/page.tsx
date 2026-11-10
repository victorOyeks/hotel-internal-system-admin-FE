import { redirect } from "next/navigation";
import { LockScreen } from "@/components/shared-device/lock-screen";
import { getSharedDevice } from "@hospio/api/device";

export const dynamic = "force-dynamic";

/** A shared device's lock screen (docs/shared-devices.md in hospio-backend). Not a sign-in page: that stays /auth. */
export default async function LockPage({
	searchParams,
}: {
	searchParams: Promise<{ reason?: string }>;
}) {
	const { reason } = await searchParams;
	const { device, state } = await getSharedDevice();
	if (state === "none") redirect("/auth");
	if (state === "removed") redirect("/api/device/forget");
	if (!device) {
		return (
			<main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-page p-6 text-center">
				<p className="text-lg font-semibold text-ink">
					Can't reach Hospio360 right now
				</p>
				<p className="text-sm text-ink-2">
					Check the connection, then try again.
				</p>
				<a
					href="/lock"
					className="rounded-control bg-brand px-5 py-3 text-[15px] font-semibold text-white"
				>
					Try again
				</a>
			</main>
		);
	}
	return <LockScreen device={device} reason={reason} />;
}
