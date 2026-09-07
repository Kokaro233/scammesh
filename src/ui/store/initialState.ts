import { CHANNEL_LABEL } from "./channels"
import type { ChannelState, DayActivity, ScamState, UiChannel } from "./types"

function channel(id: UiChannel, activity: string, timestamp = "00:00:00"): ChannelState {
	return {
		channel: id,
		label: CHANNEL_LABEL[id],
		title: CHANNEL_LABEL[id],
		description: activity,
		status: "monitoring",
		activity,
		risk: "low",
		timestamp,
		delayed: false,
	}
}

function currentWeek(): DayActivity[] {
	const days: DayActivity[] = []
	for (let offset = 6; offset >= 0; offset -= 1) {
		const date = new Date()
		date.setDate(date.getDate() - offset)
		days.push({
			label: String(date.getDate()),
			safe: 0,
			review: 0,
			high: 0,
		})
	}
	return days
}

export function createInitialState(): ScamState {
	return {
		scenarioId: "bank-impersonation",
		riskScore: 0,
		riskLevel: "normal",
		headline: "Normal",
		summary: "No coordinated fraud pattern detected.",
		reasons: [],
		stampVisible: false,
		channelStates: {
			call: {
				...channel("call", "Line open"),
				description: "No unusual speech yet",
			},
			message: {
				...channel("message", "Inbox quiet"),
				description: "No suspicious message yet",
			},
			browser: {
				...channel("browser", "Page watch"),
				description: "No unverified page yet",
			},
			device: {
				...channel("device", "Device idle"),
				description: "No remote session yet",
			},
			identity: {
				...channel("identity", "Ready"),
				description: "Waiting for a claimed identity",
			},
			payment: {
				...channel("payment", "No transfer yet"),
				description: "Waiting for payment activity",
			},
		},
		signals: [],
		connections: [],
		coordinationEvents: [],
		callTranscript: [],
		transfer: {
			amount: "",
			amountValue: 0,
			currency: "RM",
			recipient: "",
			bank: "",
			beneficiary: "New",
			time: "",
			status: "pending",
			visible: false,
		},
		history: [],
		overviewStats: {
			riskSignals: 0,
			needReview: 0,
			transfersProtected: 0,
			identityChecks: 0,
		},
		weekActivity: currentWeek(),
		demoStatus: "idle",
		demoSpeed: "normal",
		demoElapsedMs: 0,
		appliedEventIds: [],
		simulateIdentityDelay: false,
		coordinationOpen: false,
		intervention: "closed",
	}
}
