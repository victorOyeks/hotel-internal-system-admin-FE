import { ProfileContent } from "@/components/profile-content";
import { getUser } from "@/lib/dal";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { use } from "react";

function Profile() {
	const user = use(getUser())!;

	return (
		<div className="h-full w-full p-4 space-y-2 md:space-y-4">
			<Link
				href={"/dashboard"}
				className="inline-flex items-center gap-x-1 px-3 py-1.5 border-2 border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors"
			>
				<ArrowLeftIcon className="size-4" />
				<span>Go home</span>
			</Link>

			<div className="bg-card md:m-4 md:rounded-2xl lg:rounded-4xl overflow-clip h-dvh">
				<ProfileContent user={user} />
			</div>
		</div>
	);
}

export default Profile;
