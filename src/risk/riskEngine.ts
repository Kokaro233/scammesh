import { createScamEvent, EVENT_CATEGORIES, EVENT_TYPES, type EventPayloadMap } from "../runtime/events"
import type {
	Channel,
	CorrelationEdge,
	RecommendedAction,
	RiskSnapshot,
	ScamEvent,
	SessionState,
} from "../shared/types"
import {
	BASE_EVENT_WEIGHTS,
	CHANNEL_COUNT_BONUS,
	CHANNEL_COUNT_THRESHOLD,
	labelForEventType,
	levelForScore,
	SYNERGY_RULES,
} from "./weights"

export interface RiskAssessment {
	score: number
	level: ReturnType<typeof levelForScore>
	reasons: string[]
	channels: Channel[]
	correlations: CorrelationEdge[]
	actions: RecommendedAction[]
}

function uniqueKey(event: ScamEvent) {
	if (event.type === EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH && event.payload && "kind" in event.payload) {
		return `${event.type}:${(event.payload as EventPayloadMap["official_identity_mismatch"]).kind}`
	}
	return event.type
}

function uniqueSignals(events: ScamEvent[]) {
	const signals = new Map<string, ScamEvent>()
	for (const event of events) {
		if (BASE_EVENT_WEIGHTS[event.type] <= 0) {
			continue
		}
		const key = uniqueKey(event)
		if (!signals.has(key)) {
			signals.set(key, event)
		}
	}
	return signals
}

function latestOfType(events: ScamEvent[], type: ScamEvent["type"]) {
	return [...events].reverse().find((event) => event.type === type)
}

export function assessRisk(events: ScamEvent[]): RiskAssessment {
	const signals = uniqueSignals(events)
	const presentTypes = new Set([...signals.values()].map((event) => event.type))
	const reasons: string[] = []
	let score = 0

	for (const event of signals.values()) {
		const weight = BASE_EVENT_WEIGHTS[event.type]
		score += weight
		reasons.push(`+${weight} ${labelForEventType(event.type)}`)
	}

	const correlations: CorrelationEdge[] = []
	for (const rule of SYNERGY_RULES) {
		if (!rule.types.every((type) => presentTypes.has(type))) {
			continue
		}

		if (rule.bonus > 0) {
			score += rule.bonus
			reasons.push(rule.reason)
		}

		const fromEvent = latestOfType(events, rule.types[0])
		const toEvent = latestOfType(events, rule.types[rule.types.length - 1])
		if (fromEvent && toEvent) {
			correlations.push({
				edgeId: `edge-${rule.id}`,
				fromEventId: fromEvent.eventId,
				toEventId: toEvent.eventId,
				label: rule.label,
				fromChannel: rule.fromChannel,
				toChannel: rule.toChannel,
			})
		}
	}

	const channels = [...new Set([...signals.values()].map((event) => event.channel))]
	if (channels.length >= CHANNEL_COUNT_THRESHOLD) {
		score += CHANNEL_COUNT_BONUS
		reasons.push(`+${CHANNEL_COUNT_BONUS} channel-count bonus (${channels.length} channels)`)
	}

	const clamped = Math.max(0, Math.min(100, score))
	const level = levelForScore(clamped)
	const hasPayment = [...presentTypes].some((type) => (EVENT_CATEGORIES.payment as readonly string[]).includes(type))
	const actions: RecommendedAction[] =
		level === "CRITICAL" && hasPayment
			? [
					{
						actionId: "do-not-transfer",
						title: "Do not transfer",
						detail: "Prototype recommendation: pause this transfer. No payment was blocked or executed.",
						priority: "now",
					},
					{
						actionId: "verify-official-channel",
						title: "Verify through official channel",
						detail: "Contact the bank through an independently verified official channel, not a number from the call or SMS.",
						priority: "now",
					},
				]
			: []

	return {
		score: clamped,
		level,
		reasons,
		channels,
		correlations,
		actions,
	}
}

function mergeActions(existing: RecommendedAction[], incoming: RecommendedAction[]) {
	const merged = [...existing]
	for (const action of incoming) {
		if (!merged.some((item) => item.actionId === action.actionId)) {
			merged.push(action)
		}
	}
	return merged
}

export function applyRiskToSession(session: SessionState, triggerEventId?: string) {
	const assessment = assessRisk(session.events)
	session.overallRisk = assessment.score
	session.riskLevel = assessment.level
	session.correlations = assessment.correlations
	session.recommendedActions = mergeActions(session.recommendedActions, assessment.actions)
	if (assessment.level === "CRITICAL") {
		session.humanStatus = "warned"
	} else if (assessment.level !== "LOW") {
		session.humanStatus = "watching"
	}

	const snapshot: RiskSnapshot = {
		snapshotId: `risk-${session.riskSnapshots.length + 1}`,
		occurredAt: Date.now(),
		score: assessment.score,
		level: assessment.level,
		reasons: assessment.reasons,
		channelsInvolved: assessment.channels,
		triggerEventId,
	}
	session.riskSnapshots.push(snapshot)
	recordCrossChannelPattern(session, assessment)
	return assessment
}

function recordCrossChannelPattern(session: SessionState, assessment: RiskAssessment) {
	if (assessment.level !== "CRITICAL" || assessment.channels.length < CHANNEL_COUNT_THRESHOLD) {
		return
	}
	if (session.events.some((event) => event.type === EVENT_TYPES.CROSS_CHANNEL_PATTERN_DETECTED)) {
		return
	}

	const last = session.events.at(-1)
	session.events.push(
		createScamEvent({
			eventId: "pattern-cross-channel",
			type: EVENT_TYPES.CROSS_CHANNEL_PATTERN_DETECTED,
			producerId: last?.producerId ?? "identity",
			occurredAt: Date.now(),
			severity: "critical",
			confidence: 1,
			channel: last?.channel ?? "identity",
			entityRefs: assessment.channels,
			summary: "Cross-channel scam pattern detected from combined semantic events.",
			correlationKey: "scam_case_001",
			payload: { correlationKey: "scam_case_001", channels: assessment.channels },
		}),
	)
}
