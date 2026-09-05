import {
	Agent,
	SemanticEvent,
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import type { DummySessionApi } from "../session"
import type { DummyParticipantName } from "../state"

export const DUMMY_ALPHA_SIGNAL = "dummy.alpha.signal"

export class OwnAnswerSpecification extends SituationSpecification {
	isSatisfiedBy(context: SituationContext): boolean {
		return context.event.type === "model.answer" && context.event.producerId === context.participant.getId()
	}
}

export class RecordOwnAnswerProcessor implements SituationProcessor {
	constructor(
		private readonly api: DummySessionApi,
		private readonly name: DummyParticipantName,
		private readonly emitAlphaSignal: boolean,
	) {}

	apply(context: SituationContext): void {
		if (!(context.participant instanceof Agent)) {
			return
		}

		const state = this.api.resolveRuntime().state
		state.loops[this.name].endedAt = Date.now()

		if (!this.emitAlphaSignal) {
			return
		}

		this.api.sendEvent(
			SemanticEvent.create(DUMMY_ALPHA_SIGNAL, context.participant.getId(), { from: "alpha" }),
			context.participant.getId(),
		)
	}
}

export function createOwnAnswerHandler(
	api: DummySessionApi,
	name: DummyParticipantName,
	emitAlphaSignal: boolean,
): SituationHandler {
	return {
		specification: new OwnAnswerSpecification(),
		processor: new RecordOwnAnswerProcessor(api, name, emitAlphaSignal),
	}
}
