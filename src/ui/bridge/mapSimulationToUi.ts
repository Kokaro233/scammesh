import type { AgentCardView } from "../../shared/agentCard"
import type { SimulationStateView } from "../../shared/simulationView"
import type { AgentId, AgentStatus, Channel, CheckMode, RiskLevel as EngineRisk, ScamEvent } from "../../shared/types"
import { CHANNEL_LABEL } from "../store/channels"
import type {
	CoordinationEvent,
	DemoStatus,
	RiskLevel,
	ScamState,
	Signal,
	SignalConnection,
	SignalRisk,
	SignalStatus,
	TranscriptLine,
	TransferRecord,
	UiChannel,
} from "../store/types"

const SKIP_TYPES = new Set([
	"cross_channel_pattern_detected",
	"correlation_found",
	"agent_error",
	"provider_error",
	"agent_risk_escalated",
	"human_warning_issued",
])

export function toUiChannel(channel: Channel | AgentId): UiChannel {
	return channel === "transaction" ? "payment" : (channel as UiChannel)
}

export function toCssRisk(level: EngineRisk): RiskLevel {
	if (level === "LOW") return "normal"
	if (level === "WATCH") return "watch"
	if (level === "HIGH") return "review"
	return "high"
}

export function engineRiskLabel(level: EngineRisk): string {
	if (level === "LOW") return "LOW"
	if (level === "WATCH") return "WATCH"
	if (level === "HIGH") return "HIGH"
	return "CRITICAL"
}

function toDemoStatus(status: SimulationStateView["status"]): DemoStatus {
	if (status === "finished") return "complete"
	if (status === "running" || status === "paused" || status === "idle") {
		return status
	}
	return "idle"
}

function clock(startedAt: number, occurredAt: number) {
	const elapsed = Math.max(0, occurredAt - startedAt)
	const total = Math.floor(elapsed / 1000)
	const minutes = String(Math.floor(total / 60)).padStart(2, "0")
	const seconds = String(total % 60).padStart(2, "0")
	return `${minutes}:${seconds}`
}

function titleFor(type: string) {
	return type.replaceAll("_", " ")
}

function signalRisk(severity: ScamEvent["severity"]): SignalRisk {
	if (severity === "critical" || severity === "high") return "high"
	if (severity === "medium") return "review"
	return "low"
}

function statusFromAgent(status: AgentStatus, mode: CheckMode): SignalStatus {
	if (status === "ADAPTED" || mode === "HEIGHTENED" || mode === "PRIORITY") return "related"
	if (status === "ALERT" || status === "DONE") return "confirmed"
	if (status === "RUNNING") return "checking"
	if (status === "DEGRADED") return "delayed"
	return "monitoring"
}

function activityFor(card: AgentCardView, latest: ScamEvent | undefined) {
	if (card.lastAdaptationReason) {
		if (card.agentId === "message") return "Inspection level increased"
		if (card.agentId === "browser") return "Domain inspection prioritized"
		if (card.agentId === "transaction") return "Transfer monitoring escalated"
		return "Adapted"
	}
	if (latest) {
		return titleFor(latest.type)
	}
	return card.latestObservation
}

export function signalsFromSession(view: SimulationStateView): Signal[] {
	const startedAt = view.session.startedAt || Date.now()
	return view.session.events
		.filter((event) => !SKIP_TYPES.has(event.type))
		.map((event) => ({
			id: event.eventId,
			channel: toUiChannel(event.channel),
			title: titleFor(event.type),
			description: event.summary,
			risk: signalRisk(event.severity),
			timestamp: clock(startedAt, event.occurredAt || startedAt),
			status: event.severity === "low" ? "checking" : "related",
		}))
}

export function connectionsFromSession(view: SimulationStateView): SignalConnection[] {
	const startedAt = view.session.startedAt || Date.now()
	return view.session.correlations.map((edge) => ({
		id: edge.edgeId,
		source: toUiChannel(edge.fromChannel),
		target: toUiChannel(edge.toChannel),
		reason: edge.label,
		status: "confirmed" as const,
		createdAt: clock(startedAt, view.session.startedAt),
	}))
}

export function coordinationFromSession(view: SimulationStateView): CoordinationEvent[] {
	return view.session.adaptations.map((item) => ({
		id: item.adaptationId,
		source: toUiChannel(item.sourceAgent),
		target: toUiChannel(item.targetAgent),
		type: item.triggerEvent,
		description: item.reason,
		timestamp: clock(view.session.startedAt || Date.now(), item.occurredAt),
	}))
}

export function transcriptFromSession(view: SimulationStateView): TranscriptLine[] {
	return view.callTranscript.map((line, index) => ({
		id: `tr-${index + 1}`,
		time: clock(view.session.startedAt || Date.now(), view.session.startedAt + index * 1_000),
		text: line.text,
	}))
}

function paymentAmount(event: ScamEvent | undefined) {
	if (event?.type !== "new_beneficiary_detected" && event?.type !== "high_value_transfer_detected") {
		return 0
	}
	const payload = event.payload as { amount?: number }
	return payload.amount ?? 0
}

