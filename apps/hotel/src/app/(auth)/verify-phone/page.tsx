import { VerifyPhoneForm } from "@/components/auth/verify-phone-form";
import { getUser } from "@hospio/api/dal";
import { DEMO } from "@hospio/api/demo/mode";

export const dynamic = "force-dynamic";

/** The staging hint shows when demo mode is on or the API host is a staging one. */
const STAGING =
	DEMO || (process.env.NEXT_PUBLIC_API_URL ?? "").includes("staging");

/** Check your phone (Figma 3163:16180). Needs a session, no role; the owner can skip to the wizard. */
export default async function VerifyPhonePage() {
	const user = await getUser();
	return <VerifyPhoneForm phone={user?.phoneNumber ?? ""} staging={STAGING} />;
}
