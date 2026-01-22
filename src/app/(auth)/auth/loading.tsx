import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function Loading() {
	return (
		<Card className="w-full h-full md:h-auto md:max-w-[400px]">
			<CardHeader>
				<Skeleton className="h-8 w-24" />
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="flex justify-end">
					<Skeleton className="h-4 w-32" />
				</div>
			</CardContent>
			<CardFooter className="flex-col gap-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-4 w-48" />
			</CardFooter>
		</Card>
	);
}

export default Loading;
