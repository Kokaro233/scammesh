import type { AgentId, AgentStatus, Channel, CheckMode } from "./types"

export const AGENT_CARD_META: Record<AgentId, { name: string; channel: Channel }> = {
	call: { name: "Call Agent", channel: "call" },
	message: { name: "Message Agent", channel: "message" },
	browser: { name: "Browser Agent", channel: "browser" },
	device: { name: "Device Agent", channel: "device" },
	transaction: { name: "Transaction Agent", channel: "transaction" },
	identity: { name: "Identity Agent", channel: "identity" },
}

export interface AgentCardView {
	agentId: AgentId
	name: string
	channel: Channel
	status: AgentStatus
	mode: CheckMode
	latestObservation: string
	latestEventType: string | null
	lastAdaptationReason: string | null
}
