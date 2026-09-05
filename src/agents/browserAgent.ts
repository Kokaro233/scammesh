import { createAgent } from "@mozaik-ai/core"
import type { ScamSessionApi } from "../runtime/scamSessionApi"
import { createBrowserFeedHandler } from "./situations/whenBrowserFeed"
import { createLoopTraceHandlers } from "./situations/whenLoopEvents"
import { createStartLoopHandler } from "./situations/whenOthersSendAMessage"
import { createSuspiciousLinkAdaptationHandler } from "./situations/whenSuspiciousLinkDetected"

export function createBrowserAgent(api: ScamSessionApi) {
	return createAgent({
		name: "Browser Agent",
		capabilities: ["inference"],
		instruction:
			"You only inspect page URL, hostname, visible text, and form fields. You must not read the call transcript, raw SMS bodies, or payment details.",
		tools: [],
		handlers: [
			createStartLoopHandler(api, "scam-browser", "browser"),
			createBrowserFeedHandler(api),
			createSuspiciousLinkAdaptationHandler(api),
			...createLoopTraceHandlers(api, "browser"),
		],
	})
}
