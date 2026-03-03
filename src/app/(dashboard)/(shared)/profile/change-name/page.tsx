import { ChangeProfileName } from "@/components/change-profile-name";
import { getUser } from "@/lib/dal";
import { use } from "react";

function ChangeNamePage() {
	const user = use(getUser())!;

	return (
		<div className="flex size-full justify-center items-center">
			<ChangeProfileName
				defaultValues={{
					fullName: user.fullName,
					phoneNumber: user.phoneNumber,
				}}
			/>
		</div>
	);
}

export default ChangeNamePage;
