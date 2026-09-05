import {
	Agent,
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { ANALYSIS_SCHEMA } from "../../inference/schema"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import type { InboundMessage } from "../../shared/types"
import { FEED_EVENTS } from "../feedEvents"
import { publishDetection } from "../publishDetection"

export class WhenMessageFeedArrives extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === FEED_EVENTS.MESSAGE && event.producerId !== participant.getId()
	}
}

export async function inspectCurrentMessages(api: ScamSessionApi, participantId: string) {
	const state = api.resolveRuntime().state
	for (const [index, message] of state.messageInbox.entries()) {
		state.analyzeLog.push({ agentId: "message", channel: "message", payload: message })
		const result = await api.inference.analyze({ channel: "message", payload: message }, ANALYSIS_SCHEMA, {
			agentId: "message",
			channel: "message",
			mode: state.session.agentModes.message,
			registry: state.registry,
		})

		result.detections.forEach((detection, detectionIndex) => {
			publishDetection(api, {
				participantId,
				agentId: "message",
				channel: "message",
				detection,
				eventId: `message-${index}-${detectionIndex}-${state.session.agentModes.message}`,
			})
		})
	}
}

export class AnalyzeMessageFeedProcessor implements SituationProcessor {
	constructor(private readonly api: ScamSessionApi) {}

	apply(context: SituationContext): void {
		if (!(context.participant instanceof Agent)) {
			return
		}

		const message = context.event.payload as InboundMessage
		this.api.resolveRuntime().state.messageInbox.push(message)
		void inspectCurrentMessages(this.api, context.participant.getId())
	}
}

export function createMessageFeedHandler(api: ScamSessionApi): SituationHandler {
	return {
		specification: new WhenMessageFeedArrives(),
		processor: new AnalyzeMessageFeedProcessor(api),
	}
}
