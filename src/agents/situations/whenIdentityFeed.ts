import {
	Agent,
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { ANALYSIS_SCHEMA } from "../../inference/schema"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import type { IdentityLookup } from "../../shared/types"
import { FEED_EVENTS } from "../feedEvents"
import { publishDetection } from "../publishDetection"

export class WhenIdentityFeedArrives extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === FEED_EVENTS.IDENTITY && event.producerId !== participant.getId()
	}
}

function lookupKey(lookup: IdentityLookup) {
	return `${lookup.kind}:${lookup.value}`
}

export async function inspectIdentityLookups(api: ScamSessionApi, participantId: string) {
	const state = api.resolveRuntime().state
	for (const [index, lookup] of state.identityLookups.entries()) {
		const key = lookupKey(lookup)
		if (state.analyzedIdentityKeys.has(key)) {
			continue
		}

		state.analyzedIdentityKeys.add(key)
		state.analyzeLog.push({ agentId: "identity", channel: "identity", payload: lookup })
		const result = await api.inference.analyze({ channel: "identity", payload: lookup }, ANALYSIS_SCHEMA, {
			agentId: "identity",
			channel: "identity",
			mode: state.session.agentModes.identity,
			registry: state.registry,
		})

		result.detections.forEach((detection, detectionIndex) => {
			publishDetection(api, {
				participantId,
				agentId: "identity",
				channel: "identity",
				detection,
				eventId: `identity-${index}-${detectionIndex}-${key}`,
			})
		})
	}
}

export class AnalyzeIdentityFeedProcessor implements SituationProcessor {
	constructor(private readonly api: ScamSessionApi) {}

	apply(context: SituationContext): void {
		if (!(context.participant instanceof Agent)) {
			return
		}

		const lookup = context.event.payload as IdentityLookup
		const state = this.api.resolveRuntime().state
		if (!state.identityLookups.some((item) => lookupKey(item) === lookupKey(lookup))) {
			state.identityLookups.push(lookup)
		}
		void inspectIdentityLookups(this.api, context.participant.getId())
	}
}

export function createIdentityFeedHandler(api: ScamSessionApi): SituationHandler {
	return {
		specification: new WhenIdentityFeedArrives(),
		processor: new AnalyzeIdentityFeedProcessor(api),
	}
}
