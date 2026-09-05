import { RuntimeState } from "@mozaik-ai/core"
import type { AgentId, CallUtterance, Channel, InboundMessage } from "../shared/types"
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

export class ScamRuntimeState extends RuntimeState {
	session = createInitialSessionState()
	callTranscript: CallUtterance[] = []
	messageInbox: InboundMessage[] = []
	publishedTypes: string[] = []
	analyzeLog: AnalyzeLogEntry[] = []
	loops: Record<"call" | "message", ChannelLoopTrace> = {
		call: {},
		message: {},
	}
}
