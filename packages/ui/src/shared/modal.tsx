"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangleIcon, Loader2Icon, XIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "@hospio/ui/primitives/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@hospio/ui/primitives/dialog";
import { releasePageLock } from "@hospio/ui/shared/release-page-lock";
import { cn } from "@hospio/ui/utils";
import { btn } from "./ui";

const widths = {
	confirm: "sm:max-w-[520px]",
	form: "sm:max-w-[600px]",
	large: "sm:max-w-[640px]",
} as const;

/** Centred modal: Confirm 520 / Form 600 / Large 640, with the panel header and footer layout. */
export function Modal({
	open,
	onOpenChange,
	title,
	subtitle,
	icon: Icon,
	size = "form",
	tone = "default",
	footer,
	footerInfo,
	children,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	subtitle?: ReactNode;
	icon?: LucideIcon;
	size?: keyof typeof widths;
	tone?: "default" | "danger";
	footer?: ReactNode;
	footerInfo?: ReactNode;
	children?: ReactNode;
}) {
	// However the panel closes (button, overlay, Escape or a URL change), release a page lock left behind.
	const wasOpen = useRef(open);
	useEffect(() => {
		if (wasOpen.current && !open) releasePageLock();
		wasOpen.current = open;
	}, [open]);
	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next);
				if (!next) releasePageLock();
			}}
		>
			<DialogContent
				showCloseButton={false}
				className={cn(
					"gap-0 overflow-hidden rounded-card border-line bg-card p-0",
					widths[size],
				)}
			>
				{tone === "danger" && <div className="h-1 w-full bg-danger" />}
				<header className="flex items-start gap-3 px-6 pt-6 pb-4">
					{Icon && (
						<span
							className={cn(
								"flex size-10 shrink-0 items-center justify-center rounded-xl",
								tone === "danger"
									? "bg-danger-soft text-danger"
									: "bg-brand-soft text-brand",
							)}
						>
							<Icon className="size-5" />
						</span>
					)}
					<div className="min-w-0 flex-1">
						<DialogTitle className="text-xl font-bold leading-tight text-ink">
							{title}
						</DialogTitle>
						{subtitle && (
							<p className="mt-[2px] text-[13px] text-ink-3">{subtitle}</p>
						)}
					</div>
					<button
						type="button"
						onClick={() => {
							onOpenChange(false);
							releasePageLock();
						}}
						className="flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-subtle hover:text-ink"
						aria-label="Close"
					>
						<XIcon className="size-[18px]" />
					</button>
				</header>
				{children && (
					<div className="max-h-[70vh] overflow-y-auto px-6 pb-5">
						{children}
					</div>
				)}
				{(footer || footerInfo) && (
					<footer className="flex items-center gap-3 border-t border-line px-6 py-4">
						<div className="min-w-0 flex-1 text-xs text-ink-3">
							{footerInfo}
						</div>
						<div className="flex items-center gap-2">{footer}</div>
					</footer>
				)}
			</DialogContent>
		</Dialog>
	);
}

/**
 * The confirm modal (520): a question, what happens, a safer alternative when there is one, and
 * Cancel + the action named after its result ("Cancel booking", not "Yes").
 */
export function ConfirmModal({
	open,
	onOpenChange,
	title,
	subtitle,
	tone = "default",
	confirmLabel,
	pending,
	onConfirm,
	alternative,
	children,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	subtitle?: ReactNode;
	tone?: "default" | "danger";
	confirmLabel: string;
	pending?: boolean;
	onConfirm: () => void;
	/** "Safer alternative" offered on destructive flows. */
	alternative?: { label: string; onClick: () => void };
	children?: ReactNode;
}) {
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			subtitle={subtitle}
			icon={tone === "danger" ? AlertTriangleIcon : undefined}
			size="confirm"
			tone={tone}
			footerInfo={
				alternative && (
					<button
						type="button"
						onClick={alternative.onClick}
						className="text-xs font-semibold text-brand hover:underline"
					>
						{alternative.label}
					</button>
				)
			}
			footer={
				<>
					<Button
						type="button"
						variant="outline"
						className={btn.secondary}
						onClick={() => {
							onOpenChange(false);
							releasePageLock();
						}}
						disabled={pending}
					>
						Cancel
					</Button>
					<Button
						type="button"
						className={tone === "danger" ? btn.danger : btn.primary}
						onClick={onConfirm}
						disabled={pending}
					>
						{pending ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : (
							confirmLabel
						)}
					</Button>
				</>
			}
		>
			{children}
		</Modal>
	);
}
