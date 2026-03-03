import { ChangePassword } from "@/components/change-password";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function ResetPasswordPage() {
	return (
		<div className="flex size-full justify-center items-center">
			<Card className="w-full md:max-w-[450px]">
				<CardHeader>
					<CardTitle>Change Password</CardTitle>
					<CardDescription>
						Enter a safe and secure password you will remember.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ChangePassword />
				</CardContent>
			</Card>
		</div>
	);
}

export default ResetPasswordPage;
