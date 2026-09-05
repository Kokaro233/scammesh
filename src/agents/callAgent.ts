import { createAgent } from "@mozaik-ai/core"
import type { ScamSessionApi } from "../runtime/scamSessionApi"
import { createCallFeedHandler } from "./situations/whenCallFeed"
import { createLoopTraceHandlers } from "./situations/whenLoopEvents"
import { createStartLoopHandler } from "./situations/whenOthersSendAMessage"

export function createCallAgent(api: ScamSessionApi) {
	return createAgent({
		name: "Call Agent",
		capabilities: ["inference"],
		instruction:
			"You only inspect a live call transcript for social-engineering signals. You must not inspect URLs, SMS bodies, or transaction data.",
		tools: [],
		handlers: [
			createStartLoopHandler(api, "scam-call", "call"),
			createCallFeedHandler(api),
			...createLoopTraceHandlers(api, "call"),
		],
	})
}
