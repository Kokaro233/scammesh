import { AGENT_IDS, type AgentId, type CheckMode, type SessionState } from "../shared/types"

const UNSTARTED_SESSION_ID = "session-unstarted"

function initialAgentRecord<T>(value: T): Record<AgentId, T> {
	return {
		call: value,
		message: value,
		browser: value,
		device: value,
		transaction: value,
		identity: value,
	}
}

export function createInitialSessionState(now = 0): SessionState {
	return {
		sessionId: UNSTARTED_SESSION_ID,
		startedAt: now,
		overallRisk: 0,
		riskLevel: "LOW",
		activeAgents: [...AGENT_IDS],
		events: [],
		entities: {},
		correlations: [],
		recommendedActions: [],
		humanStatus: "idle",
		adaptations: [],
		riskSnapshots: [],
		agentModes: initialAgentRecord<CheckMode>("NORMAL"),
		agentStatuses: initialAgentRecord("IDLE"),
	}
}

export function resetSessionState(): SessionState {
	return createInitialSessionState(0)
}
