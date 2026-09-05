import {
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { EVENT_TYPES } from "../../runtime/events"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import { inspectCurrentPages } from "./whenBrowserFeed"

export class WhenMessageEmitsSuspiciousLink extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === EVENT_TYPES.SUSPICIOUS_LINK_DETECTED && event.producerId !== participant.getId()
	}
}

export class PrioritizeBrowserChecksProcessor implements SituationProcessor {
	constructor(private readonly api: ScamSessionApi) {}

	apply(context: SituationContext): void {
		const state = this.api.resolveRuntime().state
		const beforeMode = state.session.agentModes.browser
		if (beforeMode === "PRIORITY") {
			return
		}

		state.session.agentModes.browser = "PRIORITY"
		state.session.agentStatuses.browser = "ADAPTED"
		state.session.adaptations.push({
			adaptationId: `adapt-message-browser-${state.session.adaptations.length + 1}`,
			sourceAgent: "message",
			targetAgent: "browser",
			triggerEvent: EVENT_TYPES.SUSPICIOUS_LINK_DETECTED,
			triggerEventId: `${context.event.type}:${context.event.producerId}`,
			beforeMode,
			afterMode: "PRIORITY",
			reason: "Browser Agent adapted because Message Agent emitted suspicious_link_detected",
			occurredAt: Date.now(),
		})

		void inspectCurrentPages(this.api, context.participant.getId())
	}
}

export function createSuspiciousLinkAdaptationHandler(api: ScamSessionApi): SituationHandler {
	return {
		specification: new WhenMessageEmitsSuspiciousLink(),
		processor: new PrioritizeBrowserChecksProcessor(api),
	}
}
