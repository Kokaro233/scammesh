import type { AgentCardView } from "./agentCard"
import type { AgentId, ScenarioId, SessionState } from "./types"

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
}

export type { AgentCardView } from "./agentCard"
