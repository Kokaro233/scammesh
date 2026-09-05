import { createAgent } from "@mozaik-ai/core"
import type { ScamSessionApi } from "../runtime/scamSessionApi"
import { createCoercionAdaptationHandler } from "./situations/whenCoercionDetected"
import { createLoopTraceHandlers } from "./situations/whenLoopEvents"
import { createMessageFeedHandler } from "./situations/whenMessageFeed"
import { createStartLoopHandler } from "./situations/whenOthersSendAMessage"

export function createMessageAgent(api: ScamSessionApi) {
	return createAgent({
		name: "Message Agent",
		capabilities: ["inference"],
		instruction:
			"You only inspect inbound messages, senders, and links. You must not read the raw call transcript or payment details.",
		tools: [],
		handlers: [
			createStartLoopHandler(api, "scam-message", "message"),
			createMessageFeedHandler(api),
			createCoercionAdaptationHandler(api),
			...createLoopTraceHandlers(api, "message"),
		],
	})
}