function paymentBeneficiary(event: ScamEvent | undefined) {
	if (event?.type !== "new_beneficiary_detected") {
		return ""
	}
	const payload = event.payload as { beneficiaryName?: string }
	return payload.beneficiaryName ?? ""
}

export function transferFromSession(view: SimulationStateView, previous: TransferRecord): TransferRecord {
	const intent = view.transactionIntents.at(-1)
	const paymentEvent = [...view.session.events]
		.reverse()
		.find((event) => event.type === "new_beneficiary_detected" || event.type === "high_value_transfer_detected")

	if (!intent && !paymentEvent) {
		return { ...previous, visible: false, amount: "", amountValue: 0, recipient: "", bank: "", time: "" }
	}

	const amount = intent?.amount ?? paymentAmount(paymentEvent)
	const name = intent?.beneficiaryName ?? paymentBeneficiary(paymentEvent)

	return {
		amount: amount ? amount.toLocaleString("en-US") : previous.amount,
		amountValue: amount || previous.amountValue,
		currency: "RM",
		recipient: name || previous.recipient,
		bank: intent?.paymentRail ?? "DuitNow",
		beneficiary: intent?.isNewBeneficiary === false ? "Existing" : "New",
		time:
			previous.visible && previous.time
				? previous.time
				: clock(view.session.startedAt || Date.now(), paymentEvent?.occurredAt ?? (view.session.startedAt || Date.now())),
		status: previous.status,
		visible: true,
	}
}

function channelStatesFromSession(view: SimulationStateView, base: ScamState["channelStates"]): ScamState["channelStates"] {
	const next = { ...base }
	for (const card of view.agents) {
		const ui = toUiChannel(card.agentId)
		const latest = [...view.session.events].reverse().find((event) => event.producerId === card.agentId)
		next[ui] = {
			...next[ui],
			channel: ui,
			label: CHANNEL_LABEL[ui],
			title: CHANNEL_LABEL[ui],
			activity: activityFor(card, latest),
			description: latest?.summary ?? card.latestObservation,
			status: statusFromAgent(card.status, card.mode),
			risk: latest ? signalRisk(latest.severity) : "low",
			timestamp: latest ? clock(view.session.startedAt || Date.now(), latest.occurredAt) : next[ui].timestamp,
			delayed: card.status === "DEGRADED",
		}
	}
	return next
}

function headlineFor(level: EngineRisk, score: number) {
	if (score === 0 && level === "LOW") return "Normal"
	if (level === "LOW") return "LOW"
	if (level === "WATCH") return "WATCH"
	if (level === "HIGH") return "HIGH"
	// Engine band stays CRITICAL; consumer copy uses HIGH RISK.
	return "HIGH RISK"
}

function summaryFor(view: SimulationStateView) {
	if (view.session.riskLevel === "CRITICAL") {
		if (view.scenarioId === "bank-impersonation") {
			return "Likely impersonation scam."
		}
		return "Critical coordinated pattern detected."
	}
	const snapshot = view.session.riskSnapshots.at(-1)
	if (snapshot?.reasons[0]) {
		return `${engineRiskLabel(view.session.riskLevel)} · ${snapshot.channelsInvolved.length} channels`
	}
	if (view.session.adaptations[0]) {
		return view.session.adaptations.at(-1)?.reason ?? view.session.riskLevel
	}
	return "No coordinated fraud pattern detected."
}

export function mapSimulationToUi(view: SimulationStateView, previous: ScamState): Partial<ScamState> {
	const snapshot = view.session.riskSnapshots.at(-1)
	const signals = signalsFromSession(view)
	const identitySignals = signals.filter((item) => item.channel === "identity").length

	return {
		scenarioId: view.scenarioId ?? previous.scenarioId,
		riskScore: view.session.overallRisk,
		riskLevel: toCssRisk(view.session.riskLevel),
		headline: headlineFor(view.session.riskLevel, view.session.overallRisk),
		summary: summaryFor(view),
		reasons: snapshot?.reasons.slice(0, 8) ?? [],
		stampVisible: view.session.riskLevel === "CRITICAL",
		channelStates: channelStatesFromSession(view, previous.channelStates),
		signals,
		connections: connectionsFromSession(view),
		coordinationEvents: coordinationFromSession(view),
		callTranscript: transcriptFromSession(view),
		transfer: transferFromSession(view, previous.transfer),
		overviewStats: {
			riskSignals: signals.length,
			needReview: signals.filter((item) => item.risk !== "low").length,
			transfersProtected: previous.overviewStats.transfersProtected,
			identityChecks: identitySignals,
		},
		weekActivity: previous.weekActivity.map((day, index, list) =>
			index === list.length - 1
				? {
						...day,
						safe: signals.filter((item) => item.risk === "low").length,
						review: signals.filter((item) => item.risk === "review").length,
						high: signals.filter((item) => item.risk === "high").length,
					}
				: day,
		),
		demoStatus: toDemoStatus(view.status),
		demoElapsedMs: view.session.startedAt ? Math.max(0, Date.now() - view.session.startedAt) : previous.demoElapsedMs,
	}
}
