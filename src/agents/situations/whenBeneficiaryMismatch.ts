import {
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { EVENT_TYPES, type EventPayloadMap } from "../../runtime/events"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import { inspectCurrentTransfers } from "./whenTransactionFeed"

export class WhenIdentityFlagsBeneficiary extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		if (event.type !== EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH || event.producerId === participant.getId()) {
			return false
		}

		const payload = event.payload as EventPayloadMap["official_identity_mismatch"]
		return payload.kind === "beneficiary"
	}
}

export class PrioritizeTransactionChecksProcessor implements SituationProcessor {
	constructor(private readonly api: ScamSessionApi) {}

	apply(context: SituationContext): void {
		const state = this.api.resolveRuntime().state
		const beforeMode = state.session.agentModes.transaction
		if (beforeMode === "PRIORITY") {
			return
		}

		state.session.agentModes.transaction = "PRIORITY"
		state.session.agentStatuses.transaction = "ADAPTED"
		state.session.adaptations.push({
			adaptationId: `adapt-identity-transaction-${state.session.adaptations.length + 1}`,
			sourceAgent: "identity",
			targetAgent: "transaction",
			triggerEvent: EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH,
			triggerEventId: `${context.event.type}:${context.event.producerId}`,
			beforeMode,
			afterMode: "PRIORITY",
			reason: "Transaction Agent adapted because Identity Agent flagged a beneficiary mismatch",
			occurredAt: Date.now(),
		})

		void inspectCurrentTransfers(this.api, context.participant.getId())
	}
}

export function createBeneficiaryMismatchAdaptationHandler(api: ScamSessionApi): SituationHandler {
	return {
		specification: new WhenIdentityFlagsBeneficiary(),
		processor: new PrioritizeTransactionChecksProcessor(api),
	}
}
