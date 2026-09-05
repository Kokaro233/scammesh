import {
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { EVENT_TYPES } from "../../runtime/events"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import { inspectCurrentTransfers } from "./whenTransactionFeed"

export class WhenDeviceEmitsRemoteControl extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === EVENT_TYPES.REMOTE_CONTROL_DETECTED && event.producerId !== participant.getId()
	}
}

export class HeightenTransactionChecksProcessor implements SituationProcessor {
	constructor(private readonly api: ScamSessionApi) {}

	apply(context: SituationContext): void {
		const state = this.api.resolveRuntime().state
		const beforeMode = state.session.agentModes.transaction
		if (beforeMode === "HEIGHTENED" || beforeMode === "PRIORITY") {
			return
		}

		state.session.agentModes.transaction = "HEIGHTENED"
		state.session.agentStatuses.transaction = "ADAPTED"
		state.session.adaptations.push({
			adaptationId: `adapt-device-transaction-${state.session.adaptations.length + 1}`,
			sourceAgent: "device",
			targetAgent: "transaction",
			triggerEvent: EVENT_TYPES.REMOTE_CONTROL_DETECTED,
			triggerEventId: `${context.event.type}:${context.event.producerId}`,
			beforeMode,
			afterMode: "HEIGHTENED",
			reason: "Transaction Agent adapted because Device Agent emitted remote_control_detected",
			occurredAt: Date.now(),
		})

		void inspectCurrentTransfers(this.api, context.participant.getId())
	}
}

export function createRemoteControlAdaptationHandler(api: ScamSessionApi): SituationHandler {
	return {
		specification: new WhenDeviceEmitsRemoteControl(),
		processor: new HeightenTransactionChecksProcessor(api),
	}
}
