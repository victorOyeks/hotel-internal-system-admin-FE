import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex h-full flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-md text-center">
				<div className="mx-auto h-12 w-12" />
				<h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
					404 - Page Not Found
				</h1>
				<p className="mt-4 text-muted-foreground">
					Oops, the page you are looking for could not be found.
				</p>
				<div className="mt-6">
					<Button asChild>
						<Link href="/">Go back home</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
