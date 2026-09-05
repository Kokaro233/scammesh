import { AGENT_IDS } from "../../shared/types"
import { AGENT_CARD_META, type AgentCardView } from "../../shared/agentCard"
import { createInitialSessionState } from "../../runtime/sessionState"
import type { SimulationStateView, SimulationStatus } from "../../shared/simulationView"
import type { ScenarioId } from "../../shared/types"
import type { ScamRuntimeState } from "../../runtime/scamSessionState"
import { summarizeObservation } from "./observations"

function emptyLoops(): SimulationStateView["loops"] {
	return {
		call: {},
		message: {},
		browser: {},
		device: {},
		transaction: {},
		identity: {},
	}
}

export function buildAgentCards(state?: ScamRuntimeState): AgentCardView[] {
	return AGENT_IDS.map((agentId) => {
		const latestObservation = [...(state?.analyzeLog ?? [])].reverse().find((entry) => entry.agentId === agentId)
		const latestEvent = [...(state?.session.events ?? [])].reverse().find((event) => event.producerId === agentId)
		const latestAdaptation = [...(state?.session.adaptations ?? [])]
			.reverse()
			.find((item) => item.targetAgent === agentId)

		return {
			agentId,
			name: AGENT_CARD_META[agentId].name,
			channel: AGENT_CARD_META[agentId].channel,
			status: state?.session.agentStatuses[agentId] ?? "IDLE",
			mode: state?.session.agentModes[agentId] ?? "NORMAL",
			latestObservation: latestObservation
				? summarizeObservation(latestObservation)
				: "Waiting for channel input",
			latestEventType: latestEvent?.type ?? null,
			lastAdaptationReason: latestAdaptation?.reason ?? null,
		}
	})
}

export function idleSimulationView(): SimulationStateView {
	return {
		status: "idle",
		scenarioId: null,
		session: createInitialSessionState(),
		loops: emptyLoops(),
		agents: buildAgentCards(),
	}
}

export function toSimulationView(
	status: SimulationStatus,
	scenarioId: ScenarioId | null,
	state?: ScamRuntimeState,
): SimulationStateView {
	if (!state) {
		return { ...idleSimulationView(), status, scenarioId }
	}

	return {
		status,
		scenarioId,
		session: state.session,
		loops: {
			call: state.loops.call,
			message: state.loops.message,
			browser: state.loops.browser,
			device: state.loops.device,
			transaction: state.loops.transaction,
			identity: state.loops.identity,
		},
		agents: buildAgentCards(state),
	}
}
