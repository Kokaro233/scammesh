import {
	Agent,
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { ANALYSIS_SCHEMA } from "../../inference/schema"
import { EVENT_TYPES, type EventPayloadMap, type SemanticEventType } from "../../runtime/events"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import type { TransactionIntent } from "../../shared/types"
import { FEED_EVENTS } from "../feedEvents"
import { publishDetection } from "../publishDetection"

export class WhenTransactionFeedArrives extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === FEED_EVENTS.TRANSACTION && event.producerId !== participant.getId()
	}
}

function payloadForIntent(
	type: SemanticEventType,
	intent: TransactionIntent,
): EventPayloadMap[SemanticEventType] | undefined {
	if (type === EVENT_TYPES.NEW_BENEFICIARY_DETECTED) {
		return {
			beneficiaryName: intent.beneficiaryName,
			beneficiaryAccount: intent.beneficiaryAccount,
			amount: intent.amount,
			currency: intent.currency,
		}
	}
	if (type === EVENT_TYPES.HIGH_VALUE_TRANSFER_DETECTED) {
		return { amount: intent.amount, currency: intent.currency }
	}
	if (type === EVENT_TYPES.IRREVERSIBLE_PAYMENT_DETECTED) {
		return { paymentRail: intent.paymentRail, amount: intent.amount }
	}
	return undefined
}

function recordPrototypePause(api: ScamSessionApi) {
	const actions = api.resolveRuntime().state.session.recommendedActions
	if (actions.some((action) => action.actionId === "proto-stop-transfer")) {
		return
	}

	actions.push({
		actionId: "proto-stop-transfer",
		title: "Prototype recommendation: STOP TRANSFER",
		detail: "Pause this transfer in the prototype. No payment was blocked or executed.",
		priority: "now",
	})
}

export async function inspectCurrentTransfers(api: ScamSessionApi, participantId: string) {
	const state = api.resolveRuntime().state
	for (const [index, intent] of state.transactionIntents.entries()) {
		state.analyzeLog.push({ agentId: "transaction", channel: "transaction", payload: intent })
		const result = await api.inference.analyze({ channel: "transaction", payload: intent }, ANALYSIS_SCHEMA, {
			agentId: "transaction",
			channel: "transaction",
			mode: state.session.agentModes.transaction,
			registry: state.registry,
		})

		result.detections.forEach((detection, detectionIndex) => {
			publishDetection(api, {
				participantId,
				agentId: "transaction",
				channel: "transaction",
				detection,
				eventId: `transaction-${index}-${detectionIndex}-${state.session.agentModes.transaction}`,
				eventPayload: payloadForIntent(detection.type, intent),
			})
		})

		if (state.session.agentModes.transaction === "PRIORITY" && result.detections.length > 0) {
			recordPrototypePause(api)
		}
	}
}

export class AnalyzeTransactionFeedProcessor implements SituationProcessor {
	constructor(private readonly api: ScamSessionApi) {}

	apply(context: SituationContext): void {
		if (!(context.participant instanceof Agent)) {
			return
		}

		const intent = context.event.payload as TransactionIntent
		this.api.resolveRuntime().state.transactionIntents.push(intent)
		void inspectCurrentTransfers(this.api, context.participant.getId())
	}
}

export function createTransactionFeedHandler(api: ScamSessionApi): SituationHandler {
	return {
		specification: new WhenTransactionFeedArrives(),
		processor: new AnalyzeTransactionFeedProcessor(api),
	}
}
