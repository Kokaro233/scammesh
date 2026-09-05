import {
	Agent,
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { startDummyTurn } from "../helpers"
import type { DummySessionApi } from "../session"

export class WhenOthersSendAMessage extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === "message.sent" && event.producerId !== participant.getId()
	}
}

export class InferenceProcessor implements SituationProcessor {
	constructor(
		private readonly api: DummySessionApi,
		private readonly model: string,
	) {}

	apply(context: SituationContext): void {
		if (!(context.participant instanceof Agent)) {
			return
		}

		const { message } = context.event.payload as { message: string }
		startDummyTurn(this.api, context.participant, message, this.model)
	}
}

export function createMessageSentHandler(api: DummySessionApi, model: string): SituationHandler {
	return {
		specification: new WhenOthersSendAMessage(),
		processor: new InferenceProcessor(api, model),
	}
}
