import type { EventPayloadMap, SemanticEventType } from "../runtime/events"

export const CHANNELS = ["call", "message", "browser", "device", "transaction", "identity"] as const
export type Channel = (typeof CHANNELS)[number]

export const AGENT_IDS = ["call", "message", "browser", "device", "transaction", "identity"] as const
export type AgentId = (typeof AGENT_IDS)[number]

export const RISK_LEVELS = ["LOW", "WATCH", "HIGH", "CRITICAL"] as const
export type RiskLevel = (typeof RISK_LEVELS)[number]

export const AGENT_STATUSES = ["IDLE", "RUNNING", "ALERT", "ADAPTED", "DONE", "DEGRADED"] as const
export type AgentStatus = (typeof AGENT_STATUSES)[number]

export const CHECK_MODES = ["NORMAL", "HEIGHTENED", "PRIORITY"] as const
export type CheckMode = (typeof CHECK_MODES)[number]

export const HUMAN_STATUSES = ["idle", "watching", "warned"] as const
export type HumanStatus = (typeof HUMAN_STATUSES)[number]

export const SEVERITIES = ["low", "medium", "high", "critical"] as const
export type Severity = (typeof SEVERITIES)[number]

export const ENTITY_KINDS = ["phone", "domain", "beneficiary", "bank", "url", "person"] as const
export type EntityKind = (typeof ENTITY_KINDS)[number]

export interface ScamEntity {
	entityId: string
	kind: EntityKind
	value: string
	label?: string
	channelRefs: Channel[]
}

export interface ScamEvent<T extends SemanticEventType = SemanticEventType> {
	eventId: string
	type: T
	producerId: AgentId
	occurredAt: number
	severity: Severity
	confidence: number
	channel: Channel
	entityRefs: string[]
	summary: string
	evidenceRef?: string
	correlationKey?: string
	payload: EventPayloadMap[T]
}

export interface AgentAdaptation {
	adaptationId: string
	sourceAgent: AgentId
	targetAgent: AgentId
	triggerEvent: SemanticEventType
	triggerEventId: string
	beforeMode: CheckMode
	afterMode: CheckMode
	reason: string
	occurredAt: number
}

export interface RiskSnapshot {
	snapshotId: string
	occurredAt: number
	score: number
	level: RiskLevel
	reasons: string[]
	channelsInvolved: Channel[]
	triggerEventId?: string
}

export interface RecommendedAction {
	actionId: string
	title: string
	detail: string
	priority: "now" | "soon"
}

export interface CorrelationEdge {
	edgeId: string
	fromEventId: string
	toEventId: string
	label: string
	fromChannel: Channel
	toChannel: Channel
}

export interface SessionState {
	sessionId: string
	startedAt: number
	overallRisk: number
	riskLevel: RiskLevel
	activeAgents: AgentId[]
	events: ScamEvent[]
	entities: Record<string, ScamEntity>
	correlations: CorrelationEdge[]
	recommendedActions: RecommendedAction[]
	humanStatus: HumanStatus
	adaptations: AgentAdaptation[]
	riskSnapshots: RiskSnapshot[]
	agentModes: Record<AgentId, CheckMode>
	agentStatuses: Record<AgentId, AgentStatus>
}

export interface CallUtterance {
	speaker: "caller" | "user"
	text: string
	claimedIdentity?: string
}

export interface CallAgentInput {
	transcript: CallUtterance[]
}

export interface MessageLink {
	url: string
	displayText?: string
}

export interface InboundMessage {
	messageId: string
	transport: "sms" | "whatsapp" | "email"
	sender: string
	body: string
	links: MessageLink[]
}

export interface MessageAgentInput {
	messages: InboundMessage[]
}

export interface BrowserFormField {
	name: string
	fieldType: "text" | "password" | "tel" | "number"
	requestsSecret: "otp" | "card" | "pin" | "none"
}

export interface BrowserPage {
	url: string
	hostname: string
	title: string
	pageText: string
	formFields: BrowserFormField[]
	claimedBrand?: string
}

export interface BrowserAgentInput {
	page: BrowserPage
}

export interface DeviceTelemetry {
	kind: "screen_share_enabled" | "remote_control_app_opened" | "accessibility_enabled" | "clipboard_burst"
	appName?: string
}

export interface DeviceAgentInput {
	telemetry: DeviceTelemetry[]
}

export interface TransactionIntent {
	amount: number
	currency: "MYR"
	beneficiaryName: string
	beneficiaryAccount: string
	isNewBeneficiary: boolean
	paymentRail: string
	reversible: boolean
}

export interface TransactionAgentInput {
	intent: TransactionIntent
}

export interface KnownPayee {
	name: string
	account: string
}

export interface TrustedRegistry {
	officialBankDomains: string[]
	officialPhoneNumbers: string[]
	knownPayees: KnownPayee[]
}

export interface IdentityLookup {
	kind: "phone" | "domain" | "beneficiary"
	value: string
	claimedOrganization?: string
}

export interface IdentityAgentInput {
	registry: TrustedRegistry
	lookups: IdentityLookup[]
}

export type ScenarioFeedItem =
	| {
			feedId: string
			timestampOffsetMs: number
			sourceChannel: "call"
			payload: CallUtterance
	  }
	| {
			feedId: string
			timestampOffsetMs: number
			sourceChannel: "message"
			payload: InboundMessage
	  }
	| {
			feedId: string
			timestampOffsetMs: number
			sourceChannel: "browser"
			payload: BrowserPage
	  }
	| {
			feedId: string
			timestampOffsetMs: number
			sourceChannel: "device"
			payload: DeviceTelemetry
	  }
	| {
			feedId: string
			timestampOffsetMs: number
			sourceChannel: "transaction"
			payload: TransactionIntent
	  }
	| {
			feedId: string
			timestampOffsetMs: number
			sourceChannel: "identity"
			payload: IdentityLookup
	  }

export const SCENARIO_IDS = ["bank-impersonation", "benign-bank", "ambiguous"] as const
export type ScenarioId = (typeof SCENARIO_IDS)[number]

export interface Scenario {
	id: ScenarioId
	title: string
	summary: string
	trustedRegistry: TrustedRegistry
	feeds: ScenarioFeedItem[]
}
