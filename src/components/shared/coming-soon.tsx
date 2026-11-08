import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

/** A screen from the design that is next in line to be built. */
export function ComingSoon({ title, subtitle, figmaSection }: { title: string; subtitle?: string; figmaSection?: string }) {
	return (
		<>
			<PageHeader title={title} subtitle={subtitle} />
			<EmptyState
				title="This screen is being rebuilt"
				hint={figmaSection ? `Design: ${figmaSection} in the Hotel Internal System Figma file.` : undefined}
				className="min-h-[320px]"
			/>
		</>
	);
}
