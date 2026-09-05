import { createAgent } from "@mozaik-ai/core"
import type { DummySessionApi } from "../session"
import { createAlphaSignaledHandler } from "../situations/alpha-signaled"
import { createInferenceStartedHandler } from "../situations/inference-started"
import { createMessageSentHandler } from "../situations/message-sent"
import { createOwnAnswerHandler } from "../situations/own-answer"

export function createBeta(api: DummySessionApi) {
	return createAgent({
		name: "beta",
		capabilities: ["inference"],
		instruction:
			"You are dummy beta. Think at the same time as alpha, and adapt if alpha emits a signal while you are still running.",
		tools: [],
		handlers: [
			createMessageSentHandler(api, "dummy-beta"),
			createInferenceStartedHandler(api, "beta"),
			createOwnAnswerHandler(api, "beta", false),
			createAlphaSignaledHandler(api),
		],
	})
}
