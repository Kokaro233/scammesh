import {
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import type { DummySessionApi } from "../session"
import { DUMMY_ALPHA_SIGNAL } from "./own-answer"

export class AlphaSignaledSpecification extends SituationSpecification {
	isSatisfiedBy(context: SituationContext): boolean {
		return context.event.type === DUMMY_ALPHA_SIGNAL && context.event.producerId !== context.participant.getId()
	}
}

export class AdaptToAlphaProcessor implements SituationProcessor {
	constructor(private readonly api: DummySessionApi) {}

	apply(): void {
		const state = this.api.resolveRuntime().state
		const betaLoop = state.loops.beta
		const betaStillRunning = betaLoop.startedAt !== undefined && betaLoop.endedAt === undefined

		state.sharedFlag = "beta-heightened"
		state.adaptations.push({
			sourceAgent: "alpha",
			targetAgent: "beta",
			triggerEvent: DUMMY_ALPHA_SIGNAL,
			reason: "Beta adapted because Alpha emitted dummy.alpha.signal",
			occurredAt: Date.now(),
			betaStillRunning,
		})
	}
}

export function createAlphaSignaledHandler(api: DummySessionApi): SituationHandler {
	return {
		specification: new AlphaSignaledSpecification(),
		processor: new AdaptToAlphaProcessor(api),
	}
}
