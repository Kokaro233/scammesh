import { RuntimeState } from "@mozaik-ai/core"
import { APEX_TRUSTED_REGISTRY } from "../scenarios/trustedRegistry"
import type {
	AgentId,
	BrowserPage,
	CallUtterance,
	Channel,
	DeviceTelemetry,
	IdentityLookup,
	InboundMessage,
	TransactionIntent,
	TrustedRegistry,
} from "../shared/types"
import type { EventPayloadMap } from "./events"
import { createInitialSessionState } from "./sessionState"

export interface ChannelLoopTrace {
	startedAt?: number
	endedAt?: number
}

export interface AnalyzeLogEntry {
	agentId: AgentId
	channel: Channel
	payload: unknown
}

export type ActiveLoopAgent = "call" | "message" | "browser" | "identity" | "device" | "transaction"

export class ScamRuntimeState extends RuntimeState {
	session = createInitialSessionState()
	callTranscript: CallUtterance[] = []
	messageInbox: InboundMessage[] = []
	browserPages: BrowserPage[] = []
	identityLookups: IdentityLookup[] = []
	deviceTelemetry: DeviceTelemetry[] = []
	transactionIntents: TransactionIntent[] = []
	identityMismatches: Array<EventPayloadMap["official_identity_mismatch"]> = []
	analyzedIdentityKeys = new Set<string>()
	registry: TrustedRegistry = APEX_TRUSTED_REGISTRY
	publishedTypes: string[] = []
	analyzeLog: AnalyzeLogEntry[] = []
	loops: Record<ActiveLoopAgent, ChannelLoopTrace> = {
		call: {},
		message: {},
		browser: {},
		identity: {},
		device: {},
		transaction: {},
	}
}
