"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import {
	mintSupportToken,
	requestSupportAccess,
} from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import { SelectField, TextareaField } from "@hospio/ui/shared/field";
import { Modal } from "@hospio/ui/shared/modal";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

const HOTEL_APP =
	process.env.NEXT_PUBLIC_HOTEL_APP_URL ?? "https://web-staging.hospio360.com";

/**
 * "View as owner" (C5): a reason of at least 8 characters and a time box → POST /identity/support-access
 * → POST .../token → the hotel app opens in a new tab at /auth/support?token=… as a read-only owner view.
 * Mount it in the business page header in place of the demo "View as owner" button.
 */
export function SupportAccessButton({
	businessId,
	businessName,
	className,
}: {
	businessId: string;
	businessName: string;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState("");
	const [minutes, setMinutes] = useState("30");
	const { run, pending } = useAction();
	const valid = reason.trim().length >= 8;
	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={cn(btn.secondary, "flex items-center gap-2", className)}
			>
				<ExternalLinkIcon className="size-4" /> View as owner
			</button>
			<Modal
				open={open}
				onOpenChange={setOpen}
				title={`View ${businessName} as its owner`}
				subtitle="Read only · logged for the owner to see · ends on its own"
				icon={ExternalLinkIcon}
				size="form"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setOpen(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={!valid || pending}
							onClick={() => {
								// Open the tab first so the browser does not block it as a pop-up, then point it at the token.
								const tab = window.open("about:blank", "_blank");
								run(
									async () => {
										const grant = await requestSupportAccess({
											businessId,
											reason: reason.trim(),
											minutes: Number(minutes),
										});
										if (!grant.ok) return grant;
										return mintSupportToken(grant.data.grantId);
									},
									"Opening the hotel app as the owner",
									(t) => {
										const url = `${HOTEL_APP}/auth/support?token=${encodeURIComponent(t.accessToken)}`;
										if (tab) tab.location.href = url;
										else window.open(url, "_blank");
										setOpen(false);
										setReason("");
									},
								);
							}}
						>
							Open as owner
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<TextareaField
						label="Why you need to look (the owner sees this)"
						value={reason}
						onChange={setReason}
						placeholder="Ticket T-2041 · checking the Yaba P&L figures"
						error={reason && !valid ? "At least 8 characters" : undefined}
					/>
					<SelectField
						label="For how long"
						value={minutes}
						onChange={setMinutes}
						options={[
							{ value: "15", label: "15 minutes" },
							{ value: "30", label: "30 minutes" },
							{ value: "60", label: "60 minutes · the most allowed" },
						]}
					/>
					<WhatHappens
						items={[
							"You see the hotel app exactly as the owner does, read only",
							"Every page you open is logged with your name and this reason",
							"The access ends when the time is up or you close the tab",
						]}
					/>
				</div>
			</Modal>
		</>
	);
}
