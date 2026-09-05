import {
	Agent,
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { ANALYSIS_SCHEMA } from "../../inference/schema"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import type { BrowserPage } from "../../shared/types"
import { FEED_EVENTS } from "../feedEvents"
import { publishDetection } from "../publishDetection"

export class WhenBrowserFeedArrives extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === FEED_EVENTS.BROWSER && event.producerId !== participant.getId()
	}
}

export async function inspectCurrentPages(api: ScamSessionApi, participantId: string) {
	const state = api.resolveRuntime().state
	for (const [index, page] of state.browserPages.entries()) {
		state.analyzeLog.push({ agentId: "browser", channel: "browser", payload: page })
		const result = await api.inference.analyze({ channel: "browser", payload: page }, ANALYSIS_SCHEMA, {
			agentId: "browser",
			channel: "browser",
			mode: state.session.agentModes.browser,
			registry: state.registry,
		})

		result.detections.forEach((detection, detectionIndex) => {
			publishDetection(api, {
				participantId,
				agentId: "browser",
				channel: "browser",
				detection,
				eventId: `browser-${index}-${detectionIndex}-${state.session.agentModes.browser}`,
			})
		})
	}
}

export class AnalyzeBrowserFeedProcessor implements SituationProcessor {
	constructor(private readonly api: ScamSessionApi) {}

	apply(context: SituationContext): void {
		if (!(context.participant instanceof Agent)) {
			return
		}

		const page = context.event.payload as BrowserPage
		this.api.resolveRuntime().state.browserPages.push(page)
		void inspectCurrentPages(this.api, context.participant.getId())
	}
}

export function createBrowserFeedHandler(api: ScamSessionApi): SituationHandler {
	return {
		specification: new WhenBrowserFeedArrives(),
		processor: new AnalyzeBrowserFeedProcessor(api),
	}
}
