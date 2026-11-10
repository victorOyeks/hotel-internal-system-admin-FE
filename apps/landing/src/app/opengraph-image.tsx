import { ImageResponse } from "next/og";

export const alt = "H.M.S by Hospio360 · Hotel management for Nigerian hotels";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share card: the brand maroon with the wordmark and the one-line pitch. */
export default function OpengraphImage() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				padding: "80px",
				background: "#4c091e",
				color: "white",
			}}
		>
			<div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "0.16em" }}>
				H.M.S · Hospio360
			</div>
			<div
				style={{
					marginTop: 32,
					fontSize: 68,
					fontWeight: 700,
					lineHeight: 1.1,
					maxWidth: 980,
				}}
			>
				Every room, every till, every hotel, on one screen.
			</div>
			<div style={{ marginTop: 28, fontSize: 30, color: "#e8c9d3" }}>
				Hotel management for Nigerian hotels
			</div>
		</div>,
		{ ...size },
	);
}
