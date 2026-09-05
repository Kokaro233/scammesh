import {
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import type { AgentId } from "../../shared/types"

export class WhenOwnInferenceStarts extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === "inference.started" && event.producerId === participant.getId()
	}
}

export class WhenOwnModelAnswers extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === "model.answer" && event.producerId === participant.getId()
	}
}

export function createLoopTraceHandlers(api: ScamSessionApi, agentId: "call" | "message"): SituationHandler[] {
	return [
		{
			specification: new WhenOwnInferenceStarts(),
			processor: {
				apply() {
					api.resolveRuntime().state.loops[agentId].startedAt = Date.now()
				},
			} satisfies SituationProcessor,
		},
		{
			specification: new WhenOwnModelAnswers(),
			processor: {
				apply() {
					api.resolveRuntime().state.loops[agentId].endedAt = Date.now()
					api.resolveRuntime().state.session.agentStatuses[agentId as AgentId] = "DONE"
				},
			} satisfies SituationProcessor,
		},
	]
}
