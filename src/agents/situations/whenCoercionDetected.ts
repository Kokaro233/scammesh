import {
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { EVENT_TYPES } from "../../runtime/events"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import { inspectCurrentMessages } from "./whenMessageFeed"

export class WhenCallEmitsCoercion extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === EVENT_TYPES.COERCION_DETECTED && event.producerId !== participant.getId()
	}
}

export class HeightenMessageChecksProcessor implements SituationProcessor {
	constructor(private readonly api: ScamSessionApi) {}

	apply(context: SituationContext): void {
		const state = this.api.resolveRuntime().state
		const beforeMode = state.session.agentModes.message
		if (beforeMode === "HEIGHTENED" || beforeMode === "PRIORITY") {
			return
		}

		state.session.agentModes.message = "HEIGHTENED"
		state.session.agentStatuses.message = "ADAPTED"
		state.session.adaptations.push({
			adaptationId: `adapt-call-message-${state.session.adaptations.length + 1}`,
			sourceAgent: "call",
			targetAgent: "message",
			triggerEvent: EVENT_TYPES.COERCION_DETECTED,
			triggerEventId: `${context.event.type}:${context.event.producerId}`,
			beforeMode,
			afterMode: "HEIGHTENED",
			reason: "Message Agent adapted because Call Agent emitted coercion_detected",
			occurredAt: Date.now(),
		})

		void inspectCurrentMessages(this.api, context.participant.getId())
	}
}

export function createCoercionAdaptationHandler(api: ScamSessionApi): SituationHandler {
	return {
		specification: new WhenCallEmitsCoercion(),
		processor: new HeightenMessageChecksProcessor(api),
	}
}
