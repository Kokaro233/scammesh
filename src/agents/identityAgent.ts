import { createAgent } from "@mozaik-ai/core"
import type { ScamSessionApi } from "../runtime/scamSessionApi"
import { createDomainMismatchIdentityHandler } from "./situations/whenDomainMismatchDetected"
import { createIdentityFeedHandler } from "./situations/whenIdentityFeed"
import { createLoopTraceHandlers } from "./situations/whenLoopEvents"
import { createStartLoopHandler } from "./situations/whenOthersSendAMessage"

export function createIdentityAgent(api: ScamSessionApi) {
	return createAgent({
		name: "Identity Agent",
		capabilities: ["inference"],
		instruction:
			"You only compare phone, domain, and payee lookups against the local trusted registry mock. Do not guess official domains, scrape the web, or score the overall case.",
		tools: [],
		handlers: [
			createStartLoopHandler(api, "scam-identity", "identity"),
			createIdentityFeedHandler(api),
			createDomainMismatchIdentityHandler(api),
			...createLoopTraceHandlers(api, "identity"),
		],
	})
}
