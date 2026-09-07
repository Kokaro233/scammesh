/**
 * ScamMesh visual assets — Phase 0 inventory.
 * `ui-preview` is a visual reference only. Never render it as a page or background.
 */
export const uiAssets = {
	preview: {
		file: "src/assets/ui-preview.png",
		width: 1672,
		height: 941,
		bytes: 2_164_571,
		colorType: "rgb" as const,
		transparent: false,
		role: "visual-reference",
	},
	riskStamp: {
		file: "src/assets/risk-stamp.png",
		width: 977,
		height: 977,
		bytes: 1_245_801,
		colorType: "rgba" as const,
		transparent: true,
		role: "high-risk-final-judgment",
		note: "Circular warning stamp on transparent ground. Use mix-blend-mode: multiply.",
	},
	signalSlip: {
		file: "src/assets/signal-slip.png",
		width: 1774,
		height: 887,
		bytes: 1_639_375,
		colorType: "rgba" as const,
		transparent: true,
		role: "signal-slip-surface",
	},
	transferReceipt: {
		file: "src/assets/transfer-receipt.png",
		width: 1024,
		height: 1536,
		bytes: 2_330_230,
		colorType: "rgba" as const,
		transparent: true,
		role: "transfer-receipt-surface",
	},
	paperTexture: {
		file: "src/assets/paper-texture.png",
		width: 1122,
		height: 1402,
		bytes: 2_270_401,
		colorType: "rgba" as const,
		transparent: true,
		role: "secondary-paper-accent",
	},
} as const
