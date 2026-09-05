import {
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import type { DummySessionApi } from "../session"
import type { DummyParticipantName } from "../state"

export class OwnInferenceStartedSpecification extends SituationSpecification {
	isSatisfiedBy(context: SituationContext): boolean {
		return context.event.type === "inference.started" && context.event.producerId === context.participant.getId()
	}
}

export class RecordLoopStartProcessor implements SituationProcessor {
	constructor(
		private readonly api: DummySessionApi,
		private readonly name: DummyParticipantName,
	) {}

	apply(): void {
		this.api.resolveRuntime().state.loops[this.name].startedAt = Date.now()
	}
}

export function createInferenceStartedHandler(api: DummySessionApi, name: DummyParticipantName): SituationHandler {
	return {
		specification: new OwnInferenceStartedSpecification(),
		processor: new RecordLoopStartProcessor(api, name),
	}
}
