/**
 * Radix menus, dialogs and sheets lock the page (`pointer-events: none` on <body>) while they are open. When a
 * menu item opens a panel, the lock can be handed from one to the other and never released, leaving the
 * screen unclickable until a reload. After a panel or modal closes this clears the lock, unless another
 * dialog is still open.
 */
export function releasePageLock(delay = 350) {
	if (typeof window === "undefined") return;
	window.setTimeout(() => {
		const stillOpen = document.querySelector(
			'[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
		);
		if (!stillOpen && document.body.style.pointerEvents === "none")
			document.body.style.pointerEvents = "";
	}, delay);
}
