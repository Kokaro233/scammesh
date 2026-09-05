import {
	Agent,
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { ANALYSIS_SCHEMA } from "../../inference/schema"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import type { CallUtterance } from "../../shared/types"
import { FEED_EVENTS } from "../feedEvents"
import { publishDetection } from "../publishDetection"

export class WhenCallFeedArrives extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === FEED_EVENTS.CALL && event.producerId !== participant.getId()
	}
}

export class AnalyzeCallFeedProcessor implements SituationProcessor {
	constructor(private readonly api: ScamSessionApi) {}

	apply(context: SituationContext): void {
		if (!(context.participant instanceof Agent)) {
			return
		}

		const utterance = context.event.payload as CallUtterance
		const state = this.api.resolveRuntime().state
		state.callTranscript.push(utterance)
		state.analyzeLog.push({ agentId: "call", channel: "call", payload: utterance })

		void this.api.inference
			.analyze({ channel: "call", payload: utterance }, ANALYSIS_SCHEMA, {
				agentId: "call",
				channel: "call",
				mode: state.session.agentModes.call,
			})
			.then((result) => {
				result.detections.forEach((detection, index) => {
					publishDetection(this.api, {
						participantId: context.participant.getId(),
						agentId: "call",
						channel: "call",
						detection,
						eventId: `call-${state.callTranscript.length}-${index}`,
					})
				})
			})
	}
}

export function createCallFeedHandler(api: ScamSessionApi): SituationHandler {
	return {
		specification: new WhenCallFeedArrives(),
		processor: new AnalyzeCallFeedProcessor(api),
	}
}
