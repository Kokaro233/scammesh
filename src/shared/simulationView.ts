import type { AgentCardView } from "./agentCard"
import type { AgentId, CallUtterance, ScenarioId, SessionState, TransactionIntent } from "./types"

export type SimulationStatus = "idle" | "running" | "paused" | "finished"

export interface ChannelLoopView {
	startedAt?: number
	endedAt?: number
}

export interface SimulationStateView {
	status: SimulationStatus
	scenarioId: ScenarioId | null
	session: SessionState
	loops: Record<AgentId, ChannelLoopView>
	agents: AgentCardView[]
	callTranscript: CallUtterance[]
	transactionIntents: TransactionIntent[]
}

export type { AgentCardView } from "./agentCard"
