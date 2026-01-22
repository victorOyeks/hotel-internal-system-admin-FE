"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-shadow
export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-md text-center">
				<div className="mx-auto h-12 w-12" />
				<h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
					500 - Server Error
				</h1>
				<p className="mt-4 text-muted-foreground">
					Oops, something went wrong on our end.
				</p>
				<div className="mt-6">
					<Button onClick={() => reset()}>Try again</Button>
				</div>
			</div>
		</div>
	);
}
