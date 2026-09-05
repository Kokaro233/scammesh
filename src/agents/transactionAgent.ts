import { createAgent } from "@mozaik-ai/core"
import type { ScamSessionApi } from "../runtime/scamSessionApi"
import { createBeneficiaryMismatchAdaptationHandler } from "./situations/whenBeneficiaryMismatch"
import { createLoopTraceHandlers } from "./situations/whenLoopEvents"
import { createStartLoopHandler } from "./situations/whenOthersSendAMessage"
import { createRemoteControlAdaptationHandler } from "./situations/whenRemoteControlDetected"
import { createTransactionFeedHandler } from "./situations/whenTransactionFeed"

export function createTransactionAgent(api: ScamSessionApi) {
	return createAgent({
		name: "Transaction Agent",
		capabilities: ["inference"],
		instruction:
			"You only inspect transfer amount, currency, beneficiary, rail, and reversibility. Never execute, freeze, or block a payment. Prototype output is a recommendation to pause only.",
		tools: [],
		handlers: [
			createStartLoopHandler(api, "scam-transaction", "transaction"),
			createTransactionFeedHandler(api),
			createRemoteControlAdaptationHandler(api),
			createBeneficiaryMismatchAdaptationHandler(api),
			...createLoopTraceHandlers(api, "transaction"),
		],
	})
}
