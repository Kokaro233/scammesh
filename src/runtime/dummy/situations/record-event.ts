import {
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import type { DummySessionApi } from "../session"

export class AnyEventSpecification extends SituationSpecification {
	isSatisfiedBy(): boolean {
		return true
	}
}

export class RecordEventTypeProcessor implements SituationProcessor {
	constructor(private readonly api: DummySessionApi) {}

	apply(context: SituationContext): void {
		this.api.resolveRuntime().state.publishedTypes.push(context.event.type)
	}
}

export function createRecordEventHandler(api: DummySessionApi): SituationHandler {
	return {
		specification: new AnyEventSpecification(),
		processor: new RecordEventTypeProcessor(api),
	}
}
