import { AGENT_CARD_META } from "../../shared/agentCard"
import type { AgentId, Channel, ScamEvent, SessionState } from "../../shared/types"

export interface EvidenceItem {
	eventId: string
	type: string
	summary: string
	producedBy: AgentId
	usedBy: AgentId[]
}

export interface ChannelEvidence {
	channel: Channel
	label: string
	items: EvidenceItem[]
}

export interface AdaptationStep {
	stepId: string
	text: string
}

export function consumersOf(event: ScamEvent, session: SessionState): AgentId[] {
	return [
		...new Set(
			session.adaptations
				.filter((item) => item.sourceAgent === event.producerId && item.triggerEvent === event.type)
				.map((item) => item.targetAgent),
		),
	]
}

export function evidenceByChannel(session: SessionState): ChannelEvidence[] {
	const channels: Channel[] = ["call", "message", "browser", "device", "transaction", "identity"]
	return channels
		.map((channel) => ({
			channel,
			label: AGENT_CARD_META[channel].name,
			items: session.events
				.filter((event) => event.channel === channel && event.type !== "cross_channel_pattern_detected")
				.map((event) => ({
					eventId: event.eventId,
					type: event.type,
					summary: event.summary,
					producedBy: event.producerId,
					usedBy: consumersOf(event, session),
				})),
		}))
		.filter((group) => group.items.length > 0)
}

export function adaptationChain(session: SessionState): AdaptationStep[] {
	return session.adaptations.map((item, index) => ({
		stepId: item.adaptationId,
		text: `${index + 1}. ${AGENT_CARD_META[item.sourceAgent].name} emitted ${item.triggerEvent} → ${AGENT_CARD_META[item.targetAgent].name} ${item.afterMode}`,
	}))
}

export function whyNotSingleChannel(session: SessionState) {
	const snapshot = session.riskSnapshots.at(-1)
	const channels = snapshot?.channelsInvolved ?? []
	const synergies =
		snapshot?.reasons.filter((reason) => reason.includes("synergy") || reason.includes("channel-count")) ?? []
	return {
		channelCount: channels.length,
		channels,
		synergies,
		explain:
			channels.length < 2
				? "Only one channel has published a signal so far, so this is still a local observation."
				: `This is not a single-channel alert. ${channels.length} channels published events, and the score rose from combined rules, not from one agent vote.`,
	}
}
